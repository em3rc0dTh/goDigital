"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Database } from "lucide-react";
import { AccountsTab } from "../settings/AccountsSettings";
import { EmailTab } from "../settings/EmailsSettings";

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<"accounts" | "email" | "imap">(
    "accounts"
  );
  const [accountsState, setAccountsState] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [emailSetups, setEmailSetups] = useState<any[]>([]);
  const [imapConfig, setImapConfig] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const bankAlias = useRef<any>(null);
  const bankName = useRef<any>(null);
  const bankHolder = useRef<any>(null);
  const bankNumber = useRef<any>(null);
  const bankAccountType = useRef<any>(null);
  const bankCurrency = useRef<any>(null);
  const bankType = useRef<any>(null);

  const settingsAlias = useRef<any>(null);
  const settingsBankName = useRef<any>(null);
  const settingsHolder = useRef<any>(null);
  const settingsNumber = useRef<any>(null);
  const settingsCurrency = useRef<any>(null);
  const settingsType = useRef<any>(null);

  const emailUser = useRef<any>(null);
  const emailPass = useRef<any>(null);

  const aliasEmail = useRef<any>(null);
  const bankNameEmail = useRef<any>(null);
  const serviceTypeEmail = useRef<any>(null);
  const bankEmailSender = useRef<any>(null);

  useEffect(() => {
    loadAccountsFromDB();
    loadEmailSetups();
    loadImapConfig();
  }, []);

  async function loadAccountsFromDB() {
    try {
      const res = await fetch("/api/back/account", { cache: "no-store" });
      const data = await res.json();
      setAccountsState(data);

      const saved = localStorage.getItem("activeAccountId");
      if (saved) {
        setActiveAccount(saved);
        populateSettingsForm(saved, data);
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
      showStatus("❌ Error loading accounts", "error");
    }
  }

  async function loadEmailSetups() {
    try {
      const res = await fetch("http://localhost:8000/email/setup");
      if (res.ok) {
        const data = await res.json();
        setEmailSetups(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading email setups:", error);
    }
  }

  async function loadImapConfig() {
    try {
      const res = await fetch("http://localhost:8000/imap/config");
      if (res.ok) {
        const data = await res.json();
        setImapConfig(data);
      }
    } catch (error) {
      console.error("Error loading IMAP config:", error);
    }
  }

  function showStatus(
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 4000);
  }

  function populateSettingsForm(accountId: string, accounts: any[]) {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    if (settingsAlias.current)
      settingsAlias.current.value = account.alias || "";
    if (settingsBankName.current)
      settingsBankName.current.value = account.bank_name || "";
    if (settingsHolder.current)
      settingsHolder.current.value = account.account_holder || "";
    if (settingsNumber.current)
      settingsNumber.current.value = account.account_number || "";
    if (settingsCurrency.current)
      settingsCurrency.current.value = account.currency || "";
    if (settingsType.current)
      settingsType.current.value = account.account_type || "";
  }

  const selectAccount = (id: string) => {
    setActiveAccount(id);
    localStorage.setItem("activeAccountId", id);
    populateSettingsForm(id, accountsState);
  };

  async function addAccount(event: any) {
    event.preventDefault();

    const alias = bankAlias.current.value.trim();
    const bank_name = bankName.current.value.trim();
    const account_holder = bankHolder.current.value.trim();
    const account_number = bankNumber.current.value.trim();
    const currency = bankCurrency.current.value.trim();
    const account_type = bankType.current.value.trim();
    const bank_account_type = bankAccountType.current;

    if (!bank_name || !account_holder || !account_number) {
      showStatus(
        "❌ Please fill Bank Name, Holder Name and Account Number",
        "error"
      );
      return;
    }

    try {
      const res = await fetch("/api/back/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias,
          bank_name,
          account_holder,
          account_number,
          currency,
          account_type,
          bank_account_type,
        }),
      });

      const saved = await res.json();

      bankAlias.current.value = "";
      bankName.current.value = "";
      bankHolder.current.value = "";
      bankNumber.current.value = "";
      bankCurrency.current.value = "";
      bankType.current.value = "";
      bankAccountType.current = "";

      await loadAccountsFromDB();
      selectAccount(saved.id);
      showStatus("✅ Account added successfully", "success");
    } catch (error) {
      console.error("Error adding account:", error);
      showStatus("❌ Error adding account", "error");
    }
  }

  async function saveAccountUpdates() {
    if (!activeAccount) {
      showStatus("❌ No account selected", "error");
      return;
    }

    const alias = settingsAlias.current.value.trim();
    const bank_name = settingsBankName.current.value.trim();
    const account_holder = settingsHolder.current.value.trim();
    const currency = settingsCurrency.current.value.trim();
    const account_type = settingsType.current.value.trim();

    if (!bank_name || !account_holder) {
      showStatus("❌ Bank Name and Holder are required", "error");
      return;
    }

    try {
      await fetch(`/api/back/account/${activeAccount}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias,
          bank_name,
          account_holder,
          currency,
          account_type,
        }),
      });

      await loadAccountsFromDB();
      showStatus("✅ Account updated successfully", "success");
    } catch (error) {
      console.error("Error updating account:", error);
      showStatus("❌ Error updating account", "error");
    }
  }

  async function deleteSelectedAccount() {
    if (!activeAccount) {
      showStatus("❌ No account selected", "error");
      return;
    }

    const account = accountsState.find((a) => a.id === activeAccount);
    if (!account) {
      showStatus("❌ Account not found", "error");
      return;
    }

    const ok = confirm(
      `Delete "${account.bank_name} ${account.account_number}"? This will also delete all transactions.`
    );
    if (!ok) return;

    try {
      await fetch(`/api/back/account/${activeAccount}`, {
        method: "DELETE",
      });

      setActiveAccount(null);
      localStorage.removeItem("activeAccountId");

      if (settingsAlias.current) settingsAlias.current.value = "";
      if (settingsBankName.current) settingsBankName.current.value = "";
      if (settingsHolder.current) settingsHolder.current.value = "";
      if (settingsNumber.current) settingsNumber.current.value = "";
      if (settingsCurrency.current) settingsCurrency.current.value = "";
      if (settingsType.current) settingsType.current.value = "";

      await loadAccountsFromDB();
      showStatus("🗑️ Account deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting account:", error);
      showStatus("❌ Error deleting account", "error");
    }
  }

  async function addEmailConfig(event: any) {
    event.preventDefault();

    const email = emailUser.current.value.trim();
    const pass = emailPass.current.value.trim();

    if (!email || !pass) {
      showStatus("❌ Email and password required", "error");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/imap/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: email, password: pass }),
      });

      if (!res.ok) throw new Error("Save error");

      emailUser.current.value = "";
      emailPass.current.value = "";

      await loadImapConfig();
      showStatus("✅ IMAP configuration saved", "success");
    } catch (err) {
      console.error(err);
      showStatus("❌ Error saving IMAP config", "error");
    }
  }

  async function addSetupToEmail(event: any) {
    event.preventDefault();

    const payload = {
      alias: aliasEmail.current.value.trim(),
      bank_name: bankNameEmail.current.value.trim(),
      service_type: serviceTypeEmail.current.value.trim(),
      bank_sender: bankEmailSender.current.value.trim(),
    };

    if (!payload.bank_name || !payload.service_type || !payload.bank_sender) {
      showStatus(
        "❌ Please fill Bank Name, Service Type and Bank Sender",
        "error"
      );
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/email/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      aliasEmail.current.value = "";
      bankNameEmail.current.value = "";
      serviceTypeEmail.current.value = "";
      bankEmailSender.current.value = "";

      await loadEmailSetups();
      showStatus("✅ Email setup saved successfully", "success");
    } catch (err) {
      console.error(err);
      showStatus("❌ Error saving email setup", "error");
    }
  }

  async function updateImapConfig(user: string, password: string) {
    try {
      const res = await fetch(`http://localhost:8000/imap/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      if (!res.ok) throw new Error("Update failed");
      await loadImapConfig();
      showStatus("✅ IMAP configuration updated", "success");
    } catch (err) {
      console.error(err);
      showStatus("❌ Error updating IMAP config", "error");
    }
  }

  async function deleteImapConfig() {
    const ok = confirm(
      "Are you sure you want to delete the IMAP configuration?"
    );
    if (!ok) return;

    try {
      const res = await fetch(`http://localhost:8000/imap/config`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setImapConfig(null);
      showStatus("🗑️ IMAP configuration deleted", "success");
    } catch (err) {
      console.error(err);
      showStatus("❌ Error deleting IMAP config", "error");
    }
  }

  async function updateEmailSetup(idx: number, updated: any) {
    try {
      const res = await fetch(`http://localhost:8000/email/setup/${idx}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Update failed");
      await loadEmailSetups();
      showStatus("✅ Email setup updated", "success");
    } catch (err) {
      console.error(err);
      showStatus("❌ Error updating email setup", "error");
    }
  }

  async function deleteEmailSetup(idx: number) {
    const ok = confirm("Are you sure you want to delete this email setup?");
    if (!ok) return;

    try {
      const res = await fetch(`http://localhost:8000/email/setup/${idx}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      await loadEmailSetups();
      showStatus("🗑️ Email setup deleted", "success");
    } catch (err) {
      console.error(err);
      showStatus("❌ Error deleting email setup", "error");
    }
  }

  const tabs = [
    { id: "accounts", label: "Accounts", icon: Database },
    { id: "email", label: "Email Setup", icon: Mail },
  ] as const;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your bank accounts and email integrations
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded text-sm ${
            statusMessage.includes("✅")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {statusMessage}
        </div>
      )}

      <div className="flex gap-2 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 flex items-center gap-2 border-b-2 transition ${
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "accounts" && (
        <AccountsTab
          accounts={accountsState}
          activeAccount={activeAccount}
          selectAccount={selectAccount}
          addAccount={addAccount}
          saveAccountUpdates={saveAccountUpdates}
          deleteSelectedAccount={deleteSelectedAccount}
          bankAlias={bankAlias}
          bankName={bankName}
          bankHolder={bankHolder}
          bankNumber={bankNumber}
          bankAccountType={bankAccountType}
          bankCurrency={bankCurrency}
          bankType={bankType}
          settingsAlias={settingsAlias}
          settingsBankName={settingsBankName}
          settingsHolder={settingsHolder}
          settingsNumber={settingsNumber}
          settingsCurrency={settingsCurrency}
          settingsType={settingsType}
        />
      )}

      {activeTab === "email" && (
        <EmailTab
          imapConfig={imapConfig}
          emailSetups={emailSetups}
          emailUser={emailUser}
          emailPass={emailPass}
          aliasEmail={aliasEmail}
          bankNameEmail={bankNameEmail}
          serviceTypeEmail={serviceTypeEmail}
          bankEmailSender={bankEmailSender}
          addEmailConfig={addEmailConfig}
          addSetupToEmail={addSetupToEmail}
          updateImapConfig={updateImapConfig}
          deleteImapConfig={deleteImapConfig}
          updateEmailSetup={updateEmailSetup}
          deleteEmailSetup={deleteEmailSetup}
        />
      )}
    </div>
  );
}
