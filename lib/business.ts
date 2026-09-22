import { z } from "zod";
import { query } from "./db";
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
  await query(
    "INSERT INTO business_profiles(site_id,data) VALUES($1,$2) ON CONFLICT(site_id) DO UPDATE SET data=$2,updated_at=now()",
    [site, JSON.stringify(data)],
  );
  return NextResponse.json({ success: true });
}
