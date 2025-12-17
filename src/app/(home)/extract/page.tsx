"use client"
import { useState, useEffect } from "react";
import { Database, FileText, Mail, Settings } from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Transactions from "../../../components/extract/transactions";
import SettingsView from "../../../components/extract/settings";
import EmailsPage from "../../../components/extract/emailsPage";

export default function Extract() {
  const router = useRouter();
  const [databases, setDatabases] = useState<any[]>([]);
  const [activeDatabase, setActiveDatabase] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"transactions" | "emails" | "settings">("transactions");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatabases();
  }, []);

  async function loadDatabases() {
    setIsLoading(true);
    setError(null);

    try {
      const token = Cookies.get("session_token");
      const tenantId = Cookies.get("tenantId");
      const res = await fetch(`http://localhost:4000/api/tenants/details/${tenantId}`, {
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
    { id: "transactions", label: "Transaction Capture", icon: FileText },
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
    <div className="min-h-screen bg-white">
      <div className="px-6 py-8 md:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Bank Transactions Parser
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your bank accounts and parsed transactions easily.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadDatabases();
              }}
              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Repository Tabs */}
        {databases.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Database size={18} className="text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-700">Repositories</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {databases.map((db) => (
                <button
                  key={db.id}
                  onClick={() => selectDatabase(db.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg border transition-all duration-200 ${activeDatabase === db.id
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
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

        {/* No Database Message */}
        {databases.length === 0 && !isLoading && (
          <div className="mb-6 p-6 rounded-lg border-2 border-gray-200 bg-gray-50">
            <p className="text-gray-600 text-center">
              No databases provisioned. Please complete the launch pad flow.
            </p>
          </div>
        )}

        {/* Main Content Area with Side Navigation */}
        {activeDatabase && (
          <div className="flex gap-6">
            {/* Content Area */}
            <div className="flex-1 min-w-0">
              {activeView === "transactions" && (
                <Transactions key={activeDatabase} activeDatabase={activeDatabase} />
              )}
              {activeView === "emails" && (
                <EmailsPage key={activeDatabase} activeDatabase={activeDatabase} />
              )}
              {activeView === "settings" && (
                <SettingsView key={activeDatabase} activeDatabase={activeDatabase} />
              )}
            </div>

            {/* Side Navigation */}
            <div className="flex-shrink-0 w-56">
              <div className="sticky top-6 space-y-1 bg-white border border-gray-200 rounded-lg p-2">
                {views.map((view) => {
                  const Icon = view.icon;
                  const isActive = activeView === view.id;
                  return (
                    <button
                      key={view.id}
                      onClick={() => setActiveView(view.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                      <span className="text-sm">{view.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}