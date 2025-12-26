"use client";

import { cn } from "@/lib/utils";
import { loadTransactionsForAccount } from "./transaction";
import { format } from "date-fns";
import Cookies from "js-cookie";
// const BASE = "/api/back/account";
const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

export async function fetchAccounts() {
  const res = await fetch(BASE, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed fetching accounts");
  return res.json();
}

export async function createAccount(data: any) {
  const tenantDetailId = Cookies.get("tenantDetailId");
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-tenant-detail-id": tenantDetailId || "", },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed creating account");
  return res.json();
}

export async function updateAccount(id: string, data: any) {
  const token = Cookies.get("session_token");
  const tenantDetailId = Cookies.get("tenantDetailId");
  const res = await fetch(`${BASE}/accounts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-detail-id": tenantDetailId || "", },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed updating account");
  return res.json();
}

export async function deleteAccount(id: string) {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed deleting account");
  return res.json();
}

type Account = {
  id: string;
  alias: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  bank_account_type: string;
  currency: string;
  account_type: string;
  tx_count: number;
  oldest: Date | null;
  newest: Date | null;
};

export function AccountsTable({
  accounts,
  activeId,
  onSelect,
  columns,
}: {
  accounts: Account[];
  activeId: string | null;
  onSelect: (id: string) => void;
  columns?: string[];
}) {
  if (!accounts.length)
    return (
      <p className="text-sm text-muted-foreground">
        No bank accounts registered yet.
      </p>
    );
  function fmt(date: Date | null) {
    if (!date) return "—";
    try {
      return format(date, "yyyy-MM-dd");
    } catch {
      return "—";
    }
  }

  function getAccountStats(acc: any) {
    const store = loadTransactionsForAccount(acc.id);
    const txs = store.transactions || [];
    const count = txs.length;
    let oldest = "";
    let newest = "";

    if (count) {
      let minTs: number | null = null;
      let maxTs: number | null = null;

      txs.forEach((t: any) => {
        if (!t.fecha_hora) return;
        const ts = Date.parse(t.fecha_hora);
        if (isNaN(ts)) return;
        if (minTs === null || ts < minTs) minTs = ts;
        if (maxTs === null || ts > maxTs) maxTs = ts;
      });

      if (minTs !== null)
        oldest = new Date(minTs).toISOString().substring(0, 10);
      if (maxTs !== null)
        newest = new Date(maxTs).toISOString().substring(0, 10);
    }

    return { count, oldest, newest };
  }

  const allColumns = [
    "#",
    "Alias",
    "Bank Name",
    "Account Holder",
    "Account Number",
    "Bank Account Type",
    "Currency",
    "Type",
    "Tx Count",
    "Oldest",
    "Newest",
  ];

  const headersToShow = columns || allColumns;

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[900px] w-full border rounded-md text-sm">

        <thead className="bg-muted">
          <tr>
            {headersToShow.map((col) => (
              <Th key={col}>{col}</Th>
            ))}
          </tr>
        </thead>

        <tbody>
          {accounts.map((acc, idx) => {
            const stats = getAccountStats(acc);

            return (
              <tr
                key={acc.id}
                className={cn(
                  "cursor-pointer hover:bg-accent transition",
                  acc.id === activeId && "bg-primary/10"
                )}
                onClick={() => onSelect(acc.id)}
              >
                {headersToShow.includes("#") && <Td>{idx + 1}</Td>}
                {headersToShow.includes("Alias") && <Td>{acc.alias || "—"}</Td>}
                {headersToShow.includes("Bank Name") && <Td>{acc.bank_name}</Td>}
                {headersToShow.includes("Account Holder") && (
                  <Td>{acc.account_holder}</Td>
                )}
                {headersToShow.includes("Account Number") && (
                  <Td>
                    <strong>{acc.account_number}</strong>
                  </Td>
                )}
                {headersToShow.includes("Bank Account Type") && (
                  <Td>{acc.bank_account_type}</Td>
                )}
                {headersToShow.includes("Currency") && <Td>{acc.currency}</Td>}
                {headersToShow.includes("Type") && <Td>{acc.account_type}</Td>}
                {headersToShow.includes("Tx Count") && <Td>{acc.tx_count}</Td>}
                {headersToShow.includes("Oldest") && <Td>{fmt(acc.oldest)}</Td>}
                {headersToShow.includes("Newest") && <Td>{fmt(acc.newest)}</Td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: any }) {
  return <th className="px-2 py-2 text-left font-medium">{children}</th>;
}

function Td({ children }: { children: any }) {
  return <td className="px-2 py-2 border-t">{children}</td>;
}
