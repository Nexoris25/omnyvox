import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { query, audit } from "./db";
import {
  providerInput,
  sealStorageKey,
  writeVerified,
} from "./storage-provider";
import {
  cleanupStorage,
  storageProvider,
  transferMedia,
} from "./media-storage";

export async function storageAdmin(
  req: NextRequest,
  actor: string,
  action?: string,
) {
  if (req.method === "GET") {
    const [settings] = await query(
      "SELECT provider_id FROM storage_settings WHERE id=true",
    );
    return NextResponse.json({
      active: settings?.provider_id || null,
      providers: await query(
        "SELECT id,label,zone,endpoint,tested_at FROM storage_providers ORDER BY created_at",
      ),
      usage: await query(
        "SELECT provider_id,count(*)::int AS files,COALESCE(sum(size),0)::text AS bytes FROM media GROUP BY provider_id",
      ),
      cleanup: (
        await query("SELECT count(*)::int AS count FROM storage_cleanup")
      )[0].count,
    });
  }
  if (req.method !== "POST")
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  try {
    if (action === "connect") {
      const b = providerInput.parse(await req.json());
      const [p] = await query<{ id: string }>(
        "INSERT INTO storage_providers(label,endpoint,zone,secret) VALUES($1,$2,$3,$4) RETURNING id",
        [b.label, b.endpoint, b.zone, sealStorageKey(b.accessKey)],
      );
      await audit(actor, "storage.connected", p.id);
    } else if (action === "rotate") {
      const b = z
        .object({ id: z.uuid(), accessKey: providerInput.shape.accessKey })
        .parse(await req.json());
      const p = await storageProvider(b.id);
      const candidate = { ...p, secret: sealStorageKey(b.accessKey) };
      // Test the candidate without invalidating the stored credential if it fails.
      const object = `omnyvox/checks/${randomUUID()}.webp`;
      await query(
        "INSERT INTO storage_cleanup(provider_id,object_key) VALUES($1,$2)",
        [p.id, object],
      );
      await writeVerified(candidate, object, await probeImage());
      await query(
        "UPDATE storage_providers SET secret=$1,tested_at=now() WHERE id=$2",
        [candidate.secret, p.id],
      );
      await audit(actor, "storage.key.rotated", p.id);
    } else if (action === "test") {
      const { id } = z.object({ id: z.uuid() }).parse(await req.json());
      const p = await storageProvider(id),
        object = `omnyvox/checks/${randomUUID()}.webp`;
      await query(
        "INSERT INTO storage_cleanup(provider_id,object_key) VALUES($1,$2)",
        [id, object],
      );
      await writeVerified(p, object, await probeImage());
      await query("UPDATE storage_providers SET tested_at=now() WHERE id=$1", [
        id,
      ]);
      await audit(actor, "storage.test.passed", id);
    } else if (action === "activate") {
      const { target } = z
        .object({ target: z.uuid().nullable() })
        .parse(await req.json());
      if (target && !(await storageProvider(target)).tested_at)
        throw Error("Test the connection before activating it.");
      await query("UPDATE storage_settings SET provider_id=$1 WHERE id=true", [
        target,
      ]);
      await audit(actor, "storage.active.changed", target || "vps");
    } else if (action === "migrate") {
      const { target } = z
        .object({ target: z.uuid().nullable() })
        .parse(await req.json());
      if (target && !(await storageProvider(target)).tested_at)
        throw Error("Test the connection before moving images.");
      const rows = await query<{ id: string }>(
        "SELECT id FROM media WHERE provider_id IS DISTINCT FROM $1::uuid ORDER BY created_at,id LIMIT 2",
        [target],
      );
      let moved = 0;
      for (const row of rows) if (await transferMedia(row.id, target)) moved++;
      await audit(actor, "storage.batch.migrated", target || "vps");
      const [left] = await query<{ count: number }>(
        "SELECT count(*)::int AS count FROM media WHERE provider_id IS DISTINCT FROM $1::uuid",
        [target],
      );
      return NextResponse.json({ success: true, moved, remaining: left.count });
    } else if (action === "cleanup") {
      const result = await cleanupStorage();
      await audit(actor, "storage.cleanup", "storage");
      return NextResponse.json({ success: true, ...result });
    } else return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    // Never include remote response bodies or credentials in errors.
    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          /^(Storage |Configure STORAGE|Test the connection|Test this storage)/.test(
            error.message,
          )
            ? error.message
            : "Storage operation failed. Existing images are preserved; check the connection and retry.",
      },
      { status: 503 },
    );
  }
}
function probeImage() {
  return sharp({
    create: { width: 1, height: 1, channels: 4, background: "#540CDA" },
  })
    .webp()
    .toBuffer();
}
