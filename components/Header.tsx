import Link from "next/link";
import CategoryNav from "@/components/CategoryNav";
import CartBadge from "@/components/cart/CartBadge";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/current-user";
import { CATEGORY_TREE } from "@/lib/categories";

const navLinks = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#story", label: "Our Story" },
];

const authNavLinkClass =
  "text-[0.68rem] font-medium tracking-[0.13em] uppercase text-[rgba(245,237,224,0.4)] no-underline transition-colors hover:text-[var(--rg-light)]";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-6 py-4 md:px-14 lg:px-20 xl:px-28 bg-[rgba(8,8,8,0.94)] backdrop-blur-[14px] border-b border-[var(--border)]">
      <Link href="/" className="flex items-center gap-3 no-underline">
        <span className="relative block w-[38px] h-8 shrink-0" aria-hidden="true">
          <span className="grad-text absolute top-0 left-0 z-[2] font-serif text-[1.65rem] font-light leading-[0.85]">
            U
          </span>
          <span className="grad-text absolute bottom-0 right-0 z-[1] font-serif text-[1.65rem] font-light leading-[0.85] opacity-95">
            S
          </span>
        </span>
        <span className="flex flex-col leading-[1.1]">
          <span className="font-serif text-[1.05rem] font-semibold text-[var(--cream)] tracking-[0.04em]">
            <span className="grad-text">Up</span>Sycle
          </span>
          <span className="font-sans text-[0.5rem] font-medium tracking-[0.32em] uppercase text-[var(--rg-light)] opacity-75">
            — Market —
          </span>
        </span>
      </Link>
      <ul className="flex items-center gap-7 list-none">
        <li className="hidden md:block">
          <CategoryNav categories={CATEGORY_TREE} />
        </li>
        <li className="hidden lg:block">
          <form action="/browse" method="GET" className="flex items-center">
            <input
              type="search"
              name="q"
              placeholder="Search handcrafted pieces..."
              className="w-48 border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-[0.8rem] text-[var(--cream)] outline-none placeholder:text-[rgba(245,237,224,0.3)] focus:border-[var(--rg-core)]"
            />
          </form>
        </li>
        {navLinks.map((link) => (
          <li key={link.href} className="hidden md:block">
            <Link
              href={link.href}
              className="text-[0.68rem] font-medium tracking-[0.13em] uppercase text-[var(--muted)] no-underline transition-colors hover:text-[var(--rg-light)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/sell"
            className="border border-[var(--rg-core)] text-[var(--rg-light)] px-5 py-2 text-[0.68rem] font-medium tracking-[0.13em] uppercase no-underline transition-all hover:bg-[var(--rg-core)] hover:text-[var(--black)]"
          >
            Start Selling
          </Link>
        </li>
        {user ? (
          <>
            <li className="hidden md:block">
              <Link href="/account" className={authNavLinkClass}>
                {user.firstName ?? "Account"}
              </Link>
            </li>
            <li className="hidden md:block">
              <LogoutButton
                className={`${authNavLinkClass} cursor-pointer border-none bg-transparent p-0`}
              />
            </li>
          </>
        ) : (
          <li className="hidden md:block">
            <Link href="/login" className={authNavLinkClass}>
              Sign In
            </Link>
          </li>
        )}
        <li>
          <CartBadge />
        </li>
      </ul>
    </nav>
  );
}
