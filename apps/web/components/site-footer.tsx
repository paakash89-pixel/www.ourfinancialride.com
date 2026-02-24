import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "ourfinancialride@gmail.com";

  return (
    <footer className="mt-20 border-t border-white/60 bg-white/55 backdrop-blur-xl">
      <div className="page-shell py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <BrandMark compact />
            <p className="max-w-xl text-sm leading-6 text-slateBlue-500">
              Educational platform for disciplined, index-based wealth systems. Not investment, legal, or tax advice.
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-4 text-sm text-slateBlue-600 sm:justify-end">
            <Link href="/disclaimer" className="focus-ring rounded-md px-2 py-1 hover:text-slateBlue-700">
              Disclaimer
            </Link>
            <Link href="/privacy" className="focus-ring rounded-md px-2 py-1 hover:text-slateBlue-700">
              Privacy
            </Link>
            <Link href="/terms" className="focus-ring rounded-md px-2 py-1 hover:text-slateBlue-700">
              Terms
            </Link>
            <a
              href={`mailto:${contactEmail}`}
              className="focus-ring rounded-md px-2 py-1 hover:text-slateBlue-700"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
