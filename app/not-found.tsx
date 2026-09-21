import Link from "next/link";
import { Brand } from "@/components/brand";
export default function NotFound() {
  return (
    <main id="main" className="empty" style={{ paddingTop: "15vh" }}>
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}
      >
        <Brand />
      </div>
      <h1>This page isn’t here yet.</h1>
      <p>The website may still be a draft, or the address may have changed.</p>
      <Link href="/" className="button">
        Back to Omnyvox →
      </Link>
    </main>
  );
}
