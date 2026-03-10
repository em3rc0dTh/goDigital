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
    CreditCard, XCircle, ReceiptText, PackageCheck, ArrowLeftRight,
    RotateCcw, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw, FileUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

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

function Search2({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
}

function StatusBadge({ status }: { status: CRStatus }) {
    const cfg = STATUS_CFG[status] ?? STATUS_CFG.created;
    const Icon = cfg.icon;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", cfg.variant)}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    );
}

// ── API helper ─────────────────────────────────────────────────────────────────

function useApi() {
    const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
    const token = Cookies.get("token");
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const opts = { headers, credentials: "include" as const };

    const get = (path: string) =>
        fetch(`${base}${path}`, { ...opts }).then(r => r.json());
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
    const api = useApi();
    const [projects, setProjects] = useState<Project[]>([]);
    const [form, setForm] = useState({
        project_id: "", requested_amount: "", currency: "PEN", purpose: "", notes: "", beneficiary_email: "",
    });
    const [otherBeneficiary, setOtherBeneficiary] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            api.get("/projects").then(d => setProjects(Array.isArray(d) ? d : []));
        }
    }, [open]);

    const resetForm = () => {
        setForm({ project_id: "", requested_amount: "", currency: "PEN", purpose: "", notes: "", beneficiary_email: "" });
        setOtherBeneficiary(false);
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        setError("");
        if (!form.project_id || !form.requested_amount || !form.purpose) {
            setError("Proyecto, Monto, y Propósito son obligatorios.");
            return;
        }
        if (otherBeneficiary && !form.beneficiary_email) {
            setError("Debe ingresar el correo del beneficiario.");
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
        if (res._id) {
            resetForm();
            onCreated();
            onClose();
        }
        else setError(res.error ?? "Error al crear la solicitud.");
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && handleClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" /> Nueva Solicitud de Caja
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label>Proyecto *</Label>
                        <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                            <SelectTrigger><SelectValue placeholder="Selecciona un proyecto" /></SelectTrigger>
                            <SelectContent>
                                {projects.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Monto Solicitado *</Label>
                            <Input type="number" min="0" step="0.01" value={form.requested_amount}
                                onChange={e => setForm(f => ({ ...f, requested_amount: e.target.value }))}
                                placeholder="500.00" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Moneda</Label>
                            <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PEN">PEN</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Propósito *</Label>
                        <Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                            placeholder="Ej: Materiales para obra, viáticos Lima…" />
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="otherBeneficiary"
                            checked={otherBeneficiary}
                            onChange={(e) => setOtherBeneficiary(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                        />
                        <Label htmlFor="otherBeneficiary" className="cursor-pointer font-normal text-sm">
                            Este retiro de caja es para otro usuario
                        </Label>
                    </div>
                    {otherBeneficiary && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                            <Label>Correo del Beneficiario *</Label>
                            <Input
                                type="email"
                                value={form.beneficiary_email}
                                onChange={e => setForm(f => ({ ...f, beneficiary_email: e.target.value }))}
                                placeholder="usuario@empresa.com"
                            />
                            <p className="text-xs text-muted-foreground">La persona con este correo será la encargada de presentar las facturas.</p>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label>Notas adicionales</Label>
                        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="Detalles adicionales (opcional)" className="min-h-[80px] resize-none" />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Crear Solicitud
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Action dialog (approve, authorize, pay, submit-expense, review, close, reject) ──

type ActionType = "approve" | "authorize" | "pay" | "submit-expense" | "review" | "close" | "reject" | null;

interface ActionDialogProps {
    cr: CashRequest | null;
    action: ActionType;
    onClose: () => void;
    onDone: () => void;
}

function ActionDialog({ cr, action, onClose, onDone }: ActionDialogProps) {
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
        approve: "Aprobar Solicitud de Caja",
        authorize: "Autorizar Monto y Período",
        pay: "Desembolsar Efectivo",
        "submit-expense": "Enviar Expense Report",
        review: "Revisar Expense Report",
        close: "Cerrar Liquidación",
        reject: "Rechazar Solicitud",
    };

    const handleSubmit = async () => {
        setError("");
        setLoading(true);
        let body: Record<string, unknown> = {};
        const path = `/cash-requests/${cr._id}/${action}`;

        switch (action) {
            case "approve":
                body = { notes: form.notes };
                break;
            case "authorize":
                if (!form.authorizedAmount) { setError("El monto autorizado es requerido."); setLoading(false); return; }
                body = {
                    authorizedAmount: Number(form.authorizedAmount),
                    expensePeriodDays: Number(form.expensePeriodDays ?? 7),
                    notes: form.notes,
                };
                break;
            case "pay":
                body = { paymentProof: form.paymentProof, notes: form.notes };
                break;
            case "submit-expense":
                if (!form.totalSpent) { setError("El total gastado es requerido."); setLoading(false); return; }
                body = {
                    totalSpent: Number(form.totalSpent),
                    files: form.files ? form.files.split(",").map(f => f.trim()).filter(Boolean) : [],
                    notes: form.notes,
                };
                break;
            case "review":
                if (!form.totalSpent) { setError("El total gastado es requerido."); setLoading(false); return; }
                body = { totalSpent: Number(form.totalSpent), notes: form.notes };
                break;
            case "close":
                body = { proof: form.proof, notes: form.notes };
                break;
            case "reject":
                if (!form.reason) { setError("El motivo es requerido."); setLoading(false); return; }
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
        const currentFiles = form.files ? form.files.split(",").map(x=>x.trim()).filter(Boolean) : [];
        const body: any = {
            status: "expense_draft",
            expense_files: currentFiles,
        };
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
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        setUploadingFile(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Url = reader.result as string;
                const payload = {
                    fileName: file.name,
                    mimeType: file.type,
                    size: file.size,
                    base64Url
                };
                const res = await api.post("/files", payload);
                if (res.url) {
                    setForm(prev => {
                        const currentFiles = prev.files ? prev.files.split(",").map(x=>x.trim()).filter(Boolean) : [];
                        currentFiles.push(res.url);
                        const newFilesStr = currentFiles.join(", ");
                        
                        // Async update as draft
                        if (cr) {
                            api.put(`/cash-requests/${cr._id}`, { expense_files: currentFiles }).catch(console.error);
                        }
                        return { ...prev, files: newFilesStr };
                    });
                } else {
                    setError(res.error || "Error al subir archivo");
                }
                setUploadingFile(false);
            };
        } catch (err) {
            setError("Error al leer archivo");
            setUploadingFile(false);
        }
    };

    return (
        <Dialog open={!!action} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{titles[action]}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                        </div>
                    )}

                    {/* Summary card */}
                    <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm space-y-1">
                        <p><span className="text-muted-foreground">ID:</span> <span className="font-mono text-xs">{cr._id.slice(-8)}</span></p>
                        <p><span className="text-muted-foreground">Propósito:</span> {cr.purpose}</p>
                        <p><span className="text-muted-foreground">Monto solicitado:</span> <strong>{cr.requested_amount.toLocaleString()} {cr.currency}</strong></p>
                        {cr.authorized_amount && <p><span className="text-muted-foreground">Monto autorizado:</span> <strong>{cr.authorized_amount.toLocaleString()} {cr.currency}</strong></p>}
                    </div>

                    {/* Action-specific fields */}
                    {action === "authorize" && (
                        <>
                            <div className="space-y-1.5">
                                <Label>Monto Autorizado *</Label>
                                <Input type="number" min="0" step="0.01" value={form.authorizedAmount ?? ""}
                                    onChange={e => f("authorizedAmount", e.target.value)}
                                    placeholder={String(cr.requested_amount)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Días para presentar gastos</Label>
                                <Input type="number" min="1" max="90" value={form.expensePeriodDays ?? "7"}
                                    onChange={e => f("expensePeriodDays", e.target.value)} />
                                <p className="text-xs text-muted-foreground">El empleado tendrá este período para subir facturas.</p>
                            </div>
                        </>
                    )}
                    {action === "pay" && (
                        <div className="space-y-1.5">
                            <Label>Referencia / Comprobante de desembolso</Label>
                            <Input value={form.paymentProof ?? ""} onChange={e => f("paymentProof", e.target.value)}
                                placeholder="Nro operación, cheque, transferencia…" />
                        </div>
                    )}
                    {action === "submit-expense" && (
                        <>
                            <div className="space-y-1.5">
                                <Label>Total Gastado * <span className="font-normal text-xs text-muted-foreground">(Solo requerido para Enviar final)</span></Label>
                                <Input type="number" min="0" step="0.01" value={form.totalSpent ?? ""}
                                    onChange={e => f("totalSpent", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>URLs de archivos (separados por coma)</Label>
                                <Textarea value={form.files ?? ""} onChange={e => f("files", e.target.value)}
                                    placeholder="https://..., https://..." className="min-h-[60px] resize-none text-xs font-mono" />
                            </div>
                            <div className="space-y-1.5 pt-3 mt-3 border-t border-border">
                                <Label className="flex items-center gap-2">
                                    <FileUp className="h-4 w-4" /> Subir boleta o factura (Borrador)
                                </Label>
                                <Input type="file" onChange={handleFileUpload} disabled={uploadingFile} />
                                {uploadingFile && <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Loader2 className="h-3 w-3 animate-spin" /> Subiendo archivo...</span>}
                                <p className="text-xs text-muted-foreground mt-1 leading-tight">
                                    El archivo se guardará como borrador inmediatamente. Puedes subir varios comprobantes en diferentes momentos antes de &quot;Enviar Expense Report&quot;.
                                </p>
                            </div>
                        </>
                    )}
                    {action === "review" && (
                        <>
                            <div className="space-y-1.5">
                                <Label>Total Gastado (según facturas) *</Label>
                                <Input type="number" min="0" step="0.01" value={form.totalSpent ?? ""}
                                    onChange={e => f("totalSpent", e.target.value)} />
                            </div>
                            {form.totalSpent && cr.authorized_amount && (
                                <div className={cn(
                                    "rounded-xl px-4 py-3 text-sm border",
                                    Number(form.totalSpent) === cr.authorized_amount
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                        : Number(form.totalSpent) > cr.authorized_amount
                                            ? "bg-orange-50 border-orange-200 text-orange-800"
                                            : "bg-rose-50 border-rose-200 text-rose-800",
                                )}>
                                    <p className="font-semibold">Balance Preview</p>
                                    <p>Autorizado: {cr.authorized_amount.toLocaleString()} {cr.currency}</p>
                                    <p>Gastado: {Number(form.totalSpent).toLocaleString()} {cr.currency}</p>
                                    <p className="font-bold mt-1">
                                        {Number(form.totalSpent) === cr.authorized_amount
                                            ? "✅ Balance = 0 → Cierre directo"
                                            : Number(form.totalSpent) > cr.authorized_amount
                                                ? `↑ Reembolso empresa: +${(Number(form.totalSpent) - cr.authorized_amount).toFixed(2)} ${cr.currency}`
                                                : `↓ Devolución empleado: ${(Number(form.totalSpent) - cr.authorized_amount).toFixed(2)} ${cr.currency}`
                                        }
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                    {action === "close" && (
                        <div className="space-y-1.5">
                            <Label>Comprobante de liquidación</Label>
                            <Input value={form.proof ?? ""} onChange={e => f("proof", e.target.value)}
                                placeholder="Nro operación / URL de comprobante" />
                        </div>
                    )}
                    {action === "reject" && (
                        <div className="space-y-1.5">
                            <Label>Motivo del rechazo *</Label>
                            <Textarea value={form.reason ?? ""} onChange={e => f("reason", e.target.value)}
                                className="min-h-[80px] resize-none" placeholder="Describe el motivo…" />
                        </div>
                    )}

                    {action !== "reject" && (
                        <div className="space-y-1.5">
                            <Label>Notas {action === "approve" || action === "close" ? "(opcionales)" : "(opcionales)"}</Label>
                            <Textarea value={form.notes ?? ""} onChange={e => f("notes", e.target.value)}
                                className="min-h-[60px] resize-none" placeholder="Observaciones adicionales..." />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading || uploadingFile}>Cancelar</Button>
                    
                    {action === "submit-expense" && (
                        <Button 
                            variant="secondary" 
                            onClick={handleSaveDraft} 
                            disabled={loading || uploadingFile}
                        >
                            Guardar Borrador
                        </Button>
                    )}

                    <Button
                        onClick={handleSubmit}
                        disabled={loading || uploadingFile}
                        variant={action === "reject" ? "destructive" : "default"}
                        className="gap-2"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {titles[action]}
                    </Button>
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
    if (!cr) return null;

    const projectName  = cr.project_id  && typeof cr.project_id  === "object" ? cr.project_id.name  : String(cr.project_id ?? "—");
    const createdByName = cr.created_by ? (typeof cr.created_by === "object" ? cr.created_by.name || cr.created_by.email : String(cr.created_by)) : "—";
    const beneficiaryName = cr.beneficiary_id ? (typeof cr.beneficiary_id === "object" ? cr.beneficiary_id.name || cr.beneficiary_id.email : String(cr.beneficiary_id)) : createdByName;

    const availableActions: { label: string; action: ActionType; variant?: "destructive" | "default" | "outline"; icon: React.ElementType }[] = [];
    if (cr.status === "created") availableActions.push({ label: "Aprobar", action: "approve", icon: CheckCircle2 });
    if (cr.status === "approved") availableActions.push({ label: "Autorizar", action: "authorize", icon: ShieldCheck });
    if (cr.status === "authorized") availableActions.push({ label: "Desembolsar", action: "pay", icon: CreditCard });
    if (["paid", "expense_draft"].includes(cr.status)) availableActions.push({ label: "Enviar Gastos", action: "submit-expense", icon: ReceiptText });
    if (cr.status === "submitted") availableActions.push({ label: "Revisar", action: "review", icon: Search2 as any });
    if (["reimbursement", "refund"].includes(cr.status)) availableActions.push({ label: "Cerrar Liquidación", action: "close", icon: PackageCheck });
    if (!["closed", "rejected"].includes(cr.status)) availableActions.push({ label: "Rechazar", action: "reject", variant: "destructive", icon: XCircle });

    const fields = [
        { label: "ID", value: cr._id.slice(-12), mono: true },
        { label: "Proyecto", value: projectName },
        { label: "Beneficiario", value: beneficiaryName },
        { label: "Propósito", value: cr.purpose },
        { label: "Monto Solicitado", value: `${cr.requested_amount.toLocaleString()} ${cr.currency}` },
        cr.authorized_amount ? { label: "Monto Autorizado", value: `${cr.authorized_amount.toLocaleString()} ${cr.currency}` } : null,
        cr.expense_period_days ? { label: "Período de Gastos", value: `${cr.expense_period_days} días` } : null,
        cr.total_spent != null ? { label: "Total Gastado", value: `${cr.total_spent.toLocaleString()} ${cr.currency}` } : null,
        cr.balance != null ? {
            label: "Balance",
            value: cr.balance === 0 ? "0.00 — Exacto ✓"
                : cr.balance > 0 ? `+${cr.balance.toFixed(2)} ${cr.currency} (empresa debe)`
                    : `${cr.balance.toFixed(2)} ${cr.currency} (empleado devuelve)`,
        } : null,
        cr.expense_files?.length ? { label: "Archivos", value: `${cr.expense_files.length} documento(s)` } : null,
        { label: "Fecha creación", value: format(new Date(cr.createdAt), "d MMM yyyy, HH:mm", { locale: es }) },
    ].filter(Boolean) as { label: string; value: string; mono?: boolean }[];

    return (
        <Dialog open={!!cr} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" /> Detalle de Solicitud de Caja
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2 py-1">
                    <StatusBadge status={cr.status} />
                    <span className="text-xs text-muted-foreground">Creada {format(new Date(cr.createdAt), "d MMM yyyy", { locale: es })}</span>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {fields.map(({ label, value, mono }) => (
                        <div key={label} className="flex justify-between items-start gap-4 py-1.5 border-b border-border/50 last:border-0">
                            <span className="text-sm text-muted-foreground shrink-0">{label}</span>
                            <span className={cn("text-sm text-right", mono && "font-mono")}>{value}</span>
                        </div>
                    ))}
                    {cr.notes && (
                        <div className="bg-muted/30 rounded-lg px-3 py-2 text-sm">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Notas</p>
                            <p>{cr.notes}</p>
                        </div>
                    )}
                </div>

                {availableActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        {availableActions.map(({ label, action, variant = "default", icon: Icon }) => (
                            <Button key={action} size="sm" variant={variant} className="gap-1.5"
                                onClick={() => { onClose(); onAction(action); }}>
                                <Icon className="h-3.5 w-3.5" /> {label}
                            </Button>
                        ))}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function CashRequestsPage() {
    const router = useRouter();

    const [items, setItems] = useState<CashRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [showNew, setShowNew] = useState(false);
    const [detailCr, setDetailCr] = useState<CashRequest | null>(null);
    const [actionCr, setActionCr] = useState<CashRequest | null>(null);
    const [currentAction, setCurrentAction] = useState<ActionType>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
            const token = Cookies.get("token");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const data = await fetch(`${base}/cash-requests`, {
                headers,
                credentials: "include",
            }).then(r => r.json());
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

    // Summary counts
    const counts = useMemo(() => {
        const all = items.length;
        const active = items.filter(c => !["closed", "rejected"].includes(c.status)).length;
        const closed = items.filter(c => c.status === "closed").length;
        const total = items.reduce((s, c) => s + (c.authorized_amount ?? c.requested_amount), 0);
        return { all, active, closed, total };
    }, [items]);

    const handleOpenAction = (cr: CashRequest, action: ActionType) => {
        setActionCr(cr);
        setCurrentAction(action);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-muted/30">
            <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-primary/10">
                                <Wallet className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Solicitudes de Caja</h1>
                                <p className="text-sm text-muted-foreground">Gestiona los avances de efectivo y liquidaciones de gastos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button variant="outline" size="icon" onClick={fetchData} className="h-9 w-9">
                                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                            </Button>
                            <Button onClick={() => setShowNew(true)} className="gap-2">
                                <Plus className="h-4 w-4" /> Nueva Solicitud
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── Summary cards ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total", value: counts.all, icon: Wallet, color: "text-primary" },
                        { label: "Activas", value: counts.active, icon: RefreshCw, color: "text-amber-600" },
                        { label: "Cerradas", value: counts.closed, icon: PackageCheck, color: "text-emerald-600" },
                        { label: "Monto Total", value: `${counts.total.toLocaleString()}`, icon: CreditCard, color: "text-violet-600" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <Card key={label} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl bg-muted", color)}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className="text-lg font-bold">{value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ── Filters ─────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Buscar por proyecto, propósito o ID…"
                            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            {Object.entries(STATUS_CFG).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* ── Table ──────────────────────────────────────────────────── */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="font-semibold">ID</TableHead>
                                <TableHead className="font-semibold">Proyecto</TableHead>
                                <TableHead className="font-semibold">Propósito</TableHead>
                                <TableHead className="font-semibold text-right">Solicitado</TableHead>
                                <TableHead className="font-semibold text-right">Autorizado</TableHead>
                                <TableHead className="font-semibold">Estado</TableHead>
                                <TableHead className="font-semibold">Fecha</TableHead>
                                <TableHead className="font-semibold text-center">Acciones</TableHead>
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
                                        <p className="text-sm">No se encontraron solicitudes de caja</p>
                                    </TableCell>
                                </TableRow>
                            ) : paginated.map(cr => {
                                const projectName = cr.project_id && typeof cr.project_id === "object" ? cr.project_id.name : String(cr.project_id ?? "—");
                                return (
                                    <TableRow key={cr._id} className="group hover:bg-muted/20 transition-colors">
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            …{cr._id.slice(-8)}
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[140px] truncate">{projectName}</TableCell>
                                        <TableCell className="max-w-[200px] truncate text-sm">{cr.purpose}</TableCell>
                                        <TableCell className="text-right font-semibold tabular-nums">
                                            {cr.requested_amount.toLocaleString()}&nbsp;<span className="text-xs text-muted-foreground">{cr.currency}</span>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-sm">
                                            {cr.authorized_amount
                                                ? <>{cr.authorized_amount.toLocaleString()}&nbsp;<span className="text-xs text-muted-foreground">{cr.currency}</span></>
                                                : <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell><StatusBadge status={cr.status} /></TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(cr.createdAt), "d MMM yyyy", { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                                    onClick={() => setDetailCr(cr)}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                {cr.status === "created" && (
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600"
                                                        onClick={() => handleOpenAction(cr, "approve")}>
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {cr.status === "approved" && (
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-violet-600"
                                                        onClick={() => handleOpenAction(cr, "authorize")}>
                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {cr.status === "authorized" && (
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-teal-600"
                                                        onClick={() => handleOpenAction(cr, "pay")}>
                                                        <CreditCard className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {["paid", "expense_draft"].includes(cr.status) && (
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-indigo-600"
                                                        onClick={() => handleOpenAction(cr, "submit-expense")}>
                                                        <ReceiptText className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {cr.status === "submitted" && (
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-600"
                                                        onClick={() => handleOpenAction(cr, "review")}>
                                                        <Search className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {["reimbursement", "refund"].includes(cr.status) && (
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600"
                                                        onClick={() => handleOpenAction(cr, "close")}>
                                                        <PackageCheck className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                            <p className="text-xs text-muted-foreground">
                                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                    disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs px-2">{page} / {totalPages}</span>
                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                    disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* ── Dialogs ────────────────────────────────────────────────────── */}

            <NewCashRequestDialog
                open={showNew}
                onClose={() => setShowNew(false)}
                onCreated={fetchData}
            />

            <DetailDialog
                cr={detailCr}
                onClose={() => setDetailCr(null)}
                onAction={(action) => {
                    setActionCr(detailCr);
                    setCurrentAction(action);
                    setDetailCr(null);
                }}
            />

            <ActionDialog
                cr={actionCr}
                action={currentAction}
                onClose={() => { setActionCr(null); setCurrentAction(null); }}
                onDone={fetchData}
            />
        </div>
    );
}
