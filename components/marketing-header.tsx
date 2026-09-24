"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X, ArrowUpRight, ChevronRight } from "lucide-react";
import { Brand } from "./brand";
import { usePathname } from "next/navigation";

/** Four destinations on desktop; the logo is the way home. */
const primary = [
  ["/templates", "Templates"],
  ["/features", "Features"],
  ["/pricing", "Pricing"],
  ["/insights", "Insights"],
] as const;

/** Extra shortcuts shown only in the mobile menu. */
const explore = [
  ["/corporate-websites", "Business websites"],
  ["/ecommerce-websites", "Online stores"],
  ["/how-it-works", "How it works"],
  ["/help", "Help centre"],
  ["/contact", "Contact us"],
] as const;

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [top, setTop] = useState(0);

  const current = (url: string) =>
    pathname === url || pathname.startsWith(url + "/") ? "page" : undefined;

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) toggle.current?.focus();
  }, []);

  // Close whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const place = () => setTop(header.current?.getBoundingClientRect().bottom ?? 0);
    place();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    sheet.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab" || !sheet.current) return;
      // Keep focus inside the header bar and the menu while it is open.
      const items = [
        toggle.current,
        ...sheet.current.querySelectorAll<HTMLElement>("a, button"),
      ].filter(Boolean) as HTMLElement[];
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 900px)").matches) close(false);
      else place();
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      root.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open, close]);

  return (
    <>
      <header ref={header} className={`marketing-nav sticky-nav${open ? " menu-open" : ""}`}>
        <Brand />
        <nav className="mnav-links" aria-label="Main navigation">
          {primary.map(([url, label]) => (
            <Link key={url} href={url} aria-current={current(url)}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="mnav-actions">
          <Link href="/login" className="mnav-login">
            Log in
          </Link>
          <Link href="/register" className="button small mnav-start">
            Get started <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <button
            ref={toggle}
            type="button"
            className="mobile-menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="marketing-menu"
            onClick={() => (open ? close(false) : setOpen(true))}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      {open && (
        <>
          <div className="mnav-scrim" style={{ top }} onClick={() => close()} aria-hidden="true" />
          <div
            ref={sheet}
            id="marketing-menu"
            className="mnav-sheet"
            style={{ top }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
          >
            <nav aria-label="Main navigation" className="mnav-primary">
              {primary.map(([url, label]) => (
                <Link key={url} href={url} aria-current={current(url)} onClick={() => close(false)}>
                  {label}
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              ))}
            </nav>
            <nav aria-label="Explore" className="mnav-explore">
              <p>Explore</p>
              {explore.map(([url, label]) => (
                <Link key={url} href={url} aria-current={current(url)} onClick={() => close(false)}>
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mnav-sheet-actions">
              <Link href="/register" className="button" onClick={() => close(false)}>
                Get started <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/login" className="button secondary" onClick={() => close(false)}>
                Log in
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
