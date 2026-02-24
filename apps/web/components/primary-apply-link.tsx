import Link from "next/link";

export function PrimaryApplyLink({
  className = ""
}: {
  className?: string;
}) {
  return (
    <Link
      href="/work-with-us#apply"
      className={`ios-btn-primary px-5 py-3 text-sm ${className}`.trim()}
    >
      Apply
    </Link>
  );
}
