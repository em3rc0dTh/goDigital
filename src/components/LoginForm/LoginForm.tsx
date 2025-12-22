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

  // ⭐ NUEVO: Estado para selector de workspace
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const action = tab === "login" ? "login" : "signup";

      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, email, password, fullName }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Authentication Failed", {
          description: data.error || "An error occurred",
        });
        return;
      }

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

      {/* ⭐ NUEVO: Selector de Workspace */}
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