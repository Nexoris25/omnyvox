import {
  Camera,
  Play,
  Link as LinkIcon,
  MessageCircle,
  Music2,
} from "lucide-react";
export function SocialLinks({
  links = {},
}: {
  links?: Record<string, string | undefined>;
}) {
  return (
    <div className="social-links">
      {Object.entries(links)
        .filter(([, url]) => url && /^https?:\/\//.test(url))
        .map(([name, url]) => {
          const Icon = (
            {
              instagram: Camera,
              youtube: Play,
              whatsapp: MessageCircle,
              tiktok: Music2,
            } as Record<string, typeof Camera>
          )[name];
          return (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
            >
              {Icon ? (
                <Icon size={19} />
              ) : (
                <span className="social-monogram" aria-hidden="true">
                  {name === "facebook" ? "f" : name === "linkedin" ? "in" : "𝕏"}
                </span>
              )}
            </a>
          );
        })}
    </div>
  );
}
