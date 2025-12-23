"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Database, Forward } from "lucide-react";
import { AccountsTab } from "../settings/AccountsSettings";
import { EmailTab } from "../settings/EmailsSettings";
import Cookies from "js-cookie";
import { ForwardingTab } from "../settings/ForwardingSettings";

interface SettingsViewProps {
  activeDatabase: string;
}

export default function SettingsView({ activeDatabase }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"accounts" | "email" | "imap" | "forward">(
    "accounts"
  );
  const [accountsState, setAccountsState] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [emailSetups, setEmailSetups] = useState<any[]>([]);
  const [imapConfig, setImapConfig] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState("");

  // 🆕 Estado para el dbName del tenant activo
  const [tenantDbName, setTenantDbName] = useState<string>("");

  const bankAlias = useRef<any>(null);
  const bankHolder = useRef<any>(null);
  const bankNumber = useRef<any>(null);
  const bankType = useRef<any>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const [bankCurrency, setBankCurrency] = useState<string | null>(null);
  const [bankAccountType, setBankAccountType] = useState<string | null>(null);

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
  const account = useRef<any>(null);
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

  const IMAP_BASE =
    process.env.NEXT_PUBLIC_IMAP_API_BASE || "/imap";
  // 🆕 Cargar dbName del tenant activo
  useEffect(() => {
    loadTenantDbName();
  }, []);

  useEffect(() => {
    if (tenantDbName) {
      loadAccountsFromDB();
      loadEmailSetups();
      loadImapConfig();
    }
  }, [activeDatabase, tenantDbName]);

  async function loadTenantDbName() {
    try {
      const token = Cookies.get("session_token");
      const tenantId = Cookies.get("tenantId");
      const tenantDetailId = Cookies.get("tenantDetailId");

      if (!tenantId || !tenantDetailId) {
        console.error("Missing tenantId or tenantDetailId in cookies");
        showStatus("❌ Missing tenant information", "error");
        return;
      }

      const res = await fetch(
        `${API_BASE}/tenants/details/${tenantId}`,
        {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load tenant details");
      }

      const data = await res.json();

      // Buscar el detail que coincide con tenantDetailId
      const activeDetail = data.details.find(
        (d: any) => d.detailId === tenantDetailId
      );

      if (activeDetail?.dbName) {
        setTenantDbName(activeDetail.dbName);
        console.log("✅ Loaded tenant DB name:", activeDetail.dbName);
      } else {
        console.error("No dbName found for active tenant detail");
        showStatus("❌ Could not load database name", "error");
      }
    } catch (error) {
      console.error("Error loading tenant DB name:", error);
      showStatus("❌ Error loading tenant information", "error");
    }
  }

  async function loadAccountsFromDB() {
    try {
      const token = Cookies.get("session_token");
      const tenantDetailId = Cookies.get("tenantDetailId");
      const res = await fetch(`${API_BASE}/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-tenant-detail-id": tenantDetailId || "",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
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
    if (!tenantDbName) {
      console.warn("No tenantDbName available, skipping email setups load");
      return;
    }

    try {
      const res = await fetch(`${IMAP_BASE}/email/setup`, {
        headers: {
          "X-Database-Name": tenantDbName,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEmailSetups(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading email setups:", error);
      showStatus("❌ Error loading email setups", "error");
    }
  }

  async function loadImapConfig() {
    if (!tenantDbName) {
      console.warn("No tenantDbName available, skipping IMAP config load");
      return;
    }

    try {
      const res = await fetch(`${IMAP_BASE}/imap/config`, {
        headers: {
          "X-Database-Name": tenantDbName,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setImapConfig(data);
      }
    } catch (error) {
      console.error("Error loading IMAP config:", error);
      showStatus("❌ Error loading IMAP config", "error");
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

    const alias = bankAlias.current?.value.trim() || "";
    const bank_name = bankName;
    const account_holder = bankHolder.current?.value.trim() || "";
    const account_number = bankNumber.current?.value.trim() || "";
    const currency = bankCurrency;
    const account_type = bankType.current?.value.trim() || "";
    const bank_account_type = bankAccountType;

    if (!bank_name || !account_holder || !account_number) {
      showStatus(
        "❌ Please fill Bank Name, Holder Name and Account Number",
        "error"
      );
      return;
    }

    const payload = {
      alias,
      bank_name,
      account_holder,
      account_number,
      currency,
      account_type,
      bank_account_type,
      tenantId: Cookies.get("tenantId"),
    };

    try {
      const token = Cookies.get("session_token");
      const tenantDetailId = Cookies.get("tenantDetailId");
      const res = await fetch(`${API_BASE}/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-tenant-detail-id": tenantDetailId || "",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Create failed");

      const saved = await res.json();

      bankAlias.current!.value = "";
      bankHolder.current!.value = "";
      bankNumber.current!.value = "";
      bankType.current!.value = "";
      setBankName(null);
      setBankCurrency(null);
      setBankAccountType(null);

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
    const bank_name = settingsBankName.current;
    const account_holder = settingsHolder.current.value.trim();
    const currency = settingsCurrency.current;
    const account_type = settingsType.current.value.trim();

    if (!bank_name || !account_holder) {
      showStatus("❌ Bank Name and Holder are required", "error");
      return;
    }

    try {
      const token = Cookies.get("session_token");
      const tenantDetailId = Cookies.get("tenantDetailId");
      await fetch(`${API_BASE}/accounts/${activeAccount}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-tenant-detail-id": tenantDetailId || "",
        },
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
      const token = Cookies.get("session_token");

      if (!token) {
        showStatus("❌ No authentication token", "error");
        return;
      }
      const tenantDetailId = Cookies.get("tenantDetailId");
      const res = await fetch(`${API_BASE}/accounts/${activeAccount}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-tenant-detail-id": tenantDetailId || "",
        },
        credentials: "include",
      }
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        showStatus(
          `❌ ${errorData.error || "Failed to delete account"}`,
          "error"
        );
        return;
      }

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

    if (!tenantDbName) {
      showStatus("❌ Database name not loaded", "error");
      return;
    }

    const email = emailUser.current?.value.trim() || "";
    const pass = emailPass.current?.value.trim() || "";

    if (!email || !pass) {
      showStatus("❌ Email and password required", "error");
      return;
    }

    try {
      const res = await fetch(`${IMAP_BASE}/imap/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Database-Name": tenantDbName,
        },
        body: JSON.stringify({ user: email, password: pass }),
      });

      if (!res.ok) throw new Error("Save error");

      if (emailUser.current) emailUser.current.value = "";
      if (emailPass.current) emailPass.current.value = "";

      await loadImapConfig();
      showStatus("✅ IMAP configuration saved", "success");
    } catch (err) {
      console.error(err);
      showStatus("❌ Error saving IMAP config", "error");
    }
  }

  async function addSetupToEmail(event: any) {
    event.preventDefault();

    if (!tenantDbName) {
      showStatus("❌ Database name not loaded", "error");
      return;
    }

    const tenantId = Cookies.get("tenantId");
    const tenantDetailId = Cookies.get("tenantDetailId");

    const payload = {
      alias: aliasEmail.current?.value.trim() || "",
      bank_name: bankNameEmail.current?.value.trim() || "",
      service_type: serviceTypeEmail.current?.value.trim() || "",
      bank_sender: bankEmailSender.current?.value.trim() || "",
      tenant_id: tenantId,
      tenant_detail_id: tenantDetailId,
      account_id: activeAccount || undefined, // Cuenta activa seleccionada
      db_name: tenantDbName,
    };

    if (!payload.bank_name || !payload.service_type || !payload.bank_sender) {
      showStatus(
        "❌ Please fill Bank Name, Service Type and Bank Sender",
        "error"
      );
      return;
    }

    try {
      const res = await fetch(`${IMAP_BASE}/email/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Database-Name": tenantDbName,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      if (aliasEmail.current) aliasEmail.current.value = "";
      if (bankNameEmail.current) bankNameEmail.current.value = "";
      if (serviceTypeEmail.current) serviceTypeEmail.current.value = "";
      if (bankEmailSender.current) bankEmailSender.current.value = "";

      await loadEmailSetups();
      showStatus("✅ Email setup saved successfully", "success");
    } catch (err) {
      console.error(err);
      showStatus("❌ Error saving email setup", "error");
    }
  }

  async function updateImapConfig(user: string, password: string) {
    if (!tenantDbName) {
      showStatus("❌ Database name not loaded", "error");
      return;
    }

    try {
      const res = await fetch(`${IMAP_BASE}/imap/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Database-Name": tenantDbName,
        },
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
    if (!tenantDbName) {
      showStatus("❌ Database name not loaded", "error");
      return;
    }

    const ok = confirm(
      "Are you sure you want to delete the IMAP configuration?"
    );
    if (!ok) return;

    try {
      const res = await fetch(`${IMAP_BASE}/imap/config`, {
        method: "DELETE",
        headers: {
          "X-Database-Name": tenantDbName,
        },
      });
      if (!res.ok) throw new Error("Delete failed");
      setImapConfig(null);
      showStatus("🗑️ IMAP configuration deleted", "success");
    } catch (err) {
      console.error(err);
      showStatus("❌ Error deleting IMAP config", "error");
    }
  }

  async function updateEmailSetup(id: string, updated: any) {
    if (!tenantDbName) {
      showStatus("❌ Database name not loaded", "error");
      return;
    }

    try {
      const res = await fetch(`${IMAP_BASE}/email/setup/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Database-Name": tenantDbName,
        },
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

  async function deleteEmailSetup(id: string) {
    if (!tenantDbName) {
      showStatus("❌ Database name not loaded", "error");
      return;
    }

    const ok = confirm("Are you sure you want to delete this email setup?");
    if (!ok) return;

    try {
      const res = await fetch(`${IMAP_BASE}/email/setup/${id}`, {
        method: "DELETE",
        headers: {
          "X-Database-Name": tenantDbName,
        },
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
    { id: "forward", label: "Forwarding Setup", icon: Forward },
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
          className={`p-3 rounded text-sm ${statusMessage.includes("✅")
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
              className={`px-4 py-2 flex items-center gap-2 border-b-2 transition ${isActive
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
          setBankName={setBankName}
          bankHolder={bankHolder}
          bankNumber={bankNumber}
          bankAccountType={bankAccountType}
          setBankAccountType={setBankAccountType}
          bankCurrency={bankCurrency}
          setBankCurrency={setBankCurrency}
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
          accounts={accountsState}
          bankNameEmail={bankNameEmail}
          serviceTypeEmail={serviceTypeEmail}
          bankEmailSender={bankEmailSender}
          account={account}
          addEmailConfig={addEmailConfig}
          addSetupToEmail={addSetupToEmail}
          updateImapConfig={updateImapConfig}
          deleteImapConfig={deleteImapConfig}
          updateEmailSetup={updateEmailSetup}
          deleteEmailSetup={deleteEmailSetup}
        />
      )}

      {activeTab === "forward" && (
        <ForwardingTab
          accounts={accountsState}
          showStatus={showStatus}
        />
      )}
    </div>
  );
}