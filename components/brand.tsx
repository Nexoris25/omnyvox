import Image from "next/image";
import Link from "next/link";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="Omnyvox home">
      <Image src="/brand-icon.webp" width={36} height={34} alt="" priority />
      {!compact && (
        <Image
          src="/wordmark.webp"
          width={142}
          height={25}
          alt="Omnyvox"
          priority
        />
      )}
    </Link>
  );
}
