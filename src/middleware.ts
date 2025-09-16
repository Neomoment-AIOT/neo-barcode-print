// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const session = req.cookies.get("session");

  // Protect all routes under /landing
  if (!session && req.nextUrl.pathname.startsWith("/landing")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Only run middleware on these paths
export const config = {
  matcher: ["/landing/:path*"],
};
