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
import { useI18n } from "@/i18n/I18nProvider";

interface Workspace {
  tenantId: string;
  name: string;
  role: string;
}

export function LoginForm() {
  const [tab, setTab] = useState<"login" | "signUp" | "resetPassword">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

  // Estados para workspaces
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);

  // 🆕 Estados para verificación de email
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  const router = useRouter();

  // 🆕 Login con Google flow
  const handleGoogleLogin = async (credentialResponse: any) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(t("Auth.Messages.googleLoginFailed"), {
          description: data.error || t("Auth.Dialogs.Error.generic"),
        });
        setIsLoading(false);
        return;
      }

      // Login exitoso
      if (data.workspaces && data.workspaces.length > 1) {
        setWorkspaces(data.workspaces);
        setShowWorkspaceSelector(true);
        Cookies.set("temp_token", data.user.token, { expires: 1 / 24, sameSite: "lax" });
        toast.success(t("Auth.Messages.loginSuccessful"), { description: t("Auth.Messages.selectWorkspace") });
      } else {
        await loginToWorkspace(data.workspaces[0], data.user.token);
      }

    } catch (error) {
      console.error(error);
      toast.error(t("Auth.Dialogs.Error.title"), { description: t("Auth.Dialogs.Error.generic") });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // 🆕 Check passwords match for signup
    if (tab === "signUp" && password !== confirmPassword) {
      toast.error(t("Auth.Messages.passwordsDoNotMatch"));
      setIsLoading(false);
      return;
    }

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
          toast.error(t("Auth.Messages.emailNotVerified"), {
            description: t("Auth.Messages.checkInbox"),
          });
          setPendingVerificationEmail(data.email || email);
          setShowEmailVerification(true);
          return;
        }

        toast.error(t("Auth.Messages.authFailed"), {
          description: data.error || t("Auth.Dialogs.Error.generic"),
        });
        return;
      }

      // 🆕 Signup exitoso - mostrar mensaje de verificación
      if (isSignup) {
        setPendingVerificationEmail(data.email || email);
        setShowEmailVerification(true);
        toast.success(t("Auth.Messages.accountCreated"), {
          description: t("Auth.Messages.checkEmailVerify"),
        });

        setEmail("");
        setPassword("");
        setConfirmPassword("");
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

        toast.success(t("Auth.Messages.loginSuccessful"), {
          description: t("Auth.Messages.selectWorkspace"),
        });
      } else {
        await loginToWorkspace(data.workspaces[0], data.user.token);
      }

      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");

    } catch (error) {
      console.error(error);
      toast.error(t("Auth.Dialogs.Error.title"), {
        description: t("Auth.Dialogs.Error.generic"),
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
        description: `${t("Workspace.role", { role: workspace.role })}`,
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
      toast.info(t("Auth.Messages.resendingEmail"));

      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingVerificationEmail }),
      });

      if (res.ok) {
        toast.success(t("Auth.Messages.emailSent"), {
          description: t("Auth.Messages.pleaseCheckInbox"),
        });
      } else {
        toast.error(t("Auth.Messages.failedResend"));
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast.error(t("Auth.Dialogs.Error.title"), {
        description: t("Auth.Messages.failedResendDesc"),
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
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            handleLogin={handleLogin}
            handleGoogleLogin={handleGoogleLogin} // 🆕
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
              {t("Auth.Dialogs.VerifyEmail.title")}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-center">
              {t("Auth.Messages.weSentLink")}
            </DialogDescription>
            <p className="font-semibold text-gray-900 text-center mt-2">
              {pendingVerificationEmail}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                {t("Auth.Messages.checkInboxDetail")}
              </p>
            </div>

            <div className="text-center text-sm text-gray-600">
              {t("Auth.Messages.didntReceive")}
            </div>

            <Button
              onClick={resendVerificationEmail}
              variant="outline"
              className="w-full"
            >
              {t("Auth.Buttons.resendVerification")}
            </Button>

            <Button
              onClick={() => {
                setShowEmailVerification(false);
                setTab("login");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t("Auth.Buttons.goToLogin")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Selector de Workspace */}
      <Dialog open={showWorkspaceSelector} onOpenChange={setShowWorkspaceSelector}>
        <DialogContent className="bg-white border border-gray-200 rounded-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t("Auth.Dialogs.SelectWorkspace.title")}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {t("Auth.Dialogs.SelectWorkspace.description")}
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
                      {t("Workspace.role", { role: workspace.role })}
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
            {t("Auth.Buttons.cancel")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={!!errorMessage} onOpenChange={() => setErrorMessage(null)}>
        <DialogContent className="bg-neutral-900 border border-neutral-700 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{t("Auth.Dialogs.Error.title")}</DialogTitle>
            <DialogDescription className="text-neutral-300">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setErrorMessage(null)}
          >
            {t("Auth.Buttons.close")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}