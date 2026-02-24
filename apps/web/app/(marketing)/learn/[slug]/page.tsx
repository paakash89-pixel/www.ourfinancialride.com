import { redirect } from "next/navigation";

interface LearnArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata() {
  return {
    title: "Redirecting"
  };
}

export async function generateStaticParams() {
  return [];
}

export default async function LearnArticlePage({ params }: LearnArticlePageProps) {
  await params;
  redirect("/letters");
}
