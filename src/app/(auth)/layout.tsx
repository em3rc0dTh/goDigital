import { Sparkles } from "lucide-react";
import { Toaster } from "sonner";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="max-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/purple.png')",
      }}
    >
      <nav className="bg-black/40 absolute w-full flex items-center justify-between px-6 md:px-8 py-6 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-white" />
          <span className="text-3xl font-bold  text-white">
            {process.env.NEXT_PUBLIC_PROJECT}
          </span>
        </div>
        <div className="bg-white/10 text-white rounded-lg p-1 backdrop-blur-sm">
          <LanguageSwitcher />
        </div>
      </nav>
      <div className="min-h-screen w-full bg-black/40 flex items-center justify-center">
        {children}
        <Toaster position="top-right" />
      </div>
    </div>
  );
}
