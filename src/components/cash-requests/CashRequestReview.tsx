"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2, Wallet, Calendar, User, Building, ArrowLeft, AlertCircle, 
    ShieldCheck, CheckCircle2, CreditCard, Search, XCircle, PackageCheck, ReceiptText,
    Camera, Sparkles, FileText
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { usePermissions } from "@/hooks/usePermissions";

// Replicando los tipos básicos necesarios (Misma lógica de page.tsx)
type ActionType = "approve" | "authorize" | "pay" | "submit-expense" | "review" | "close" | "reject" | null;

export default function CashRequestReview({ type = "review" }: { type?: string }) {
    const { t } = useI18n();
    const { role } = usePermissions();
    const canAction = role === "superadmin" || role === "admin" || role === "treasurer";
    
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog state
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [currentAction, setCurrentAction] = useState<ActionType>(null);
    const [processingAction, setProcessingAction] = useState(false);

    // Form states
    const [form, setForm] = useState<Record<string, string>>({});
    const [uploadingAI, setUploadingAI] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

    const fetchDetails = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            // Assuming there's a GET route for a single cash-request in the backend. 
            // If not, we might fetch all and filter, but ideally there is /cash-requests/:id
            const res = await fetch(`${API_BASE}/cash-requests`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...(tenantDetailId ? { "x-tenant-detail-id": tenantDetailId } : {}),
                },
                credentials: "include",
            });

            if (!res.ok) throw new Error("Error fetching request details");
            const allRequests = await res.json();
            
            // Asumiendo que la data es un arreglo de todos, filtramos para agarrar el nuestro
            // Nota: Lo ideal es llamar directamente `${API_BASE}/cash-requests/${id}` si el backend lo soporta, 
            // usaremos esa lógica aquí pero si devuelve un array, filtramos:
            const single = Array.isArray(allRequests) 
                ? allRequests.find((r: any) => r._id === id) 
                : allRequests;

            if (!single) throw new Error("Cash Request no encontrado");
            setData(single);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error cargando la solicitud");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, API_BASE]);

    const openActionDialog = (action: ActionType) => {
        setCurrentAction(action);
        setForm({
            totalSpent: data?.total_spent != null ? String(data.total_spent) : "",
            files: data?.expense_files?.join(", ") ?? "",
            notes: data?.notes ?? "",
            authorizedAmount: data?.authorized_amount != null ? String(data.authorized_amount) : "",
            expensePeriodDays: data?.expense_period_days != null ? String(data.expense_period_days) : "7",
        });
        setActionDialogOpen(true);
    };

    const submitAction = async () => {
        if (!data || !currentAction) return;
        setProcessingAction(true);
        setError(null);

        let body: Record<string, unknown> = {};
        const path = `/cash-requests/${id}/${currentAction}`;

        try {
            switch (currentAction) {
                case "approve":
                    body = { notes: form.notes }; break;
                case "authorize":
                    if (!form.authorizedAmount) throw new Error("El monto autorizado es requerido.");
                    body = {
                        authorizedAmount: Number(form.authorizedAmount),
                        expensePeriodDays: Number(form.expensePeriodDays ?? 7),
                        notes: form.notes,
                    }; break;
                case "pay":
                    body = { paymentProof: form.paymentProof, notes: form.notes }; break;
                case "submit-expense": {
                    const ts = form.totalSpent || (data.total_spent != null ? String(data.total_spent) : "");
                    if (!ts) throw new Error("Total gastado es requerido.");
                    body = {
                        totalSpent: Number(ts),
                        files: form.files ? form.files.split(",").map(f => f.trim()).filter(Boolean) : (data.expense_files || []),
                        notes: form.notes,
                    }; break;
                }
                case "review": {
                    const ts = form.totalSpent || (data.total_spent != null ? String(data.total_spent) : "");
                    if (!ts) throw new Error("Total gastado es requerido.");
                    body = { totalSpent: Number(ts), notes: form.notes }; break;
                }
                case "close":
                    body = { proof: form.proof, notes: form.notes }; break;
                case "reject":
                    if (!form.reason) throw new Error("Motivo es requerido.");
                    body = { reason: form.reason }; break;
            }

            const token = Cookies.get("session_token");
            const res = await fetch(`${API_BASE}${path}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Error ejecutando: ${currentAction}`);
            }

            toast.success(`Acción realizada con éxito.`);
            setActionDialogOpen(false);
            fetchDetails(); // Recargar los detalles
            
        } catch (err: any) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setProcessingAction(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!data) return;
        setProcessingAction(true);
        try {
            const token = Cookies.get("session_token");
            const res = await fetch(`${API_BASE}/cash-requests/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
                body: JSON.stringify({ 
                    status: "expense_draft",
                    total_spent: form.totalSpent ? Number(form.totalSpent) : data.total_spent,
                    expense_files: form.files ? form.files.split(",").map(f => f.trim()).filter(Boolean) : data.expense_files,
                    notes: form.notes || data.notes
                }),
            });

            if (!res.ok) throw new Error("Error al guardar borrador");
            
            toast.success("Borrador guardado");
            setActionDialogOpen(false);
            fetchDetails();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setProcessingAction(false);
        }
    };

    const f = (key: string, v: string) => setForm(prev => ({ ...prev, [key]: v }));

    const handleAIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        setUploadingAI(true);
        
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("method", "n8n");

            const token = Cookies.get("session_token");
            const res = await fetch(`${API_BASE}/cash-requests/${id}/add-expense-ai`, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Error al analizar el comprobante");
            }

            const result = await res.json();
            console.log("AI result:", result);
            toast.success("Comprobante analizado y guardado con éxito.");
            fetchDetails(); // Recargar datos
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Error al procesar el archivo");
        } finally {
            setUploadingAI(false);
            if (e.target) e.target.value = "";
        }
    };

    const removeExpenseItem = async (index: number) => {
        if (!data || !data.expense_items) return;
        try {
            const newItems = [...data.expense_items];
            const newFiles = [...(data.expense_files || [])];

            newItems.splice(index, 1);
            if (newFiles.length > index) {
                newFiles.splice(index, 1);
            }
            
            const newTotal = newItems.reduce((sum: number, it: any) => sum + (it.amount || 0), 0);

            const token = Cookies.get("session_token");
            const res = await fetch(`${API_BASE}/cash-requests/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
                body: JSON.stringify({ 
                    expense_items: newItems,
                    expense_files: newFiles,
                    total_spent: newTotal
                }),
            });

            if (!res.ok) throw new Error("Error al eliminar el item");
            
            toast.success("Item eliminado correctamente");
            fetchDetails();
        } catch (err: any) {
            toast.error(err.message || "Error al eliminar");
        }
    };

    const renderActionButtons = () => {
        if (!data) return null;

        const availableActions = [];
        const isTreasurer = role === "treasurer";

        if (data.status === "created" && !isTreasurer) availableActions.push({ label: t("CashRequests.actions.approve"), action: "approve" as ActionType, variant: "default", icon: CheckCircle2, className: "bg-emerald-600 hover:bg-emerald-700 text-white" });
        if (data.status === "approved" && canAction) availableActions.push({ label: t("CashRequests.actions.authorize"), action: "authorize" as ActionType, variant: "default", icon: ShieldCheck, className: "bg-violet-600 hover:bg-violet-700 text-white" });
        if (data.status === "authorized" && canAction) availableActions.push({ label: t("CashRequests.actions.pay"), action: "pay" as ActionType, variant: "default", icon: CreditCard, className: "bg-teal-600 hover:bg-teal-700 text-white" });
        if (["paid", "expense_draft"].includes(data.status)) availableActions.push({ label: t("CashRequests.actions.submitExpense"), action: "submit-expense" as ActionType, variant: "default", icon: ReceiptText, className: "bg-indigo-600 hover:bg-indigo-700 text-white" });
        if (data.status === "submitted" && canAction) availableActions.push({ label: t("CashRequests.actions.review"), action: "review" as ActionType, variant: "default", icon: Search, className: "bg-amber-600 hover:bg-amber-700 text-white" });
        if (["reimbursement", "refund"].includes(data.status) && canAction) availableActions.push({ label: t("CashRequests.actions.close"), action: "close" as ActionType, variant: "default", icon: PackageCheck, className: "bg-green-600 hover:bg-green-700 text-white" });

        const canReject = !["closed", "rejected", "paid"].includes(data.status) && (canAction || data.created_by === role); // simplification

        return (
            <div className="flex gap-2">
                {canReject && (
                    <Button onClick={() => openActionDialog("reject")} variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2">
                        <XCircle className="h-4 w-4" /> {t("CashRequests.actions.reject")}
                    </Button>
                )}
                {availableActions.map(({ label, action, className, icon: Icon }) => (
                    <Button key={action} onClick={() => openActionDialog(action)} className={cn("gap-2", className)}>
                        <Icon className="h-4 w-4" /> {label}
                    </Button>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">{t("CashRequests.dialogs.detail.title") + "..."}</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-destructive/10 p-6 rounded-full mb-4">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Algo salió mal</h1>
                <p className="text-muted-foreground mb-6">{error || "No encontrado"}</p>
                <Button onClick={() => router.push("/cash-requests")} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
            </div>
        );
    }

    const projectName = data.project_id && typeof data.project_id === "object" ? data.project_id.name : String(data.project_id ?? "—");
    const createdByName = data.created_by ? (typeof data.created_by === "object" ? data.created_by.name || data.created_by.email : String(data.created_by)) : "—";
    const beneficiaryName = data.beneficiary_id ? (typeof data.beneficiary_id === "object" ? data.beneficiary_id.name || data.beneficiary_id.email : String(data.beneficiary_id)) : createdByName;

    // Calcular balance localmente para evitar errores de undefined
    const balance = (data.total_spent ?? 0) - (data.authorized_amount ?? 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-muted/50 py-8">
            <div className="container max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="h-10 w-10 rounded-full p-0 shrink-0 hover:bg-muted" onClick={() => router.push("/cash-requests")}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight">{t("CashRequests.dialogs.detail.title")}</h1>
                                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20 capitalize">
                                    <Wallet className="h-3 w-3" /> Cash Request
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                <span>{t("CashRequests.dialogs.detail.created")} {data.createdAt ? format(new Date(data.createdAt), "PPP", { locale: es }) : "—"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`px-4 py-1.5 text-sm font-medium border uppercase bg-muted/50`}>
                            <span className="font-mono px-2 py-0.5 rounded text-sm mr-2 opacity-70">#{id.slice(-6)}</span>
                            {t(`CashRequests.status.${data.status}`) || data.status?.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Balance Preview Primario (Solo si hay gasto) */}
                        {data.total_spent != null && data.authorized_amount > 0 && (
                            <div className={cn(
                                "rounded-2xl p-6 border shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6",
                                data.balance === 0 
                                    ? "bg-emerald-50/40 border-emerald-100" 
                                    : data.balance > 0 
                                        ? "bg-orange-50/40 border-orange-100"
                                        : "bg-rose-50/40 border-rose-100"
                            )}>
                                <div className="space-y-1 text-center sm:text-left">
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Estado de Liquidación</p>
                                    <h2 className={cn(
                                        "text-xl font-black",
                                        balance === 0 ? "text-emerald-700" : balance > 0 ? "text-orange-700" : "text-rose-700"
                                    )}>
                                        {balance === 0
                                            ? t("CashRequests.dialogs.action.balance.zero")
                                            : balance > 0
                                                ? t("CashRequests.dialogs.action.balance.reimbursement")
                                                : t("CashRequests.dialogs.action.balance.refund")}
                                    </h2>
                                    <p className="text-xs text-muted-foreground italic max-w-[280px]">
                                        {balance === 0 
                                            ? "Los gastos coinciden exactamente con el presupuesto." 
                                            : balance > 0 
                                                ? "La empresa debe pagar la diferencia al empleado."
                                                : "El empleado debe devolver el excedente a la empresa."}
                                    </p>
                                </div>
                                <div className="text-center sm:text-right shrink-0">
                                    <p className={cn(
                                        "text-4xl font-black tabular-nums tracking-tighter",
                                        balance === 0 ? "text-emerald-600" : balance > 0 ? "text-orange-600" : "text-rose-600"
                                    )}>
                                        {balance > 0 ? "+" : ""}{balance.toFixed(2)}
                                        <span className="text-lg ml-1 opacity-70 font-bold">{data.currency}</span>
                                    </p>
                                    <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tight justify-center sm:justify-end">
                                        <span>Presupuesto: {data.authorized_amount.toLocaleString()}</span>
                                        <span>Gastado: {data.total_spent.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rendición de Gastos Progresiva */}
                        {["paid", "expense_draft", "submitted", "under_review", "reimbursement", "refund", "closed"].includes(data.status) && (
                            <Card className="shadow-md border-indigo-100 dark:border-indigo-900/30 overflow-hidden bg-gradient-to-b from-white to-indigo-50/20 dark:from-background dark:to-indigo-950/5">
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                            <ReceiptText className="h-5 w-5" />
                                            Rendición de Gastos
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">Sube tus comprobantes y deja que la IA haga el trabajo</p>
                                    </div>
                                    {["paid", "expense_draft"].includes(data.status) && (
                                        <div className="relative">
                                            <Input 
                                                type="file" 
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                                onChange={handleAIUpload}
                                                accept="image/*,application/pdf"
                                                disabled={uploadingAI}
                                            />
                                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 relative z-0">
                                                {uploadingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                                Cargar con IA
                                            </Button>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!data.expense_items?.length && (
                                        <div className="text-center py-10 px-4 border-2 border-dashed border-indigo-100 dark:border-indigo-900/20 rounded-xl bg-white/50 dark:bg-black/10">
                                            <div className="bg-indigo-100 dark:bg-indigo-900/30 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Camera className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <h3 className="text-sm font-semibold">No hay gastos registrados</h3>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                                                Haz clic en &quot;Cargar con IA&quot; para subir tu primera boleta o factura.
                                            </p>
                                        </div>
                                    )}

                                    {data.expense_items?.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 gap-2">
                                                {data.expense_items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-muted/20 hover:border-indigo-200 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                                                                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold truncate max-w-[150px] sm:max-w-xs">{item.issuer_name || "Comprobante"}</p>
                                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {item.date ? format(new Date(item.date), "dd/MM/yyyy") : "—"}
                                                                    {item.tax_id && ` • RUC: ${item.tax_id}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">
                                                                {item.amount?.toLocaleString()} {item.currency}
                                                            </p>
                                                            {["paid", "expense_draft"].includes(data.status) && (
                                                                <button 
                                                                    onClick={() => removeExpenseItem(idx)}
                                                                    className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-black hover:bg-red-700 active:scale-95 transition-all"
                                                                >
                                                                    ELIMINAR
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-2 border-t border-indigo-100 dark:border-indigo-900/30">
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-medium text-muted-foreground">Total Acumulado</p>
                                                    <p className="text-xl font-black text-indigo-800 dark:text-indigo-300">
                                                        {data.total_spent?.toLocaleString()} {data.currency}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Presupuesto</p>
                                                    <p className="text-xs font-semibold">
                                                        {data.authorized_amount?.toLocaleString()} {data.currency}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            {data.authorized_amount > 0 && (
                                                <div className="h-2 w-full bg-indigo-100 dark:bg-indigo-950/40 rounded-full overflow-hidden">
                                                    <div 
                                                        className={cn(
                                                            "h-full transition-all duration-500",
                                                            (data.total_spent / data.authorized_amount) > 1 ? "bg-red-500" : "bg-indigo-500"
                                                        )}
                                                        style={{ width: `${Math.min((data.total_spent / data.authorized_amount) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Nueva Galería Visual de Comprobantes */}
                                    {(data.expense_files?.length ?? 0) > 0 && (
                                        <div className="pt-4 border-t mt-4">
                                            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                                                <Camera className="h-3.5 w-3.5" /> Evidencias Visuales ({data.expense_files?.length ?? 0})
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                {data.expense_files.map((url: string, idx: number) => {
                                                    const apiRoot = API_BASE.replace(/\/api\/?$/, "");
                                                    const path = url.startsWith("/api/files") ? url : `/api/files/${url.startsWith("/") ? url.substring(1) : url}`;
                                                    const fullUrl = url.startsWith("http") ? url : `${apiRoot}${path}`;
                                                    return (
                                                        <a 
                                                            key={idx} 
                                                            href={fullUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="h-20 w-20 rounded-xl overflow-hidden border-2 border-muted hover:border-indigo-400 transition-all shadow-sm group"
                                                        >
                                                            <img src={fullUrl} alt={`Evidencia ${idx+1}`} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                {["paid", "expense_draft"].includes(data.status) && (
                                    <CardFooter className="bg-indigo-50/50 dark:bg-indigo-950/10 border-t border-indigo-100 dark:border-indigo-900/20 py-3">
                                        <Button
                                            onClick={() => openActionDialog("submit-expense")}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-10"
                                            disabled={!data.expense_items?.length && !data.expense_files?.length}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            {t("CashRequests.actions.submitExpense")}
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        )}

                        {/* Project & Beneficiary */}
                        <Card className="shadow-sm border-muted-foreground/20">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Building className="h-5 w-5 text-primary" />
                                    Detalle General
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t("CashRequests.dialogs.detail.project")}</p>
                                        <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                                            <p className="font-semibold text-sm sm:text-base">{projectName}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t("CashRequests.dialogs.detail.beneficiary")}</p>
                                        <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                                            <p className="font-semibold text-sm sm:text-base">{beneficiaryName}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t("CashRequests.dialogs.detail.purpose")}</p>
                                        <div className="p-3 bg-muted/40 rounded-lg border border-border/50 font-medium text-sm">
                                            {data.purpose}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financial Details */}
                        <Card className="shadow-sm border-muted-foreground/20 overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-primary" />
                                    Finanzas y Liquidación
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 grid gap-6">
                                <div className="grid grid-cols-2 gap-4 pb-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t("CashRequests.dialogs.detail.requestedAmount")}</p>
                                        <p className="text-xl font-bold">{data.requested_amount?.toLocaleString()}&nbsp;{data.currency}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t("CashRequests.dialogs.detail.authorizedAmount")}</p>
                                        <p className={cn("text-xl font-bold", data.authorized_amount ? "text-primary" : "text-muted-foreground")}>
                                            {data.authorized_amount ? `${data.authorized_amount.toLocaleString()} ${data.currency}` : "—"}
                                        </p>
                                    </div>
                                </div>

                                {data.total_spent != null && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Rendición de Gastos Enviada</p>
                                                <p className="text-xl font-bold text-amber-600">
                                                    {data.total_spent.toLocaleString()}&nbsp;{data.currency}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Balance Card Estilizado */}
                                        <div className={cn(
                                            "rounded-xl px-4 py-3 border space-y-2",
                                            balance === 0 
                                                ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30" 
                                                : balance > 0 
                                                    ? "bg-orange-50/50 border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/30"
                                                    : "bg-rose-50/50 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30"
                                        )}>
                                            <p className={cn(
                                                "font-bold text-[10px] uppercase tracking-wider",
                                                balance === 0 ? "text-emerald-600" : balance > 0 ? "text-orange-600" : "text-rose-600"
                                            )}>
                                                {t("CashRequests.dialogs.action.balance.title")}
                                            </p>
                                            
                                            <div className="flex justify-between items-center text-xs">
                                                <p className="font-medium text-muted-foreground">
                                                    {balance === 0
                                                        ? t("CashRequests.dialogs.action.balance.zero")
                                                        : balance > 0
                                                            ? t("CashRequests.dialogs.action.balance.reimbursement")
                                                            : t("CashRequests.dialogs.action.balance.refund")}
                                                </p>
                                                <p className={cn(
                                                    "font-black text-lg",
                                                    balance === 0 ? "text-emerald-700" : balance > 0 ? "text-orange-700" : "text-rose-700"
                                                )}>
                                                    {balance === 0 ? "" : balance > 0 ? "+" : ""}{balance.toLocaleString()} {data.currency}
                                                </p>
                                            </div>
                                            
                                            {balance !== 0 && (
                                                <p className="text-[10px] text-muted-foreground italic text-right">
                                                    ({balance > 0 ? t("CashRequests.dialogs.detail.companyOwes") : t("CashRequests.dialogs.detail.employeeRefunds")})
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <Separator />
                            </CardContent>
                            <CardFooter className="flex mt-2 pb-6 justify-end">
                                {renderActionButtons()}
                            </CardFooter>
                        </Card>

                    </div>

                    {/* Sidebar / Meta Details */}
                    <div className="space-y-6">
                        <Card className="shadow-sm border-muted-foreground/20 h-full">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    Información Adicional
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-3">
                                    {data.expense_period_days && (
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Plazo de Rendición</p>
                                                <p className="text-sm text-foreground">{data.expense_period_days} días</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-3">
                                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Autor original</p>
                                            <p className="text-sm text-foreground break-all">{createdByName}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Descripción / Notas Adicionales</p>
                                    <div className="bg-muted/20 p-4 rounded-xl border border-border/40">
                                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                            {data.notes || "Sin notas adicionales reportadas."}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Dialog de Acciones */}
                <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="capitalize">Ejecutar Acción</DialogTitle>
                            <DialogDescription>
                                Complete los campos requeridos para cambiar el estado.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {currentAction === "authorize" && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Monto Autorizado *</Label>
                                        <Input type="number" min="0" step="0.01" value={form.authorizedAmount ?? ""}
                                            onChange={e => f("authorizedAmount", e.target.value)} placeholder={String(data.requested_amount)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Días para presentar gastos</Label>
                                        <Input type="number" min="1" max="90" value={form.expensePeriodDays ?? "7"}
                                            onChange={e => f("expensePeriodDays", e.target.value)} />
                                    </div>
                                </>
                            )}

                            {currentAction === "pay" && (
                                <div className="space-y-2">
                                    <Label>Comprobante de desembolso</Label>
                                    <Input value={form.paymentProof ?? ""} onChange={e => f("paymentProof", e.target.value)}
                                        placeholder="Nro operación, cheque…" />
                                </div>
                            )}

                            {currentAction === "submit-expense" && (
                                <>
                                    <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-4 mb-4 border border-indigo-100 dark:border-indigo-900/20">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium">Gastos acumulados ({data.expense_items?.length || 0})</span>
                                            <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                                                {data.total_spent?.toLocaleString()} {data.currency}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Al confirmar, se cerrará el borrador y se enviará la rendición para revisión del SuperAdmin.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Total Final a Reportar *</Label>
                                        <Input 
                                            type="number" 
                                            min="0" 
                                            step="0.01" 
                                            value={form.totalSpent ?? data.total_spent ?? ""} 
                                            readOnly
                                            className="bg-muted/30 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Archivos / Evidencias (Editables)</Label>
                                        <Textarea 
                                            value={form.files ?? data.expense_files?.join(", ") ?? ""} 
                                            onChange={e => f("files", e.target.value)} 
                                            placeholder="URLs adicionales separadas por coma..." 
                                        />
                                    </div>
                                </>
                            )}

                            {currentAction === "review" && (
                                <div className="space-y-2">
                                    <Label>Total Gastado (Modificar si aplica) *</Label>
                                    <Input 
                                        type="number" 
                                        min="0" 
                                        step="0.01" 
                                        value={form.totalSpent ?? data.total_spent ?? ""} 
                                        onChange={e => f("totalSpent", e.target.value)}
                                        className="font-bold"
                                    />
                                </div>
                            )}

                            {currentAction === "close" && (
                                <div className="space-y-2">
                                    <Label>Comprobante de Liquidación / Devolución</Label>
                                    <Input value={form.proof ?? ""} onChange={e => f("proof", e.target.value)} placeholder="Nro operación…" />
                                </div>
                            )}

                            {currentAction === "reject" && (
                                <div className="space-y-2">
                                    <Label>Motivo del rechazo *</Label>
                                    <Textarea value={form.reason ?? ""} onChange={e => f("reason", e.target.value)} required />
                                </div>
                            )}

                            {currentAction !== "reject" && (
                                <div className="space-y-2">
                                    <Label>Notas Generales (opcional)</Label>
                                    <Textarea value={form.notes ?? ""} onChange={e => f("notes", e.target.value)} />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>{t("Common.cancel")}</Button>
                            {currentAction === "submit-expense" && (
                                <Button 
                                    variant="secondary" 
                                    onClick={handleSaveDraft}
                                    disabled={processingAction}
                                >
                                    {t("CashRequests.dialogs.action.buttons.saveDraft")}
                                </Button>
                            )}
                            <Button
                                onClick={submitAction}
                                disabled={processingAction}
                                className={currentAction === 'reject' ? "bg-red-600 hover:bg-red-700 text-white" : "bg-primary"}
                            >
                                {processingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {currentAction === "submit-expense" ? t("CashRequests.actions.submitExpense") : `Confirmar ${currentAction}`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
