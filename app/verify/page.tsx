import { AccountRecovery } from "@/components/account-recovery";
export const metadata = {
  title: "Verify email",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AccountRecovery mode="verify" />;
}
