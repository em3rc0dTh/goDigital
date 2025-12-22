"use client";
import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Sun,
  MessageSquare,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Cookies from "js-cookie";

export default function GettingStarted() {
  const [expandedSection, setExpandedSection] = useState("businessEntity");
  const [completedTasks, setCompletedTasks] = useState({
    businessEntity: false,
    project: false,
    integration: false,
    teammates: false,
    bankAccount: false,
  });

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

  const [businessEntity, setBusinessEntity] = useState({
    country: "PE",
    entityType: "natural",
    taxId: "",
    businessEmail: "",
    domain: "",
  });

  const workspaceProgress = Math.round(
    (Object.values(completedTasks).filter(Boolean).length / 4) * 100
  );

  const accountProgress = completedTasks.bankAccount ? 100 : 0;

  const handleBusinessEntitySubmit = async () => {
    if (!businessEntity.taxId || !businessEntity.businessEmail) {
      alert("Tax ID and Email are required.");
      return;
    }
    console.log("Business Entity", businessEntity);
    try {
      const tenantId = Cookies.get("tenantId");
      const token = Cookies.get("session_token");
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/provision`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(businessEntity),
      });

      if (!res.ok) {
        console.error("Backend failed:", await res.text());
        alert("Error creating business entity. Check backend logs.");
        return;
      }

      // Backend success → mark task as completed
      setCompletedTasks({ ...completedTasks, businessEntity: true });
      setExpandedSection("project");
    } catch (error) {
      console.error("Network error:", error);
      alert("Cannot connect to backend (localhost:4000). Is it running?");
    }
  };

  useEffect(() => {
    async function loadTenant() {
      const tenantId = Cookies.get("tenantId");
      const token = Cookies.get("session_token");

      try {
        const res = await fetch(`${API_BASE}/tenants/${tenantId}`, {
          headers: { "Authorization": `Bearer ${token}` },
          credentials: "include",
        });

        if (!res.ok) throw new Error(await res.text());

        const tenant = await res.json();

        // Verifica si ya hay al menos un business entity
        const hasBusinessEntities = tenant.databases && tenant.databases.length > 0;

        if (hasBusinessEntities) {
          setCompletedTasks(prev => ({ ...prev, businessEntity: true }));

          // Prellenar formulario con el último Business Entity si quieres
          const lastEntity = tenant.databases[tenant.databases.length - 1];
          setBusinessEntity({
            country: lastEntity.country ?? "PE",
            entityType: lastEntity.entityType ?? "natural",
            taxId: lastEntity.taxId ?? "",
            businessEmail: lastEntity.businessEmail ?? "",
            domain: lastEntity.domain ?? "",
          });
        }
      } catch (error) {
        console.error("Error loading tenant:", error);
      }
    }

    loadTenant();
  }, []);

  const toggleTask = (task: keyof typeof completedTasks) => {
    setCompletedTasks({ ...completedTasks, [task]: !completedTasks[task] });
  };

  return (
    <main className="flex-1 overflow-y-auto min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search for Shortcuts, Projects, Secrets, etc."
                className="pl-10 bg-gray-50 border-gray-200"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-mono">
                ⌘+K
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <Button variant="ghost" size="icon">
              <Sun className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Avatar>
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Getting Started Content */}
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Launch Pad</h1>

        <div className="flex gap-8">
          <div className="flex-1 max-w-2xl">
            {/* Set up your workplace */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Set up your Business Workspace</CardTitle>
                  <span className="text-sm font-semibold text-purple-600">
                    {workspaceProgress}%
                  </span>
                </div>
                <Progress value={workspaceProgress} className="mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Business Entity */}
                <div className="border rounded-lg p-4 transition-all hover:border-purple-200 bg-white">
                  <button
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === "businessEntity" ? "" : "businessEntity"
                      )
                    }
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${completedTasks.businessEntity
                          ? "bg-purple-600 border-purple-600"
                          : "border-gray-300"
                          }`}
                      >
                        {completedTasks.businessEntity && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium">
                        Create Business Entity
                      </span>
                    </div>
                    {expandedSection === "businessEntity" ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSection === "businessEntity" && (
                    <>
                      {completedTasks.businessEntity ? (
                        <div className="mt-4 pl-9 space-y-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <p className="text-sm text-gray-700">
                            Ya existe al menos un Business Entity configurado para este workspace.
                          </p>
                          <Button
                            onClick={() => {
                              setCompletedTasks(prev => ({ ...prev, businessEntity: false }));
                              setBusinessEntity({
                                country: "PE",
                                entityType: "natural",
                                taxId: "",
                                businessEmail: "",
                                domain: "",
                              });
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Crear otro Business Entity
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-4 pl-9 space-y-6">

                          {/* Country */}
                          <div className="flex flex-col space-y-1">
                            <label className="text-sm font-medium">Country</label>
                            <div className="relative">
                              <select
                                className="w-full border rounded-md p-2 pl-10 bg-white appearance-none cursor-pointer hover:border-purple-300 transition-colors"
                                value={businessEntity.country}
                                onChange={(e) =>
                                  setBusinessEntity({ ...businessEntity, country: e.target.value })
                                }
                              >
                                <option value="PE">🇵🇪 Peru</option>
                                <option value="US">🇺🇸 United States</option>
                                <option value="BR">🇧🇷 Brazil</option>
                                <option value="MX">🇲🇽 Mexico</option>
                                <option value="ES">🇪🇸 Spain</option>
                              </select>

                              {/* Flag Icon (absolute) */}
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">
                                {
                                  {
                                    PE: "🇵🇪",
                                    US: "🇺🇸",
                                    BR: "🇧🇷",
                                    MX: "🇲🇽",
                                    ES: "🇪🇸",
                                  }[businessEntity.country]
                                }
                              </span>
                            </div>
                          </div>

                          {/* Type */}
                          <div className="flex flex-col space-y-1">
                            <label className="text-sm font-medium">Type</label>
                            <select
                              className="w-full border rounded-md p-2 bg-white cursor-pointer hover:border-purple-300 transition-colors"
                              value={businessEntity.entityType}
                              onChange={(e) =>
                                setBusinessEntity({ ...businessEntity, entityType: e.target.value })
                              }
                            >
                              <option value="natural">Natural Person</option>
                              <option value="legal">Legal Person</option>
                            </select>
                          </div>

                          <div className="flex flex-col space-y-1">
                            <label className="text-sm font-medium">
                              Tax ID / RUC <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full border rounded-md p-2"
                              placeholder="RUC or business identifier"
                              value={businessEntity.taxId}
                              onChange={(e) =>
                                setBusinessEntity({ ...businessEntity, taxId: e.target.value })
                              }
                            />
                          </div>

                          {/* Business Email */}
                          <div className="flex flex-col space-y-1">
                            <label className="text-sm font-medium">
                              Business Email <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              className="w-full border rounded-md p-2"
                              placeholder="business@example.com"
                              value={businessEntity.businessEmail}
                              onChange={(e) =>
                                setBusinessEntity({ ...businessEntity, businessEmail: e.target.value })
                              }
                            />
                          </div>

                          {/* Domain */}
                          <div className="flex flex-col space-y-1">
                            <label className="text-sm font-medium">Domain (optional)</label>
                            <input
                              type="text"
                              className="w-full border rounded-md p-2"
                              placeholder="thradex.com"
                              value={businessEntity.domain}
                              onChange={(e) =>
                                setBusinessEntity({ ...businessEntity, domain: e.target.value })
                              }
                            />
                          </div>

                          {/* Submit Button */}
                          <Button
                            onClick={handleBusinessEntitySubmit}
                            className="bg-purple-600 hover:bg-purple-700 text-white w-full mt-2"
                          >
                            Complete Business Entity →
                          </Button>

                        </div>
                      )}
                    </>
                  )}

                </div>

                {/* First Project */}
                <div className="border rounded-lg p-4 transition-all hover:border-purple-200 bg-white">
                  <button
                    onClick={() => {
                      if (expandedSection === "project") {
                        setExpandedSection("");
                      } else {
                        setExpandedSection("project");
                      }
                    }}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${completedTasks.project
                          ? "bg-purple-600 border-purple-600"
                          : "border-gray-300"
                          }`}
                      >
                        {completedTasks.project && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium">
                        Set up your first project
                      </span>
                    </div>
                    {expandedSection === "project" ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSection === "project" && (
                    <div className="mt-4 pl-9 space-y-3">
                      <p className="text-sm text-gray-600">
                        Projects are where you define configurations and manage
                        secrets for a single service or application.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li>
                          Projects start with three default environments, each
                          with a root config: Development, Staging and
                          Production
                        </li>
                        <li>
                          You can branch configs to allow overrides from the
                          root configs
                        </li>
                      </ul>
                      <Button
                        onClick={() => toggleTask("project")}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Go to Projects →
                      </Button>
                    </div>
                  )}
                </div>

                {/* First Integration */}
                <button
                  onClick={() => toggleTask("integration")}
                  className="w-full border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-all hover:border-purple-200 bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${completedTasks.integration
                        ? "bg-purple-600 border-purple-600"
                        : "border-gray-300"
                        }`}
                    >
                      {completedTasks.integration && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">
                      Set up your first integration
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                {/* Invite teammates */}
                <button
                  onClick={() => toggleTask("teammates")}
                  className="w-full border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-all hover:border-purple-200 bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${completedTasks.teammates
                        ? "bg-purple-600 border-purple-600"
                        : "border-gray-300"
                        }`}
                    >
                      {completedTasks.teammates && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">Invite teammates</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </CardContent>
            </Card>

            {/* Set up your account */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Set up your account</CardTitle>
                  <span className="text-sm font-semibold text-purple-600">
                    {accountProgress}%
                  </span>
                </div>
                <Progress value={accountProgress} className="mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bank Account */}
                <button
                  onClick={() => toggleTask("bankAccount")}
                  className="w-full border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-all hover:border-purple-200 bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${completedTasks.bankAccount
                        ? "bg-purple-600 border-purple-600"
                        : "border-gray-300"
                        }`}
                    >
                      {completedTasks.bankAccount && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">Set up your bank account</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Joining your team's workplace? Some of the items may already
                  be completed.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  If you want to test all of these capabilities Doppler has to
                  offer,{" "}
                  <a href="#" className="text-purple-600 hover:underline">
                    create a new personal workplace
                  </a>{" "}
                  to go through Getting Started. You can use your personal
                  workplace as a sandbox or delete it at any time. Your progress
                  will be saved from workplace to workplace.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Need more help?</CardTitle>
                <CardDescription>
                  Check out these relevant Doppler Docs for more information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <a
                  href="#"
                  className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                >
                  📖 Welcome
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                >
                  📖 Get Started
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                >
                  📖 Tutorials
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                >
                  📖 Demo Videos
                </a>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 text-xs font-semibold uppercase">
                    💡 Pro Tip
                  </span>
                </div>
                <CardTitle className="text-base">Project Naming</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  A project should be considered an encapsulated application
                  service. Rather than naming a project after your application,
                  we suggest naming it after the specific service or component.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}