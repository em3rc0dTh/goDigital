"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Calendar, DollarSign, User, Building, ArrowLeft, AlertCircle, Clock } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { format } from "date-fns";
import { PaymentStatusFlow } from "@/components/payment-requests/PaymentStatusFlow";
import { useI18n } from "@/i18n/I18nProvider";

export default function PaymentRequestDetailPage() {
    const { t } = useI18n();
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

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full"></div>
                    <Loader2 className="relative h-12 w-12 animate-spin text-primary mb-4" />
                </div>
                <p className="text-muted-foreground animate-pulse">{t("PaymentRequestDetail.loading")}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-destructive/10 p-6 rounded-full mb-4">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{t("PaymentRequestDetail.error.title")}</h1>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => router.push('/payment-requests')} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("PaymentRequestDetail.error.goBack")}
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

    // logic to approximate dates
    const dates = {
        createdAt: data.createdAt,
        // If current status matches, use updatedAt as the date for that step
        [data.status === 'approved' ? 'approvedAt' :
            data.status === 'authorized' ? 'authorizedAt' :
                data.status === 'paid' ? 'paidAt' : '']: data.updatedAt
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
                            onClick={() => router.push('/payment-requests')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{t("PaymentRequestDetail.title")}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">#{id.slice(-6).toUpperCase()}</span>
                                <span>•</span>
                                <span>{t("PaymentRequestDetail.header.created")} {data.createdAt ? format(new Date(data.createdAt), "PPP") : "Unknown"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`px-4 py-1.5 text-sm font-medium border capitalize ${getStatusColor(data.status)}`}>
                            {t(`PaymentRequestDetail.status.${data.status?.toLowerCase() || 'pending'}`)}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Project & Vendor */}
                        <Card className="shadow-sm border-muted-foreground/20">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Building className="h-5 w-5 text-primary" />
                                    {t("PaymentRequestDetail.sections.projectVendor")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">{t("PaymentRequestDetail.fields.project")}</p>
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
                                        <p className="text-sm font-medium text-muted-foreground">{t("PaymentRequestDetail.fields.vendor")}</p>
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
                                    {t("PaymentRequestDetail.sections.financialDetails")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 grid gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">{t("PaymentRequestDetail.fields.subtotal")}</p>
                                        <p className="text-xl font-semibold">{data.currency} {data.subtotal?.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">{t("PaymentRequestDetail.fields.tax")}</p>
                                        <p className="text-xl font-semibold text-muted-foreground">{data.currency} {data.tax?.toFixed(2)}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-end bg-primary/5 -mx-6 -mb-6 p-6">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">{t("PaymentRequestDetail.fields.total")}</p>
                                        <p className="text-3xl font-bold text-primary">
                                            {data.currency} {data.total?.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground">
                                        {t("PaymentRequestDetail.fields.subjectToApproval")}
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
                                    {t("PaymentRequestDetail.sections.requestInfo")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">{t("PaymentRequestDetail.fields.issueDate")}</p>
                                            <p className="text-sm text-foreground">
                                                {data.date ? format(new Date(data.date), "PPP") : "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">{t("PaymentRequestDetail.fields.dueDate")}</p>
                                            <p className="text-sm text-foreground">
                                                {data.dueDate ? format(new Date(data.dueDate), "PPP") : "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">{t("PaymentRequestDetail.fields.createdBy")}</p>
                                            <p className="text-sm text-foreground break-all">
                                                {data.userIdCreator || "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm font-medium mb-2">{t("PaymentRequestDetail.fields.description")}</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {data.notes || t("PaymentRequestDetail.fields.noNotes")}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Status Flow */}
                <Card className="shadow-sm border-muted-foreground/20 my-6">
                    <CardContent className="pt-6">
                        <PaymentStatusFlow status={data.status} dates={dates} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
