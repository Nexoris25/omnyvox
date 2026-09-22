import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { z } from "zod";

export const bunnyEndpoints = [
  "storage.bunnycdn.com",
  "uk.storage.bunnycdn.com",
  "ny.storage.bunnycdn.com",
  "la.storage.bunnycdn.com",
  "sg.storage.bunnycdn.com",
  "se.storage.bunnycdn.com",
  "br.storage.bunnycdn.com",
  "jh.storage.bunnycdn.com",
  "syd.storage.bunnycdn.com",
] as const;
export const providerInput = z.object({
  label: z.string().trim().min(2).max(80),
  endpoint: z.enum(bunnyEndpoints),
  zone: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,62}$/),
  accessKey: z
    .string()
    .min(8)
    .max(512)
    .regex(/^[\x21-\x7e]+$/),
});
export type BunnyProvider = { endpoint: string; zone: string; secret: string };
export function digest(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}
function key() {
  const value =
    process.env.STORAGE_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value))
    throw Error("Configure STORAGE_ENCRYPTION_KEY before connecting storage.");
  return Buffer.from(value, "hex");
}
export function sealStorageKey(value: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from("omnyvox:storage:v1"));
  const bytes = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), bytes]
    .map((v) => v.toString("hex"))
    .join(":");
}
export function openStorageKey(value: string) {
  const [iv, tag, bytes] = value.split(":").map((v) => Buffer.from(v, "hex"));
  const cipher = createDecipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from("omnyvox:storage:v1"));
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(bytes), cipher.final()]).toString("utf8");
}
export function storageUrl(provider: BunnyProvider, object: string) {
  z.enum(bunnyEndpoints).parse(provider.endpoint);
  z.string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,62}$/)
    .parse(provider.zone);
  // Only application-generated file paths; never accept directories or arbitrary URLs.
  if (
    !/^omnyvox\/(?:marketing|[a-f0-9-]{36}|checks)\/[a-f0-9-]{36}\.webp$/.test(
      object,
    )
  )
    throw Error("Invalid storage object path");
  return `https://${provider.endpoint}/${provider.zone}/${object}`;
}
export async function bunnyRequest(
  provider: BunnyProvider,
  object: string,
  method: "GET" | "PUT" | "DELETE",
  bytes?: Buffer,
  transport: typeof fetch = fetch,
) {
  const r = await transport(storageUrl(provider, object), {
    method,
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    headers: {
      AccessKey: openStorageKey(provider.secret),
      ...(bytes
        ? {
            "Content-Type": "image/webp",
            Checksum: digest(bytes).toUpperCase(),
          }
        : {}),
    },
    body: bytes ? new Uint8Array(bytes) : undefined,
  });
  if (!r.ok && !(method === "DELETE" && r.status === 404)) {
    await r.body?.cancel();
    throw Error(
      `Storage ${method.toLowerCase()} failed (${r.status}). Check the storage zone, region and access key.`,
    );
  }
  return r;
}
export async function readBunny(
  provider: BunnyProvider,
  object: string,
  transport: typeof fetch = fetch,
) {
  const r = await bunnyRequest(provider, object, "GET", undefined, transport);
  const reader = r.body?.getReader();
  if (!reader) throw Error("Storage returned an empty response");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 12 * 1024 * 1024)
        throw Error("Stored image exceeds size limit");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks);
}
export async function writeVerified(
  provider: BunnyProvider,
  object: string,
  bytes: Buffer,
  transport: typeof fetch = fetch,
) {
  const result = await bunnyRequest(provider, object, "PUT", bytes, transport);
  await result.body?.cancel();
  const copy = await readBunny(provider, object, transport);
  if (copy.length !== bytes.length || digest(copy) !== digest(bytes))
    throw Error("Storage verification failed. The source image was preserved.");
}
