// app/api/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.redirect("/login");

  // Borrar todas las cookies que uses para sesión
  res.cookies.set("session_token", "", { path: "/", expires: new Date(0) });
  // si tienes más cookies de sesión, agregarlas igual:
  // res.cookies.set("otra_cookie", "", { path: "/", expires: new Date(0) });

  return res;
}
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true });

  // Borra la cookie de sesión
  res.cookies.set("session_token", "", {
    path: "/",
    maxAge: 0,
  });

  return res;
}
