import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faXTwitter,
  faYoutube,
  faTiktok,
  faWhatsapp,
  type IconDefinition,
} from "@fortawesome/free-brands-svg-icons";

// Brand marks from Font Awesome Free (icons CC BY 4.0, https://fontawesome.com/license/free).
const brands: Record<string, { icon: IconDefinition; name: string }> = {
  facebook: { icon: faFacebook, name: "Facebook" },
  instagram: { icon: faInstagram, name: "Instagram" },
  linkedin: { icon: faLinkedin, name: "LinkedIn" },
  x: { icon: faXTwitter, name: "X" },
  youtube: { icon: faYoutube, name: "YouTube" },
  tiktok: { icon: faTiktok, name: "TikTok" },
  whatsapp: { icon: faWhatsapp, name: "WhatsApp" },
};

export function BrandIcon({
  icon,
  size = 18,
}: {
  icon: IconDefinition;
  size?: number;
}) {
  const [width, height, , , path] = icon.icon;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {(Array.isArray(path) ? path : [path]).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export const whatsappIcon = faWhatsapp;

export function SocialLinks({
  links = {},
  businessName,
}: {
  links?: Record<string, string | undefined>;
  businessName?: string;
}) {
  const entries = Object.keys(brands).filter(
    (key) => links[key] && /^https?:\/\//.test(links[key]!),
  );
  if (!entries.length) return null;
  return (
    <div className="social-links">
      {entries.map((key) => {
        const { icon, name } = brands[key];
        const label = businessName ? `${businessName} on ${name}` : name;
        return (
          <a
            key={key}
            href={links[key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} (opens in a new tab)`}
            title={name}
          >
            <BrandIcon icon={icon} />
          </a>
        );
      })}
    </div>
  );
}
