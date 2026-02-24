import type { MetadataRoute } from "next";
import { getAllLetters } from "../lib/letters";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ourfinancialride.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/work-with-us",
    "/tools",
    "/blueprint",
    "/letters",
    "/newsletter",
    "/create-account",
    "/member",
    "/login",
    "/disclaimer",
    "/privacy",
    "/terms"
  ];

  const staticEntries = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : route === "/work-with-us" ? 0.95 : 0.7
  }));

  const letters = await getAllLetters();
  const letterEntries = letters.map((letter) => ({
    url: `${siteUrl}/letters/${letter.slug}`,
    lastModified: new Date(letter.date),
    changeFrequency: "monthly" as const,
    priority: 0.6
  }));

  return [...staticEntries, ...letterEntries];
}
