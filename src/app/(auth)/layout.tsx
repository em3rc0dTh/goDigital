import { Sparkles } from "lucide-react";
import { Toaster } from "sonner";

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
      <nav className="bg-black/40 absolute flex items-center justify-between px-6 md:px-8 py-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-white" />
          <span className="text-3xl font-bold  text-white">
            {process.env.NEXT_PUBLIC_PROJECT}
          </span>
        </div>
      </nav>
      <div className="min-h-screen w-full bg-black/40 flex items-center justify-center">
        {children}
        <Toaster position="top-right" />
      </div>
    </div>
  );
}
