// middleware.ts (en la raíz del proyecto, al lado de app/)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Obtenemos la cookie de sesión
  const session = request.cookies.get("session_token")?.value;
  // Rutas públicas (sin protección)
  const publicRoutes = ["/login", "/register", "/auth", "/api"];
  
  // Comprobar si la ruta actual es pública
  const isPublic = publicRoutes.some((path) => pathname.startsWith(path));

  // Si no hay sesión y la ruta no es pública, redirigir a login
  if (!session && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Si hay sesión y está intentando entrar a login/register, redirigir a home
  if (session && (pathname === "/login" || pathname === "/register")) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/home";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

// Configurar qué rutas protege
export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: [
    "/((?!api/auth|_next/static|_next/image|.*\\.png|favicon.ico$).*)",
    "/",
  ],
};