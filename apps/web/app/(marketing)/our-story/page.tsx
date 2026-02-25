import type { Metadata } from "next";
import Link from "next/link";
import { StoryReel } from "../../../components/story-reel";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "How OFR moved from low six-figure income to financial independence through disciplined systems."
};

export default function OurStoryPage() {
  return (
    <main className="page-shell py-12 sm:py-16">
      <section className="card animate-fade-up p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-slateBlue-500">Our Story</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slateBlue-700 sm:text-5xl">
          10-Year Path to Work-Optional Living
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slateBlue-500">
          No stock tips. No hype. Just disciplined investing, fixed-cost control, and clear quarterly reviews.
        </p>
        <div className="mt-6">
          <Link href="/work-with-us#apply" className="ios-btn-primary px-5 py-3 text-sm">
            Apply for 1:1 Coaching
          </Link>
        </div>
      </section>

      <StoryReel />
    </main>
  );
}
