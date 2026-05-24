import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Redirige /admin/Administrateurs → /admin/administrateurs (URLs sensibles à la casse). */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const lower = pathname.toLowerCase();

  if (pathname === lower) {
    return NextResponse.next();
  }

  if (!lower.startsWith("/admin")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = lower;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
