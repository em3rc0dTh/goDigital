// app/verify-email/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { useI18n } from "@/i18n/I18nProvider";

type VerificationState = "loading" | "success" | "error" | "invalid";

interface Workspace {
    tenantId: string;
    name: string;
    role: string;
}

export default function VerifyEmailClient() {
    const [state, setState] = useState<VerificationState>("loading");
    const [message, setMessage] = useState("");
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const { t } = useI18n();

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    useEffect(() => {
        if (!token) {
            setState("invalid");
            setMessage(t("Auth.VerifyEmail.messages.noToken"));
            return;
        }

        verifyEmail();
    }, [token]);

    const verifyEmail = async () => {
        try {
            const res = await fetch(`${API_BASE}/verify-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ token }),
            });

            const data = await res.json();

            if (res.ok) {
                setState("success");
                setMessage(t("Auth.VerifyEmail.messages.success"));

                // Guardar token y workspaces
                if (data.user?.token) {
                    Cookies.set("session_token", data.user.token, {
                        expires: 7,
                        sameSite: "lax",
                        secure: process.env.NODE_ENV === "production",
                    });
                }

                if (data.workspaces && data.workspaces.length > 0) {
                    setWorkspaces(data.workspaces);
                    setSelectedWorkspace(data.workspaces[0]);
                }

                // Auto-redirect después de 3 segundos
                setTimeout(() => {
                    if (data.workspaces?.[0]) {
                        loginToWorkspace(data.workspaces[0]);
                    } else {
                        router.push("/login");
                    }
                }, 3000);
            } else {
                setState("error");
                setMessage(data.error || t("Auth.VerifyEmail.messages.failed"));
            }
        } catch (error) {
            console.error("Verification error:", error);
            setState("error");
            setMessage(t("Auth.VerifyEmail.messages.error"));
        }
    };

    const loginToWorkspace = (workspace: Workspace) => {
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

        router.push("/home");
    };

    const renderContent = () => {
        switch (state) {
            case "loading":
                return (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="bg-blue-100 p-4 rounded-full">
                                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {t("Auth.VerifyEmail.title")}
                        </h1>
                        <p className="text-gray-600">
                            {t("Auth.VerifyEmail.verifying")}
                        </p>
                    </div>
                );

            case "success":
                return (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-green-100 p-4 rounded-full">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {t("Auth.VerifyEmail.successTitle")}
                            </h1>
                            <p className="text-gray-600">{message}</p>
                        </div>

                        {workspaces.length > 0 && (
                            <div className="space-y-4 pt-4">
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        {t("Auth.VerifyEmail.selectWorkspace")}
                                    </p>
                                    <div className="space-y-2">
                                        {workspaces.map((workspace) => (
                                            <button
                                                key={workspace.tenantId}
                                                onClick={() => setSelectedWorkspace(workspace)}
                                                className={`w-full p-4 border-2 rounded-lg transition-all duration-200 text-left ${selectedWorkspace?.tenantId === workspace.tenantId
                                                    ? "border-blue-600 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-400"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {workspace.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {t("Workspace.role", { role: workspace.role })}
                                                        </p>
                                                    </div>
                                                    {selectedWorkspace?.tenantId === workspace.tenantId && (
                                                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => selectedWorkspace && loginToWorkspace(selectedWorkspace)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                                    disabled={!selectedWorkspace}
                                >
                                    {t("Auth.VerifyEmail.continueToWorkspace")}
                                </Button>
                            </div>
                        )}

                        {workspaces.length === 0 && (
                            <div className="text-sm text-gray-500">
                                {t("Auth.VerifyEmail.redirecting")}
                            </div>
                        )}
                    </div>
                );

            case "error":
                return (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-red-100 p-4 rounded-full">
                                <XCircle className="h-12 w-12 text-red-600" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {t("Auth.VerifyEmail.failedTitle")}
                            </h1>
                            <p className="text-gray-600">{message}</p>
                        </div>
                        <div className="space-y-3">
                            <Button
                                onClick={() => router.push("/login")}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                            >
                                {t("Auth.VerifyEmail.goToLogin")}
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="w-full h-12"
                            >
                                {t("Auth.VerifyEmail.tryAgain")}
                            </Button>
                        </div>
                    </div>
                );

            case "invalid":
                return (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-yellow-100 p-4 rounded-full">
                                <Mail className="h-12 w-12 text-yellow-600" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {t("Auth.VerifyEmail.invalidLinkTitle")}
                            </h1>
                            <p className="text-gray-600">{message}</p>
                        </div>
                        <Button
                            onClick={() => router.push("/login")}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                        >
                            {t("Auth.VerifyEmail.goToLogin")}
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
                    {renderContent()}
                </div>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        {t("Auth.VerifyEmail.needHelp")}{" "}
                        <a
                            href="mailto:support@godigital.com"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            {t("Auth.VerifyEmail.contactSupport")}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}