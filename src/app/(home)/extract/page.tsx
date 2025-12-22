"use client"
import { useState, useEffect } from "react";
import { BarChart3, Database, FileText, List, Mail, Settings, TrendingUp, Building2 } from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Transactions from "../../../components/extract/transactions";
import SettingsView from "../../../components/extract/settings";
import EmailsPage from "../../../components/extract/emailsPage";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function Extract() {
  const router = useRouter();
  const [databases, setDatabases] = useState<any[]>([]);
  const [activeDatabase, setActiveDatabase] = useState<string | null>(null);
  const [showView, setShowView] = useState<"consolidated" | "extract">("consolidated");
  const [activeView, setActiveView] = useState<"transactions" | "emails" | "settings">("transactions");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";
  useEffect(() => {

    loadDatabases();
  }, []);

  async function loadDatabases() {
    setIsLoading(true);
    setError(null);

    try {
      const token = Cookies.get("session_token");
      const tenantId = Cookies.get("tenantId");
      const res = await fetch(`${API_BASE}/tenants/details/${tenantId}`, {
        cache: "no-store",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to load databases: ${res.status}`);
      }

      const data = await res.json();

      // data es un objeto tenant, no un array
      const allDatabases = data.details.map((detail: any) => ({
        id: detail.detailId,
        dbName: detail.dbName,
        entityType: detail.entityType,
        taxId: detail.taxId,
        tenantName: data.name,
        tenantId: data.tenantId,
      }));

      setDatabases(allDatabases);

      // Selección del database activo
      const savedDetailId = Cookies.get("tenantDetailId");
      if (savedDetailId && allDatabases.find((db: any) => db.id === savedDetailId)) {
        setActiveDatabase(savedDetailId);
      } else if (allDatabases.length > 0) {
        setActiveDatabase(allDatabases[0].id);
        Cookies.set("tenantDetailId", allDatabases[0].id);
      }

    } catch (error) {
      console.error("Error loading databases:", error);
      setError("Failed to load databases. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const selectDatabase = (id: string) => {
    setActiveDatabase(id);
    Cookies.set("tenantDetailId", id);
  };

  const views = [
    { id: "transactions", label: "Web Capture", icon: FileText },
    { id: "emails", label: "Email Capture", icon: Mail },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  if (isLoading && databases.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading repositories...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <Tabs value={showView} onValueChange={(v) => setShowView(v as any)} className="w-full">
            <TabsList className="h-auto p-0 bg-transparent border-0 w-full justify-start">
              <TabsTrigger
                value="consolidated"
                className="gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-600 data-[state=active]:text-blue-600 font-medium"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="extract"
                className="gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-600 data-[state=active]:text-blue-600 font-medium"
              >
                <List className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="inline">Bank Extract</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      {showView === "consolidated" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
                  <p className="text-sm text-gray-600">Consolidated view across all repositories</p>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <CardContent className="p-8 sm:p-12">
              <div className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-full mb-6 border-4 border-blue-100">
                  <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  Summary View
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-8 leading-relaxed">
                  This view aggregates data from all {databases.length} repositories.
                  Add summary analytics, cross-repository insights, and summaries here.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {databases.map((db) => (
                    <span
                      key={db.id}
                      className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-xs sm:text-sm font-medium border border-blue-200 shadow-sm"
                    >
                      {db.taxId}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {showView === "extract" && (
        <div className="min-h-screen bg-white pb-16 lg:pb-0">
          <div className="px-4 sm:px-6 lg:px-12 py-6 sm:py-8 max-w-7xl mx-auto">
            {/* Header Card */}
            <Card className="mb-6 border border-gray-200 shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">Bank Extract</h1>
                    <p className="text-sm text-gray-600">Manage your bank accounts and parsed transactions</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                <p className="text-red-800 text-sm">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    loadDatabases();
                  }}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Repository Tabs */}
            {databases.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Database size={18} className="text-gray-700" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Repositories
                  </h2>
                  <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {databases.length} total
                  </span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {databases.map((db) => (
                    <button
                      key={db.id}
                      onClick={() => selectDatabase(db.id)}
                      className={`flex-shrink-0 px-4 py-2.5 rounded-lg border transition-all shadow-sm
                  ${activeDatabase === db.id
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow"
                        }`}
                    >
                      <p className="text-xs font-semibold">{db.taxId}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {db.entityType}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Database */}
            {databases.length === 0 && !isLoading && (
              <div className="mb-6 p-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                <p className="text-gray-600 text-center text-sm">
                  No databases provisioned. Please complete the launch pad flow.
                </p>
              </div>
            )}

            {/* Main Layout */}
            {activeDatabase && (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {activeView === "transactions" && (
                    <Transactions
                      key={activeDatabase}
                      activeDatabase={activeDatabase}
                    />
                  )}
                  {activeView === "emails" && (
                    <EmailsPage
                      key={activeDatabase}
                      activeDatabase={activeDatabase}
                    />
                  )}
                  {activeView === "settings" && (
                    <SettingsView
                      key={activeDatabase}
                      activeDatabase={activeDatabase}
                    />
                  )}
                </div>

                {/* Sidebar – Desktop */}
                <div className="hidden lg:block w-56 flex-shrink-0">
                  <div className="sticky top-6 space-y-1.5 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                    {views.map((view) => {
                      const Icon = view.icon;
                      const isActive = activeView === view.id;
                      return (
                        <button
                          key={view.id}
                          onClick={() => setActiveView(view.id as any)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${isActive
                              ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
                              : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-500"
                              }`}
                          />
                          <span className="text-sm">{view.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation – Mobile */}
          {activeDatabase && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
              <div className="flex">
                {views.map((view) => {
                  const Icon = view.icon;
                  const isActive = activeView === view.id;
                  return (
                    <button
                      key={view.id}
                      onClick={() => setActiveView(view.id as any)}
                      className={`flex-1 flex flex-col items-center justify-center py-3 text-xs transition-colors
                  ${isActive ? "text-blue-600 font-medium" : "text-gray-500"}
                `}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      {view.label.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}