import { AccountRecovery } from "@/components/account-recovery";
export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AccountRecovery mode="reset" />;
}
