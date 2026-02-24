import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createMemberSessionValue,
  memberCookieName
} from "../../../lib/member-auth";

export const runtime = "nodejs";

const loginSchema = z.object({
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const memberPassword = process.env.MEMBER_PASSWORD;
  if (!memberPassword) {
    return NextResponse.json(
      { message: "MEMBER_PASSWORD is not configured." },
      { status: 500 }
    );
  }

  if (parsed.data.password !== memberPassword) {
    return NextResponse.json({ message: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(memberCookieName, createMemberSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
