import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SecuritySettings } from "@/components/security-settings";
export const metadata = {
  title: "Account security",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if (!(await user())) redirect("/login");
  return <SecuritySettings />;
}
