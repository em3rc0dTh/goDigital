import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const session = request.cookies.get("session_token")?.value;
  const tenantId = request.cookies.get("tenantId")?.value;
  const publicRoutes = ["/login", "/register", "/auth", "/api", "/verify-email", "/reset-password", "/select-workspace"];

  const isPublic = publicRoutes.some((path) => pathname.startsWith(path));

  // If no session and trying to access private route
  if (!session && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // If session exists but no workspace selected, force selection
  if (session && !tenantId && !isPublic && pathname !== "/select-workspace") {
    const selectUrl = request.nextUrl.clone();
    selectUrl.pathname = "/select-workspace";
    return NextResponse.redirect(selectUrl);
  }

  // If session exists and trying to access login/register
  if (session && tenantId && (pathname === "/login" || pathname === "/register")) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/home";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|.*\\.png|favicon.ico$).*)",
    "/",
  ],
};
