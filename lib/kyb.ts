import { z } from "zod";

/**
 * Corporate Affairs Commission (CAC) registry lookups for business
 * verification. The registered name always comes from the registry, never
 * from what the customer types.
 *
 * Providers:
 * - "dojah" (default): Dojah KYC API. Needs DOJAH_APP_ID and DOJAH_SECRET_KEY;
 *   DOJAH_BASE_URL defaults to https://api.dojah.io (use
 *   https://sandbox.dojah.io with sandbox keys).
 * - "sandbox": fixed fictitious records for automated tests and local QA.
 *   Never enable it on a live platform.
 */
export const companyTypes = {
  RC: "Limited company (RC)",
  BN: "Business name (BN)",
  IT: "Incorporated trustees (IT)",
} as const;
export type CompanyType = keyof typeof companyTypes;

export const cacInput = z
  .object({
    companyType: z.enum(["RC", "BN", "IT"]),
    cacNumber: z
      .string()
      .trim()
      .toUpperCase()
      .transform((v) => v.replace(/^(RC|BN|IT)\s*/, "").replace(/\s/g, ""))
      .pipe(
        z.string().regex(/^\d{4,10}$/, "Enter the digits of your CAC number, for example 1234567."),
      ),
  })
  .transform((v) => ({ ...v, reference: `${v.companyType}${v.cacNumber}` }));
export type CacInput = z.infer<typeof cacInput>;

export type CacRecord = {
  name: string;
  reference: string;
  companyType: CompanyType;
  address?: string;
  registeredOn?: string;
  /** The registry's status text, e.g. "ACTIVE". */
  entityStatus?: string;
  provider: string;
};
export type LookupResult =
  | { status: "found"; record: CacRecord }
  | { status: "not_found" }
  | { status: "unavailable"; reason: string };

/** Entity statuses that must go to a person rather than auto-verify. */
export const needsReview = (record: CacRecord) =>
  !!record.entityStatus && !/^(active|registered|verified)$/i.test(record.entityStatus.trim());

const sandboxRegister: Record<string, Omit<CacRecord, "reference" | "companyType" | "provider">> = {
  RC1234567: { name: "TEST BUSINESS LIMITED", address: "1 Test Close, Ikeja, Lagos", registeredOn: "2019-03-14", entityStatus: "ACTIVE" },
  RC7654321: { name: "SAMPLE TRADING NIGERIA LIMITED", address: "22 Sample Road, Wuse II, Abuja", registeredOn: "2021-08-02", entityStatus: "INACTIVE" },
  BN2345678: { name: "ADAEZE FABRICS AND DESIGNS", address: "5 Market Street, Aba, Abia", registeredOn: "2022-01-20", entityStatus: "ACTIVE" },
  IT3456789: { name: "THE INCORPORATED TRUSTEES OF SAMPLE FOUNDATION", address: "9 Charity Avenue, Ibadan, Oyo", registeredOn: "2018-11-05", entityStatus: "ACTIVE" },
};

const pick = (o: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) {
    const v = o?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
};

export async function lookupCac(
  input: CacInput,
  transport: typeof fetch = fetch,
): Promise<LookupResult> {
  const provider = process.env.KYB_PROVIDER || "dojah";
  if (provider === "sandbox") {
    const hit = sandboxRegister[input.reference];
    return hit
      ? { status: "found", record: { ...hit, reference: input.reference, companyType: input.companyType, provider: "sandbox" } }
      : { status: "not_found" };
  }
  const appId = process.env.DOJAH_APP_ID,
    secret = process.env.DOJAH_SECRET_KEY;
  if (!appId || !secret)
    return { status: "unavailable", reason: "The CAC registry connection is not configured." };
  const base = process.env.DOJAH_BASE_URL || "https://api.dojah.io";
  try {
    const url = new URL("/api/v1/kyc/cac", base);
    url.searchParams.set("rc_number", input.cacNumber);
    url.searchParams.set("company_type", input.companyType === "RC" ? "RC" : input.companyType);
    const r = await transport(url, {
      headers: { AppId: appId, Authorization: secret, Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    if (r.status === 404) return { status: "not_found" };
    const body = (await r.json().catch(() => ({}))) as { entity?: Record<string, unknown>; error?: string };
    if (!r.ok) {
      // Dojah reports unknown numbers as 400 with an error message.
      if (r.status === 400 && /not\s*found|no record|invalid/i.test(String(body.error || "")))
        return { status: "not_found" };
      return { status: "unavailable", reason: `Registry responded with ${r.status}.` };
    }
    const entity = body.entity || {};
    const name = pick(entity, "company_name", "companyName", "name", "business_name");
    if (!name) return { status: "not_found" };
    return {
      status: "found",
      record: {
        name,
        reference: input.reference,
        companyType: input.companyType,
        address: pick(entity, "address", "branch_address", "head_office_address"),
        registeredOn: pick(entity, "date_of_registration", "registration_date"),
        entityStatus: pick(entity, "status", "company_status"),
        provider: "dojah",
      },
    };
  } catch {
    return { status: "unavailable", reason: "The CAC registry could not be reached." };
  }
}
