import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createNewsletterSessionValue,
  newsletterCookieName
} from "../../../../lib/member-auth";

export const runtime = "nodejs";

const newsletterSchema = z.object({
  email: z.string().trim().email("Enter a valid email")
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = newsletterSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    newsletterCookieName,
    createNewsletterSessionValue(parsed.data.email),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    }
  );

  return response;
}
