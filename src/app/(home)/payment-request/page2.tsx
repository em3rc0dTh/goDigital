"use client";

import React, { useEffect, useState } from "react";
import { SchemaForm } from "@/components/schema-form/SchemaForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, FileText, AlertCircle, Info } from "lucide-react";
import Cookies from "js-cookie";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function PaymentRequestPage() {
    const [schemaData, setSchemaData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [providers, setProviders] = useState([]);

    // Initialize formData with default values immediately
    const [formData, setFormData] = useState(() => {
        const userEmail = Cookies.get("userEmail");
        return {
            userIdCreator: userEmail || "",
            amount: 0,
            tax: 0,
            total_amount: 0,
            hasQuotation: false,
            hasPurchaseOrder: false,
            items: []
        };
    });

    const API_BASE =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true); // Ensure loading is true at start
                const name = "payment_request";
                const [schemaRes, projectsRes, providersRes] = await Promise.all([
                    fetch(`${API_BASE}/forms/name/${name}`),
                    fetch(`/api/projects`),
                    fetch(`/api/providers`)
                ]);

                // Handle Schema
                if (schemaRes.ok) {
                    const data = await schemaRes.json();
                    setSchemaData(data);
                } else {
                    toast.error(`Form schema '${name}' not found.`);
                }

                // Handle Projects
                if (projectsRes.ok) {
                    const data = await projectsRes.json();
                    setProjects(data);
                } else {
                    toast.error("Projects not found.");
                }

                // Handle Providers
                if (providersRes.ok) {
                    const data = await providersRes.json();
                    setProviders(data);
                } else {
                    toast.error("Providers not found.");
                }

            } catch (error) {
                console.error(error);
                toast.error("Failed to load form data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_BASE]);

    // Debug log to see formData changes
    useEffect(() => {
        console.log("Current formData:", formData);
    }, [formData]);

    const enrichedSchema = React.useMemo(() => {
        if (!schemaData) return null;
        const newSchema = JSON.parse(JSON.stringify(schemaData.schema));

        const updateEnum = (key: string, items: any[], valueKey: string, labelKey: string) => {
            if (newSchema.properties?.[key]) {
                newSchema.properties[key].oneOf = items.map((i: any) => ({
                    const: i[valueKey],
                    title: i[labelKey]
                }));

                // Remove enum/enumNames to favor oneOf
                delete newSchema.properties[key].enum;
                delete newSchema.properties[key].enumNames;
            }
        };

        // Try common field names for Projects
        ['project', 'projectId', 'userIdProject'].forEach(key =>
            updateEnum(key, projects, 'id', 'name')
        );

        // Try common field names for Providers
        ['provider', 'providerId', 'supplier', 'userIdProvider', 'beneficiary'].forEach(key =>
            updateEnum(key, providers, 'company_id', 'name')
        );

        return newSchema;
    }, [schemaData, projects, providers]);

    // Enhanced UI Schema with better organization
    const enhancedUiSchema = React.useMemo(() => {
        if (!schemaData?.uiSchema) return null;

        return {
            ...schemaData.uiSchema,
            "project": { "ui:widget": "SelectWidget" },
            "beneficiary": { "ui:widget": "SelectWidget" },
            "ui:order": [
                "userIdCreator",
                "beneficiary",
                "project",
                "date",
                "deadlineGet",
                "currency",
                "hasQuotation",
                "quotationFile",
                "hasPurchaseOrder",
                "purchaseOrderFile",
                "amount",
                "tax",
                "total_amount",
                "items",
                "notes",
                "parsedDocuments"
            ]
        };
    }, [schemaData]);

    const handleFormChange = (e: any) => {
        console.log("Form changed:", e.formData);
        setFormData(e.formData);
    };

    const handleSubmit = (e: any) => {
        console.log("Form submitted:", e.formData);
        toast.success("Payment request submitted successfully!", {
            description: "Your request has been sent for approval"
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full"></div>
                    <Loader2 className="relative h-12 w-12 animate-spin text-primary mb-4" />
                </div>
                <p className="text-muted-foreground mt-4">Loading payment request form...</p>
            </div>
        );
    }

    if (!schemaData || !enrichedSchema) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Card className="max-w-lg w-full border-destructive/50">
                    <CardContent className="pt-6">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Form configuration not found. Please contact your administrator.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
            <div className="container max-w-6xl mx-auto px-4 py-6 sm:py-10 sm:px-6 lg:px-8">
                {/* Enhanced Header Section */}
                <div className="mb-8 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl"></div>
                                <div className="relative p-3 bg-primary/10 rounded-xl border border-primary/20">
                                    <FileText className="h-7 w-7 text-primary" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                    Payment Request
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Create and submit a new payment request
                                </p>
                            </div>
                        </div>
                        <Badge variant="outline" className="w-fit">
                            <Info className="h-3 w-3 mr-1" />
                            Required fields marked
                        </Badge>
                    </div>

                    <Separator />
                </div>

                {/* Main Form Card */}
                <Card className="shadow-xl border-2">
                    <CardHeader className="space-y-2 pb-8 bg-muted/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">Request Details</CardTitle>
                                <CardDescription className="mt-1.5">
                                    Complete all required information to process your payment request
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-8 space-y-8">
                        {/* Debug Panel - Remove in production */}
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm font-semibold mb-2">Form Data Debug:</p>
                            <pre className="text-xs overflow-auto max-h-40">
                                {JSON.stringify(formData, null, 2)}
                            </pre>
                        </div>

                        <SchemaForm
                            // Removed destructive key prop
                            schema={enrichedSchema}
                            uiSchema={enhancedUiSchema || schemaData.uiSchema}
                            formData={formData}
                            onChange={handleFormChange}
                            onSubmit={handleSubmit}
                        />
                    </CardContent>
                </Card>

                {/* Footer Info */}
                <div className="mt-8 space-y-4">
                    <Alert className="bg-muted/50">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            All payment requests are subject to review and approval. You will receive a notification once your request has been processed.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </div>
    );
}