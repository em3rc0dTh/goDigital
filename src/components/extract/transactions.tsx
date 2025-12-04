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

export default function Transactions() {
  const [accountsState, setAccountsState] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [storedTransactions, setStoredTransactions] = useState<any[]>([]);
  const [sessionDuplicates, setSessionDuplicates] = useState<any[]>([]);
  const [parsedBatchData, setParsedBatchData] = useState<any[]>([]);
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTransactions, setShowTransactions] = useState(true);
  const [accountType, setAccountType] = useState<"personal" | "business">(
    "personal"
  );
  const [bankType, setBankType] = useState<string>("");
  const [currencyType, setCurrencyType] = useState<string>("");
  const inputTextRef = useRef<HTMLTextAreaElement>(null);
  const clearStartDateRef = useRef<HTMLInputElement>(null);
  const clearEndDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAccountsFromDB();
    const saved = localStorage.getItem("activeAccountId");
    if (saved) setActiveAccount(saved);
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
    } catch (error) {
      console.error("Error loading accounts:", error);
      setSaveStatus("❌ Error loading accounts");
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

  async function saveTransactionsToAPI(accountId: string, transactions: any[]) {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/back/transactions/${accountId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions }),
      });
      if (!res.ok) throw new Error("Save failed");
      await loadTransactionsFromAPI(accountId);
      await updateAccount(accountId, {
        tx_count: transactions.length,
        oldest:
          transactions.length > 0 ? new Date(transactions[0].fecha_hora) : null,
        newest:
          transactions.length > 0
            ? new Date(transactions[transactions.length - 1].fecha_hora)
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

  // async function parseText() {
  //   setSessionDuplicates([]);

  //   const text = inputTextRef.current?.value || "";

  //   if (!activeAccount) {
  //     alert("Please select a bank account first.");
  //     setSaveStatus("❌ No bank account selected.");
  //     return;
  //   }

  //   const account = accountsState.find((a) => a.id === activeAccount);
  //   if (!account) {
  //     setSaveStatus("❌ Selected account not found.");
  //     return;
  //   }

  //   if (!text.trim()) {
  //     setSaveStatus("❌ No text to parse.");
  //     return;
  //   }

  //   const accountNormCurrency = normalizeCurrency(account.currency || "");
  //   if (!accountNormCurrency) {
  //     setSaveStatus("❌ Account currency invalid.");
  //     return;
  //   }

  //   const lines = text
  //     .split("\n")
  //     .map((l) => l.trim())
  //     .filter((l) => l.length > 0);

  //   const result: any[] = [];
  //   let detectedNormCurrency: string | null = null;
  //   let detectedRawCurrency: string | null = null;

  //   const dateRegex =
  //     /([\wáéíóúüñÁÉÍÓÚÜÑ]{3,4}\.? \d{1,2} [\wáéíóúüñÁÉÍÓÚÜÑ]{3} \d{2}:\d{2})\s*([A-Za-z$€¥\/\.\s]+)\s*([+-]?[0-9.,-]+)/i;

  //   for (let i = 0; i < lines.length - 1; i++) {
  //     const line = lines[i];

  //     if (
  //       /cargo\s+realizado\s+por/i.test(line) ||
  //       /movimientos/i.test(line) ||
  //       /fecha\s+y\s+hora/i.test(line) ||
  //       /^monto$/i.test(line)
  //     )
  //       continue;

  //     const desc = line;
  //     const next = lines[i + 1] || "";
  //     const match = next.match(dateRegex);

  //     if (match) {
  //       const fechaRaw = match[1];
  //       const currencyToken = match[2];
  //       let montoStr = match[3];

  //       const txNormCurrency = normalizeCurrency(currencyToken);
  //       if (!txNormCurrency) {
  //         setSaveStatus(`❌ Unrecognized currency "${currencyToken}"`);
  //         return;
  //       }

  //       if (!detectedNormCurrency) {
  //         detectedNormCurrency = txNormCurrency;
  //         detectedRawCurrency = currencyToken;
  //       } else if (txNormCurrency !== detectedNormCurrency) {
  //         setSaveStatus("❌ Multiple currencies detected in same batch.");
  //         return;
  //       }

  //       montoStr = montoStr.replace(/,/g, "").replace(/[^0-9.-]/g, "");
  //       const monto = parseFloat(montoStr);

  //       if (!isNaN(monto)) {
  //         const fechaIso = normalizeDateTime(fechaRaw);
  //         result.push({
  //           descripcion: desc,
  //           fecha_hora: fechaIso,
  //           fecha_hora_raw: fechaRaw,
  //           monto,
  //           currency: txNormCurrency,
  //           currency_raw: currencyToken,
  //         });
  //       }
  //     }
  //   }

  //   if (!result.length) {
  //     setSaveStatus("❌ No transactions found in text.");
  //     return;
  //   }

  //   if (detectedNormCurrency && detectedNormCurrency !== accountNormCurrency) {
  //     setSaveStatus(
  //       `❌ Currency mismatch: Account is "${account.currency}", data is "${detectedRawCurrency}".`
  //     );
  //     return;
  //   }

  //   const cleanAccNum = (account.account_number || "").replace(
  //     /[^0-9A-Za-z]/g,
  //     ""
  //   );

  //   const existingUUIDs = new Set();
  //   storedTransactions.forEach((t: any) => {
  //     if (t.uuid) existingUUIDs.add(t.uuid);
  //   });

  //   const newTransactions: any[] = [];
  //   const duplicates: any[] = [];

  //   result.forEach((rt) => {
  //     const uuid = cleanAccNum + "_" + rt.fecha_hora;
  //     rt.uuid = uuid;
  //     if (existingUUIDs.has(uuid)) {
  //       duplicates.push(rt);
  //     } else {
  //       newTransactions.push(rt);
  //     }
  //   });

  //   if (!newTransactions.length && !duplicates.length) {
  //     setSaveStatus("⚠️ No new or duplicate transactions found.");
  //     return;
  //   }

  //   try {
  //     const allTransactions = [...storedTransactions, ...newTransactions];
  //     await saveTransactionsToAPI(activeAccount, allTransactions);

  //     setParsedBatchData(newTransactions);
  //     setSessionDuplicates(duplicates);

  //     const savedCount = newTransactions.length;
  //     const dupCount = duplicates.length;

  //     let summaryMsg = `✅ Parsed ${savedCount} new transaction(s). `;
  //     if (dupCount > 0) summaryMsg += `⚠️ ${dupCount} duplicate(s) skipped.`;

  //     setSaveStatus(summaryMsg);
  //     if (inputTextRef.current) inputTextRef.current.value = "";
  //   } catch (error) {
  //     setSaveStatus("❌ Error saving transactions");
  //   }
  // }

  // async function parseBusinessText(text: string, accountCurrency: string) {
  //   const lines = text
  //     .split("\n")
  //     .map((l) => l.trim())
  //     .filter((l) => l.length > 0);

  //   const result: any[] = [];

  //   for (const line of lines) {
  //     // Buscamos importe con símbolo S/ o $
  //     const match = line.match(
  //       /^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+([^\s]+)?\s+([^\n]+)\s+([^\n]+)\s+([^\s]+)\s+([S$\/][0-9.,-]+)\s+([S$\/][0-9.,-]+)/
  //     );
  //     if (!match) continue;

  //     const [
  //       ,
  //       fechaOperacion,
  //       fechaProceso,
  //       nroOperacion,
  //       movimiento,
  //       descripcion,
  //       canal,
  //       importeRaw,
  //       saldoRaw,
  //     ] = match;

  //     const currencyToken = importeRaw.slice(0, 2).trim(); // "S/" o "$"
  //     const montoStr = importeRaw.slice(currencyToken.length).replace(/,/g, "");
  //     const monto = parseFloat(montoStr);

  //     if (!monto || !currencyToken) continue;

  //     const normalizedCurrency = normalizeCurrency(currencyToken);
  //     if (normalizedCurrency !== accountCurrency) {
  //       throw new Error(
  //         `Currency mismatch: Account is "${accountCurrency}", data is "${currencyToken}"`
  //       );
  //     }

  //     result.push({
  //       fecha_operacion: fechaOperacion,
  //       fecha_proceso: fechaProceso,
  //       nro_operacion: nroOperacion,
  //       movimiento,
  //       descripcion,
  //       canal,
  //       monto,
  //       currency: normalizedCurrency,
  //     });
  //   }

  //   return result;
  // }

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
      tx.uuid = cleanAccNum + "_" + (tx.fecha_hora || tx.fecha_operacion);
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
    let i = 0;

    while (i < lines.length) {
      if (!lines[i].match(/\d{2}\/\d{2}\/\d{4}/)) {
        i++;
        continue;
      }

      const fechaOperacion = lines[i++];
      const fechaProceso = i < lines.length ? lines[i++] : "-";
      const nroOperacion = i < lines.length ? lines[i++] : "-";
      const movimiento = i < lines.length ? lines[i++] : "-";
      const descripcion = i < lines.length ? lines[i++] : "-";
      const canal = i < lines.length ? lines[i++] : "-";
      const importeRaw = i < lines.length ? lines[i++] : "-";
      const saldoRaw = i < lines.length ? lines[i++] : "-";

      const symbolMatch = importeRaw.match(/^(S\/|\$)/);
      if (!symbolMatch) continue;

      const currencyToken = symbolMatch[0];
      const montoStr = importeRaw.slice(currencyToken.length).replace(/,/g, "");
      const monto = parseFloat(montoStr);
      if (isNaN(monto)) continue;

      const normalizedCurrency = normalizeCurrency(currencyToken); // aquí conviertes "S/" a "PEN", "$" a "USD", etc.
      const normalizedAccountCurrency = normalizeCurrency(accountCurrency);

      if (normalizedCurrency !== normalizedAccountCurrency) continue; // o lanza error si quieres

      const uuid = `123456789_${fechaOperacion}`;

      result.push({
        descripcion,
        fecha_hora: normalizeDateTime(fechaOperacion),
        fecha_hora_raw: fechaOperacion,
        monto,
        currency: normalizedCurrency,
        currency_raw: currencyToken,
        uuid,
        canal,
        movimiento,
        nroOperacion,
        saldo: saldoRaw,
      });
    }

    return result;
  }

  const transactionSummary = {
    count: storedTransactions.length,
    net: storedTransactions.reduce((sum, t) => sum + (t.monto || 0), 0),
  };

  const currencySymbol =
    accountsState.find((a) => a.id === activeAccount)?.currency || "???";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">
          Manage and parse bank transactions
        </p>
      </div>

      <Card>
        <CardHeader>
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
          <CardContent className="pt-6">
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
              <CardTitle className="flex justify-between items-center">
                <span>Parse Transactions</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {isLoading && "Loading..."}
                </span>
              </CardTitle>
              <CardDescription>
                Paste your bank statement text below
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Textarea
                ref={inputTextRef}
                placeholder="Paste transaction text here..."
                className="min-h-[200px] font-mono text-sm"
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    const selectedAccount = accountsState.find(
                      (a) => a.id === activeAccount
                    );
                    console.log(
                      "Selected Account: ",
                      selectedAccount.bank_account_type.toLowerCase().trim()
                    );
                    parseText(
                      selectedAccount.bank_account_type.toLowerCase().trim() ===
                        "business"
                        ? "business"
                        : "personal"
                    );
                  }}
                  disabled={isLoading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Parse & Save
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    if (inputTextRef.current) inputTextRef.current.value = "";
                  }}
                >
                  Clear
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setDebugPanelVisible(!debugPanelVisible)}
                >
                  ⚙️ Debug
                </Button>
              </div>

              {saveStatus && (
                <div
                  className={`p-3 rounded text-sm ${
                    saveStatus.includes("✅")
                      ? "bg-green-100 text-green-800"
                      : saveStatus.includes("⚠️")
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {saveStatus}
                </div>
              )}

              {debugPanelVisible && parsedBatchData.length > 0 && (
                <div className="p-4 bg-gray-900 rounded text-green-400 text-xs font-mono max-h-48 overflow-auto">
                  <pre>{JSON.stringify(parsedBatchData, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>

          {sessionDuplicates.length > 0 && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-900">
                  ⚠️ Duplicates ({sessionDuplicates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {sessionDuplicates.map((dup, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded border border-yellow-200 text-sm"
                    >
                      <p className="font-semibold">{dup.descripcion}</p>
                      <p className="text-xs text-muted-foreground">
                        {dup.fecha_hora_raw} • {dup.monto} {dup.currency_raw}
                      </p>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() =>
                    downloadTransactions(
                      sessionDuplicates,
                      `duplicates_${new Date().toISOString().split("T")[0]}.json`
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Stored Transactions</CardTitle>
                  <CardDescription className="mt-2">
                    Total: {transactionSummary.count} transactions | Net:{" "}
                    {transactionSummary.net.toFixed(2)} {currencySymbol}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowTransactions(!showTransactions)}
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">#</th>
                          <th className="px-4 py-2 text-left">Description</th>
                          <th className="px-4 py-2 text-left">Date & Time</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-center">Currency</th>
                        </tr>
                      </thead>
                      <tbody className="max-h-96 overflow-y-auto">
                        {storedTransactions.map((tx, idx) => (
                          <tr
                            key={idx}
                            className="border-b hover:bg-gray-50 transition"
                          >
                            <td className="px-4 py-2 text-gray-500">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-2 font-medium">
                              {tx.descripcion}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {tx.fecha_hora_raw || tx.fecha_hora}
                            </td>
                            <td
                              className={`px-4 py-2 text-right font-semibold ${
                                tx.monto > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {tx.monto > 0 ? "+" : ""}
                              {Number(tx.monto).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-center text-sm">
                              {tx.currency_raw || tx.currency}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Management</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">
                    Clear by Date Range
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        ref={clearStartDateRef}
                        type="date"
                        placeholder="Start"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        ref={clearEndDateRef}
                        type="date"
                        placeholder="End"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={clearTransactionsByDateRange}
                  >
                    Clear Range
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Quick Actions</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      downloadTransactions(
                        storedTransactions,
                        `transactions_${new Date().toISOString().split("T")[0]}.json`
                      )
                    }
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export All
                  </Button>
                </div>
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={clearAllTransactionsForAccount}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Transactions
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
