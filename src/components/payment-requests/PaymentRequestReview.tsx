"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, Calendar, DollarSign, User, Building, ArrowLeft, AlertCircle, Clock, ShieldCheck, ThumbsUp, ThumbsDown, CheckCircle, CreditCard, XCircle } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PaymentRequestReview({ type = "review" }: { type?: "review" | "authorize" | "pay" }) {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Action Dialog State
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [currentAction, setCurrentAction] = useState<'approve' | 'authorize' | 'pay' | 'reject' | null>(null);
    const [processingAction, setProcessingAction] = useState(false);

    // Form inputs
    const [notes, setNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const [debitedBankAccountId, setDebitedBankAccountId] = useState("");
    const [paymentProofUrl, setPaymentProofUrl] = useState("");

    // Data for dropdowns
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [businessUnit, setBusinessUnit] = useState<any>();
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const token = Cookies.get("session_token");
                const tenantDetailId = Cookies.get("tenantDetailId");

                const response = await fetch(`${API_BASE}/payment-requests/${id}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "x-tenant-detail-id": tenantDetailId || "",
                    },
                    credentials: "include",
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("Payment request not found");
                    }
                    throw new Error("Failed to fetch payment request details");
                }

                const result = await response.json();
                setBusinessUnit(result.project.business_unit_id || null)
                console.log("Fetched Data:", result); // Debugging
                setData(result);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
                toast.error("Error loading details");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, API_BASE]);

    useEffect(() => {
        // Fetch bank accounts on mount (or only when needed)
        const fetchAccounts = async () => {
            if (!businessUnit) return;
            try {
                const token = Cookies.get("session_token");
                const tenantDetailId = Cookies.get("tenantDetailId");
                const response = await fetch(`${API_BASE}/accounts/bu/${businessUnit}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "x-tenant-detail-id": tenantDetailId || "",
                    },
                    credentials: "include",
                });
                if (response.ok) {
                    const accounts = await response.json();
                    setBankAccounts(accounts);
                }
            } catch (e) {
                console.error("Failed to fetch accounts", e);
            }
        };
        fetchAccounts();
    }, [API_BASE, businessUnit]);

    const openActionDialog = (action: 'approve' | 'authorize' | 'pay' | 'reject') => {
        setCurrentAction(action);
        setNotes("");
        setRejectionReason("");
        setPaymentDate("");
        setDebitedBankAccountId("");
        setPaymentProofUrl("");
        setActionDialogOpen(true);
    };

    const submitAction = async () => {
        if (!data || !currentAction) return;
        setProcessingAction(true);

        try {
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            const endpoint = currentAction;
            let body: any = {};

            if (currentAction === 'approve') {
                body = { notes };
            } else if (currentAction === 'authorize') {
                body = {
                    notes,
                    payment_date: paymentDate,
                    debited_bank_account: debitedBankAccountId
                };
            } else if (currentAction === 'pay') {
                if (!paymentProofUrl) {
                    toast.error("Payment proof URL is required");
                    setProcessingAction(false);
                    return;
                }
                body = { payment_proof: paymentProofUrl, notes };
            } else if (currentAction === 'reject') {
                if (!rejectionReason) {
                    toast.error("Rejection reason is required");
                    setProcessingAction(false);
                    return;
                }
                body = { reason: rejectionReason };
            }

            const response = await fetch(`${API_BASE}/payment-requests/${id}/${endpoint}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "x-tenant-detail-id": tenantDetailId || "",
                },
                credentials: "include",
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to update status");
            }

            const updatedData = await response.json();
            setData(updatedData);

            toast.success(`Request ${currentAction}d successfully`); // simple pluralization
            setActionDialogOpen(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to update status");
        } finally {
            setProcessingAction(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full"></div>
                    <Loader2 className="relative h-12 w-12 animate-spin text-primary mb-4" />
                </div>
                <p className="text-muted-foreground animate-pulse">Loading request details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-destructive/10 p-6 rounded-full mb-4">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => router.back()} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </div>
        );
    }

    if (!data) return null;

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return "bg-green-100 text-green-700 border-green-200";
            case 'authorized': return "bg-blue-100 text-blue-700 border-blue-200";
            case 'approved': return "bg-indigo-100 text-indigo-700 border-indigo-200";
            case 'pending': return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case 'rejected': return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const renderActionButtons = () => {
        if (data.status === 'rejected' || data.status === 'paid') return null;

        return (
            <div className="flex gap-2">
                <Button
                    onClick={() => openActionDialog('reject')}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2"
                >
                    <XCircle className="h-4 w-4" />
                    Reject
                </Button>

                {data.status === 'pending' && (
                    <Button
                        onClick={() => openActionDialog('approve')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    >
                        <ThumbsUp className="h-4 w-4" />
                        Approve
                    </Button>
                )}

                {data.status === 'approved' && (
                    <Button
                        onClick={() => openActionDialog('authorize')}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        <ShieldCheck className="h-4 w-4" />
                        Authorize
                    </Button>
                )}

                {data.status === 'authorized' && (
                    <Button
                        onClick={() => openActionDialog('pay')}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                        <CreditCard className="h-4 w-4" />
                        Attend / Pay
                    </Button>
                )}

                <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="capitalize">{currentAction} Request</DialogTitle>
                            <DialogDescription>
                                {currentAction === 'reject' ? "Please provide a reason for rejection." :
                                    currentAction === 'approve' ? "You can add optional notes for approval." :
                                        currentAction === 'authorize' ? "Specify payment details for authorization." :
                                            "Upload proof of payment to complete this request."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {currentAction === 'reject' && (
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason for Rejection <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="Budget limit exceeded..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {currentAction === 'approve' && (
                                <div className="space-y-2">
                                    <Label htmlFor="app-notes">Notes (Optional)</Label>
                                    <Textarea
                                        id="app-notes"
                                        placeholder="Looks good to me..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            )}

                            {currentAction === 'authorize' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="auth-notes">Observations (Optional)</Label>
                                        <Textarea
                                            id="auth-notes"
                                            placeholder="Authorized for Friday payment..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="payment-date">Payment Date (Optional)</Label>
                                        <Input
                                            id="payment-date"
                                            type="date"
                                            value={paymentDate}
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bank-account">Debited Bank Account (Optional)</Label>
                                        <Select value={debitedBankAccountId} onValueChange={setDebitedBankAccountId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bankAccounts.map((acc) => (
                                                    <SelectItem key={acc.id} value={acc.id}>
                                                        {acc.bank_name} - {acc.alias} ({acc.currency}) - {acc.bank_account_type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            {currentAction === 'pay' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="proof">Payment Proof URL <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="proof"
                                            placeholder="https://storage.googleapis.com/.../voucher.jpg"
                                            value={paymentProofUrl}
                                            onChange={(e) => setPaymentProofUrl(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pay-notes">Observations (Optional)</Label>
                                        <Textarea
                                            id="pay-notes"
                                            placeholder="Paid via transfer #12345..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>Cancel</Button>
                            <Button
                                onClick={submitAction}
                                disabled={processingAction}
                                className={currentAction === 'reject' ? "bg-red-600 hover:bg-red-700" : ""}
                            >
                                {processingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {currentAction === 'pay' ? 'Mark as Paid' :
                                    currentAction === 'reject' ? 'Reject Request' :
                                        currentAction === 'authorize' ? 'Authorize Request' :
                                            'Approve Request'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-muted/50 py-8">
            <div className="container max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            className="h-10 w-10 rounded-full p-0 shrink-0 hover:bg-muted"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight">Payment Review</h1>
                                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20 capitalize">
                                    <ShieldCheck className="h-3 w-3" />
                                    {type} View
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                <span>Created {data.createdAt ? format(new Date(data.createdAt), "PPP") : "Unknown"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`px-4 py-1.5 text-sm font-medium border capitalize ${getStatusColor(data.status)}`}>
                            <span className="font-mono px-2 py-0.5 rounded text-sm">#{id.slice(-6).toUpperCase()}</span>
                            <span className="pr-2">•</span>
                            {data.status?.replace('_', ' ')}
                        </Badge>

                    </div>
                </div>

                {/* Status Alert */}
                {data.status !== 'paid' && data.status !== 'rejected' && (
                    <Alert className="mb-6 bg-blue-50/50 border-blue-200">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-blue-900 mb-1">Action Required</h4>
                                <p className="text-sm text-blue-800/80">
                                    Current Status: <span className="font-bold uppercase">{data.status}</span>.
                                    {data.status === 'pending' && " Please review and approve this request."}
                                    {data.status === 'approved' && " Please authorize this request for payment."}
                                    {data.status === 'authorized' && " Please process the payment and upload proof."}
                                </p>
                            </div>
                        </div>
                    </Alert>
                )}

                {data.status === 'paid' && (
                    <Alert className="mb-6 bg-green-50/50 border-green-200">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-green-100 rounded-full">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-green-900 mb-1">Payment Completed</h4>
                                <p className="text-sm text-green-800/80">
                                    This request has been fully processed and paid.
                                    {data.paymentProof && (
                                        <a href={data.paymentProof} target="_blank" rel="noopener noreferrer" className="ml-2 underline font-semibold">
                                            View Payment Proof
                                        </a>
                                    )}
                                </p>
                            </div>
                        </div>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Project & Vendor */}
                        <Card className="shadow-sm border-muted-foreground/20">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Building className="h-5 w-5 text-primary" />
                                    Project & Vendor
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Project</p>
                                        <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                                            <p className="font-semibold text-sm sm:text-base">
                                                {typeof data.project === 'object' ? data.project?.name : "Project ID"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1 truncate font-mono">
                                                {typeof data.project === 'object' ? data.project?.code : data.project_id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Vendor / Beneficiary</p>
                                        <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                                            <p className="font-semibold text-sm sm:text-base">
                                                {typeof data.provider_id === 'object' ? data.provider_id?.name : "Provider ID"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1 truncate font-mono">
                                                {typeof data.provider_id === 'object' ? data.provider_id?._id : data.provider_id}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financial Details */}
                        <Card className="shadow-sm border-muted-foreground/20 overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Financial Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 grid gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Amount (Subtotal)</p>
                                        <p className="text-xl font-semibold">{data.currency} {data.subtotal?.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Tax</p>
                                        <p className="text-xl font-semibold text-muted-foreground">{data.currency} {data.tax?.toFixed(2)}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-end bg-primary/5 -mx-6 -mb-6 p-6">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Amount</p>
                                        <p className="text-3xl font-bold text-primary">
                                            {data.currency} {data.total?.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground uppercase">
                                        {data.status}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex mt-2 pb-2 justify-end">
                                {renderActionButtons()}
                            </CardFooter>
                        </Card>

                    </div>

                    {/* Sidebar / Meta Details */}
                    <div className="space-y-6">
                        <Card className="shadow-sm border-muted-foreground/20 h-full">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Request Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Issue Date</p>
                                            <p className="text-sm text-foreground">
                                                {data.date ? format(new Date(data.date), "PPP") : "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Due Date</p>
                                            <p className="text-sm text-foreground">
                                                {data.dueDate ? format(new Date(data.dueDate), "PPP") : "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Payment Date</p>
                                            <p className="text-sm text-foreground">
                                                {data.payment_date ? format(new Date(data.payment_date), "PPP") : "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Created By</p>
                                            <p className="text-sm text-foreground break-all">
                                                {data.created_by.email || "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm font-medium mb-2">Description / Notes</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {data.notes || "No additional notes provided."}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
