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
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2, Wallet, Calendar, User, Building, ArrowLeft, AlertCircle, 
    ShieldCheck, CheckCircle2, CreditCard, Search, XCircle, PackageCheck, ReceiptText
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Replicando los tipos básicos necesarios (Misma lógica de page.tsx)
type CRStatus = "created" | "approved" | "authorized" | "paid" | "expense_draft" | "submitted" | "under_review" | "closed" | "rejected" | "reimbursement" | "refund";
type ActionType = "approve" | "authorize" | "pay" | "submit-expense" | "review" | "close" | "reject" | null;

export default function CashRequestReview({ type = "review" }: { type?: string }) {
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

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

    const fetchDetails = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const token = Cookies.get("token");
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
    }, [id, API_BASE]);

    const openActionDialog = (action: ActionType) => {
        setCurrentAction(action);
        setForm({});
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
                case "submit-expense":
                    if (!form.totalSpent) throw new Error("Total gastado es requerido.");
                    body = {
                        totalSpent: Number(form.totalSpent),
                        files: form.files ? form.files.split(",").map(f => f.trim()).filter(Boolean) : [],
                        notes: form.notes,
                    }; break;
                case "review":
                    if (!form.totalSpent) throw new Error("Total gastado es requerido.");
                    body = { totalSpent: Number(form.totalSpent), notes: form.notes }; break;
                case "close":
                    body = { proof: form.proof, notes: form.notes }; break;
                case "reject":
                    if (!form.reason) throw new Error("Motivo es requerido.");
                    body = { reason: form.reason }; break;
            }

            const token = Cookies.get("token");
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

            toast.success(`Acción ${currentAction} realizada con éxito.`);
            setActionDialogOpen(false);
            fetchDetails(); // Recargar los detalles
            
        } catch (err: any) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setProcessingAction(false);
        }
    };

    const f = (key: string, v: string) => setForm(prev => ({ ...prev, [key]: v }));

    const renderActionButtons = () => {
        if (!data) return null;

        const availableActions = [];
        if (data.status === "created") availableActions.push({ label: "Aprobar", action: "approve" as ActionType, variant: "default", icon: CheckCircle2, className: "bg-emerald-600 hover:bg-emerald-700 text-white" });
        if (data.status === "approved") availableActions.push({ label: "Autorizar", action: "authorize" as ActionType, variant: "default", icon: ShieldCheck, className: "bg-violet-600 hover:bg-violet-700 text-white" });
        if (data.status === "authorized") availableActions.push({ label: "Desembolsar", action: "pay" as ActionType, variant: "default", icon: CreditCard, className: "bg-teal-600 hover:bg-teal-700 text-white" });
        if (["paid", "expense_draft"].includes(data.status)) availableActions.push({ label: "Enviar Gastos", action: "submit-expense" as ActionType, variant: "default", icon: ReceiptText, className: "bg-indigo-600 hover:bg-indigo-700 text-white" });
        if (data.status === "submitted") availableActions.push({ label: "Revisar Gastos", action: "review" as ActionType, variant: "default", icon: Search, className: "bg-amber-600 hover:bg-amber-700 text-white" });
        if (["reimbursement", "refund"].includes(data.status)) availableActions.push({ label: "Cerrar", action: "close" as ActionType, variant: "default", icon: PackageCheck, className: "bg-green-600 hover:bg-green-700 text-white" });

        const canReject = !["closed", "rejected", "paid"].includes(data.status);

        return (
            <div className="flex gap-2">
                {canReject && (
                    <Button onClick={() => openActionDialog("reject")} variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2">
                        <XCircle className="h-4 w-4" /> Rechazar
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
                <p className="text-muted-foreground animate-pulse">Cargando detalles de caja...</p>
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
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Bandeja
                </Button>
            </div>
        );
    }

    const projectName = data.project_id && typeof data.project_id === "object" ? data.project_id.name : String(data.project_id ?? "—");
    const createdByName = data.created_by ? (typeof data.created_by === "object" ? data.created_by.name || data.created_by.email : String(data.created_by)) : "—";
    const beneficiaryName = data.beneficiary_id ? (typeof data.beneficiary_id === "object" ? data.beneficiary_id.name || data.beneficiary_id.email : String(data.beneficiary_id)) : createdByName;

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
                                <h1 className="text-2xl font-bold tracking-tight">Revisión de Caja</h1>
                                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20 capitalize">
                                    <Wallet className="h-3 w-3" /> Cash Request
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                <span>Creado el {data.createdAt ? format(new Date(data.createdAt), "PPP", { locale: es }) : "—"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`px-4 py-1.5 text-sm font-medium border uppercase bg-muted/50`}>
                            <span className="font-mono px-2 py-0.5 rounded text-sm mr-2 opacity-70">#{id.slice(-6)}</span>
                            {data.status?.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
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
                                        <p className="text-sm font-medium text-muted-foreground">Proyecto</p>
                                        <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                                            <p className="font-semibold text-sm sm:text-base">{projectName}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Beneficiario / Responsable</p>
                                        <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                                            <p className="font-semibold text-sm sm:text-base">{beneficiaryName}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <p className="text-sm font-medium text-muted-foreground">Propósito</p>
                                        <div className="p-3 bg-muted/40 rounded-lg border border-border/50 font-medium">
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Solicitado</p>
                                        <p className="text-xl font-semibold">{data.requested_amount?.toLocaleString()}&nbsp;{data.currency}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Autorizado</p>
                                        <p className={cn("text-xl font-semibold", data.authorized_amount ? "text-primary" : "text-muted-foreground")}>
                                            {data.authorized_amount ? `${data.authorized_amount.toLocaleString()} ${data.currency}` : "—"}
                                        </p>
                                    </div>
                                    {data.total_spent != null && (
                                        <div className="space-y-1 col-span-2 pt-2 border-t">
                                            <p className="text-sm text-muted-foreground">Rendición de Gastos Enviada</p>
                                            <p className="text-xl font-semibold text-amber-600">{data.total_spent.toLocaleString()}&nbsp;{data.currency}</p>
                                            {data.balance != null && (
                                                <div className="text-sm mt-1">
                                                    Balance: <strong>
                                                    {data.balance === 0 ? "0.00 — Exacto ✓"
                                                        : data.balance > 0 ? `+${data.balance.toFixed(2)} ${data.currency} (empresa debe)`
                                                        : `${data.balance.toFixed(2)} ${data.currency} (empleado devuelve)`}
                                                    </strong>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
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
                                    <AlertCircle className="h-5 w-5 text-primary" />
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
                                    <p className="text-sm font-medium mb-2">Descripción / Notas Adicionales</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {data.notes || "Sin notas adicionales reportadas."}
                                    </p>
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
                                    <div className="space-y-2">
                                        <Label>Total Gastado *</Label>
                                        <Input type="number" min="0" step="0.01" value={form.totalSpent ?? ""} onChange={e => f("totalSpent", e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Archivos / URLs</Label>
                                        <Textarea value={form.files ?? ""} onChange={e => f("files", e.target.value)} placeholder="https://..." />
                                    </div>
                                </>
                            )}

                            {currentAction === "review" && (
                                <div className="space-y-2">
                                    <Label>Total Gastado (Modificar si aplica) *</Label>
                                    <Input type="number" min="0" step="0.01" value={form.totalSpent ?? data.total_spent ?? ""} onChange={e => f("totalSpent", e.target.value)} />
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
                            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>Cancelar</Button>
                            <Button
                                onClick={submitAction}
                                disabled={processingAction}
                                className={currentAction === 'reject' ? "bg-red-600 hover:bg-red-700 text-white" : "bg-primary"}
                            >
                                {processingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar {currentAction}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
