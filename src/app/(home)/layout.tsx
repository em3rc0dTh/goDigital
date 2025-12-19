"use client";
import { Bricolage_Grotesque } from "next/font/google";
import Sidebar from "@/components/utils/Sidebar";
import { usePathname } from "next/navigation";

export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const showSidebar = pathname !== "/setup";

  return (
    <div className="flex w-screen min-h-screen">
      {showSidebar && <Sidebar />}
      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );

}
