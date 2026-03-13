"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Loader2, Plus, Search, Eye, Wallet, CheckCircle2, ShieldCheck,
    Filter, RefreshCw, FileUp,
    ChevronLeft, ChevronRight, AlertTriangle,
    RotateCcw, ArrowLeftRight, CreditCard,
    XCircle, ReceiptText, PackageCheck,
    Calendar, FileText, Sparkles, Camera, Building
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

// ── Types ──────────────────────────────────────────────────────────────────────

type CRStatus =
    | "created" | "approved" | "authorized" | "paid"
    | "expense_draft" | "submitted" | "under_review"
    | "closed" | "rejected" | "reimbursement" | "refund";

interface CashRequest {
    _id: string;
    project_id: { _id: string; name: string } | string;
    created_by?: { _id: string; name: string; email: string } | string;
    beneficiary_id?: { _id: string; name: string; email: string } | string;
    requested_amount: number;
    authorized_amount?: number;
    currency: string;
    purpose: string;
    notes?: string;
    status: CRStatus;
    expense_period_days?: number;
    total_spent?: number;
    balance?: number;
    expense_files?: string[];
    expense_items?: any[];
    createdAt: string;
}

interface Project { _id: string; name: string; }

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<CRStatus, { label: string; icon: React.ElementType; variant: string }> = {
    created: { label: "Created", icon: Wallet, variant: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
    approved: { label: "Approved", icon: CheckCircle2, variant: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
    authorized: { label: "Authorized", icon: ShieldCheck, variant: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
    paid: { label: "Disbursed", icon: CreditCard, variant: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" },
    expense_draft: { label: "Expense Draft", icon: ReceiptText, variant: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300" },
    submitted: { label: "Submitted", icon: ReceiptText, variant: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" },
    under_review: { label: "Under Review", icon: Search, variant: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
    closed: { label: "Closed", icon: PackageCheck, variant: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
    rejected: { label: "Rejected", icon: XCircle, variant: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
    reimbursement: { label: "Reimbursement", icon: ArrowLeftRight, variant: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
    refund: { label: "Refund", icon: RotateCcw, variant: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" },
};

function SearchIcon({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
}

function StatusBadge({ status }: { status: CRStatus }) {
    const { t } = useI18n();
    const cfg = STATUS_CFG[status] ?? STATUS_CFG.created;
    const Icon = cfg.icon;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", cfg.variant)}>
            <Icon className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">{t(`CashRequests.status.${status}`)}</span>
            <span className="sm:hidden">{cfg.label}</span>
        </span>
    );
}

// ── API helper ─────────────────────────────────────────────────────────────────

function useApi() {
    const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
    const token = Cookies.get("token");
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const opts = { headers, credentials: "include" as const };

    const get = (path: string) => fetch(`${base}${path}`, { ...opts }).then(r => r.json());
    const post = (path: string, body: unknown) =>
        fetch(`${base}${path}`, { ...opts, method: "POST", body: JSON.stringify(body) }).then(r => r.json());
    const put = (path: string, body: unknown) =>
        fetch(`${base}${path}`, { ...opts, method: "PUT", body: JSON.stringify(body) }).then(r => r.json());
    const del = (path: string) =>
        fetch(`${base}${path}`, { ...opts, method: "DELETE" }).then(r => r.json());

    return { get, post, put, del };
}

// ── New Cash Request dialog ────────────────────────────────────────────────────

function NewCashRequestDialog({
    open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: () => void }) {
    const { t } = useI18n();
    const api = useApi();
    const [projects, setProjects] = useState<Project[]>([]);
    const [form, setForm] = useState({
        project_id: "", requested_amount: "", currency: "PEN", purpose: "", notes: "", beneficiary_email: "",
    });
    const [otherBeneficiary, setOtherBeneficiary] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) api.get("/projects").then(d => setProjects(Array.isArray(d) ? d : []));
    }, [open]);

    const resetForm = () => {
        setForm({ project_id: "", requested_amount: "", currency: "PEN", purpose: "", notes: "", beneficiary_email: "" });
        setOtherBeneficiary(false);
        setError("");
    };

    const handleClose = () => { resetForm(); onClose(); };

    const handleSubmit = async () => {
        setError("");
        if (!form.project_id || !form.requested_amount || !form.purpose) {
            setError(t("CashRequests.dialogs.new.errors.required"));
            return;
        }
        if (otherBeneficiary && !form.beneficiary_email) {
            setError(t("CashRequests.dialogs.new.errors.beneficiaryEmail"));
            return;
        }
        setLoading(true);
        const res = await api.post("/cash-requests", {
            project_id: form.project_id,
            requested_amount: Number(form.requested_amount),
            currency: form.currency,
            purpose: form.purpose,
            notes: form.notes || undefined,
            beneficiary_email: otherBeneficiary ? form.beneficiary_email : undefined,
        });
        setLoading(false);
        if (res._id) { resetForm(); onCreated(); onClose(); }
        else setError(res.error ?? t("CashRequests.dialogs.new.errors.createError"));
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && handleClose()}>
            <DialogContent className="w-[95vw] max-w-lg max-h-[95dvh] overflow-hidden flex flex-col rounded-2xl p-0 gap-0">
                <DialogHeader className="shrink-0 px-5 pt-5 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Wallet className="h-5 w-5 text-primary shrink-0" />
                        {t("CashRequests.dialogs.new.title")}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 p-5 overflow-y-auto flex-1 min-h-0">
                    {error && (
                        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{error}</span>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{t("CashRequests.dialogs.new.project")}</Label>
                        <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                            <SelectTrigger className="h-10"><SelectValue placeholder={t("CashRequests.dialogs.new.selectProject")} /></SelectTrigger>
                            <SelectContent>
                                {projects.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">{t("CashRequests.dialogs.new.requestedAmount")}</Label>
                            <Input type="number" min="0" step="0.01" value={form.requested_amount}
                                onChange={e => setForm(f => ({ ...f, requested_amount: e.target.value }))}
                                placeholder="500.00" className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">{t("CashRequests.dialogs.new.currency")}</Label>
                            <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PEN">PEN</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{t("CashRequests.dialogs.new.purpose")}</Label>
                        <Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                            placeholder={t("CashRequests.dialogs.new.purposePlaceholder")} className="h-10" />
                    </div>

                    <div className="flex items-center gap-2.5 py-1">
                        <input type="checkbox" id="otherBeneficiary" checked={otherBeneficiary}
                            onChange={e => setOtherBeneficiary(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 shrink-0" />
                        <Label htmlFor="otherBeneficiary" className="cursor-pointer font-normal text-sm leading-tight">
                            {t("CashRequests.dialogs.new.otherBeneficiary")}
                        </Label>
                    </div>

                    {otherBeneficiary && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-sm font-medium">{t("CashRequests.dialogs.new.beneficiaryEmail")}</Label>
                            <Input type="email" value={form.beneficiary_email}
                                onChange={e => setForm(f => ({ ...f, beneficiary_email: e.target.value }))}
                                placeholder="usuario@empresa.com" className="h-10" />
                            <p className="text-xs text-muted-foreground">{t("CashRequests.dialogs.new.beneficiaryEmailDesc")}</p>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{t("CashRequests.dialogs.new.notes")}</Label>
                        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder={t("CashRequests.dialogs.new.notesPlaceholder")}
                            className="min-h-[80px] resize-none" />
                    </div>
                </div>

                <DialogFooter className="shrink-0 px-5 py-4 border-t bg-muted/20">
                    <div className="flex w-full gap-2">
                        <Button variant="outline" className="flex-1" onClick={handleClose}>{t("CashRequests.dialogs.new.cancel")}</Button>
                        <Button onClick={handleSubmit} disabled={loading} className="gap-2 flex-1">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
                            {t("CashRequests.dialogs.new.create")}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Action dialog ──────────────────────────────────────────────────────────────

type ActionType = "approve" | "authorize" | "pay" | "submit-expense" | "review" | "close" | "reject" | null;

interface ActionDialogProps {
    cr: CashRequest | null;
    action: ActionType;
    onClose: () => void;
    onDone: () => void;
}

function ActionDialog({ cr, action, onClose, onDone }: ActionDialogProps) {
    const { t } = useI18n();
    const api = useApi();
    const [form, setForm] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [error, setError] = useState("");

    const resetKey = `${action ?? ""}-${cr?._id ?? ""}`;
    const [prevKey, setPrevKey] = useState(resetKey);

    if (resetKey !== prevKey) {
        setPrevKey(resetKey);
        setForm({
            files: cr?.expense_files?.join(", ") ?? "",
            totalSpent: cr?.total_spent != null ? String(cr.total_spent) : "",
            notes: cr?.notes ?? ""
        });
        setError("");
    }

    if (!cr || !action) return null;

    const titles: Record<NonNullable<ActionType>, string> = {
        approve: t("CashRequests.dialogs.action.approve"),
        authorize: t("CashRequests.dialogs.action.authorize"),
        pay: t("CashRequests.dialogs.action.pay"),
        "submit-expense": t("CashRequests.dialogs.action.submitExpense"),
        review: t("CashRequests.dialogs.action.review"),
        close: t("CashRequests.dialogs.action.close"),
        reject: t("CashRequests.dialogs.action.reject"),
    };

    const handleSubmit = async () => {
        setError("");
        setLoading(true);
        let body: Record<string, unknown> = {};
        const path = `/cash-requests/${cr._id}/${action}`;

        switch (action) {
            case "approve": body = { notes: form.notes }; break;
            case "authorize":
                if (!form.authorizedAmount) { setError(t("CashRequests.dialogs.action.errors.authorizedAmount")); setLoading(false); return; }
                body = { authorizedAmount: Number(form.authorizedAmount), expensePeriodDays: Number(form.expensePeriodDays ?? 7), notes: form.notes };
                break;
            case "pay": body = { paymentProof: form.paymentProof, notes: form.notes }; break;
            case "submit-expense":
                if (!form.totalSpent) { setError(t("CashRequests.dialogs.action.errors.totalSpent")); setLoading(false); return; }
                body = { totalSpent: Number(form.totalSpent), files: form.files ? form.files.split(",").map(f => f.trim()).filter(Boolean) : [], notes: form.notes };
                break;
            case "review":
                if (!form.totalSpent) { setError(t("CashRequests.dialogs.action.errors.totalSpent")); setLoading(false); return; }
                body = { totalSpent: Number(form.totalSpent), notes: form.notes };
                break;
            case "close": body = { proof: form.proof, notes: form.notes }; break;
            case "reject":
                if (!form.reason) { setError(t("CashRequests.dialogs.action.errors.reason")); setLoading(false); return; }
                body = { reason: form.reason };
                break;
        }

        const res = await api.put(path, body);
        setLoading(false);
        if (res.error) { setError(res.error); return; }
        onDone();
        onClose();
    };

    const handleSaveDraft = async () => {
        setError("");
        setLoading(true);
        const currentFiles = form.files ? form.files.split(",").map(x => x.trim()).filter(Boolean) : [];
        const body: any = { status: "expense_draft", expense_files: currentFiles };
        if (form.totalSpent) body.total_spent = Number(form.totalSpent);
        if (form.notes) body.notes = form.notes;
        const res = await api.put(`/cash-requests/${cr?._id}`, body);
        setLoading(false);
        if (res.error) { setError(res.error); return; }
        onDone();
        onClose();
    };

    const f = (key: string, v: string) => setForm(prev => ({ ...prev, [key]: v }));

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !cr) return;
        const file = e.target.files[0];
        setUploadingFile(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("method", "n8n");

            const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
            const token = Cookies.get("token");

            const res = await fetch(`${base}/cash-requests/${cr._id}/add-expense-ai`, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || t("CashRequests.dialogs.action.errors.uploadError"));
            }

            const result = await res.json();

            // Si el backend devolvió el objeto actualizado, lo usamos para el formulario
            if (result.total_spent != null || result.expense_files) {
                setForm(prev => ({
                    ...prev,
                    totalSpent: result.total_spent != null ? String(result.total_spent) : prev.totalSpent,
                    files: result.expense_files?.join(", ") ?? prev.files
                }));
            }

            toast.success("Comprobante analizado con éxito");
            // Notificar al padre para refrescar la lista en el fondo si es necesario
            onDone();
        } catch (err: any) {
            setError(err.message || t("CashRequests.dialogs.action.errors.uploadError"));
        } finally {
            setUploadingFile(false);
            if (e.target) e.target.value = "";
        }
    };

    return (
        <Dialog open={!!action} onOpenChange={v => !v && onClose()}>
            <DialogContent className="w-[95vw] max-w-lg max-h-[95dvh] overflow-hidden flex flex-col rounded-2xl p-0 gap-0">
                <DialogHeader className="shrink-0 px-5 pt-5 pb-4 border-b">
                    <DialogTitle className="text-base">{titles[action]}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 p-5 overflow-y-auto flex-1 min-h-0">
                    {error && (
                        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{error}</span>
                        </div>
                    )}

                    {/* Summary card */}
                    <div className="bg-muted/50 rounded-xl px-4 py-3 text-sm space-y-1.5 border border-border/50">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-muted-foreground text-xs">ID</span>
                            <span className="font-mono text-xs bg-background px-2 py-0.5 rounded border">{cr._id.slice(-8)}</span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-muted-foreground text-xs shrink-0">{t("CashRequests.dialogs.action.summary.purpose")}</span>
                            <span className="text-right text-xs">{cr.purpose}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground text-xs shrink-0">{t("CashRequests.dialogs.action.summary.requestedAmount")}</span>
                            <strong className="text-sm">{cr.requested_amount.toLocaleString()} {cr.currency}</strong>
                        </div>
                        {cr.authorized_amount && (
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground text-xs shrink-0">{t("CashRequests.dialogs.action.summary.authorizedAmount")}</span>
                                <strong className="text-sm">{cr.authorized_amount.toLocaleString()} {cr.currency}</strong>
                            </div>
                        )}
                    </div>

                    {action === "authorize" && (
                        <>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">{t("CashRequests.dialogs.action.fields.authorizedAmount")}</Label>
                                <Input type="number" min="0" step="0.01" value={form.authorizedAmount ?? ""}
                                    onChange={e => f("authorizedAmount", e.target.value)}
                                    placeholder={String(cr.requested_amount)} className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">{t("CashRequests.dialogs.action.fields.expensePeriod")}</Label>
                                <Input type="number" min="1" max="90" value={form.expensePeriodDays ?? "7"}
                                    onChange={e => f("expensePeriodDays", e.target.value)} className="h-10" />
                                <p className="text-xs text-muted-foreground">{t("CashRequests.dialogs.action.fields.expensePeriodDesc")}</p>
                            </div>
                        </>
                    )}
                    {action === "pay" && (
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">{t("CashRequests.dialogs.action.fields.paymentProof")}</Label>
                            <Input value={form.paymentProof ?? ""} onChange={e => f("paymentProof", e.target.value)}
                                placeholder={t("CashRequests.dialogs.action.fields.paymentProofPlaceholder")} className="h-10" />
                        </div>
                    )}
                    {action === "submit-expense" && (
                        <>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: t("CashRequests.dialogs.action.fields.totalSpentOptional") }} />
                                <Input type="number" min="0" step="0.01" value={form.totalSpent ?? ""}
                                    readOnly className="h-10 bg-muted/30 font-bold" />
                            </div>
                            {/* <div className="space-y-1.5">
                                <Label className="text-sm font-medium">{t("CashRequests.dialogs.action.fields.fileUrls")}</Label>
                                <Textarea value={form.files ?? ""} onChange={e => f("files", e.target.value)}
                                    placeholder="https://..., https://..." className="min-h-[60px] resize-none text-xs font-mono" />
                            </div> */}

                            {/* Detalle de items analizados por IA */}
                            {cr.expense_items && cr.expense_items.length > 0 && (
                                <div className="space-y-2 pt-2 border-t mt-2">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                        Detalle de Comprobantes ({cr.expense_items.length})
                                    </Label>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                        {cr.expense_items.map((it: any, idx: number) => (
                                            <div key={idx} className="flex flex-col gap-2 p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="h-7 w-7 rounded bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                                                            <FileText className="h-4 w-4 text-indigo-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold truncate leading-none mb-1">
                                                                {it.issuer_name || "Comprobante"}
                                                            </p>
                                                            <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                                                                <Calendar className="h-2.5 w-2.5" />
                                                                {it.date ? format(new Date(it.date), "dd/MM/yyyy") : "—"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-2">
                                                        <p className="text-[11px] font-black text-indigo-700 dark:text-indigo-400">
                                                            {it.amount?.toLocaleString()} {it.currency}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Desglose de items internos del comprobante */}
                                                {it.items && it.items.length > 0 && (
                                                    <div className="pl-9 space-y-1 border-l-2 border-indigo-100/50 ml-3.5">
                                                        {it.items.map((sub: any, sIdx: number) => (
                                                            <div key={sIdx} className="flex justify-between text-[9px] leading-tight text-muted-foreground/80">
                                                                <span className="truncate mr-4 italic">• {sub.description}</span>
                                                                <span className="shrink-0 font-medium">{sub.total?.toLocaleString()} {it.currency}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Nueva Galería Visual de Comprobantes */}
                            {(cr?.expense_files?.length ?? 0) > 0 && (
                                <div className="pt-4 border-t mt-2">
                                    <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                                        <Camera className="h-3.5 w-3.5" /> Evidencias Visuales ({cr?.expense_files?.length ?? 0})
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {cr?.expense_files?.map((url: string, idx: number) => {
                                            const apiBase = process.env.NEXT_PUBLIC_API_BASE || "";
                                            // Evitar doble /api si la URL ya lo tiene y el apiBase también
                                            const cleanUrl = url.startsWith("/api") && apiBase.endsWith("/api")
                                                ? url.substring(4)
                                                : url;
                                            const fullUrl = url.startsWith("http") ? url : `${apiBase}${cleanUrl}`;
                                            return (
                                                <a
                                                    key={idx}
                                                    href={fullUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="h-20 w-20 rounded-xl overflow-hidden border-2 border-muted hover:border-indigo-400 transition-all shadow-sm group"
                                                >
                                                    <img src={fullUrl} alt={`Evidencia ${idx + 1}`} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 pt-3 mt-1 border-t border-border">
                                <Label className="flex items-center gap-2 text-sm font-medium">
                                    <FileUp className="h-4 w-4 shrink-0" /> {t("CashRequests.dialogs.action.fields.uploadDraft")}
                                </Label>
                                <Input type="file" onChange={handleFileUpload} disabled={uploadingFile}
                                    className="cursor-pointer file:cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:px-2 file:py-1" />
                                {uploadingFile && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Loader2 className="h-3 w-3 animate-spin" /> {t("CashRequests.dialogs.action.fields.draftUploading")}
                                    </span>
                                )}
                                <div className="space-y-2">
                                    <Label>Total Final a Reportar *</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.totalSpent ?? cr.total_spent ?? ""}
                                        readOnly
                                        className="bg-muted/30 font-bold"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground leading-tight">
                                    {t("CashRequests.dialogs.action.fields.draftSavesImmediately")}
                                </p>
                            </div>
                        </>
                    )}
                    {(action === "submit-expense" || action === "review") && (
                        <>
                            {(form.totalSpent || cr.total_spent != null) && cr.authorized_amount && (
                                <div className={cn(
                                    "rounded-xl px-4 py-3 text-sm border space-y-1.5 bg-indigo-50/30 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30",
                                )}>
                                    <p className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                        {t("CashRequests.dialogs.action.balance.title")}
                                    </p>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">{t("CashRequests.dialogs.action.balance.authorized")}</span>
                                        <span className="font-semibold">{cr.authorized_amount.toLocaleString()} {cr.currency}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">{t("CashRequests.dialogs.action.balance.spent")}</span>
                                        <span className="font-semibold">{Number(form.totalSpent || cr.total_spent).toLocaleString()} {cr.currency}</span>
                                    </div>
                                    <div className="pt-1.5 border-t border-indigo-100/50 dark:border-indigo-900/50 mt-1.5 flex justify-between items-center">
                                        <p className="font-medium text-xs">
                                            {Number(form.totalSpent || cr.total_spent) === cr.authorized_amount
                                                ? t("CashRequests.dialogs.action.balance.zero")
                                                : Number(form.totalSpent || cr.total_spent) > cr.authorized_amount
                                                    ? t("CashRequests.dialogs.action.balance.reimbursement")
                                                    : t("CashRequests.dialogs.action.balance.refund")}
                                        </p>
                                        <p className={cn(
                                            "font-black text-sm",
                                            Number(form.totalSpent || cr.total_spent) === cr.authorized_amount ? "text-emerald-600" :
                                            Number(form.totalSpent || cr.total_spent) > cr.authorized_amount ? "text-orange-600" : "text-rose-600"
                                        )}>
                                            {Number(form.totalSpent || cr.total_spent) === cr.authorized_amount ? "" : 
                                             Number(form.totalSpent || cr.total_spent) > cr.authorized_amount ? "+" : ""}
                                            {(Number(form.totalSpent || cr.total_spent || 0) - (cr.authorized_amount ?? 0)).toFixed(2)} {cr.currency}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {action === "close" && (
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">{t("CashRequests.dialogs.action.fields.liquidationProof")}</Label>
                            <Input value={form.proof ?? ""} onChange={e => f("proof", e.target.value)}
                                placeholder={t("CashRequests.dialogs.action.fields.liquidationPlaceholder")} className="h-10" />
                        </div>
                    )}
                    {action === "reject" && (
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">{t("CashRequests.dialogs.action.fields.rejectReason")}</Label>
                            <Textarea value={form.reason ?? ""} onChange={e => f("reason", e.target.value)}
                                className="min-h-[80px] resize-none" placeholder={t("CashRequests.dialogs.action.fields.rejectPlaceholder")} />
                        </div>
                    )}
                    {action !== "reject" && (
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">{t("CashRequests.dialogs.action.fields.notesOptional")}</Label>
                            <Textarea value={form.notes ?? ""} onChange={e => f("notes", e.target.value)}
                                className="min-h-[60px] resize-none" placeholder="Observaciones adicionales..." />
                        </div>
                    )}
                </div>

                <DialogFooter className="shrink-0 px-5 py-4 border-t bg-muted/20">
                    <div className="flex w-full gap-2 flex-wrap">
                        <Button variant="outline" onClick={onClose} disabled={loading || uploadingFile} className="flex-1 min-w-[100px]">
                            {t("CashRequests.dialogs.action.buttons.cancel")}
                        </Button>

                        {action === "submit-expense" && (
                            <Button variant="secondary" onClick={handleSaveDraft} disabled={loading || uploadingFile} className="flex-1 min-w-[100px]">
                                {t("CashRequests.dialogs.action.buttons.saveDraft")}
                            </Button>
                        )}

                        <Button
                            onClick={handleSubmit}
                            disabled={loading || uploadingFile}
                            variant={action === "reject" ? "destructive" : "default"}
                            className={cn(
                                "gap-2 flex-1 min-w-[140px]",
                                action === "submit-expense" && "bg-indigo-600 hover:bg-indigo-700 text-white"
                            )}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
                            {action === "submit-expense"
                                ? t("CashRequests.dialogs.action.submitExpense")
                                : (titles[action] || "Confirmar")}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Detail dialog ──────────────────────────────────────────────────────────────

function DetailDialog({ cr, onClose, onAction }: {
    cr: CashRequest | null;
    onClose: () => void;
    onAction: (a: ActionType) => void;
}) {
    const { t } = useI18n();
    if (!cr) return null;

    const projectName = cr.project_id && typeof cr.project_id === "object" ? cr.project_id.name : String(cr.project_id ?? "—");
    const createdByName = cr.created_by ? (typeof cr.created_by === "object" ? cr.created_by.name || cr.created_by.email : String(cr.created_by)) : "—";
    const beneficiaryName = cr.beneficiary_id ? (typeof cr.beneficiary_id === "object" ? cr.beneficiary_id.name || cr.beneficiary_id.email : String(cr.beneficiary_id)) : createdByName;

    const availableActions: { label: string; action: ActionType; variant?: "destructive" | "default" | "outline"; icon: React.ElementType }[] = [];
    if (cr.status === "created") availableActions.push({ label: t("CashRequests.actions.approve"), action: "approve", icon: CheckCircle2 });
    if (cr.status === "approved") availableActions.push({ label: t("CashRequests.actions.authorize"), action: "authorize", icon: ShieldCheck });
    if (cr.status === "authorized") availableActions.push({ label: t("CashRequests.actions.pay"), action: "pay", icon: CreditCard });
    if (["paid", "expense_draft"].includes(cr.status)) availableActions.push({ label: t("CashRequests.actions.submitExpense"), action: "submit-expense", icon: ReceiptText });
    if (cr.status === "submitted") availableActions.push({ label: t("CashRequests.actions.review"), action: "review", icon: Search as any });
    if (["reimbursement", "refund"].includes(cr.status)) availableActions.push({ label: t("CashRequests.actions.close"), action: "close", icon: PackageCheck });
    if (!["closed", "rejected"].includes(cr.status)) availableActions.push({ label: t("CashRequests.actions.reject"), action: "reject", variant: "destructive", icon: XCircle });

    return (
        <Dialog open={!!cr} onOpenChange={v => !v && onClose()}>
            <DialogContent className="w-[95vw] max-w-lg max-h-[95dvh] overflow-hidden flex flex-col rounded-2xl p-0 gap-0">
                <DialogHeader className="shrink-0 px-5 pt-5 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Wallet className="h-5 w-5 text-primary shrink-0" />
                        {t("CashRequests.dialogs.detail.title")}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={cr.status} />
                        <span className="text-xs text-muted-foreground">
                            {t("CashRequests.dialogs.detail.created")} {format(new Date(cr.createdAt), "d MMM yyyy", { locale: es })}
                        </span>
                    </div>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto flex-1 min-h-0 px-5 py-5 custom-scrollbar bg-muted/5">
                    {/* Sección: Información General */}
                    <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 px-0.5">
                            <Building className="h-3.5 w-3.5" /> {t("CashRequests.dialogs.detail.general") || "Detalle General"}
                        </Label>
                        <div className="bg-background rounded-xl border border-border/60 shadow-sm divide-y divide-border/40 overflow-hidden">
                            {[
                                { label: t("CashRequests.dialogs.detail.project") ?? "Proyecto", value: projectName },
                                { label: t("CashRequests.dialogs.detail.beneficiary"), value: beneficiaryName },
                                { label: t("CashRequests.dialogs.detail.purpose") ?? "Propósito", value: cr.purpose },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex flex-col gap-1 p-3">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{label}</span>
                                    <span className="text-sm font-semibold">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sección: Finanzas y Liquidación */}
                    <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 px-0.5">
                            <Wallet className="h-3.5 w-3.5" /> Finanzas y Liquidación
                        </Label>
                        <div className="bg-background rounded-xl border border-border/60 shadow-sm divide-y divide-border/40 overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-border/40">
                                <div className="p-3">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{t("CashRequests.dialogs.detail.requestedAmount") ?? "Monto Solicitado"}</span>
                                    <p className="text-sm font-bold mt-0.5">{cr.requested_amount.toLocaleString()} {cr.currency}</p>
                                </div>
                                <div className="p-3">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{t("CashRequests.dialogs.detail.authorizedAmount") ?? "Monto Autorizado"}</span>
                                    <p className="text-sm font-bold mt-0.5 text-primary">
                                        {cr.authorized_amount ? `${cr.authorized_amount.toLocaleString()} ${cr.currency}` : "—"}
                                    </p>
                                </div>
                            </div>
                            {cr.total_spent != null && (
                                <div className="p-3 bg-indigo-50/10">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Rendición de Gastos Enviada</span>
                                    <p className="text-sm font-bold mt-0.5 text-amber-600">
                                        {cr.total_spent.toLocaleString()} {cr.currency}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Balance Preview (Solo si hay rendición) */}
                    {cr.authorized_amount && cr.total_spent != null && (
                        <div className="rounded-xl px-4 py-3 text-sm border space-y-2 bg-indigo-50/40 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30">
                            <p className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                {t("CashRequests.dialogs.action.balance.title")}
                            </p>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{t("CashRequests.dialogs.action.balance.authorized")}</span>
                                <span className="font-semibold">{cr.authorized_amount.toLocaleString()} {cr.currency}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{t("CashRequests.dialogs.action.balance.spent")}</span>
                                <span className="font-semibold">{cr.total_spent.toLocaleString()} {cr.currency}</span>
                            </div>
                            <div className="pt-2 border-t border-indigo-100/50 dark:border-indigo-900/50 mt-1 flex justify-between items-center">
                                <p className="font-medium text-xs">
                                    {cr.total_spent === cr.authorized_amount
                                        ? t("CashRequests.dialogs.action.balance.zero")
                                        : cr.total_spent > cr.authorized_amount
                                            ? t("CashRequests.dialogs.action.balance.reimbursement")
                                            : t("CashRequests.dialogs.action.balance.refund")}
                                </p>
                                <p className={cn(
                                    "font-black text-sm",
                                    cr.total_spent === cr.authorized_amount ? "text-emerald-600" :
                                    cr.total_spent > cr.authorized_amount ? "text-orange-600" : "text-rose-600"
                                )}>
                                    {cr.total_spent === cr.authorized_amount ? "" : 
                                     cr.total_spent > cr.authorized_amount ? "+" : ""}
                                    {((cr.total_spent ?? 0) - (cr.authorized_amount ?? 0)).toFixed(2)} {cr.currency}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Breakdown de items */}
                    {cr.expense_items && cr.expense_items.length > 0 && (
                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 px-0.5">
                                <ReceiptText className="h-3.5 w-3.5" /> Rendición de Gastos
                            </Label>
                            <div className="space-y-2">
                                {cr.expense_items.map((it: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-muted/20 border border-border/50 shadow-sm">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                                                <FileText className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold truncate leading-none mb-1">
                                                    {it.issuer_name || "Comprobante"}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {it.date ? format(new Date(it.date), "dd/MM/yyyy") : "—"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <p className="text-xs font-black text-indigo-700 dark:text-indigo-400">
                                                {it.amount?.toLocaleString()} {it.currency}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Meta/Notes */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" /> {t("CashRequests.dialogs.detail.creationDate")}
                            </p>
                            <p className="text-xs font-medium">{format(new Date(cr.createdAt), "d MMM yyyy", { locale: es })}</p>
                        </div>
                        {cr.expense_period_days && (
                            <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1.5">
                                    <RotateCcw className="h-3 w-3" /> {t("CashRequests.dialogs.detail.expensePeriod")}
                                </p>
                                <p className="text-xs font-medium">{cr.expense_period_days} días</p>
                            </div>
                        )}
                    </div>

                    {cr.notes && (
                        <div className="bg-muted/30 rounded-xl px-3 py-3 text-sm border border-border/40">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Descripción / Notas</p>
                            <p className="text-xs leading-relaxed text-muted-foreground">{cr.notes}</p>
                        </div>
                    )}

                    {/* Galería Visual */}
                    {(cr.expense_files?.length ?? 0) > 0 && (
                        <div className="space-y-3 pt-2">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 px-0.5">
                                <Camera className="h-3.5 w-3.5" /> Evidencias Visuales ({cr.expense_files?.length})
                            </Label>
                            <div className="flex flex-wrap gap-2.5">
                                {cr.expense_files?.map((url: string, idx: number) => {
                                    const apiBase = process.env.NEXT_PUBLIC_API_BASE || "";
                                    const cleanUrl = url.startsWith("/api") && apiBase.endsWith("/api") ? url.substring(4) : url;
                                    const fullUrl = url.startsWith("http") ? url : `${apiBase}${cleanUrl}`;
                                    return (
                                        <a key={idx} href={fullUrl} target="_blank" rel="noopener noreferrer" 
                                            className="h-20 w-20 rounded-xl overflow-hidden border-2 border-background shadow-md hover:border-indigo-400 transition-all group">
                                            <img src={fullUrl} alt={`Evidencia ${idx + 1}`} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 px-5 pb-4 pt-3 border-t bg-muted/20 space-y-3">
                    {availableActions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {availableActions.map(({ label, action, variant = "default", icon: Icon }) => (
                                <Button key={action} size="sm" variant={variant}
                                    className="gap-1.5 flex-1 min-w-[120px] h-9"
                                    onClick={() => { onClose(); onAction(action); }}>
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{label}</span>
                                </Button>
                            ))}
                        </div>
                    )}
                    <Button variant="outline" onClick={onClose} className="w-full h-9">
                        {t("CashRequests.dialogs.detail.close")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Action buttons helper ──────────────────────────────────────────────────────

function CRActionButtons({ cr, onAction, compact = false }: {
    cr: CashRequest;
    onAction: (cr: CashRequest, action: ActionType) => void;
    compact?: boolean;
}) {
    const { t } = useI18n();
    const btnClass = compact
        ? "h-7 w-7 p-0"
        : "h-8 gap-1.5 flex-1 text-xs px-2";

    const actions: { status: CRStatus | CRStatus[]; action: ActionType; icon: React.ElementType; color: string; label?: string }[] = [
        { status: "created", action: "approve", icon: CheckCircle2, color: "text-emerald-600 border-emerald-200 hover:bg-emerald-50", label: t("CashRequests.actions.approve") },
        { status: "approved", action: "authorize", icon: ShieldCheck, color: "text-violet-600 border-violet-200 hover:bg-violet-50", label: t("CashRequests.actions.authorize") },
        { status: "authorized", action: "pay", icon: CreditCard, color: "text-teal-600 border-teal-200 hover:bg-teal-50", label: t("CashRequests.actions.pay") },
        { status: ["paid", "expense_draft"], action: "submit-expense", icon: ReceiptText, color: "text-indigo-600 border-indigo-200 hover:bg-indigo-50", label: t("CashRequests.actions.submitExpense") },
        { status: "submitted", action: "review", icon: Search, color: "text-amber-600 border-amber-200 hover:bg-amber-50", label: t("CashRequests.actions.review") },
        { status: ["reimbursement", "refund"], action: "close", icon: PackageCheck, color: "text-green-600 border-green-200 hover:bg-green-50", label: t("CashRequests.actions.close") },
    ];

    return (
        <>
            {actions.map(({ status, action, icon: Icon, color, label }) => {
                const statuses = Array.isArray(status) ? status : [status];
                if (!statuses.includes(cr.status as CRStatus)) return null;
                return (
                    <Button key={action} size="sm" variant="outline"
                        className={cn(btnClass, color)}
                        onClick={() => onAction(cr, action)}>
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {!compact && label && <span className="truncate">{label}</span>}
                    </Button>
                );
            })}
        </>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function CashRequestsPage() {
    const { t } = useI18n();

    const [items, setItems] = useState<CashRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [showNew, setShowNew] = useState(false);
    const [detailCr, setDetailCr] = useState<CashRequest | null>(null);
    const [actionCr, setActionCr] = useState<CashRequest | null>(null);
    const [currentAction, setCurrentAction] = useState<ActionType>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
            const token = Cookies.get("token");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const data = await fetch(`${base}/cash-requests`, { headers, credentials: "include" }).then(r => r.json());
            setItems(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchData(); }, [fetchData]);

    const filtered = useMemo(() => {
        return items.filter(cr => {
            const projectName = cr.project_id && typeof cr.project_id === "object" ? cr.project_id.name : "";
            const q = search.toLowerCase();
            const matchSearch = !search || cr.purpose.toLowerCase().includes(q) || projectName.toLowerCase().includes(q) || cr._id.includes(q);
            const matchStatus = filterStatus === "all" || cr.status === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [items, search, filterStatus]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const counts = useMemo(() => ({
        all: items.length,
        active: items.filter(c => !["closed", "rejected"].includes(c.status)).length,
        closed: items.filter(c => c.status === "closed").length,
        total: items.reduce((s, c) => s + (c.authorized_amount ?? c.requested_amount), 0),
    }), [items]);

    const handleOpenAction = (cr: CashRequest, action: ActionType) => {
        setActionCr(cr);
        setCurrentAction(action);
    };

    const hasActiveFilter = filterStatus !== "all";

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-muted/30">
            <div className="max-w-screen-xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-primary/10 shrink-0">
                            <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{t("CashRequests.title")}</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{t("CashRequests.description")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="icon" onClick={fetchData} className="h-9 w-9 shrink-0">
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </Button>
                        <Button onClick={() => setShowNew(true)} className="gap-2 h-9 px-3 sm:px-4">
                            <Plus className="h-4 w-4 shrink-0" />
                            <span className="hidden sm:inline">{t("CashRequests.newRequest")}</span>
                            <span className="sm:hidden">New</span>
                        </Button>
                    </div>
                </div>

                {/* ── Summary cards ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { label: t("CashRequests.summary.total"), value: counts.all, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
                        { label: t("CashRequests.summary.active"), value: counts.active, icon: RefreshCw, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
                        { label: t("CashRequests.summary.closed"), value: counts.closed, icon: PackageCheck, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
                        { label: t("CashRequests.summary.totalAmount"), value: counts.total.toLocaleString(), icon: CreditCard, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/30" },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <Card key={label} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl shrink-0", bg, color)}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground truncate">{label}</p>
                                    <p className="text-base sm:text-lg font-bold tabular-nums">{value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ── Filters ─────────────────────────────────────────────────── */}
                <div className="flex gap-2 items-center">
                    {/* Search — always visible */}
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            className="pl-9 h-10"
                            placeholder={t("CashRequests.filters.search")}
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    {/* Status filter: dropdown on mobile, select on desktop */}
                    <div className="hidden sm:block">
                        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
                            <SelectTrigger className="w-[180px] h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("CashRequests.filters.allStatuses")}</SelectItem>
                                {Object.entries(STATUS_CFG).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Mobile filter button */}
                    <div className="sm:hidden">
                        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className={cn("h-10 w-10 shrink-0", hasActiveFilter && "border-primary text-primary")}>
                                    <Filter className="h-4 w-4" />
                                    {hasActiveFilter && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="rounded-t-2xl pb-8">
                                <SheetHeader className="mb-4">
                                    <SheetTitle>{t("CashRequests.filters.allStatuses")}</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-2">
                                    {[["all", t("CashRequests.filters.allStatuses")], ...Object.entries(STATUS_CFG).map(([k, v]) => [k, v.label])].map(([value, label]) => (
                                        <button key={value} onClick={() => { setFilterStatus(value); setPage(1); setFiltersOpen(false); }}
                                            className={cn(
                                                "flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left",
                                                filterStatus === value
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-muted"
                                            )}>
                                            {label}
                                            {filterStatus === value && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                {/* Active filter pill on mobile */}
                {hasActiveFilter && (
                    <div className="flex sm:hidden items-center gap-2">
                        <span className="text-xs text-muted-foreground">Filter:</span>
                        <button onClick={() => { setFilterStatus("all"); setPage(1); }}
                            className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                            {STATUS_CFG[filterStatus as CRStatus]?.label ?? filterStatus}
                            <XCircle className="h-3 w-3" />
                        </button>
                    </div>
                )}

                {/* ── Mobile cards ──────────────────────────────────────────────── */}
                <div className="lg:hidden flex flex-col gap-3">
                    {loading ? (
                        <div className="text-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                        </div>
                    ) : paginated.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground border-2 rounded-2xl bg-card border-dashed">
                            <Wallet className="h-8 w-8 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">{t("CashRequests.table.empty")}</p>
                        </div>
                    ) : paginated.map(cr => {
                        const projectName = cr.project_id && typeof cr.project_id === "object" ? cr.project_id.name : String(cr.project_id ?? "—");
                        return (
                            <Card key={cr._id} className="shadow-sm border-border/60 overflow-hidden">
                                <CardContent className="p-4 space-y-3">
                                    {/* Top row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                    …{cr._id.slice(-8)}
                                                </span>
                                                <span className="font-semibold text-sm truncate">{projectName}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{cr.purpose}</p>
                                        </div>
                                        <StatusBadge status={cr.status} />
                                    </div>

                                    {/* Amount + date row */}
                                    <div className="flex justify-between items-center pt-2 border-t border-muted/60">
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(cr.createdAt), "d MMM yyyy", { locale: es })}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-muted-foreground mr-1">{cr.currency}</span>
                                            <span className="font-bold text-base tabular-nums">{cr.requested_amount.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-muted/60 flex-wrap">
                                        <Button size="sm" variant="outline" className="h-8 px-3 gap-1.5 flex-none"
                                            onClick={() => setDetailCr(cr)}>
                                            <Eye className="h-3.5 w-3.5" />
                                            <span className="text-xs">{t("CashRequests.table.actions")}</span>
                                        </Button>
                                        <div className="flex items-center gap-2 flex-1 flex-wrap justify-end">
                                            <CRActionButtons cr={cr} onAction={handleOpenAction} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* ── Desktop Table ──────────────────────────────────────────── */}
                <Card className="hidden lg:block border-border/60 shadow-sm">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="font-semibold w-[100px]">{t("CashRequests.table.id")}</TableHead>
                                    <TableHead className="font-semibold">{t("CashRequests.table.project")}</TableHead>
                                    <TableHead className="font-semibold">{t("CashRequests.table.purpose")}</TableHead>
                                    <TableHead className="font-semibold text-right">{t("CashRequests.table.requested")}</TableHead>
                                    <TableHead className="font-semibold text-right">{t("CashRequests.table.authorized")}</TableHead>
                                    <TableHead className="font-semibold">{t("CashRequests.table.status")}</TableHead>
                                    <TableHead className="font-semibold">{t("CashRequests.table.date")}</TableHead>
                                    <TableHead className="font-semibold text-center w-[120px]">{t("CashRequests.table.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-16">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                                            <Wallet className="h-8 w-8 mx-auto mb-3 opacity-30" />
                                            <p className="text-sm">{t("CashRequests.table.empty")}</p>
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.map(cr => {
                                    const projectName = cr.project_id && typeof cr.project_id === "object" ? cr.project_id.name : String(cr.project_id ?? "—");
                                    return (
                                        <TableRow key={cr._id} className="group hover:bg-muted/20 transition-colors">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                …{cr._id.slice(-8)}
                                            </TableCell>
                                            <TableCell className="font-medium max-w-[140px]">
                                                <span className="truncate block">{projectName}</span>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] text-sm">
                                                <span className="truncate block">{cr.purpose}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold tabular-nums whitespace-nowrap">
                                                {cr.requested_amount.toLocaleString()}&nbsp;<span className="text-xs text-muted-foreground font-normal">{cr.currency}</span>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-sm whitespace-nowrap">
                                                {cr.authorized_amount
                                                    ? <>{cr.authorized_amount.toLocaleString()}&nbsp;<span className="text-xs text-muted-foreground">{cr.currency}</span></>
                                                    : <span className="text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell><StatusBadge status={cr.status} /></TableCell>
                                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                {format(new Date(cr.createdAt), "d MMM yyyy", { locale: es })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                                        onClick={() => setDetailCr(cr)}>
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <CRActionButtons cr={cr} onAction={handleOpenAction} compact />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* ── Pagination ──────────────────────────────────────────────── */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border rounded-xl bg-card shadow-sm gap-2">
                        <p className="text-xs text-muted-foreground order-2 sm:order-1">
                            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} {t("of") ?? "de"} {filtered.length}
                        </p>
                        <div className="flex items-center gap-1 order-1 sm:order-2">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                                disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {/* Page number pills */}
                            <div className="flex items-center gap-1 px-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let p: number;
                                    if (totalPages <= 5) p = i + 1;
                                    else if (page <= 3) p = i + 1;
                                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                                    else p = page - 2 + i;
                                    return (
                                        <button key={p} onClick={() => setPage(p)}
                                            className={cn(
                                                "h-8 w-8 rounded-lg text-xs font-medium transition-colors",
                                                p === page
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-muted text-muted-foreground"
                                            )}>
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                                disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Dialogs ────────────────────────────────────────────────────── */}
            <NewCashRequestDialog open={showNew} onClose={() => setShowNew(false)} onCreated={fetchData} />

            <DetailDialog cr={detailCr} onClose={() => setDetailCr(null)}
                onAction={action => {
                    setActionCr(detailCr);
                    setCurrentAction(action);
                    setDetailCr(null);
                }} />

            <ActionDialog cr={actionCr} action={currentAction}
                onClose={() => { setActionCr(null); setCurrentAction(null); }}
                onDone={fetchData} />
        </div>
    );
}