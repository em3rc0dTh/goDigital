"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2, FileText, Calendar, DollarSign, User, Building, ArrowLeft, AlertCircle, Clock, ShieldCheck, ThumbsUp, ThumbsDown } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PaymentRequestReviewPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
        if (!data) return;

        try {
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            const response = await fetch(`${API_BASE}/payment-requests/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "x-tenant-detail-id": tenantDetailId || "",
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error("Failed to update status");
            }

            const updatedData = await response.json();
            setData(updatedData);
            toast.success(`Request ${newStatus} successfully`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
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
            case 'approved': return "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200";
            case 'pending': return "bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-200";
            case 'rejected': return "bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200";
            default: return "bg-gray-500/15 text-gray-700 hover:bg-gray-500/25 border-gray-200";
        }
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
                                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                                    <ShieldCheck className="h-3 w-3" />
                                    Approver View
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">#{id.slice(-6).toUpperCase()}</span>
                                <span>•</span>
                                <span>Created {data.createdAt ? format(new Date(data.createdAt), "PPP") : "Unknown"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {data.status === 'pending' ? (
                            <div className="flex gap-2 mr-2">
                                <Button
                                    onClick={() => handleStatusUpdate('rejected')}
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2"
                                >
                                    <ThumbsDown className="h-4 w-4" />
                                    Reject
                                </Button>
                                <Button
                                    onClick={() => handleStatusUpdate('approved')}
                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                >
                                    <ThumbsUp className="h-4 w-4" />
                                    Approve
                                </Button>
                            </div>
                        ) : (
                            <Badge variant="outline" className={`px-4 py-1.5 text-sm font-medium border capitalize ${getStatusColor(data.status)}`}>
                                {data.status}
                            </Badge>
                        )}
                    </div>
                </div>

                <Alert className="mb-6 bg-blue-50/50 border-blue-200">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <ShieldCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-blue-900 mb-1">Approval Required</h4>
                            <p className="text-sm text-blue-800/80">
                                You are reviewing this payment request as an authorized approver. Please verify all financial and vendor details before taking action.
                            </p>
                        </div>
                    </div>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
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
                                    <div className="text-right text-xs text-muted-foreground">
                                        Pending Approval
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

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
                                                {typeof data.project_id === 'object' ? data.project_id?.name : "Project ID"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1 truncate font-mono">
                                                {typeof data.project_id === 'object' ? data.project_id?._id : data.project_id}
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
                                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Created By</p>
                                            <p className="text-sm text-foreground break-all">
                                                {data.userIdCreator || "-"}
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
