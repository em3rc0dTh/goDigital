"use client";

export function loadTransactionsForAccount(accountId: string) {
  if (typeof window === "undefined") {
    // Next.js SSR fallback
    return {
      account_id: accountId,
      currency: null,
      transactions: [],
    };
  }

  const key = getTransactionsStorageKey(accountId);
  const raw = localStorage.getItem(key);

  if (!raw) {
    return {
      account_id: accountId,
      currency: null,
      transactions: [],
    };
  }

  try {
    const obj = JSON.parse(raw);
    if (!obj.transactions) obj.transactions = [];
    return obj;
  } catch (e) {
    console.error(
      "Error parsing transactions for account",
      accountId,
      e
    );
    return {
      account_id: accountId,
      currency: null,
      transactions: [],
    };
  }
  
}
export function getTransactionsStorageKey(accountId: string) {
return `transactions_${accountId}`;
}
