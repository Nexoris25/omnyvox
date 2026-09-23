import { z } from "zod";
import { query, pool } from "./db";
import { legalSetFor, policies } from "./legal-policies";
import { NextRequest, NextResponse } from "next/server";
export const businessSchema = z.object({
  summary: z.string().trim().max(1500),
  services: z.string().max(2000),
  audience: z.string().max(500),
  city: z.string().max(100),
  phone: z.string().max(40),
  address: z.string().max(300),
  showAddress: z.boolean(),
  hours: z.string().max(300),
  factsConfirmed: z.boolean(),
  fulfilment: z.enum(["physical", "digital", "services"]).default("physical"),
});
export async function businessSettings(req: NextRequest, site: string) {
  if (req.method === "GET") {
    const [p] = await query(
      "SELECT data FROM business_profiles WHERE site_id=$1",
      [site],
    );
    return NextResponse.json(p?.data || {});
  }
  if (req.method !== "PATCH")
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  const data = businessSchema.parse(await req.json());
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [current],
    } = await client.query(
      "SELECT status,industry_id,category FROM sites WHERE id=$1 FOR UPDATE",
      [site],
    );
    if (current.status === "published") {
      const { rows } = await client.query(
        "SELECT data FROM records WHERE site_id=$1 AND kind='legal' AND data->>'status'='published' AND data->>'policyReviewed'='true'",
        [site],
      );
      const missing = legalSetFor(
        current.industry_id,
        current.category,
        data.fulfilment,
      ).filter((type) => !rows.some((r) => r.data.policyType === type));
      if (missing.length) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            error:
              "Publish reviewed policies before changing this live business: " +
              missing.map((type) => policies[type].title).join(", "),
          },
          { status: 409 },
        );
      }
    }
    await client.query(
      "INSERT INTO business_profiles(site_id,data) VALUES($1,$2) ON CONFLICT(site_id) DO UPDATE SET data=$2,updated_at=now()",
      [site, JSON.stringify(data)],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  return NextResponse.json({ success: true });
}
