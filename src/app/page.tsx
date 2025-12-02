// app/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirige a /home
  redirect("/home");

  // No se renderiza nada
  return null;
}
