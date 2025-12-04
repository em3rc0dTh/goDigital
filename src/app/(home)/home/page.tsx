"use client";
import { BusinessTable, PersonalTable } from "@/components/table/transactionTable";
import { Eye, EyeOff, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [accountsState, setAccountsState] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [storedTransactions, setStoredTransactions] = useState<any[]>([]);
  const [showTransactions, setShowTransactions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const currentAccount = accountsState.find((a) => a.id === activeAccount);
  const currencySymbol = currentAccount?.currency || "USD";

  const transactionSummary = {
    count: storedTransactions.length,
    net: storedTransactions.reduce((sum, t) => sum + t.monto, 0),
    positive: storedTransactions.filter((t) => t.monto > 0).reduce((sum, t) => sum + t.monto, 0),
    negative: Math.abs(storedTransactions.filter((t) => t.monto < 0).reduce((sum, t) => sum + t.monto, 0)),
  };

  useEffect(() => {
    loadAccountsFromDB();
  }, []);

  useEffect(() => {
    if (activeAccount) {
      loadTransactionsFromAPI(activeAccount);
    }
  }, [activeAccount]);

  async function loadAccountsFromDB() {
    try {
      const res = await fetch("/api/back/account", { cache: "no-store" });
      const data = await res.json();
      setAccountsState(data);

      const saved = localStorage.getItem("activeAccountId");
      if (saved && data.find((a: any) => a.id === saved)) {
        setActiveAccount(saved);
      } else if (data.length > 0) {
        setActiveAccount(data[0].id);
        localStorage.setItem("activeAccountId", data[0].id);
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  }

  async function loadTransactionsFromAPI(accountId: string) {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/back/transactions/${accountId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
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

  const selectAccount = (id: string) => {
    setActiveAccount(id);
    localStorage.setItem("activeAccountId", id);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="px-6 py-8 md:px-12 max-w-7xl mx-auto">
        {/* Account Selector - Compact Version */}
        <div className="mb-8">
          {accountsState.length > 1 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {accountsState.map((account) => (
                <button
                  key={account.id}
                  onClick={() => selectAccount(account.id)}
                  className={`flex-shrink-0 px-6 py-3 rounded-lg border-2 transition-all duration-200
    ${activeAccount === account.id
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-black hover:border-black"
                    }`}
                >
                  {/* Primera fila */}
                  <div className="flex flex-row">
                    <p
                      className={`text-xs font-medium ${activeAccount === account.id ? "text-white" : "text-black"
                        }`}
                    >
                      {account.bank_name} |{" "}
                      <span
                        className={`font-semibold ${activeAccount === account.id ? "text-white" : "text-black"
                          }`}
                      >
                        {account.alias}
                      </span>
                    </p>
                  </div>

                  {/* Segunda fila */}
                  <p
                    className={`text-xs font-mono mt-1 ${activeAccount === account.id ? "text-gray-300" : "text-gray-600"
                      }`}
                  >
                    {account.account_type} | {account.bank_account_type}
                  </p>

                  {/* Tercera fila */}
                  <p
                    className={`text-xs font-mono mt-1 ${activeAccount === account.id ? "text-gray-300" : "text-gray-600"
                      }`}
                  >
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
                  <p className="text-sm text-gray-400 font-mono mt-2">{currentAccount.account_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-light">{currentAccount.currency}</p>
                  <p className="text-xs text-gray-400 mt-1">{currentAccount.account_type || "Account"}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Total Transacciones</p>
            <p className="text-3xl font-light mt-2 text-black">{transactionSummary.count}</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-green-600" />
              <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Ingresos</p>
            </div>
            <p className="text-3xl font-light mt-2 text-green-600">{transactionSummary.positive.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">{currencySymbol}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingDown size={18} className="text-red-600" />
              <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Gastos</p>
            </div>
            <p className="text-3xl font-light mt-2 text-red-600">{transactionSummary.negative.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">{currencySymbol}</p>
          </div>

          <div className={`border-2 rounded-lg p-4 ${transactionSummary.net >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-600">Balance Neto</p>
            <p className={`text-3xl font-light mt-2 ${transactionSummary.net >= 0 ? "text-green-600" : "text-red-600"}`}>
              {transactionSummary.net >= 0 ? "+" : ""}{transactionSummary.net.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{currencySymbol}</p>
          </div>
        </div> */}

        {/* Transactions Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-black">Últimas Transacciones</h2>
              <p className="text-sm text-gray-600 mt-1">
                {isLoading ? "Cargando..." : `Mostrando ${Math.min(5, transactionSummary.count)} de ${transactionSummary.count}`}
              </p>
            </div>
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
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
              <p className="text-sm">Transacciones ocultas</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}