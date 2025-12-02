import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/utils/Sidebar";

export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GoDigital",
  description: "Plataforma de automatización y gestión financiera para PYMES",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <div className="flex">
          <Sidebar />

          <main className="flex-1 min-h-screen">{children}</main>
        </div>
  );
}
