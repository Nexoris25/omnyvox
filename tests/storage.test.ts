import { test } from "node:test";
import assert from "node:assert/strict";
import {
  providerInput,
  sealStorageKey,
  openStorageKey,
  storageUrl,
  writeVerified,
  readBunny,
} from "../lib/storage-provider";
process.env.STORAGE_ENCRYPTION_KEY = "12".repeat(32);
const provider = {
  endpoint: "storage.bunnycdn.com",
  zone: "omnyvox-test",
  secret: sealStorageKey("private-zone-key"),
};
const object = "omnyvox/marketing/11111111-1111-1111-1111-111111111111.webp";
test("storage credentials use authenticated encryption with a unique nonce", () => {
  assert.equal(openStorageKey(provider.secret), "private-zone-key");
  assert.notEqual(sealStorageKey("private-zone-key"), provider.secret);
  const parts = provider.secret.split(":");
  parts[1] = "00".repeat(16);
  assert.throws(() => openStorageKey(parts.join(":")));
});
test("storage destinations reject arbitrary hosts, traversal and directory deletion", () => {
  assert.throws(() =>
    storageUrl({ ...provider, endpoint: "localhost" }, object),
  );
  assert.throws(() => storageUrl({ ...provider, zone: "../secret" }, object));
  for (const path of [
    "omnyvox/",
    "../media",
    "omnyvox/marketing/",
    object + "?x=1",
  ])
    assert.throws(() => storageUrl(provider, path));
  assert.equal(
    providerInput.safeParse({
      label: "Test",
      endpoint: "https://storage.bunnycdn.com@evil.com",
      zone: "test",
      accessKey: "password",
    }).success,
    false,
  );
});
test("upload verifies exact downloaded bytes and sends storage-zone authentication", async () => {
  const bytes = Buffer.from("test-image");
  let calls = 0;
  const fake = (async (url, init) => {
    assert.equal(
      String(url),
      `https://storage.bunnycdn.com/omnyvox-test/${object}`,
    );
    assert.equal(
      (init?.headers as Record<string, string>).AccessKey,
      "private-zone-key",
    );
    assert.equal(init?.redirect, "error");
    calls++;
    return init?.method === "PUT"
      ? new Response("", { status: 201 })
      : new Response(bytes);
  }) as typeof fetch;
  await writeVerified(provider, object, bytes, fake);
  assert.equal(calls, 2);
});
test("corrupt remote copy cannot be treated as a successful migration", async () => {
  const fake = (async () => new Response("corrupt")) as typeof fetch;
  await assert.rejects(
    writeVerified(provider, object, Buffer.from("original"), fake),
    /verification failed/,
  );
});
test("provider failures do not disclose response bodies", async () => {
  const fake = (async () =>
    new Response("sensitive provider response", {
      status: 401,
    })) as typeof fetch;
  await assert.rejects(
    readBunny(provider, object, fake),
    (error) =>
      error instanceof Error &&
      error.message.includes("401") &&
      !error.message.includes("sensitive"),
  );
});
test("oversized remote objects are refused", async () => {
  const fake = (async () =>
    new Response(new Uint8Array(13 * 1024 * 1024))) as typeof fetch;
  await assert.rejects(readBunny(provider, object, fake), /size limit/);
});
