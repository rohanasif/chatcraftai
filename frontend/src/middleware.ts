import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the token from cookies
  const token = request.cookies.get("token")?.value;

  // Handle root path redirects
  if (pathname === "/") {
    if (token) {
      // User is logged in, redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      // User is not logged in, redirect to login
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // Handle dashboard access (protected route)
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Handle auth pages when user is already logged in
  if (
    (pathname.startsWith("/auth/login") ||
      pathname.startsWith("/auth/register")) &&
    token
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
