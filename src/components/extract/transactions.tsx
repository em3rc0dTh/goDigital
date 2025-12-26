"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AccountsTable, updateAccount } from "./AccountsTable";
import { Trash2, Download, Upload, Eye, EyeOff } from "lucide-react";
import { GenericTable } from "../table/common-table";
import { BusinessTable, PersonalTable } from "../table/transactionTable";
import Cookies from "js-cookie";
import crypto from "crypto";
// O si recibes activeDatabase como prop:
interface TransactionsProps {
  activeDatabase: string;
}
export default function Transactions({ activeDatabase }: TransactionsProps) {
  const [accountsState, setAccountsState] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [storedTransactions, setStoredTransactions] = useState<any[]>([]);
  const [sessionDuplicates, setSessionDuplicates] = useState<any[]>([]);
  const [parsedBatchData, setParsedBatchData] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTransactions, setShowTransactions] = useState(true);
  const [bankType, setBankType] = useState<string>("");
  const [parsedType, setParsedType] = useState<"personal" | "business">("personal");
  const [currencyType, setCurrencyType] = useState<string>("");
  const inputTextRef = useRef<HTMLTextAreaElement>(null);
  const clearStartDateRef = useRef<HTMLInputElement>(null);
  const clearEndDateRef = useRef<HTMLInputElement>(null);
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";
  useEffect(() => {
    loadAccountsFromDB();
  }, [activeDatabase]);

  useEffect(() => {
    const saved = localStorage.getItem("activeAccountId");
    if (saved) {
      const acc = accountsState.find(a => a.id === saved);
      if (acc) {
        setParsedType(acc.bank_account_type === "Business" ? "business" : "personal");
      }
      setActiveAccount(saved);

    }
  }, [accountsState]);

  useEffect(() => {
    if (activeAccount) {
      loadTransactionsFromAPI(activeAccount);
    }
  }, [activeAccount]);

  async function loadAccountsFromDB() {
    try {
      const token = Cookies.get("session_token");
      const tenantDetailId = Cookies.get("tenantDetailId");
      const res = await fetch(`${API_BASE}/accounts`, {
        cache: "no-store",
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-tenant-detail-id": tenantDetailId || "",
        },
        credentials: "include",
      });

      const data = await res.json();
      setAccountsState(data);
    } catch (error) {
      console.error("Error loading accounts:", error);
      setSaveStatus("❌ Error loading accounts");
    }
  }

  async function loadTransactionsFromAPI(accountId: string) {
    try {
      setIsLoading(true);
      const token = Cookies.get("session_token");
      const tenantDetailId = Cookies.get("tenantDetailId");
      const res = await fetch(`${API_BASE}/accounts/${accountId}/transactions`, {
        cache: "no-store",
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-tenant-detail-id": tenantDetailId || "",
        },
        credentials: "include",
      });
      if (!res.ok) {
        setStoredTransactions([]);
        return;
      }
      const data = await res.json();

      // Ordenar por fecha_hora (más reciente primero)
      const sorted = Array.isArray(data)
        ? data.sort((a, b) => {
          const dateA = new Date(a.fecha_hora).getTime();
          const dateB = new Date(b.fecha_hora).getTime();
          return dateB - dateA; // Descendente (más reciente primero)
        })
        : [];

      setStoredTransactions(sorted);
    } catch (error) {
      console.error("Error loading transactions:", error);
      setStoredTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveTransactionsToAPI(accountId: string, transactions: any[]) {
    try {
      setIsLoading(true);

      const normalized = transactions.map((t) => ({
        tenantId: Cookies.get("tenantId"),
        accountId,
        descripcion: t.descripcion ?? null,
        fecha_hora: t.fecha_hora ?? null,
        fecha_hora_raw: t.fecha_hora_raw ?? null,
        monto: t.monto ?? null,
        currency: t.currency ?? null,
        currency_raw: t.currency_raw ?? null,
        uuid: t.uuid ?? null,

        // ---- business ----
        operation_date: t.operation_date ?? null,
        process_date: t.process_date ?? null,
        operation_number: t.operation_number ?? null,
        movement: t.movement ?? null,
        channel: t.channel ?? null,
        amount: t.amount ?? null,
        balance: t.balance ?? null,
      }));
      console.log("Payload: ", normalized);
      const token = Cookies.get("session_token");
      const tenantDetailId = Cookies.get("tenantDetailId");
      const res = await fetch(`${API_BASE}/accounts/${accountId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-detail-id": tenantDetailId || "", },
        credentials: "include",
        body: JSON.stringify({ transactions: normalized }),
      });

      if (!res.ok) throw new Error("Save failed");

      await loadTransactionsFromAPI(accountId);
      await updateAccount(accountId, {
        tx_count: normalized.length,
        oldest:
          normalized.length > 0 ? new Date(normalized[0].fecha_hora) : null,
        newest:
          normalized.length > 0
            ? new Date(normalized[normalized.length - 1].fecha_hora)
            : null,
      });

      await loadAccountsFromDB();
    } catch (error) {
      console.error("Error saving transactions:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  function normalizeCurrency(x: string): string {
    if (!x) return "";
    const upper = x.toUpperCase().trim();
    const map: { [key: string]: string } = {
      "S/.": "PEN",
      "S/": "PEN",
      S: "PEN",
      PEN: "PEN",
      USD: "USD",
      $: "USD",
      US$: "USD",
      EUR: "EUR",
      "€": "EUR",
      GBP: "GBP",
      "£": "GBP",
      JPY: "JPY",
      "¥": "JPY",
    };
    return map[upper] || upper;
  }

  function normalizeDateTime(fechaRaw: string): string {
    const parts = fechaRaw.split("/");
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts.map((p) => parseInt(p, 10));
      if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) {
        return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(
          2,
          "0"
        )}T00:00:00`;
      }
    }

    const currentYear = new Date().getFullYear();
    const withYear = `${fechaRaw} ${currentYear}`;

    const parsed = new Date(withYear);
    if (!isNaN(parsed.getTime())) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, "0");
      const dd = String(parsed.getDate()).padStart(2, "0");
      const hh = String(parsed.getHours()).padStart(2, "0");
      const min = String(parsed.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
    }

    return fechaRaw;
  }

  const selectAccount = (id: string) => {
    setActiveAccount(id);
    localStorage.setItem("activeAccountId", id);

    const acc = accountsState.find(a => a.id === id);
    console.log(acc);

    if (acc) {
      setParsedType(acc.bank_account_type === "Business" ? "business" : "personal");
    }

    setSaveStatus("");
  };


  async function clearAllTransactionsForAccount() {
    if (!activeAccount) {
      alert("Select an account first.");
      return;
    }

    const count = storedTransactions.length;
    if (!count) {
      alert("No transactions to clear.");
      return;
    }

    const ok = confirm(`Delete all ${count} stored transactions?`);
    if (!ok) return;

    try {
      await saveTransactionsToAPI(activeAccount, []);
      setSaveStatus("✅ All transactions cleared.");
    } catch (error) {
      setSaveStatus("❌ Error clearing transactions");
    }
  }

  async function clearTransactionsByDateRange() {
    if (!activeAccount) {
      alert("Select an account first.");
      return;
    }

    const startVal = clearStartDateRef.current?.value;
    const endVal = clearEndDateRef.current?.value;

    if (!startVal && !endVal) {
      alert("Select at least one date.");
      return;
    }

    if (!storedTransactions.length) {
      alert("No transactions to filter.");
      return;
    }

    let startTs = startVal ? new Date(startVal + "T00:00:00").getTime() : null;
    let endTs = endVal ? new Date(endVal + "T23:59:59").getTime() : null;

    const kept: any[] = [];
    const removed: any[] = [];

    storedTransactions.forEach((t: any) => {
      if (!t.fecha_hora) {
        kept.push(t);
        return;
      }
      const txTs = Date.parse(t.fecha_hora);
      if (isNaN(txTs)) {
        kept.push(t);
        return;
      }

      let inRange = true;
      if (startTs && txTs < startTs) inRange = false;
      if (endTs && txTs > endTs) inRange = false;

      if (inRange) removed.push(t);
      else kept.push(t);
    });

    if (!removed.length) {
      alert("No transactions matched the selected range.");
      return;
    }

    const ok = confirm(
      `Delete ${removed.length} transactions in selected range?`
    );
    if (!ok) return;

    try {
      await saveTransactionsToAPI(activeAccount, kept);
      setSaveStatus(`✅ ${removed.length} transactions removed by date range.`);
      if (clearStartDateRef.current) clearStartDateRef.current.value = "";
      if (clearEndDateRef.current) clearEndDateRef.current.value = "";
    } catch (error) {
      setSaveStatus("❌ Error removing transactions");
    }
  }

  function downloadTransactions(transactions: any[], filename: string) {
    if (!activeAccount) {
      alert("Select a bank account first.");
      return;
    }

    const account = accountsState.find((a) => a.id === activeAccount);
    if (!account) {
      alert("Account not found.");
      return;
    }

    const exportData = {
      bank_account: {
        alias: account.alias || "",
        bank_name: account.bank_name,
        account_holder: account.account_holder,
        account_number: account.account_number,
        currency: normalizeCurrency(account.currency || ""),
        account_type: account.account_type,
      },
      exported_at: new Date().toISOString(),
      transactions,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function parseText(accountType: "personal" | "business") {
    setSessionDuplicates([]);

    const text = inputTextRef.current?.value || "";
    if (!activeAccount) {
      alert("Please select a bank account first.");
      setSaveStatus("❌ No bank account selected.");
      return;
    }

    const account = accountsState.find((a) => a.id === activeAccount);
    if (!account) {
      setSaveStatus("❌ Selected account not found.");
      return;
    }

    if (!text.trim()) {
      setSaveStatus("❌ No text to parse.");
      return;
    }

    const accountNormCurrency = normalizeCurrency(account.currency || "");
    if (!accountNormCurrency) {
      setSaveStatus("❌ Account currency invalid.");
      return;
    }

    let result: any[] = [];
    try {
      if (accountType === "personal") {
        result = parsePersonalText(text, accountNormCurrency);
      } else {
        result = parseBusinessText(text, accountNormCurrency);
      }
    } catch (err: any) {
      setSaveStatus(`❌ ${err.message}`);
      return;
    }

    if (!result.length) {
      setSaveStatus("❌ No transactions found in text.");
      return;
    }

    if (result.some((r) => r.currency !== accountNormCurrency)) {
      setSaveStatus(`❌ Currency mismatch: Account is "${account.currency}", data is "${accountNormCurrency}".`);
      return;
    }

    const detectedCurrencies = new Set(result.map((r) => r.currency));
    if (detectedCurrencies.size > 1) {
      setSaveStatus("❌ Multiple currencies detected in same batch.");
      return;
    }

    const detectedNormCurrency = Array.from(detectedCurrencies)[0];
    if (detectedNormCurrency !== accountNormCurrency) {
      setSaveStatus(
        `❌ Currency mismatch: Account is "${account.currency}", data is "${detectedNormCurrency}".`
      );
      return;
    }

    const cleanAccNum = (account.account_number || "").replace(
      /[^0-9A-Za-z]/g,
      ""
    );
    const existingUUIDs = new Set(
      storedTransactions.map((t: any) => t.uuid).filter(Boolean)
    );

    const newTransactions: any[] = [];
    const duplicates: any[] = [];

    result.forEach((tx) => {
      tx.uuid = crypto
        .createHash("sha1")
        .update(JSON.stringify({
          acc: cleanAccNum,
          fecha: tx.fecha_hora,
          desc: tx.descripcion,
          monto: tx.monto,
        }))
        .digest("hex");
      if (existingUUIDs.has(tx.uuid)) duplicates.push(tx);
      else newTransactions.push(tx);
    });

    if (!newTransactions.length && !duplicates.length) {
      setSaveStatus("⚠️ No new or duplicate transactions found.");
      return;
    }

    try {
      const allTransactions = [...storedTransactions, ...newTransactions];
      await saveTransactionsToAPI(activeAccount, allTransactions);

      setParsedBatchData(newTransactions);
      setSessionDuplicates(duplicates);

      let summaryMsg = `✅ Parsed ${newTransactions.length} new transaction(s). `;
      if (duplicates.length > 0)
        summaryMsg += `⚠️ ${duplicates.length} duplicate(s) skipped.`;

      setSaveStatus(summaryMsg);
      if (inputTextRef.current) inputTextRef.current.value = "";
    } catch (error) {
      setSaveStatus("❌ Error saving transactions");
    }
  }

  function parsePersonalText(text: string, accountCurrency: string) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const result: any[] = [];
    const dateRegex =
      /([\wáéíóúüñÁÉÍÓÚÜÑ]{3,4}\.? \d{1,2} [\wáéíóúüñÁÉÍÓÚÜÑ]{3} \d{2}:\d{2})\s*([A-Za-z$€¥\/\.\s]+)\s*([+-]?[0-9.,-]+)/i;

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      if (
        /cargo\s+realizado\s+por|movimientos|fecha\s+y\s+hora|^monto$/i.test(
          line
        )
      )
        continue;

      const next = lines[i + 1];
      const match = next.match(dateRegex);
      if (!match) continue;

      const [, fechaRaw, currencyToken, montoRaw] = match;
      const txNormCurrency = normalizeCurrency(currencyToken);
      if (!txNormCurrency)
        throw new Error(`Unrecognized currency "${currencyToken}"`);
      const monto = parseFloat(
        montoRaw.replace(/,/g, "").replace(/[^0-9.-]/g, "")
      );
      if (!isNaN(monto)) {
        result.push({
          descripcion: line,
          fecha_hora: normalizeDateTime(fechaRaw),
          fecha_hora_raw: fechaRaw,
          monto,
          currency: txNormCurrency,
          currency_raw: currencyToken,
        });
      }
    }

    return result;
  }

  function parseBusinessText(text: string, accountCurrency: string) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const result: any[] = [];
    const skipped: any[] = [];
    let i = 0;

    while (i < lines.length) {
      if (!lines[i].match(/\d{2}\/\d{2}\/\d{4}/)) {
        i++;
        continue;
      }

      const operationDate = lines[i++];
      const processDate = i < lines.length ? lines[i++] : "-";
      const operationNumber = i < lines.length ? lines[i++] : "-";
      const movement = i < lines.length ? lines[i++] : "-";
      const description = i < lines.length ? lines[i++] : "-";
      const channel = i < lines.length ? lines[i++] : "-";
      const amountRaw = i < lines.length ? lines[i++] : "-";
      const balanceRaw = i < lines.length ? lines[i++] : "-";

      // Currency detection
      const symbolMatch = amountRaw.match(/^(S\/|\$)/);
      if (!symbolMatch) {
        skipped.push({
          operationDate,
          reason: `No currency symbol found in amount: "${amountRaw}" or missing amount`,
        });
        continue;
      }

      const currencyToken = symbolMatch[0];
      const amountStr = amountRaw.slice(currencyToken.length).replace(/,/g, "");
      const amount = parseFloat(amountStr);
      if (isNaN(amount)) {
        skipped.push({
          operationDate,
          reason: `Invalid amount: "${amountRaw}"`,
        });
        continue;
      }

      const normalizedCurrency = normalizeCurrency(currencyToken);
      const normalizedAccountCurrency = normalizeCurrency(accountCurrency);

      if (normalizedCurrency !== normalizedAccountCurrency) {
        skipped.push({
          operationDate,
          reason: `Currency mismatch: Found "${normalizedCurrency}", account is "${normalizedAccountCurrency}"`,
          detected: normalizedCurrency,
          account: normalizedAccountCurrency,
        });
        continue;
      }

      const uuid = `biz_${operationDate}_${operationNumber}`;

      result.push({
        descripcion: description,
        fecha_hora: normalizeDateTime(operationDate),
        fecha_hora_raw: operationDate,
        monto: amount,
        currency: normalizedCurrency,
        currency_raw: currencyToken,
        uuid,

        operation_date: operationDate,
        process_date: processDate,
        operation_number: operationNumber,
        movement,
        channel,
        amount: parseMoney(amountRaw),
        balance: parseMoney(balanceRaw),
      });
    }

    if (!result.length && skipped.length > 0) {
      const currencyMismatches = skipped.filter((s) => s.reason.includes("Currency mismatch"));
      if (currencyMismatches.length > 0) {
        const first = currencyMismatches[0];
        throw new Error(
          `Currency mismatch: Account is "${first.account}", data is "${first.detected}"`
        );
      }
      throw new Error(
        `Could not parse transactions. Issues: ${skipped.map((s) => s.reason).join("; ")}`
      );
    }

    return result;
  }

  const parseMoney = (value: string) => {
    if (!value || value === "-") return null;

    const symbols = ["S/.", "S/", "US$", "$", "€", "£", "¥"];
    let numericPart = value;

    for (const symbol of symbols) {
      if (value.startsWith(symbol)) {
        numericPart = value.slice(symbol.length);
        break;
      }
    }
    const parsed = Number(
      numericPart.replace(/,/g, "").trim()
    );

    return isNaN(parsed) ? null : parsed;
  }

  const transactionSummary = {
    count: storedTransactions.length,
    net: storedTransactions.reduce((sum, t) => sum + (t.monto || 0), 0),
  };

  const currencySymbol =
    accountsState.find((a) => a.id === activeAccount)?.currency || "???";

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-6 pb-10">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Web Capture
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage and parse bank transactions
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Select Account</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountsTable
            accounts={accountsState}
            activeId={activeAccount}
            onSelect={(id) => selectAccount(id)}
          />
        </CardContent>
      </Card>

      {!activeAccount && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 text-sm sm:text-base">
            <p className="text-blue-900">
              👆 Select a bank account to get started
            </p>
          </CardContent>
        </Card>
      )}

      {activeAccount && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Parse Transactions</span>
                <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                  {isLoading && "Loading..."}
                </span>
              </CardTitle>
              <CardDescription className="text-sm">
                Paste your bank statement text below
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Textarea
                ref={inputTextRef}
                placeholder="Paste transaction text here..."
                className="min-h-[160px] sm:min-h-[200px] font-mono text-xs sm:text-sm"
              />

              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <Button
                  onClick={() => {
                    const selectedAccount = accountsState.find(
                      (a) => a.id === activeAccount
                    );

                    const type =
                      selectedAccount.bank_account_type
                        .toLowerCase()
                        .trim() === "business"
                        ? "business"
                        : "personal";
                    parseText(type);
                    setParsedType(type);
                  }}
                  disabled={isLoading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Parse & Save
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    if (inputTextRef.current)
                      inputTextRef.current.value = "";
                  }}
                >
                  Clear
                </Button>
              </div>

              {saveStatus && (
                <div
                  className={`p-3 rounded text-xs sm:text-sm ${saveStatus.includes("✅")
                    ? "bg-green-100 text-green-800"
                    : saveStatus.includes("⚠️")
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                    }`}
                >
                  {saveStatus}
                </div>
              )}
            </CardContent>
          </Card>

          {sessionDuplicates.length > 0 && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-900 text-sm sm:text-base">
                  ⚠️ Duplicates ({sessionDuplicates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-auto text-sm">
                  {sessionDuplicates.map((dup, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded border border-yellow-200 text-sm"
                    >
                      <p className="font-semibold">
                        {dup.descripcion}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dup.fecha_hora_raw} • {dup.monto}{" "}
                        {dup.currency_raw}
                      </p>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full text-sm"
                  onClick={() =>
                    downloadTransactions(
                      sessionDuplicates,
                      `duplicates_${new Date().toISOString().split("T")[0]
                      }.json`
                    )
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Duplicates
                </Button>
              </CardContent>
            </Card>
          )}

          {storedTransactions.length > 0 && (
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Stored Transactions</CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    Total: {transactionSummary.count} transactions | Net:{" "}
                    {transactionSummary.net.toFixed(2)}{" "}
                    {currencySymbol}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  className="self-end sm:self-auto"
                  onClick={() =>
                    setShowTransactions(!showTransactions)
                  }
                >
                  {showTransactions ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </Button>
              </CardHeader>

              {showTransactions && (
                <CardContent>
                  {parsedType === "personal" && (
                    <PersonalTable
                      storedTransactions={storedTransactions}
                    />
                  )}
                  {parsedType === "business" && (
                    <BusinessTable
                      storedTransactions={storedTransactions}
                    />
                  )}
                </CardContent>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
