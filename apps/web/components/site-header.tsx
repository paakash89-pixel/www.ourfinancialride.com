import Link from "next/link";
import { BrandMark } from "./brand-mark";

const nav = [
  { href: "/work-with-us", label: "Work With Us" },
  { href: "/tools", label: "Tools" },
  { href: "/our-story", label: "Our Story" },
  { href: "/principles", label: "Principles" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/65 backdrop-blur-2xl">
      <div className="page-shell">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/" className="focus-ring rounded-xl px-2 py-1">
            <BrandMark iconSrc="/brand/ofr-mark-topbar.png" />
          </Link>

          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center gap-1 rounded-full border border-slateBlue-100 bg-white/72 p-1.5 text-sm text-slateBlue-600 shadow-soft"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring rounded-full px-3 py-2 transition hover:bg-white hover:text-slateBlue-700"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/work-with-us#apply"
              className="ios-btn-primary ml-1 px-4 py-2 text-sm"
            >
              Apply
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
