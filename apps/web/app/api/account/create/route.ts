import { NextResponse } from "next/server";
import { z } from "zod";
import { createAccount } from "../../../../lib/account-store";
import {
  accountCookieName,
  createAccountSessionValue,
  createNewsletterSessionValue,
  newsletterCookieName
} from "../../../../lib/member-auth";

export const runtime = "nodejs";

const accountSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  password: z
    .string()
    .min(10, "Use at least 10 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/\d/, "Include at least one number"),
  subscribeNewsletter: z.boolean()
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = accountSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  try {
    await createAccount(parsed.data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create account." },
      { status: 409 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    accountCookieName,
    createAccountSessionValue(parsed.data.email),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90
    }
  );

  if (parsed.data.subscribeNewsletter) {
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
  }

  return response;
}
