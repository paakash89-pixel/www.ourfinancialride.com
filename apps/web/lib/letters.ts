import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

export interface LetterMeta {
  title: string;
  slug: string;
  date: string;
  summary: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
}

export interface Letter extends LetterMeta {
  content: string;
}

const candidateLetterDirs = [
  path.join(process.cwd(), "content", "letters"),
  path.join(process.cwd(), "..", "..", "content", "letters")
];

const resolveLetterDir = async (): Promise<string> => {
  for (const dir of candidateLetterDirs) {
    try {
      await fs.access(dir);
      return dir;
    } catch {
      // Continue checking
    }
  }
  throw new Error("Could not find /content/letters directory.");
};

const parseLetterFile = async (filePath: string): Promise<Letter> => {
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = matter(raw);
  const data = parsed.data as LetterMeta;

  return {
    title: data.title,
    slug: data.slug,
    date: data.date,
    summary: data.summary,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    keywords: data.keywords ?? [],
    content: parsed.content.trim()
  };
};

export const getAllLetters = async (): Promise<Letter[]> => {
  const lettersDir = await resolveLetterDir();
  const files = await fs.readdir(lettersDir);
  const letters = await Promise.all(
    files.filter((file) => file.endsWith(".md")).map((file) => parseLetterFile(path.join(lettersDir, file)))
  );

  return letters.sort((a, b) => (a.date < b.date ? 1 : -1));
};

export const getLetterBySlug = async (slug: string): Promise<Letter | null> => {
  const letters = await getAllLetters();
  return letters.find((letter) => letter.slug === slug) ?? null;
};
