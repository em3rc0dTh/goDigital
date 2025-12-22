import { useState, useEffect } from "react";
import { Plus, Trash2, Mail, Save, Power, RefreshCw, AlertCircle } from "lucide-react";
import Cookies from "js-cookie";

interface ForwardingRule {
    email: string;
    accounts: string[];
}

interface ForwardingConfig {
    id: string;
    entityId: string;
    forwardingData: ForwardingRule[];
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface ForwardingTabProps {
    accounts: any[];
    showStatus: (message: string, type?: "success" | "error" | "warning") => void;
}

export function ForwardingTab({ accounts, showStatus }: ForwardingTabProps) {
    const [forwardingRules, setForwardingRules] = useState<ForwardingRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [configExists, setConfigExists] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [configId, setConfigId] = useState<string>("");
    const API_BASE =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";
    useEffect(() => {
        loadForwardingConfig();
    }, []);

    async function loadForwardingConfig() {
        try {
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            if (!tenantDetailId) {
                console.warn("No tenantDetailId found");
                return;
            }

            const res = await fetch(`${API_BASE}/gmail/${tenantDetailId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (res.ok) {
                const data = await res.json();
                if (data.config) {
                    setConfigExists(true);
                    setConfigId(data.config.id);
                    setIsActive(data.config.active);

                    if (data.config.forwardingData && Array.isArray(data.config.forwardingData)) {
                        setForwardingRules(
                            data.config.forwardingData.map((rule: any) => ({
                                email: rule.email,
                                accounts: rule.accounts.map((acc: any) => acc.toString()),
                            }))
                        );
                    }
                }
            } else if (res.status === 404) {
                setConfigExists(false);
                setForwardingRules([]);
            }
        } catch (error) {
            console.error("Error loading forwarding config:", error);
            showStatus("⚠️ Error loading forwarding configuration", "warning");
        }
    }

    async function saveForwardingConfig() {
        try {
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            if (!tenantDetailId) {
                showStatus("❌ No tenant detail ID found", "error");
                return;
            }

            // Validar que todas las reglas tengan email y al menos una cuenta
            const invalidRules = forwardingRules.filter(
                (rule) => !rule.email.trim() || rule.accounts.length === 0
            );

            if (invalidRules.length > 0) {
                showStatus(
                    "❌ All rules must have an email and at least one account",
                    "error"
                );
                return;
            }

            setLoading(true);

            const res = await fetch(`${API_BASE}/gmail/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
                body: JSON.stringify({
                    entityId: tenantDetailId,
                    forwardingData: forwardingRules.map((rule) => ({
                        email: rule.email.toLowerCase().trim(),
                        accounts: rule.accounts,
                    })),
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save");
            }

            const result = await res.json();
            setConfigId(result.config.id);
            setIsActive(result.config.active);
            setConfigExists(true);

            showStatus("✅ Forwarding configuration saved successfully", "success");
            await loadForwardingConfig();
        } catch (error: any) {
            console.error("Error saving forwarding config:", error);
            showStatus(
                `❌ Error saving configuration: ${error.message}`,
                "error"
            );
        } finally {
            setLoading(false);
        }
    }

    async function toggleActiveStatus() {
        try {
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            if (!tenantDetailId) {
                showStatus("❌ No tenant detail ID found", "error");
                return;
            }

            setLoading(true);

            const res = await fetch(
                `${API_BASE}/gmail/${tenantDetailId}/toggle`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: "include",
                }
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to toggle status");
            }

            const result = await res.json();
            setIsActive(result.active);
            showStatus(
                `✅ Configuration ${result.active ? "activated" : "deactivated"}`,
                "success"
            );
        } catch (error: any) {
            console.error("Error toggling config:", error);
            showStatus(`❌ Error: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    }

    async function deleteConfiguration() {
        try {
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            if (!tenantDetailId) {
                showStatus("❌ No tenant detail ID found", "error");
                return;
            }

            const confirmed = confirm(
                "Are you sure you want to delete this forwarding configuration? This action cannot be undone."
            );

            if (!confirmed) return;

            setLoading(true);

            const res = await fetch(
                `${API_BASE}/gmail/${tenantDetailId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: "include",
                }
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete");
            }

            setConfigExists(false);
            setForwardingRules([]);
            setIsActive(false);
            setConfigId("");
            showStatus("🗑️ Configuration deleted successfully", "success");
        } catch (error: any) {
            console.error("Error deleting config:", error);
            showStatus(`❌ Error: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    }

    function addRule() {
        setForwardingRules([...forwardingRules, { email: "", accounts: [] }]);
    }

    function removeRule(index: number) {
        setForwardingRules(forwardingRules.filter((_, i) => i !== index));
    }

    function updateRuleEmail(index: number, email: string) {
        const updated = [...forwardingRules];
        updated[index].email = email;
        setForwardingRules(updated);
    }

    function toggleAccount(ruleIndex: number, accountId: string) {
        const updated = [...forwardingRules];
        const rule = updated[ruleIndex];

        if (rule.accounts.includes(accountId)) {
            rule.accounts = rule.accounts.filter((id) => id !== accountId);
        } else {
            rule.accounts.push(accountId);
        }

        setForwardingRules(updated);
    }

    return (
        <div className="space-y-6">
            {/* Header con información */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-blue-900">Email Forwarding Rules</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Configure which email addresses should forward transactions to specific bank accounts.
                                Each rule maps an email address to one or more accounts.
                            </p>
                        </div>
                    </div>

                    {configExists && (
                        <div className="flex items-center gap-2 ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                                }`}>
                                {isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Controles principales */}
            {configExists && (
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={toggleActiveStatus}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg inline-flex items-center gap-2 transition ${isActive
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Power className="w-4 h-4" />
                        {isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                        onClick={loadForwardingConfig}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>

                    <button
                        onClick={deleteConfiguration}
                        disabled={loading}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Config
                    </button>
                </div>
            )}

            {/* Reglas de forwarding */}
            <div className="space-y-4">
                {forwardingRules.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">No forwarding rules configured</p>
                        <button
                            onClick={addRule}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add First Rule
                        </button>
                    </div>
                ) : (
                    forwardingRules.map((rule, index) => (
                        <div
                            key={index}
                            className="border rounded-lg p-4 bg-white shadow-sm space-y-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={rule.email}
                                        onChange={(e) => updateRuleEmail(index, e.target.value)}
                                        placeholder="notifications@bank.com"
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {rule.email && !rule.email.includes("@") && (
                                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Please enter a valid email address
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeRule(index)}
                                    className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Remove rule"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Forward to Accounts ({rule.accounts.length} selected)
                                </label>
                                {rule.accounts.length === 0 && (
                                    <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        At least one account must be selected
                                    </p>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg border">
                                    {accounts.length === 0 ? (
                                        <p className="text-sm text-gray-500 col-span-2 text-center py-4">
                                            No accounts available. Create accounts first in the Accounts tab.
                                        </p>
                                    ) : (
                                        accounts.map((account) => (
                                            <label
                                                key={account.id}
                                                className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition border border-transparent hover:border-blue-200"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={rule.accounts.includes(account.id)}
                                                    onChange={() => toggleAccount(index, account.id)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-sm flex-1">
                                                    <span className="font-medium">{account.bank_name}</span>
                                                    {account.alias && (
                                                        <span className="text-gray-500"> ({account.alias})</span>
                                                    )}
                                                    <span className="text-gray-400 text-xs block">
                                                        {account.account_number}
                                                    </span>
                                                </span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Botones de acción */}
            {forwardingRules.length > 0 && (
                <div className="flex gap-3 pt-4 border-t">
                    <button
                        onClick={addRule}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Another Rule
                    </button>
                    <button
                        onClick={saveForwardingConfig}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? "Saving..." : configExists ? "Update Configuration" : "Save Configuration"}
                    </button>
                </div>
            )}
        </div>
    );
}