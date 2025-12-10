"use client";

import { useState } from "react";
import { AuthLeftContent } from "../AuthLeftContent";
import { AuthTabs } from "../AuthTabs";
import { ResetPasswordForm } from "../ResetPasswordForm";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { toast } from "sonner";
import Cookies from "js-cookie";


export function LoginForm() {
  const [tab, setTab] = useState<
    "login" | "signUp" | "resetPassword" | "signUpEmail"
  >("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const action = tab === "login" ? "login" : "signup";

      const res = await fetch("http://localhost:4000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email, password, fullName }),
      });

      const data = await res.json();
      console.log("User logged", data);
      if (!res.ok) {
        toast.error("Authentication Failed", {
          description: data.error || "An error occurred",
        });
        return;
      }
      Cookies.set("session_token", data.user.token, {
        expires: 7,
        sameSite: "lax",
      });
      Cookies.set("tenantId", data.user.tenantId, {
        expires: 7,
        sameSite: "lax",
      });

      const successMessage =
        action === "login"
          ? `Welcome back, ${data.user.fullName}!`
          : `Welcome, ${data.user.fullName}!`;

      toast.success("Success!", {
        description: successMessage,
      });
      setEmail("");
      setPassword("");
      setFullName("");

      router.push("/home");
    } catch (error) {
      console.error(error);
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-h-screen bg-transparent flex items-center justify-center">
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-10 px-6 py-10">
        <AuthLeftContent tab={tab} />

        {tab === "resetPassword" ? (
          <ResetPasswordForm
            email={email}
            setEmail={setEmail}
            onBack={() => setTab("login")}
          />
        ) : (
          <AuthTabs
            tab={tab}
            setTab={setTab}
            email={email}
            password={password}
            setEmail={setEmail}
            setPassword={setPassword}
            fullName={fullName}
            setFullName={setFullName}
            handleLogin={handleLogin}
            isLoading={isLoading}
          />
        )}
      </div>

      <Dialog open={!!errorMessage} onOpenChange={() => setErrorMessage(null)}>
        <DialogContent className="bg-neutral-900 border border-neutral-700 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Error</DialogTitle>
            <DialogDescription className="text-neutral-300">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setErrorMessage(null)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
