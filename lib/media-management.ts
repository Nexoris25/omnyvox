import { query, audit } from "./db";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
export async function manageMedia(
  req: NextRequest,
  id: string,
  siteId: string | null,
  actor: string,
) {
  if (!z.uuid().safeParse(id).success)
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  const [m] = await query(
    "SELECT id FROM media WHERE id=$1 AND site_id IS NOT DISTINCT FROM $2::uuid",
    [id, siteId],
  );
  if (!m)
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  if (req.method === "PATCH") {
    const { alt } = z
      .object({ alt: z.string().max(300) })
      .parse(await req.json());
    await query("UPDATE media SET alt=$1 WHERE id=$2", [alt, id]);
  } else if (req.method === "DELETE") {
    const used = siteId
      ? await query(
          "SELECT id FROM sites WHERE id=$1 AND (data::text LIKE $2 OR published::text LIKE $2) UNION SELECT id FROM records WHERE site_id=$1 AND data::text LIKE $2",
          [siteId, "%" + id + "%"],
        )
      : await query(
          "SELECT id FROM marketing_records WHERE data::text LIKE $1",
          ["%" + id + "%"],
        );
    if (used.length)
      return NextResponse.json(
        {
          error:
            "This image is in use. Remove it from draft and published content before deleting.",
        },
        { status: 409 },
      );
    await query("DELETE FROM media WHERE id=$1", [id]);
  }
  await audit(
    actor,
    "media." + (req.method === "DELETE" ? "deleted" : "updated"),
    id,
  );
  return NextResponse.json({ success: true });
}
