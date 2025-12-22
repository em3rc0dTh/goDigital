// components/accounts/AccountsView.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AccountsTable } from "./AccountsTable";
import Cookies from "js-cookie";

function saveActiveAccount(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("active_account_id", id);
}

function loadActiveAccount() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("active_account_id");
}

export default function AccountsView() {
  const [accountsState, setAccountsState] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";
  // ⭐ ACTUALIZADO: Ya no necesitas pasar tenantId en URL
  async function fetchAccounts() {
    try {
      setIsLoading(true);
      setError(null);

      const token = Cookies.get("session_token");

      if (!token) {
        setError("No authentication token");
        return;
      }
      const tenantDetailId = Cookies.get("tenantDetailId");
      // ⭐ El backend ahora extrae tenantId del JWT automáticamente
      const res = await fetch(`${API_BASE}/accounts`, {
        cache: "no-store",
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-tenant-detail-id": tenantDetailId || "",
        },
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired. Please login again.");
          // Opcional: redirigir a login
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setAccountsState(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setError("Failed to load accounts");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAccounts();
    setActiveAccount(loadActiveAccount());
  }, []);

  function selectAccount(id: string) {
    saveActiveAccount(id);
    setActiveAccount(id);
  }

  return (
    <div id="accountsView" className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Bank Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Register all your bank accounts here. Click a row to select it as the
            active account.
          </p>
        </div>

        {/* ⭐ NUEVO: Mostrar workspace actual */}
        <div className="text-sm text-gray-600">
          <p className="font-medium">{Cookies.get("workspaceName") || "Workspace"}</p>
          <p className="text-xs">Role: {Cookies.get("userRole") || "member"}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          Loading accounts...
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registered Accounts</CardTitle>
        </CardHeader>

        <CardContent>
          <AccountsTable
            accounts={accountsState}
            activeId={activeAccount}
            onSelect={(id) => selectAccount(id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}