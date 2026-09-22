import { randomUUID } from "node:crypto";
import { pool, query, audit } from "./db";
import {
  bunnyRequest,
  digest,
  readBunny,
  writeVerified,
  type BunnyProvider,
} from "./storage-provider";

export type StoredMedia = {
  id: string;
  site_id: string | null;
  bytes: Buffer | null;
  provider_id: string | null;
  object_key: string | null;
  checksum: string | null;
  size: string | number;
};
type Provider = BunnyProvider & { id: string; tested_at: string | null };
export async function storageProvider(id: string) {
  const [provider] = await query<Provider>(
    "SELECT * FROM storage_providers WHERE id=$1",
    [id],
  );
  if (!provider) throw Error("Storage connection no longer exists");
  return provider;
}
export async function mediaBytes(media: StoredMedia) {
  const bytes = media.provider_id
    ? await readBunny(
        await storageProvider(media.provider_id),
        media.object_key!,
      )
    : media.bytes!;
  if (
    Number(media.size) !== bytes.length ||
    (media.checksum && media.checksum !== digest(bytes))
  )
    throw Error("Stored image failed integrity verification");
  return bytes;
}
export async function mediaResponse(media: StoredMedia) {
  return new Response(new Uint8Array(await mediaBytes(media)), {
    headers: {
      "Content-Type": "image/webp",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
export class StorageQuotaError extends Error {}
export async function mediaUsage(site: string) {
  const [row] = await query<{ used: string; quota: string }>(
    "SELECT COALESCE((SELECT sum(size) FROM media WHERE site_id=s.id),0) AS used, COALESCE((p.entitlements->>'storageBytes')::bigint,CASE s.tier WHEN 'basic' THEN 5368709120 WHEN 'growth' THEN 10737418240 ELSE 21474836480 END) AS quota FROM effective_sites s LEFT JOIN plans p ON p.id=s.category||'-'||s.tier WHERE s.id=$1",
    [site],
  );
  return { used: Number(row?.used || 0), quota: Number(row?.quota || 0) };
}
export async function createMedia(
  site: string | null,
  bytes: Buffer,
  alt: string,
  name = "",
) {
  const client = await pool.connect();
  const id = randomUUID();
  try {
    await client.query("BEGIN");
    if (site) {
      await client.query("SELECT id FROM sites WHERE id=$1 FOR UPDATE", [site]);
      const {
        rows: [usage],
      } = await client.query(
        "SELECT COALESCE((SELECT sum(size) FROM media WHERE site_id=s.id),0)::bigint AS used, COALESCE((p.entitlements->>'storageBytes')::bigint,CASE s.tier WHEN 'basic' THEN 5368709120 WHEN 'growth' THEN 10737418240 ELSE 21474836480 END) AS quota FROM effective_sites s LEFT JOIN plans p ON p.id=s.category||'-'||s.tier WHERE s.id=$1",
        [site],
      );
      if (!usage || Number(usage.used) + bytes.length > Number(usage.quota))
        throw new StorageQuotaError(
          "Your website storage allowance is full. Remove unused images or upgrade your plan.",
        );
    }
    await client.query(
      "INSERT INTO media(id,site_id,bytes,alt,size,checksum,name) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [id, site, bytes, alt, bytes.length, digest(bytes), name.slice(0, 160)],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  const [setting] = await query<{ provider_id: string | null }>(
    "SELECT provider_id FROM storage_settings WHERE id=true",
  );
  if (setting?.provider_id) {
    try {
      await transferMedia(id, setting.provider_id);
    } catch {
      await audit("system", "storage.upload.fallback_to_vps", id);
    }
  }
  return { id };
}

// Each transfer commits separately. A failed or interrupted batch can be safely resumed.
export async function transferMedia(id: string, target: string | null) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [media],
    } = await client.query<StoredMedia>(
      "SELECT * FROM media WHERE id=$1 FOR UPDATE SKIP LOCKED",
      [id],
    );
    if (!media || media.provider_id === target) {
      await client.query("ROLLBACK");
      return false;
    }
    const bytes = await mediaBytes(media);
    let object: string | null = null;
    if (target) {
      const provider = await storageProvider(target);
      if (!provider.tested_at)
        throw Error("Test this storage connection before moving images.");
      object = `omnyvox/${media.site_id || "marketing"}/${randomUUID()}.webp`;
      // A durable delayed cleanup entry also covers interrupted/failed remote uploads.
      await query(
        "INSERT INTO storage_cleanup(provider_id,object_key) VALUES($1,$2)",
        [target, object],
      );
      await writeVerified(provider, object, bytes);
    }
    await client.query(
      "UPDATE media SET bytes=$1,provider_id=$2,object_key=$3,checksum=$4 WHERE id=$5",
      [target ? null : bytes, target, object, digest(bytes), id],
    );
    if (object)
      await client.query(
        "DELETE FROM storage_cleanup WHERE provider_id=$1 AND object_key=$2",
        [target, object],
      );
    if (media.provider_id)
      await client.query(
        "INSERT INTO storage_cleanup(provider_id,object_key) VALUES($1,$2) ON CONFLICT DO NOTHING",
        [media.provider_id, media.object_key],
      );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export async function cleanupStorage() {
  const rows = await query<{
    id: string;
    provider_id: string;
    object_key: string;
  }>(
    "SELECT * FROM storage_cleanup WHERE created_at<now()-interval '1 hour' ORDER BY id LIMIT 10",
  );
  let deleted = 0,
    failed = 0;
  for (const row of rows) {
    if (
      (
        await query(
          "SELECT id FROM media WHERE provider_id=$1 AND object_key=$2",
          [row.provider_id, row.object_key],
        )
      ).length
    )
      continue;
    try {
      const r = await bunnyRequest(
        await storageProvider(row.provider_id),
        row.object_key,
        "DELETE",
      );
      await r.body?.cancel();
      await query("DELETE FROM storage_cleanup WHERE id=$1", [row.id]);
      deleted++;
    } catch {
      failed++;
    }
  }
  return { deleted, failed };
}
