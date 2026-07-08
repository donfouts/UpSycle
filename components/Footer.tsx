import Link from "next/link";

const footerCols = [
  {
    title: "Shop",
    links: [
      { href: "/browse", label: "Browse All" },
      { href: "/browse?cat=jewelry", label: "Jewelry" },
      { href: "/browse?cat=clothing", label: "Clothing / Apparel" },
      { href: "/browse?cat=home-goods", label: "Home Goods" },
      { href: "/browse?cat=furniture", label: "Furniture" },
    ],
  },
  {
    title: "Sell",
    links: [
      { href: "/sell", label: "Open a Shop" },
      { href: "/login", label: "Seller Sign In" },
      { href: "/#how-it-works", label: "How It Works" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#story", label: "Our Story" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--black)] border-t border-[var(--border)] px-6 pt-12 pb-8 md:px-14">
      <div className="flex flex-wrap items-start justify-between gap-8 mb-9">
        <div>
          <span className="relative block w-14 h-[46px]" aria-hidden="true">
            <span className="grad-text absolute top-0 left-0 font-serif text-[2.6rem] font-light leading-[0.85]">
              U
            </span>
            <span className="grad-text absolute bottom-0 right-0 font-serif text-[2.6rem] font-light leading-[0.85] opacity-95">
              S
            </span>
          </span>
          <div className="font-serif text-[1.05rem] text-[var(--cream)] mt-2">
            <span className="grad-text">Up</span>Sycle Market
          </div>
          <div className="text-[0.58rem] tracking-[0.17em] uppercase text-[var(--rg-core)] opacity-60 mt-1">
            Created By US, Treasured by You
          </div>
        </div>
        <div className="flex flex-wrap gap-12">
          {footerCols.map((col) => (
            <div key={col.title}>
              <h4 className="text-[0.58rem] font-semibold tracking-[0.2em] uppercase text-[var(--rg-core)] mb-3.5">
                {col.title}
              </h4>
              <ul className="list-none flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.78rem] text-[var(--muted)] no-underline transition-colors hover:text-[var(--rg-light)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[var(--border)] pt-5 flex flex-wrap justify-between gap-2.5">
        <span className="text-[0.62rem] text-[rgba(245,237,224,0.26)] tracking-[0.05em]">
          © 2026 UpSycle Market. All rights reserved.
        </span>
        <span className="text-[0.62rem] text-[rgba(245,237,224,0.26)] tracking-[0.05em]">
          Handmade · Upcycled · Sustainable
        </span>
      </div>
    </footer>
  );
}
