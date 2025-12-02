"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AccountsTable } from "./AccountsTable";

// ----------------------
// ACTIVE ACCOUNT STORAGE
// ----------------------
function saveActiveAccount(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("active_account_id", id);
}

function loadActiveAccount() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("active_account_id");
}

// ----------------------
// MAIN COMPONENT
// ----------------------
export default function AccountsView() {
  const [accountsState, setAccountsState] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);

  // CARGA DESDE BACKEND
  async function fetchAccounts() {
    try {
      const res = await fetch("/api/back/account", { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      setAccountsState(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  }

  // CARGA INICIAL
  useEffect(() => {
    fetchAccounts();
    setActiveAccount(loadActiveAccount());
  }, []);

  // SELECT ACCOUNT → react + storage
  function selectAccount(id: string) {
    saveActiveAccount(id);
    setActiveAccount(id);
  }

  return (
    <div id="accountsView" className="w-full max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Bank Accounts</h2>
      <p className="text-sm text-muted-foreground">
        Register all your bank accounts here. Click a row to select it as the
        active account.
      </p>

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
