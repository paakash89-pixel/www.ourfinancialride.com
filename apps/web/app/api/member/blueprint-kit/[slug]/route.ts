import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { blueprintTimeline } from "../../../../../lib/content";
import { isMemberSessionValid, memberCookieName } from "../../../../../lib/member-auth";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

const MASTER_KIT_SLUG = "ofr-blueprint-us-master";

const getKitPath = (slug: string): string =>
  path.resolve(process.cwd(), "content", "blueprint-kits", `${slug}.xlsx`);

export async function GET(_: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(memberCookieName)?.value;

  if (!isMemberSessionValid(sessionValue)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const tool = blueprintTimeline.find((item) => item.toolSlug === slug);

  if (!tool && slug !== MASTER_KIT_SLUG) {
    return NextResponse.json({ message: "Resource not found" }, { status: 404 });
  }

  try {
    const filePath = getKitPath(slug);
    const file = await fs.readFile(filePath);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=\"${slug}.xlsx\"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    return NextResponse.json({ message: "Resource file is missing." }, { status: 404 });
  }
}
