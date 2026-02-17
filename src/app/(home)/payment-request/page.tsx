"use client";

import React, { useEffect, useState } from "react";
import { SchemaForm } from "@/components/schema-form/SchemaForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, FileText, AlertCircle, Info, Upload, CheckCircle2, FolderKanban } from "lucide-react";
import Cookies from "js-cookie";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function PaymentRequestPage() {
    // Step management (0 = project selection, then 1-4 as before)
    const [step, setStep] = useState(0);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [hasFiles, setHasFiles] = useState(null);
    const [personType, setPersonType] = useState(null);

    // File upload states
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileProcessed, setFileProcessed] = useState(false);

    // Data states
    const [schemaData, setSchemaData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [projects, setProjects] = useState([]);
    const [providers, setProviders] = useState([]);

    // Pagination and Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 9;
    const [userEmail, setUserEmail] = useState(Cookies.get("userEmail") || "");
    // Initialize formData with default values
    const [formData, setFormData] = useState(() => {
        return {
            userIdCreator: userEmail || "",
            amount: 0,
            tax: 0,
            total_amount: 0,
            issueDate: (() => {
                const d = new Date();
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })(),
        };
    });

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    // Load projects on initial mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoadingProjects(true);
                const token = Cookies.get("session_token");
                const tenantDetailId = Cookies.get("tenantDetailId");
                const projectsRes = await fetch(`${API_BASE}/projects`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "x-tenant-detail-id": tenantDetailId || "",
                    },
                    credentials: "include",
                });

                if (projectsRes.ok) {
                    const data = await projectsRes.json();
                    // Filter for active projects only as per user request
                    const activeProjects = data.filter((p: any) => p.status === 'active');
                    setProjects(activeProjects);
                } else {
                    toast.error("Failed to load projects.");
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load projects.");
            } finally {
                setLoadingProjects(false);
            }
        };
        const userEmail = Cookies.get("userEmail");
        setUserEmail(userEmail || "");
        fetchProjects();
    }, []);

    // Determine which form schema to load
    const getFormName = () => {
        if (hasFiles === true) {
            return "payment_request_with_files";
        } else if (hasFiles === false && personType === "natural") {
            return "payment_request_natural_person";
        } else if (hasFiles === false && personType === "legal") {
            return "payment_request_legal_person";
        }
        return null;
    };

    // Fetch data when form type is determined
    useEffect(() => {
        const formName = getFormName();
        if (!formName) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const token = Cookies.get("session_token");
                const tenantDetailId = Cookies.get("tenantDetailId");
                const [schemaRes, providersRes] = await Promise.all([
                    fetch(`${API_BASE}/forms/name/${formName}`),
                    fetch(`${API_BASE}/entities?vendor_type=provider`, {
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "x-tenant-detail-id": tenantDetailId || "",
                        },
                        credentials: "include",
                    })
                ]);

                if (schemaRes.ok) {
                    const data = await schemaRes.json();
                    setSchemaData(data);
                } else {
                    toast.error(`Form schema '${formName}' not found.`);
                }

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
    }, [hasFiles, personType, API_BASE]);

    const handleProjectSelect = (project: any) => {
        setSelectedProject(project);
        setFormData(prev => ({
            ...prev,
            project: project._id || project.id,
            projectName: project.name
        }));
        setStep(1); // Move to file question step
    };

    const handleFilesAnswer = (answer: any) => {
        setHasFiles(answer);
        setFormData(prev => ({ ...prev, hasFiles: answer }));

        if (answer === true) {
            setStep(3); // Will show file upload step
        } else {
            setStep(2); // Go to person type selection
        }
    };

    const handlePersonType = (type: any) => {
        setPersonType(type);
        setFormData(prev => ({ ...prev, personType: type }));
        setStep(4); // Will load form directly for manual entry
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploadedFiles(Array.from(files));
        setIsProcessing(true);

        try {
            const formDataUpload = new FormData();
            Array.from(files).forEach((file) => {
                formDataUpload.append('files', file);
            });

            // Upload files to agent endpoint
            const response = await fetch(`${API_BASE}/n8n/read_payment_request`, {
                method: 'POST',
                body: formDataUpload,
            });

            if (!response.ok) {
                throw new Error('File processing failed');
            }

            const extractedData = await response.json();
            console.log("Extracted Data (Raw):", extractedData);

            // Normalize keys (trim whitespace)
            const normalizedExtracted: any = {};
            Object.keys(extractedData).forEach(key => {
                normalizedExtracted[key.trim()] = extractedData[key];
            });

            // Map extracted data to form fields
            const mappedData: any = {};

            // Helper to clean currency strings
            const parseAmount = (val: any) => {
                if (typeof val === 'number') return val;
                if (!val) return 0;
                return parseFloat(val.toString().replace(/[^0-9.-]+/g, ""));
            };

            // Helper to parse dates (DD/MM/YYYY to YYYY-MM-DD)
            const parseDate = (dateStr: string) => {
                if (!dateStr) return undefined;

                const clean = dateStr.toString().trim();
                console.log(`Parsing date: ${clean}`);

                // If already in YYYY-MM-DD
                if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

                // Handle "DD/MM/YYYY" or "DD-MM-YYYY"
                const parts = clean.split(/[\/\-]/);
                if (parts.length === 3) {
                    // Check for Year last (DD/MM/YYYY)
                    if (parts[2].length === 4) {
                        const d = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        console.log(`Parsed DD/MM/YYYY to: ${d}`);
                        return d;
                    }
                    // Check for Year first (YYYY/MM/DD)
                    if (parts[0].length === 4) {
                        const d = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                        console.log(`Parsed YYYY/MM/DD to: ${d}`);
                        return d;
                    }
                }
                return clean; // Fallback to original if unknown format
            };

            if (normalizedExtracted["Amount"]) mappedData.amount = parseAmount(normalizedExtracted["Amount"]);
            if (normalizedExtracted["Tax"]) mappedData.tax = parseAmount(normalizedExtracted["Tax"]);
            if (normalizedExtracted["Total Amount"]) mappedData.total_amount = parseAmount(normalizedExtracted["Total Amount"]);

            // if (normalizedExtracted["Issue Date"]) mappedData.issueDate = parseDate(normalizedExtracted["Issue Date"]);
            // Always set issueDate to today as per requirement
            mappedData.issueDate = (() => {
                const d = new Date();
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })();
            if (normalizedExtracted["Deadline"]) mappedData.deliveryDeadline = parseDate(normalizedExtracted["Deadline"]);

            if (normalizedExtracted["Currency"]) {
                const curr = normalizedExtracted["Currency"].toLowerCase();
                mappedData.currency = curr.includes("dolar") || curr.includes("usd") ? "USD" : "PEN";
            }

            if (normalizedExtracted["Payment description (auto-extracted from file)"]) {
                mappedData.description = normalizedExtracted["Payment description (auto-extracted from file)"];
            }

            if (normalizedExtracted["Additional Notes"]) {
                mappedData.notes = normalizedExtracted["Additional Notes"];
            }

            // Map items if present and convert parsed strings to numbers
            if (normalizedExtracted["Extracted Items (from files)"]) {
                const itemsRaw = normalizedExtracted["Extracted Items (from files)"];
                mappedData.items = itemsRaw.map((item: any) => ({
                    ...item,
                    quantity: parseAmount(item.quantity),
                    unit_price: parseAmount(item.unit_price),
                    total: parseAmount(item.total)
                }));
            }

            // Try to match beneficiary to a provider ID
            if (normalizedExtracted["Beneficiary"]) {
                const beneficiaryName = normalizedExtracted["Beneficiary"];
                console.log("Looking for beneficiary:", beneficiaryName);

                // Helper to normalize company names for comparison
                // Removes dots, extra spaces, and converts to lowercase
                const normalizeName = (name: string) => {
                    if (!name) return "";
                    return name.toLowerCase()
                        .replace(/\./g, "")     // Remove dots
                        .replace(/[,\-]/g, "")  // Remove commas, dashes
                        .replace(/\s+/g, " ")   // Normalize spaces
                        .trim();
                };

                const normalizedTarget = normalizeName(beneficiaryName);
                console.log("Normalized target:", normalizedTarget);

                const provider: any = providers.find((p: any) => {
                    if (!p) return false;
                    const name = normalizeName(p.name);
                    const businessName = normalizeName(p.businessName);

                    if (name === normalizedTarget || businessName === normalizedTarget) return true;

                    if (normalizedTarget.length > 3) {
                        const nameMatch = name.length > 0 && (name.includes(normalizedTarget) || normalizedTarget.includes(name));
                        const businessMatch = businessName.length > 0 && (businessName.includes(normalizedTarget) || normalizedTarget.includes(businessName));
                        return nameMatch || businessMatch;
                    }
                    return false;
                });

                if (provider) {
                    console.log("Match found:", provider.name);
                    mappedData.beneficiary = provider._id || provider.id;
                } else {
                    console.warn("No matching provider found for:", beneficiaryName);
                }
            }

            const userEmail = Cookies.get("userEmail");
            console.log("Setting userIdCreator to:", userEmail);

            setFormData((prev: any) => ({
                ...prev,
                ...extractedData, // Keep raw data
                ...mappedData,    // Apply mapped data
                userIdCreator: userEmail || prev.userIdCreator || "", // Ensure it's never undefined
                project: prev.project, // Keep selected project
                projectName: prev.projectName,
            }));

            setFileProcessed(true);
            toast.success("Files processed successfully!", {
                description: "Data has been extracted and populated in the form"
            });

            // Move to form view
            setStep(4);

        } catch (error) {
            console.error('File upload error:', error);
            toast.error("Failed to process files", {
                description: "Please try again or enter data manually"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const resetForm = () => {
        setStep(0);
        setSelectedProject(null);
        setHasFiles(null);
        setPersonType(null);
        setSchemaData(null);
        setUploadedFiles([]);
        setFileProcessed(false);
        const userEmail = Cookies.get("userEmail");
        setFormData({
            userIdCreator: userEmail || "",
            amount: 0,
            tax: 0,
            total_amount: 0,
            issueDate: (() => {
                const d = new Date();
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })(),
        });
    };

    useEffect(() => {
        console.log("Current formData:", formData);
    }, [formData]);

    const enrichedSchema: any = React.useMemo(() => {
        if (!schemaData) return null;
        const newSchema = JSON.parse(JSON.stringify(schemaData.schema));

        // Remove title to avoid duplication with page header
        delete newSchema.title;
        delete newSchema.description;

        const updateEnum = (key: any, items: any, valueKey: any, labelKey: any) => {
            if (newSchema.properties?.[key]) {
                const oneOfItems = items
                    .filter((i: any) => i[valueKey]) // Filter out items with undefined/null ID
                    .map((i: any) => ({
                        const: i[valueKey],
                        title: i[labelKey] || "Unknown"
                    }));

                if (oneOfItems.length > 0) {
                    newSchema.properties[key].oneOf = oneOfItems;

                    // RJSF sometimes needs type to be explicit
                    if (!newSchema.properties[key].type) {
                        newSchema.properties[key].type = "string";
                    }

                    delete newSchema.properties[key].enum;
                    delete newSchema.properties[key].enumNames;
                }
            }
        };

        // Use _id for projects (MongoDB ObjectId)
        ['project', 'projectId', 'userIdProject'].forEach(key =>
            updateEnum(key, projects, '_id', 'name')
        );

        // Use _id for providers (MongoDB ObjectId)
        ['provider', 'providerId', 'supplier', 'userIdProvider', 'beneficiary'].forEach(key =>
            updateEnum(key, providers, '_id', 'name')
        );

        // Ensure userIdCreator exists in properties since it's required
        if (!newSchema.properties.userIdCreator) {
            newSchema.properties.userIdCreator = {
                type: "string",
                title: "Created by"
            };
        }

        if (newSchema.properties.issueDate) {
            const today = new Date();
            const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            if (!newSchema.properties.issueDate.type) {
                newSchema.properties.issueDate.type = "string";
            }
            newSchema.properties.issueDate.default = localDate;
        }

        return newSchema;
    }, [schemaData, projects, providers]);

    const enhancedUiSchema = React.useMemo(() => {
        if (!schemaData?.uiSchema) return null;

        return {
            ...schemaData.uiSchema,
            "project": { "ui:widget": "SelectWidget" },
            "beneficiary": { "ui:widget": "SelectWidget" },
            "userIdCreator": { "ui:readonly": true, "ui:widget": "hidden" }, // Hide or make readonly
            "issueDate": { "ui:readonly": true },
        };
    }, [schemaData]);

    const handleFormChange = (e: any) => {
        // Create a copy of the form data
        const newData = { ...e.formData };

        // Auto-calculate Total Amount
        // Ensure values are treated as numbers
        const amount = parseFloat(newData.amount) || 0;
        const tax = parseFloat(newData.tax) || 0;

        // Calculate total (Amount + Tax)
        const calculatedTotal = Number((amount + tax).toFixed(2));

        // Only update if the value is different to avoid potential cycles
        // though strictly setting key values is usually fine in this direction
        newData.total_amount = calculatedTotal;

        console.log("Form changed:", newData);
        setFormData(newData);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: any) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        console.log("Form submitted:", e.formData);

        try {
            const data = e.formData;

            // Map form fields to backend payload
            const payload = {
                project_id: data.project,
                provider_id: data.beneficiary,
                subtotal: Number(data.amount),
                tax: Number(data.tax),
                total: Number(data.total_amount),
                currency: data.currency || "USD",
                date: data.issueDate || (() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                })(),
                dueDate: (data.deliveryDeadline || data.deadlineGet) ? (() => {
                    const d = new Date(data.deliveryDeadline || data.deadlineGet);
                    return !isNaN(d.getTime())
                        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        : undefined;
                })() : undefined,
                notes: data.description || data.notes,
                status: 'pending',
                userIdCreator: data.userIdCreator
            };
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");
            const response = await fetch(`${API_BASE}/payment-requests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "x-tenant-detail-id": tenantDetailId || "",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to submit payment request");
            }

            toast.success("Payment request submitted successfully!", {
                description: "Your request has been sent for approval"
            });

            resetForm();
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error("Submission failed", {
                description: error.message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter and Paginate Projects
    const filteredProjects = React.useMemo(() => {
        return projects.filter((project: any) =>
            project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [projects, searchTerm]);

    const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

    const paginatedProjects = React.useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProjects, currentPage]);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Step 0: Project Selection
    if (step === 0) {
        if (loadingProjects) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
                    <div className="relative">
                        <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full"></div>
                        <Loader2 className="relative h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground mt-4 text-center px-4">
                        Loading projects...
                    </p>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
                <div className="container max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">
                    <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl"></div>
                                <div className="relative p-2 sm:p-3 bg-primary/10 rounded-xl border border-primary/20">
                                    <FolderKanban className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words">
                                    Select Project
                                </h1>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                    Choose a project to create a payment request
                                </p>
                            </div>
                        </div>
                        <Separator />
                    </div>

                    <Card className="shadow-lg sm:shadow-xl border-2">
                        <CardHeader className="space-y-4 pb-6 sm:pb-8 bg-muted/30 px-4 sm:px-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl sm:text-2xl">Available Projects</CardTitle>
                                    <CardDescription className="text-sm sm:text-base mt-1">
                                        Select the project associated with this payment request
                                    </CardDescription>
                                </div>
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search by name, code or description..."
                                        className="pl-9 bg-background"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6">
                            {paginatedProjects.length === 0 ? (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {searchTerm ? "No projects found match your search criteria." : "No projects available. Please contact your administrator."}
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                                        {paginatedProjects.map((project: any) => (
                                            <button
                                                key={project.id || project._id}
                                                onClick={() => handleProjectSelect(project)}
                                                className="group relative p-4 sm:p-6 border-2 border-muted hover:border-primary rounded-lg transition-all hover:shadow-lg bg-card text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex flex-col h-full"
                                            >
                                                <div className="flex items-start gap-3 w-full">
                                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors shrink-0">
                                                        <FolderKanban className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm sm:text-base break-words group-hover:text-primary transition-colors">
                                                            {project.name}
                                                        </h3>
                                                        {project.description && (
                                                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                                                                {project.description}
                                                            </p>
                                                        )}
                                                        {project.code && (
                                                            <p className="text-xs text-muted-foreground mt-2">
                                                                Code: {project.code}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex flex-col-reverse sm:flex-row items-center justify-between border-t border-border pt-4 gap-4">
                                            <p className="text-sm text-muted-foreground">
                                                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} of {filteredProjects.length} projects
                                            </p>
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="h-8"
                                                >
                                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                                    Previous
                                                </Button>
                                                <span className="text-sm font-medium mx-2 sm:hidden">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="h-8"
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4 ml-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
                        Step 1 of 4
                    </div>
                </div>
            </div>
        );
    }

    // Step 1: Files Question
    if (step === 1) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
                <div className="container max-w-2xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">
                    <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl"></div>
                                <div className="relative p-2 sm:p-3 bg-primary/10 rounded-xl border border-primary/20">
                                    <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words">
                                    Payment Request
                                </h1>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                    Project: <span className="font-medium">{selectedProject?.name}</span>
                                </p>
                            </div>
                        </div>
                        <Separator />
                    </div>

                    <Card className="shadow-lg sm:shadow-xl border-2">
                        <CardHeader className="space-y-2 pb-6 sm:pb-8 bg-muted/30 px-4 sm:px-6">
                            <CardTitle className="text-xl sm:text-2xl">Step 2: Document Verification</CardTitle>
                            <CardDescription className="text-sm sm:text-base">
                                Does your payment request have files (quotation or purchase order or both)?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6">
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <button
                                    onClick={() => handleFilesAnswer(true)}
                                    className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => handleFilesAnswer(false)}
                                    className="w-full sm:flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
                                >
                                    No
                                </button>
                            </div>
                            <button
                                onClick={resetForm}
                                className="w-full mt-4 text-xs sm:text-sm text-gray-600 hover:text-gray-800 underline py-2"
                            >
                                ← Change project
                            </button>
                        </CardContent>
                    </Card>

                    <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
                        Step 2 of 4
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Person Type Selection
    if (step === 2) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
                <div className="container max-w-2xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">
                    <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl"></div>
                                <div className="relative p-2 sm:p-3 bg-primary/10 rounded-xl border border-primary/20">
                                    <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words">
                                    Payment Request
                                </h1>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                    Project: <span className="font-medium">{selectedProject?.name}</span>
                                </p>
                            </div>
                        </div>
                        <Separator />
                    </div>

                    <Card className="shadow-lg sm:shadow-xl border-2">
                        <CardHeader className="space-y-2 pb-6 sm:pb-8 bg-muted/30 px-4 sm:px-6">
                            <CardTitle className="text-xl sm:text-2xl">Step 3: Select Person Type</CardTitle>
                            <CardDescription className="text-sm sm:text-base">
                                Please select the type of person for this payment request
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6 space-y-3 sm:space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <button
                                    onClick={() => handlePersonType("natural")}
                                    className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
                                >
                                    Natural Person
                                </button>
                                <button
                                    onClick={() => handlePersonType("legal")}
                                    className="w-full sm:flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
                                >
                                    Legal Person
                                </button>
                            </div>
                            <button
                                onClick={resetForm}
                                className="w-full mt-2 sm:mt-4 text-xs sm:text-sm text-gray-600 hover:text-gray-800 underline py-2"
                            >
                                ← Go back
                            </button>
                        </CardContent>
                    </Card>

                    <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
                        Step 3 of 4
                    </div>
                </div>
            </div>
        );
    }

    // Step 3: File Upload (only when hasFiles === true)
    if (step === 3 && hasFiles === true) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
                <div className="container max-w-2xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">
                    <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl"></div>
                                <div className="relative p-2 sm:p-3 bg-primary/10 rounded-xl border border-primary/20">
                                    <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words">
                                    Upload Documents
                                </h1>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                    Project: <span className="font-medium">{selectedProject?.name}</span>
                                </p>
                            </div>
                        </div>
                        <Separator />
                    </div>

                    <Card className="shadow-lg sm:shadow-xl border-2">
                        <CardHeader className="space-y-2 pb-6 sm:pb-8 bg-muted/30 px-4 sm:px-6">
                            <CardTitle className="text-xl sm:text-2xl">Step 3: Upload Files</CardTitle>
                            <CardDescription className="text-sm sm:text-base">
                                Upload your quotation or purchase order. Our AI will extract the information automatically.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6 space-y-4">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 sm:p-12 text-center hover:border-primary/50 transition-colors">
                                <input
                                    type="file"
                                    id="file-upload"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileUpload}
                                    disabled={isProcessing}
                                    className="hidden"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    {isProcessing ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                            <p className="text-sm text-muted-foreground">Processing files...</p>
                                        </div>
                                    ) : uploadedFiles.length > 0 ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                                            <div>
                                                <p className="font-medium">{uploadedFiles.length} file(s) uploaded</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {uploadedFiles.map(f => f.name).join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4">
                                            <Upload className="h-12 w-12 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">Click to upload files</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    PDF, JPG, or PNG (max 10MB each)
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={resetForm}
                                    className="w-full sm:flex-1 text-sm text-gray-600 hover:text-gray-800 underline py-2"
                                >
                                    ← Go back
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
                        Step 3 of 4
                    </div>
                </div>
            </div>
        );
    }

    // Step 4: Form Display - Loading
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full"></div>
                    <Loader2 className="relative h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mt-4 text-center px-4">
                    Loading payment request form...
                </p>
            </div>
        );
    }

    // Step 4: Form Display - Error
    if (!schemaData || !enrichedSchema) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
                <Card className="max-w-lg w-full border-destructive/50">
                    <CardContent className="pt-6 px-4 sm:px-6">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                Form configuration not found. Please contact your administrator.
                            </AlertDescription>
                        </Alert>
                        <button
                            onClick={resetForm}
                            className="w-full mt-4 text-xs sm:text-sm text-gray-600 hover:text-gray-800 underline py-2"
                        >
                            ← Start over
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Step 4: Form Display - Main Form
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
            <div className="container max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-10">
                <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl"></div>
                                <div className="relative p-2 sm:p-3 bg-primary/10 rounded-xl border border-primary/20">
                                    <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words">
                                    Payment Request
                                </h1>
                                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 break-words">
                                    Project: <span className="font-medium">{selectedProject?.name}</span>
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    {hasFiles
                                        ? fileProcessed ? "Review Extracted Data" : "Payment Request with Files"
                                        : `Payment Request - ${personType === "natural" ? "Natural" : "Legal"} Person`}
                                </p>
                            </div>
                        </div>
                        <Badge variant="outline" className="w-fit self-start lg:self-center text-xs">
                            <Info className="h-3 w-3 mr-1" />
                            Required fields marked
                        </Badge>
                    </div>
                    <Separator />
                </div>

                {fileProcessed && (
                    <Alert className="mb-6 bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-sm text-green-800">
                            Data successfully extracted from uploaded files. Please review and confirm the information below.
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="shadow-lg sm:shadow-xl border-2 relative overflow-hidden">
                    {isSubmitting && (
                        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full"></div>
                                <Loader2 className="relative h-12 w-12 animate-spin text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">Processing Payment Request</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                We are saving your request and sending email notifications to the project owner.
                            </p>
                        </div>
                    )}

                    <CardHeader className="space-y-2 pb-6 sm:pb-8 bg-muted/30 px-4 sm:px-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-xl sm:text-2xl break-words">Request Details</CardTitle>
                                <CardDescription className="mt-1.5 text-xs sm:text-sm break-words">
                                    {hasFiles
                                        ? "Review and confirm the automatically extracted information"
                                        : "Complete all required information to process your payment request"}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6 sm:pt-8 space-y-6 sm:space-y-8 px-4 sm:px-6">
                        <SchemaForm
                            schema={enrichedSchema}
                            uiSchema={enhancedUiSchema || schemaData.uiSchema}
                            formData={formData}
                            onChange={handleFormChange}
                            onSubmit={handleSubmit}
                        >
                            <div className="mt-6">
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto min-w-[200px] h-11 text-base shadow-md hover:shadow-lg transition-all"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Payment Request
                                            <CheckCircle2 className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </SchemaForm>

                        <button
                            onClick={resetForm}
                            className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 underline py-2"
                            disabled={isSubmitting}
                        >
                            ← Start over
                        </button>
                    </CardContent>
                </Card>

                <div className="mt-6 sm:mt-8 space-y-4">
                    <Alert className="bg-muted/50">
                        <Info className="h-4 w-4 shrink-0" />
                        <AlertDescription className="text-xs sm:text-sm break-words">
                            All payment requests are subject to review and approval. You will receive a notification once your request has been processed.
                        </AlertDescription>
                    </Alert>
                </div>

                <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
                    Step 4 of 4
                </div>
            </div>
        </div>
    );
}