import { ArrowDownRight, ChevronRight } from "lucide-react";
export function SitePageHeader({
  title,
  description,
  home,
  eyebrow = "Explore",
  children,
}: {
  title: string;
  description?: string;
  home: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="site-page-header">
      <nav className="site-breadcrumbs" aria-label="Breadcrumb">
        <a href={home || "/"}>Home</a>
        <ChevronRight size={13} aria-hidden="true" />
        <span aria-current="page">{title}</span>
      </nav>
      <div className="site-page-heading">
        <div>
          <span className="section-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
          {children}
        </div>
        <ArrowDownRight
          className="page-heading-mark"
          size={64}
          strokeWidth={1}
          aria-hidden="true"
        />
      </div>
    </header>
  );
}
