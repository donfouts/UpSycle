import type { ReactNode } from "react";

export interface LegalTocItem {
  id: string;
  label: string;
}

interface LegalPageLayoutProps {
  eyebrow: string;
  title: string;
  effectiveDate: ReactNode;
  lastUpdated: ReactNode;
  disclaimer: ReactNode;
  toc: LegalTocItem[];
  children: ReactNode;
}

/** Shared chrome for /privacy and /terms — header, disclaimer callout, and a
 * table-of-contents + numbered-sections layout, styled with the `.legal-*`
 * classes in globals.css. */
export default function LegalPageLayout({
  eyebrow,
  title,
  effectiveDate,
  lastUpdated,
  disclaimer,
  toc,
  children,
}: LegalPageLayoutProps) {
  return (
    <section className="px-6 py-28 md:px-14">
      <div className="sec-max">
        <div className="legal-header">
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="sec-title">{title}</h1>
          <p className="legal-meta">
            Effective date: {effectiveDate} &middot; Last updated: {lastUpdated}
          </p>
          <div className="legal-disclaimer">
            <strong>Template notice.</strong> {disclaimer}
          </div>
        </div>

        <div className="legal-layout">
          <nav className="legal-toc" aria-label="Table of contents">
            <div className="legal-toc-label">On this page</div>
            <ol>
              {toc.map((item, i) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>
                    {i + 1}. {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <main>{children}</main>
        </div>
      </div>
    </section>
  );
}

export function LegalSection({
  id,
  num,
  title,
  children,
}: {
  id: string;
  num: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="legal-section">
      <div className="legal-num">{num}</div>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
