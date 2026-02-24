import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getAllLetters, getLetterBySlug } from "../../../../lib/letters";

interface LetterPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const letters = await getAllLetters();
  return letters.map((letter) => ({ slug: letter.slug }));
}

export async function generateMetadata({ params }: LetterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const letter = await getLetterBySlug(slug);

  if (!letter) {
    return { title: "Letter not found" };
  }

  return {
    title: letter.seoTitle ?? letter.title,
    description: letter.seoDescription ?? letter.summary,
    keywords: letter.keywords,
    alternates: {
      canonical: `/letters/${letter.slug}`
    },
    openGraph: {
      type: "article",
      title: letter.seoTitle ?? letter.title,
      description: letter.seoDescription ?? letter.summary
    }
  };
}

const renderBlock = (block: string) => {
  const lines = block.split("\n");
  const nodes: ReactNode[] = [];
  lines.forEach((line, index) => {
    nodes.push(line);
    if (index < lines.length - 1) {
      nodes.push(<br key={`br-${index}`} />);
    }
  });
  return nodes;
};

export default async function LetterDetailPage({ params }: LetterPageProps) {
  const { slug } = await params;
  const letter = await getLetterBySlug(slug);

  if (!letter) {
    notFound();
  }

  const blocks = letter.content.split("\n\n");

  return (
    <main className="page-shell py-12 sm:py-16">
      <article className="card animate-fade-up mx-auto max-w-3xl p-6 sm:p-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: letter.seoTitle ?? letter.title,
              description: letter.seoDescription ?? letter.summary,
              datePublished: letter.date,
              author: {
                "@type": "Organization",
                name: "OFR — Our Financial Ride"
              },
              publisher: {
                "@type": "Organization",
                name: "OFR — Our Financial Ride"
              },
              mainEntityOfPage: `/letters/${letter.slug}`,
              keywords: letter.keywords
            })
          }}
        />
        <p className="text-xs uppercase tracking-wide text-slateBlue-500">
          {new Date(letter.date).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slateBlue-700 sm:text-5xl">
          {letter.title}
        </h1>

        <div className="prose-custom mt-8">
          {blocks.map((block) => (
            <p key={block}>{renderBlock(block)}</p>
          ))}
        </div>

        <div className="ios-soft-panel mt-10 p-5">
          <p className="text-sm text-slateBlue-600">Apply for 1:1 coaching.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/work-with-us#apply"
              className="ios-btn-primary px-5 py-3 text-sm"
            >
              Apply
            </Link>
            <Link
              href="/letters"
              className="ios-btn-secondary px-5 py-3 text-sm"
            >
              Back to letters
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
