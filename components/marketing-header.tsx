"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";
import { usePathname } from "next/navigation";
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="marketing-nav sticky-nav">
      <Brand />
      <button
        className="mobile-menu-toggle"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="marketing-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav
        id="marketing-navigation"
        className={open ? "marketing-links open" : "marketing-links"}
        aria-label="Main navigation"
      >
        {[
          ["/", "Overview"],
          ["/templates", "Templates"],
          ["/features", "Features"],
          ["/pricing", "Pricing"],
          ["/insights", "Insights"],
          ["/contact", "Contact"],
        ].map(([url, label]) => (
          <Link
            key={url}
            href={url}
            aria-current={
              pathname === url ||
              (url !== "/" && pathname.startsWith(url + "/"))
                ? "page"
                : undefined
            }
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
        ))}
        <Link href="/login">Log in</Link>
        <Link href="/register" className="button small">
          Get started <ArrowUpRight size={16} />
        </Link>
      </nav>
    </header>
  );
}
