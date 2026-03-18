import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_COOKIE } from "@/lib/constants";
import { readSessionCookieValue } from "@/lib/session";

function buildRedirectResponse(request: NextRequest, pathname: string) {
  const response = NextResponse.redirect(new URL(pathname, request.url));
  response.cookies.delete(AUTH_COOKIE);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawSession = request.cookies.get(AUTH_COOKIE)?.value;
  const envelope = await readSessionCookieValue(rawSession);
  const role = envelope?.session.role ?? null;

  if ((pathname.startsWith("/profile") || pathname.startsWith("/settings")) && !role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(AUTH_COOKIE);
    return response;
  }

  if (pathname.startsWith("/admin")) {
    if (!role) {
      return buildRedirectResponse(request, "/login");
    }

    if (role !== "admin") {
      return buildRedirectResponse(request, "/analytics");
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/settings/:path*", "/admin/:path*"],
};
