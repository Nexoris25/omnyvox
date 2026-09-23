import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PlatformAdmin } from "@/components/platform-admin";
import { isStaff } from "@/lib/permissions";
export const metadata = {
  title: "Platform administration",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const account = await user();
  if (!account) redirect("/login");
  if (!isStaff(account.role)) redirect("/dashboard");
  if (!account.mfa_enabled || !account.mfa_verified)
    redirect("/account/security");
  return <PlatformAdmin role={account.role} />;
}
