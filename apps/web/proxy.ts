import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const APEX_HOST = "ourfinancialride.com";
const WWW_HOST = "www.ourfinancialride.com";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase();

  if (host === APEX_HOST) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.host = WWW_HOST;
    redirectUrl.protocol = "https";
    return NextResponse.redirect(redirectUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"]
};
