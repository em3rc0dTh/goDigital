// components/auth/LoginForm.tsx
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
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { Mail } from "lucide-react";

interface Workspace {
  tenantId: string;
  name: string;
  role: string;
}

export function LoginForm() {
  const [tab, setTab] = useState<"login" | "signUp" | "resetPassword">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

  // Estados para workspaces
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);

  // 🆕 Estados para verificación de email
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const isSignup = tab === "signUp";
      const endpoint = isSignup ? `${API_BASE}/auth/signup` : `${API_BASE}/auth/login`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          isSignup
            ? { email, password, fullName }
            : { email, password }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        // 🆕 Manejo especial para email no verificado
        if (data.code === "EMAIL_NOT_VERIFIED" || data.error?.toLowerCase().includes("verify")) {
          toast.error("Email Not Verified", {
            description: "Please check your inbox and verify your email address",
          });
          setPendingVerificationEmail(data.email || email);
          setShowEmailVerification(true);
          return;
        }

        toast.error("Authentication Failed", {
          description: data.error || "An error occurred",
        });
        return;
      }

      // 🆕 Signup exitoso - mostrar mensaje de verificación
      if (isSignup) {
        setPendingVerificationEmail(data.email || email);
        setShowEmailVerification(true);
        toast.success("Account Created!", {
          description: "Please check your email to verify your account",
        });

        setEmail("");
        setPassword("");
        setFullName("");
        setIsLoading(false);
        return;
      }

      // Login exitoso - manejo de workspaces
      if (data.workspaces && data.workspaces.length > 1) {
        setWorkspaces(data.workspaces);
        setShowWorkspaceSelector(true);

        Cookies.set("temp_token", data.user.token, {
          expires: 1 / 24,
          sameSite: "lax",
        });

        toast.success("Login Successful", {
          description: "Please select your workspace",
        });
      } else {
        await loginToWorkspace(data.workspaces[0], data.user.token);
      }

      setEmail("");
      setPassword("");
      setFullName("");

    } catch (error) {
      console.error(error);
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginToWorkspace = async (workspace: Workspace, token?: string) => {
    try {
      const authToken = token || Cookies.get("temp_token");

      if (!authToken) {
        throw new Error("No authentication token");
      }

      Cookies.set("session_token", authToken, {
        expires: 7,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      Cookies.set("tenantId", workspace.tenantId, {
        expires: 7,
        sameSite: "lax",
      });

      Cookies.set("workspaceName", workspace.name, {
        expires: 7,
        sameSite: "lax",
      });

      Cookies.set("userRole", workspace.role, {
        expires: 7,
        sameSite: "lax",
      });

      // Limpiar token temporal
      Cookies.remove("temp_token");

      toast.success(`Welcome to ${workspace.name}!`, {
        description: `Role: ${workspace.role}`,
      });

      router.push("/home");
    } catch (error) {
      console.error("Workspace login error:", error);
      toast.error("Error", {
        description: "Failed to access workspace",
      });
    }
  };

  // 🆕 Función para reenviar email de verificación
  const resendVerificationEmail = async () => {
    try {
      toast.info("Resending verification email...");

      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingVerificationEmail }),
      });

      if (res.ok) {
        toast.success("Email Sent!", {
          description: "Please check your inbox",
        });
      } else {
        toast.error("Failed to resend email");
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Error", {
        description: "Failed to resend verification email",
      });
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

      {/* 🆕 Modal de Verificación de Email */}
      <Dialog open={showEmailVerification} onOpenChange={setShowEmailVerification}>
        <DialogContent className="bg-white border border-gray-200 rounded-lg max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <DialogTitle className="text-gray-900 text-center">
              Verify Your Email
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-center">
              We've sent a verification link to
            </DialogDescription>
            <p className="font-semibold text-gray-900 text-center mt-2">
              {pendingVerificationEmail}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Please check your inbox and click the verification link to activate your account.
              </p>
            </div>

            <div className="text-center text-sm text-gray-600">
              Didn't receive the email?
            </div>

            <Button
              onClick={resendVerificationEmail}
              variant="outline"
              className="w-full"
            >
              Resend Verification Email
            </Button>

            <Button
              onClick={() => {
                setShowEmailVerification(false);
                setTab("login");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Selector de Workspace */}
      <Dialog open={showWorkspaceSelector} onOpenChange={setShowWorkspaceSelector}>
        <DialogContent className="bg-white border border-gray-200 rounded-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Select Workspace</DialogTitle>
            <DialogDescription className="text-gray-600">
              You have access to multiple workspaces. Choose one to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {workspaces.map((workspace) => (
              <button
                key={workspace.tenantId}
                onClick={() => {
                  loginToWorkspace(workspace);
                  setShowWorkspaceSelector(false);
                }}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-black transition-all duration-200 text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{workspace.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Role: <span className="font-medium">{workspace.role}</span>
                    </p>
                  </div>
                  <div className="text-blue-600">→</div>
                </div>
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setShowWorkspaceSelector(false);
              Cookies.remove("temp_token");
            }}
            className="w-full"
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={!!errorMessage} onOpenChange={() => setErrorMessage(null)}>
        <DialogContent className="bg-neutral-900 border border-neutral-700 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Error</DialogTitle>
            <DialogDescription className="text-neutral-300">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setErrorMessage(null)}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}