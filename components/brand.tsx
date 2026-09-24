import Link from "next/link";

/** The Omnyvox logo. Use `onDark` on dark backgrounds (footer, sidebar) for
 * the white-lettered variant; both variants have transparent backgrounds.
 * Served as plain images: they are tiny and already optimised. */
export function Brand({
  compact = false,
  onDark = false,
}: {
  compact?: boolean;
  onDark?: boolean;
}) {
  const suffix = onDark ? "-on-dark" : "";
  return (
    <Link href="/" className="brand" aria-label="Omnyvox home">
      <img src={`/brand-icon${suffix}.webp`} width={36} height={33} alt="" />
      {!compact && <img src={`/wordmark${suffix}.webp`} width={142} height={24} alt="Omnyvox" />}
    </Link>
  );
}
