"use client"
import { BusinessTable, PersonalTable } from "@/components/table/transactionTable";
import { Eye, EyeOff, Database, BarChart3, List } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [databases, setDatabases] = useState<any[]>([]);
  const [activeDatabase, setActiveDatabase] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"consolidated" | "detailed">("consolidated");
  const [accountsState, setAccountsState] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [storedTransactions, setStoredTransactions] = useState<any[]>([]);
  const [showTransactions, setShowTransactions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";
  const hasRedirected = useRef(false);
  const isLoadingDatabases = useRef(false);

  useEffect(() => {
    setWorkspaceName(Cookies.get("workspaceName") || null);
    setUserRole(Cookies.get("userRole") || null);
    loadDatabases();
  }, []);

  useEffect(() => {
    if (activeDatabase) {
      loadAccountsFromDB();
    }
  }, [activeDatabase]);

  useEffect(() => {
    if (activeAccount && activeDatabase) {
      loadTransactionsFromAPI(activeAccount);
    }
  }, [activeAccount]);

  const currentAccount = accountsState.find((a) => a.id === activeAccount);

  const transactionSummary = {
    count: storedTransactions.length,
    net: storedTransactions.reduce((sum, t) => sum + (t.monto || 0), 0),
    positive: storedTransactions
      .filter((t) => t.monto > 0)
      .reduce((sum, t) => sum + t.monto, 0),
    negative: Math.abs(
      storedTransactions
        .filter((t) => t.monto < 0)
        .reduce((sum, t) => sum + t.monto, 0)
    ),
  };

  async function loadDatabases() {
    if (isLoadingDatabases.current) return;

    isLoadingDatabases.current = true;
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
          Cookies.remove("session_token");
          Cookies.remove("tenantId");
          Cookies.remove("workspaceName");
          Cookies.remove("userRole");
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            router.push("/login");
          }
          return;
        }
        throw new Error(`Failed to load databases: ${res.status}`);
      }

      const data = await res.json();

      const allDatabases = data.details.map((detail: any) => ({
        id: detail.detailId,
        dbName: detail.dbName,
        entityType: detail.entityType,
        taxId: detail.taxId,
        tenantName: data.name,
        tenantId: data.tenantId
      }));


      setDatabases(allDatabases);

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
      isLoadingDatabases.current = false;
    }
  }

  async function loadAccountsFromDB() {
    if (!activeDatabase) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = Cookies.get("session_token");
      const res = await fetch(`${API_BASE}/accounts`, {
        cache: "no-store",
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-tenant-detail-id": activeDatabase,
        },
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          Cookies.remove("session_token");
          Cookies.remove("tenantId");
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            router.push("/login");
          }
          return;
        }
        throw new Error(`Failed to load accounts: ${res.status}`);
      }

      const data = await res.json();
      setAccountsState(data.reverse());

      const saved = localStorage.getItem(`activeAccountId_${activeDatabase}`);
      if (saved && data.find((a: any) => a.id === saved)) {
        setActiveAccount(saved);
      } else if (data.length > 0) {
        setActiveAccount(data[0].id);
        localStorage.setItem(`activeAccountId_${activeDatabase}`, data[0].id);
      } else {
        setActiveAccount(null);
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
      setError("Failed to load accounts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTransactionsFromAPI(accountId: string) {
    if (!activeDatabase) return;

    try {
      setIsLoading(true);
      const token = Cookies.get("session_token");
      const res = await fetch(
        `${API_BASE}/accounts/${accountId}/transactions`,
        {
          cache: "no-store",
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-tenant-detail-id": activeDatabase,
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          Cookies.remove("session_token");
          Cookies.remove("tenantId");
          router.push("/login");
          return;
        }
        setStoredTransactions([]);
        return;
      }

      const data = await res.json();
      setStoredTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      setStoredTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }

  const selectDatabase = (id: string) => {
    setActiveDatabase(id);
    Cookies.set("tenantDetailId", id);
    setActiveAccount(null);
    setAccountsState([]);
    setStoredTransactions([]);
  };

  const selectAccount = (id: string) => {
    setActiveAccount(id);
    if (activeDatabase) {
      localStorage.setItem(`activeAccountId_${activeDatabase}`, id);
    }
  };

  const activeDb = databases.find(db => db.id === activeDatabase);

  if (isLoadingDatabases.current && databases.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 py-8 md:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {workspaceName ?? "Workspace"}
            </p>
            <p className="text-xs text-gray-600">
              Role: {userRole?.toUpperCase() || "USER"}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => {
                setError(null);
                isLoadingDatabases.current = false;
                loadDatabases();
              }}
              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* View Tabs: Consolidated vs Detailed */}
        {databases.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveView("consolidated")}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 border-b-2 ${activeView === "consolidated"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
              >
                <BarChart3 size={18} />
                <span>Summary</span>
              </button>
              <button
                onClick={() => setActiveView("detailed")}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 border-b-2 ${activeView === "detailed"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
              >
                <List size={18} />
                <span>Detailed</span>
              </button>
            </div>
          </div>
        )}

        {/* Database Tabs - Only show in Detailed view */}
        {databases.length > 0 && activeView === "detailed" && (
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
              No databases provisioned. Please complete the getting started flow.
            </p>
          </div>
        )}

        {/* CONSOLIDATED VIEW */}
        {activeView === "consolidated" && databases.length > 0 && (
          <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center p-8">
              <BarChart3 size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Summary View
              </h3>
              <p className="text-sm text-gray-500 max-w-md mb-4">
                This view aggregates data from all {databases.length} repositories.
                Add summary analytics, cross-repository insights, and summaries here.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {databases.map((db) => (
                  <span
                    key={db.id}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                  >
                    {db.taxId}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DETAILED VIEW */}
        {activeView === "detailed" && activeDatabase && (
          <>
            {/* Account Selector */}
            <div className="mb-8">
              {accountsState.length > 1 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {accountsState.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => selectAccount(account.id)}
                      className={`flex-shrink-0 px-6 py-3 rounded-lg border-2 transition-all duration-200 ${activeAccount === account.id
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white text-black hover:border-black"
                        }`}
                    >
                      <p className={`text-xs font-medium ${activeAccount === account.id ? "text-white" : "text-black"
                        }`}>
                        {account.bank_name} |{" "}
                        <span className="font-semibold">{account.alias}</span>
                      </p>
                      <p className={`text-xs font-mono mt-1 ${activeAccount === account.id ? "text-gray-300" : "text-gray-600"
                        }`}>
                        {account.account_type} | {account.bank_account_type}
                      </p>
                      <p className={`text-xs font-mono mt-1 ${activeAccount === account.id ? "text-gray-300" : "text-gray-600"
                        }`}>
                        {account.currency}
                      </p>
                    </button>
                  ))}
                </div>
              ) : currentAccount ? (
                <div className="p-6 rounded-lg border-2 border-black bg-black text-white">
                  <p className="text-sm text-gray-300">{currentAccount.bank_name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <h3 className="text-2xl font-semibold">{currentAccount.alias}</h3>
                      <p className="text-sm text-gray-400 font-mono mt-2">
                        {currentAccount.account_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-light">{currentAccount.currency}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {currentAccount.account_type || "Account"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : accountsState.length === 0 && !isLoading ? (
                <div className="p-6 rounded-lg border-2 border-gray-200 bg-gray-50">
                  <p className="text-gray-600 text-center">
                    No accounts found in this database. Create one in Settings.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Transactions Table */}
            {currentAccount && (
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Latest Transactions
                      </h2>
                      {currentAccount && (
                        <div className="flex items-center gap-2 px-3 py-1">
                          <span className="text-sm font-medium text-gray-700">
                            {currentAccount.alias}
                          </span>
                          <span className="text-xs font-semibold text-blue-600 px-2 py-0.5">
                            {currentAccount.currency}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {isLoading ? (
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                          Loading...
                        </span>
                      ) : (
                        <span>
                          Showing{" "}
                          <span className="font-semibold text-gray-900">
                            {Math.min(5, transactionSummary.count)}
                          </span>{" "}
                          of{" "}
                          <span className="font-semibold text-gray-900">
                            {transactionSummary.count}
                          </span>{" "}
                          transaction{transactionSummary.count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowTransactions(!showTransactions)}
                    className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${showTransactions
                      ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {showTransactions ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>

                {showTransactions ? (
                  currentAccount?.bank_account_type === "Business" ? (
                    <BusinessTable storedTransactions={storedTransactions} />
                  ) : (
                    <PersonalTable storedTransactions={storedTransactions} />
                  )
                ) : (
                  <div className="flex flex-col justify-center items-center px-6 py-16 text-gray-600">
                    <EyeOff size={32} className="mb-3 text-gray-300" />
                    <p className="text-sm">Transactions hidden</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}