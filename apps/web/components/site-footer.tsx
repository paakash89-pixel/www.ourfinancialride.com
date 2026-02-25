import Link from "next/link";
import { BrandMark } from "./brand-mark";

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ThreadsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 16.5c.6 1.7 2.1 2.8 4.2 2.8 2.5 0 4.2-1.4 4.2-3.4 0-1.7-1.3-2.8-3.8-3.2l-1.8-.3c-2-.3-3.1-1.3-3.1-2.8 0-1.8 1.5-3.1 3.8-3.1 2.2 0 3.6 1 4.1 2.8" />
      <path d="M12.7 12.8c1.5.2 2.3.9 2.3 2 0 1.2-1 2-2.5 2-1.7 0-2.7-.8-3.1-2.2" />
    </svg>
  );
}

export function SiteFooter() {
  const instagramUrl =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/ourfinancialride";
  const threadsUrl =
    process.env.NEXT_PUBLIC_THREADS_URL ?? "https://www.threads.net/@ourfinancialride";

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
            <Link href="/faq" className="focus-ring rounded-md px-2 py-1 hover:text-slateBlue-700">
              FAQ
            </Link>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:text-slateBlue-700"
            >
              <InstagramIcon />
              Instagram
            </a>
            <a
              href={threadsUrl}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:text-slateBlue-700"
            >
              <ThreadsIcon />
              Threads
            </a>
            <Link href="/disclaimer" className="focus-ring rounded-md px-2 py-1 hover:text-slateBlue-700">
              Disclaimer
            </Link>
            <Link href="/privacy" className="focus-ring rounded-md px-2 py-1 hover:text-slateBlue-700">
              Privacy
            </Link>
            <Link href="/terms" className="focus-ring rounded-md px-2 py-1 hover:text-slateBlue-700">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
