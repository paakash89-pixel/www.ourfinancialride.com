import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAccountCredentials } from "../../../../lib/account-store";
import {
  accountCookieName,
  createAccountSessionValue
} from "../../../../lib/member-auth";

export const runtime = "nodejs";

const accountLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password")
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = accountLoginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const account = await verifyAccountCredentials(
    parsed.data.email,
    parsed.data.password
  );

  if (!account) {
    return NextResponse.json({ message: "Incorrect email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(accountCookieName, createAccountSessionValue(account.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90
  });

  return response;
}

