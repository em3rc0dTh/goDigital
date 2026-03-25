"use client";

import Sidebar from "@/components/utils/Sidebar";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar = pathname !== "/setup";

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {showSidebar && <Sidebar />}

      {/* SOLO ESTE SCROLLEA */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
