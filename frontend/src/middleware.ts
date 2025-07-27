import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the token from cookies
  const token = request.cookies.get("token")?.value;

  console.log(token);
  console.log(pathname);

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
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    // Allow access to dashboard if token exists
    return NextResponse.next();
  }

  // Handle auth pages when user is already logged in
  if (pathname.startsWith("/auth/")) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Allow access to auth pages if no token
    return NextResponse.next();
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
