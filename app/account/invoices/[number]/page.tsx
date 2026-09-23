import { user } from "@/lib/auth";
import { query } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
export const metadata = {
  title: "Subscription invoice",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const account = await user();
  if (!account) redirect("/login");
  if (account.mfa_enabled && !account.mfa_verified) redirect("/login");
  const { number } = await params;
  if (!/^\d{1,16}$/.test(number)) notFound();
  const [invoice] = await query<{
    number: string;
    description: string;
    amount: number;
    currency: string;
    issued_at: string;
    period_start: string;
    period_end: string;
    buyer: { name: string; business: string; email: string };
    reference: string;
  }>(
    "SELECT i.* FROM invoices i JOIN sites s ON s.id=i.site_id WHERE i.number=$1 AND s.owner_id=$2",
    [number, account.id],
  );
  if (!invoice) notFound();
  return (
    <main
      id="main"
      className="section"
      style={{ maxWidth: 800, margin: "auto" }}
    >
      <Link href="/dashboard/billing">← Subscription & billing</Link>
      <h1>Invoice OMN-{String(invoice.number).padStart(6, "0")}</h1>
      <p>Omnyvox · Nexoris Technologies Ltd</p>
      <p>
        Issued {new Date(invoice.issued_at).toLocaleDateString("en-NG")} · Paid
      </p>
      <h2>Bill to</h2>
      <p>
        {invoice.buyer.business}
        <br />
        {invoice.buyer.name}
        <br />
        {invoice.buyer.email}
      </p>
      <h2>{invoice.description}</h2>
      <p>
        Service period:{" "}
        {new Date(invoice.period_start).toLocaleDateString("en-NG")} –{" "}
        {new Date(invoice.period_end).toLocaleDateString("en-NG")}
      </p>
      <p>
        Total paid:{" "}
        <strong>
          {new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: invoice.currency,
          }).format(invoice.amount / 100)}
        </strong>
      </p>
      <p style={{ overflowWrap: "anywhere" }}>
        Payment reference: {invoice.reference}
      </p>
      <p>Use your browser’s Print command to save a PDF copy.</p>
    </main>
  );
}
