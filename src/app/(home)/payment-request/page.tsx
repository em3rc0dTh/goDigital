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
import { useI18n } from "@/i18n/I18nProvider";
function StepShell({ children, step, total = 4 }: { children: React.ReactNode; step: number; total?: number }) {
    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col justify-center container max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
                {children}
            </div>
            <div className="shrink-0 pb-3 text-center text-xs text-gray-500">
                Step {step} of {total}
            </div>
        </div>
    );
}

function PageHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
    return (
        <div className="mb-4 space-y-3 shrink-0">
            <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl" />
                    <div className="relative p-2 sm:p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">{title}</h1>
                    {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
                </div>
            </div>
            <Separator />
        </div>
    );
}
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

export default function PaymentRequestPage() {
    const { t } = useI18n();
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
                    toast.error(t('PaymentRequestForm.toasts.projectsLoadError'));
                }
            } catch (error) {
                console.error(error);
                toast.error(t('PaymentRequestForm.toasts.projectsLoadError'));
            } finally {
                setLoadingProjects(false);
            }
        };
        const userEmail = Cookies.get("userEmail");
        setUserEmail(userEmail || "");
        fetchProjects();
    }, [t]);

    // Determine which form schema to load
    const getFormName = React.useCallback(() => {
        if (hasFiles === true) {
            return "payment_request_with_files";
        } else if (hasFiles === false && personType === "natural") {
            return "payment_request_natural_person";
        } else if (hasFiles === false && personType === "legal") {
            return "payment_request_legal_person";
        }
        return null;
    }, [hasFiles, personType]);

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
                    toast.error(t('PaymentRequestForm.toasts.schemaNotFound', { name: formName }));
                }

                if (providersRes.ok) {
                    const data = await providersRes.json();
                    setProviders(data);
                } else {
                    toast.error(t('PaymentRequestForm.toasts.providersNotFound'));
                }
            } catch (error) {
                console.error(error);
                toast.error(t('PaymentRequestForm.toasts.formDataLoadError'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getFormName, t]);

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
            toast.success(t('PaymentRequestForm.toasts.fileProcessSuccess'), {
                description: t('PaymentRequestForm.toasts.fileProcessSuccessDesc')
            });

            // Move to form view
            setStep(4);

        } catch (error) {
            console.error('File upload error:', error);
            toast.error(t('PaymentRequestForm.toasts.fileProcessError'), {
                description: t('PaymentRequestForm.toasts.fileProcessErrorDesc')
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

            toast.success(t('PaymentRequestForm.toasts.submitSuccess'), {
                description: t('PaymentRequestForm.toasts.submitSuccessDesc')
            });

            resetForm();
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error(t('PaymentRequestForm.toasts.submitError'), {
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

    const getTodayLocalISO = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const formatDateDisplay = (iso: string) => {
        if (!iso) return "";
        const [y, m, d] = iso.split("-");
        return `${d}/${m}/${y}`;
    };

    // Step 0: Project Selection
    if (step === 0) {
        if (loadingProjects) {
            return (
                <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground mt-4">{t('PaymentRequestForm.step1.loading')}</p>
                </div>
            );
        }

        return (
            <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
                <div className="flex flex-col flex-1 min-h-0 container max-w-4xl mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-2">

                    {/* Page header */}
                    <div className="shrink-0 mb-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl" />
                                <div className="relative p-2 sm:p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                    <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">{t('PaymentRequestForm.step1.title')}</h1>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t('PaymentRequestForm.step1.subtitle')}</p>
                            </div>
                        </div>
                        <Separator />
                    </div>

                    {/* Main card — fills remaining height */}
                    <Card className="flex flex-col flex-1 min-h-0 shadow-lg border-2 border-muted">
                        <CardHeader className="shrink-0 py-4 bg-muted/30 px-4 sm:px-6 border-b border-muted">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shrink-0">
                                    1
                                </span>
                                <div>
                                    <CardTitle className="text-base sm:text-lg font-semibold">{t('PaymentRequestForm.step1.cardTitle')}</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm mt-0.5">
                                        {t('PaymentRequestForm.step1.cardDesc')}
                                    </CardDescription>
                                </div>
                            </div>
                            {/* Search */}
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder={t('PaymentRequestForm.step1.searchPlaceholder')}
                                    className="pl-9 bg-background h-9 text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="flex flex-col flex-1 min-h-0 pt-4 px-4 sm:px-6 pb-4">
                            {paginatedProjects.length === 0 ? (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        {searchTerm ? t('PaymentRequestForm.step1.noProjects') : "No projects available. Please contact your administrator."}
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="flex flex-col flex-1 min-h-0">
                                    {/* Scrollable grid */}
                                    <div className="flex-1 min-h-0 overflow-y-auto">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
                                            {paginatedProjects.map((project: any) => (
                                                <button
                                                    key={project.id || project._id}
                                                    onClick={() => handleProjectSelect(project)}
                                                    className="group flex flex-col gap-3 p-4 rounded-xl border-2 border-muted bg-card hover:border-primary hover:shadow-md transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                                >
                                                    <div className="flex items-start gap-3 w-full">
                                                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors shrink-0">
                                                            <FolderKanban className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                                                {project.name}
                                                            </h3>
                                                            {project.description && (
                                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                                                    {project.description}
                                                                </p>
                                                            )}
                                                            {project.code && (
                                                                <p className="text-xs text-muted-foreground/70 mt-1.5 font-mono">
                                                                    {project.code}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pagination — pinned at bottom of card */}
                                    {totalPages > 1 && (
                                        <div className="shrink-0 flex flex-col-reverse sm:flex-row items-center justify-between border-t border-muted pt-3 mt-3 gap-3">
                                            <p className="text-xs text-muted-foreground">
                                                {t('PaymentRequestForm.step1.pagination', {
                                                    start: ((currentPage - 1) * ITEMS_PER_PAGE) + 1,
                                                    end: Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length),
                                                    total: filteredProjects.length
                                                })}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="h-8 text-xs"
                                                >
                                                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />{t('PaymentRequestForm.step1.previous')}
                                                </Button>
                                                <span className="text-xs text-muted-foreground px-1 tabular-nums">
                                                    {currentPage} / {totalPages}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="h-8 text-xs"
                                                >
                                                    {t('PaymentRequestForm.step1.next')}<ChevronRight className="h-3.5 w-3.5 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="shrink-0 pb-3 text-center text-xs text-gray-500">{t('PaymentRequestForm.step1.step')}</div>
            </div>
        );
    }

    // Step 1: Files Question
    if (step === 1) {
        return (
            <StepShell step={2}>
                <PageHeader icon={FileText} title={t('PaymentRequestForm.step2.title')} subtitle={`Project: ${selectedProject?.name}`} />

                <Card className="shadow-lg border-2 border-muted">
                    <CardHeader className="py-5 bg-muted/30 px-4 sm:px-6 border-b border-muted">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shrink-0">
                                2
                            </span>
                            <div>
                                <CardTitle className="text-base sm:text-lg font-semibold">{t('PaymentRequestForm.step2.cardTitle')}</CardTitle>
                                <CardDescription className="text-xs sm:text-sm mt-0.5">
                                    {t('PaymentRequestForm.step2.cardDesc')}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6 px-4 sm:px-6 pb-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Yes option */}
                            <button
                                onClick={() => handleFilesAnswer(true)}
                                className="group relative flex flex-col items-center justify-center gap-2 p-5 sm:p-6 rounded-xl border-2 border-muted bg-card hover:border-primary hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <Upload className="h-5 w-5 text-primary" />
                                </div>
                                <span className="font-semibold text-sm">{t('PaymentRequestForm.step2.yes')}</span>
                                <span className="text-xs text-muted-foreground text-center leading-relaxed">
                                    {t('PaymentRequestForm.step2.yesDesc')}
                                </span>
                            </button>

                            {/* No option */}
                            <button
                                onClick={() => handleFilesAnswer(false)}
                                className="group relative flex flex-col items-center justify-center gap-2 p-5 sm:p-6 rounded-xl border-2 border-muted bg-card hover:border-foreground hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2"
                            >
                                <div className="p-2.5 rounded-lg bg-muted group-hover:bg-muted/80 transition-colors">
                                    <FileText className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </div>
                                <span className="font-semibold text-sm">{t('PaymentRequestForm.step2.no')}</span>
                                <span className="text-xs text-muted-foreground text-center leading-relaxed">
                                    {t('PaymentRequestForm.step2.noDesc')}
                                </span>
                            </button>
                        </div>

                        <div className="pt-1 border-t border-muted">
                            <button
                                onClick={resetForm}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                            >
                                <ChevronLeft className="h-3 w-3" />
                                {t('PaymentRequestForm.step2.changeProject')}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </StepShell>
        );
    }

    // Step 2: Person Type Selection
    if (step === 2) {
        return (
            <StepShell step={3}>
                <PageHeader icon={FileText} title={t('PaymentRequestForm.step4.manual')} subtitle={`Project: ${selectedProject?.name}`} />

                <Card className="shadow-lg border-2 border-muted">
                    <CardHeader className="py-5 bg-muted/30 px-4 sm:px-6 border-b border-muted">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shrink-0">
                                3
                            </span>
                            <div>
                                <CardTitle className="text-base sm:text-lg font-semibold">{t('PaymentRequestForm.personType.cardTitle')}</CardTitle>
                                <CardDescription className="text-xs sm:text-sm mt-0.5">
                                    {t('PaymentRequestForm.personType.cardDesc')}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6 px-4 sm:px-6 pb-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Natural Person */}
                            <button
                                onClick={() => handlePersonType("natural")}
                                className="group relative flex flex-col items-start gap-3 p-5 sm:p-6 rounded-xl border-2 border-muted bg-card hover:border-primary hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-left"
                            >
                                <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    {/* Person icon inline */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{t('PaymentRequestForm.personType.natural')}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                        {t('PaymentRequestForm.personType.naturalDesc')}
                                    </p>
                                </div>
                            </button>

                            {/* Legal Person */}
                            <button
                                onClick={() => handlePersonType("legal")}
                                className="group relative flex flex-col items-start gap-3 p-5 sm:p-6 rounded-xl border-2 border-muted bg-card hover:border-primary hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-left"
                            >
                                <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    {/* Building icon inline */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{t('PaymentRequestForm.personType.legal')}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                        {t('PaymentRequestForm.personType.legalDesc')}
                                    </p>
                                </div>
                            </button>
                        </div>

                        <div className="pt-1 border-t border-muted">
                            <button
                                onClick={resetForm}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                            >
                                <ChevronLeft className="h-3 w-3" />
                                {t('PaymentRequestForm.personType.goBack')}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </StepShell>
        );
    }

    // Step 3: File Upload (only when hasFiles === true)
    if (step === 3 && hasFiles === true) {
        return (
            <StepShell step={3}>
                <PageHeader icon={Upload} title={t('PaymentRequestForm.step3.title')} subtitle={`Project: ${selectedProject?.name}`} />

                <Card className="shadow-lg border-2 border-muted">
                    <CardHeader className="py-5 bg-muted/30 px-4 sm:px-6 border-b border-muted">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shrink-0">
                                3
                            </span>
                            <div>
                                <CardTitle className="text-base sm:text-lg font-semibold">{t('PaymentRequestForm.step3.cardTitle')}</CardTitle>
                                <CardDescription className="text-xs sm:text-sm mt-0.5">
                                    {t('PaymentRequestForm.step3.cardDesc')}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6 px-4 sm:px-6 pb-6 space-y-4">
                        {/* Drop zone */}
                        <div className={`relative rounded-xl border-2 border-dashed transition-colors duration-200 ${isProcessing
                            ? "border-primary/40 bg-primary/5"
                            : uploadedFiles.length > 0
                                ? "border-emerald-400/60 bg-emerald-50/50 dark:bg-emerald-950/20"
                                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                            }`}>
                            <input
                                type="file"
                                id="file-upload"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                disabled={isProcessing}
                                className="hidden"
                            />
                            <label htmlFor="file-upload" className={`flex flex-col items-center justify-center gap-3 p-10 sm:p-14 text-center ${isProcessing ? "cursor-wait" : "cursor-pointer"}`}>
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                        <div>
                                            <p className="font-medium text-sm">{t('PaymentRequestForm.step3.processing')}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{t('PaymentRequestForm.step3.extracting')}</p>
                                        </div>
                                    </>
                                ) : uploadedFiles.length > 0 ? (
                                    <>
                                        <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">
                                                {t('PaymentRequestForm.step3.filesReady', { count: uploadedFiles.length, s: uploadedFiles.length > 1 ? "s" : "" })}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto truncate">
                                                {uploadedFiles.map(f => f.name).join(", ")}
                                            </p>
                                            <p className="text-xs text-muted-foreground/60 mt-2">{t('PaymentRequestForm.step3.clickToReplace')}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 rounded-full bg-muted">
                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{t('PaymentRequestForm.step3.clickToUpload')}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{t('PaymentRequestForm.step3.uploadDesc')}</p>
                                        </div>
                                    </>
                                )}
                            </label>
                        </div>

                        <div className="pt-1 border-t border-muted">
                            <button
                                onClick={resetForm}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                            >
                                <ChevronLeft className="h-3 w-3" />
                                {t('PaymentRequestForm.step3.goBack')}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </StepShell>
        );
    }

    // Step 4: Form Display - Loading
    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 gap-4">
                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium">{t('PaymentRequestForm.step4.loadingForm')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('PaymentRequestForm.step4.preparing')}</p>
                </div>
            </div>
        );
    }

    // Step 4: Form Display - Error
    if (!schemaData || !enrichedSchema) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
                <Card className="max-w-md w-full border-2 border-muted shadow-lg">
                    <CardHeader className="py-5 bg-muted/30 px-4 sm:px-6 border-b border-muted">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 shrink-0">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">{t('PaymentRequestForm.step4.configError')}</CardTitle>
                                <CardDescription className="text-xs mt-0.5">{t('PaymentRequestForm.step4.unableToLoad')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-5 px-4 sm:px-6 pb-5 space-y-4">
                        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                            <AlertDescription className="text-xs sm:text-sm">
                                {t('PaymentRequestForm.step4.contactAdmin')}
                            </AlertDescription>
                        </Alert>
                        <div className="pt-1 border-t border-muted">
                            <button
                                onClick={resetForm}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                            >
                                <ChevronLeft className="h-3 w-3" />
                                {t('PaymentRequestForm.step4.startOver')}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Step 4: Form Display - Main Form
    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0 container max-w-5xl mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-5 pb-2">

                {/* Fixed page header */}
                <div className="shrink-0 mb-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl" />
                                <div className="relative p-2 sm:p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">{t('PaymentRequestForm.step4.title')}</h1>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                    <p className="text-xs text-muted-foreground truncate">
                                        {t('PaymentRequestForm.step4.project')} <span className="font-medium">{selectedProject?.name}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {t('PaymentRequestForm.step4.date')} <span className="font-medium">{formatDateDisplay(formData.issueDate || getTodayLocalISO())}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground hidden sm:inline truncate">
                                        {hasFiles
                                            ? fileProcessed ? t('PaymentRequestForm.step4.reviewData') : t('PaymentRequestForm.step4.withFiles')
                                            : `${personType === "natural" ? t('PaymentRequestForm.step4.naturalPerson') : t('PaymentRequestForm.step4.legalPerson')}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">
                            <Info className="h-3 w-3 mr-1" />{t('PaymentRequestForm.step4.requiredFields')}
                        </Badge>
                    </div>
                    <Separator />
                </div>

                {/* Scrollable area */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3">

                    {/* AI extraction notice */}
                    {fileProcessed && (
                        <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <AlertDescription className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                                {t('PaymentRequestForm.step4.successAlert')}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Main form card */}
                    <Card className="shadow-lg border-2 border-muted relative overflow-hidden">

                        {/* Submitting overlay */}
                        {isSubmitting && (
                            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 mb-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                                <h3 className="text-base font-semibold mb-1">{t('PaymentRequestForm.step4.processingTitle')}</h3>
                                <p className="text-xs text-muted-foreground max-w-xs">
                                    {t('PaymentRequestForm.step4.processingDesc')}
                                </p>
                            </div>
                        )}

                        <CardHeader className="py-5 bg-muted/30 px-4 sm:px-6 border-b border-muted">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shrink-0">
                                    4
                                </span>
                                <div>
                                    <CardTitle className="text-base sm:text-lg font-semibold">{t('PaymentRequestForm.step4.cardTitle')}</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm mt-0.5">
                                        {hasFiles
                                            ? t('PaymentRequestForm.step4.cardDescWithFiles')
                                            : t('PaymentRequestForm.step4.cardDescManual')}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-2 px-4 sm:px-6 pb-6">
                            <SchemaForm
                                schema={enrichedSchema}
                                uiSchema={enhancedUiSchema || schemaData.uiSchema}
                                formData={formData}
                                onChange={handleFormChange}
                                onSubmit={handleSubmit}
                            >
                                <div className="mt-6 pt-4 border-t border-muted flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <Button
                                        type="submit"
                                        className="w-full sm:w-auto min-w-[200px] h-10 text-sm shadow-md hover:shadow-lg transition-all"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('PaymentRequestForm.step4.submitting')}</>
                                        ) : (
                                            <>{t('PaymentRequestForm.step4.submit')}<CheckCircle2 className="ml-2 h-4 w-4" /></>
                                        )}
                                    </Button>
                                    <button
                                        onClick={resetForm}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                                        disabled={isSubmitting}
                                    >
                                        <ChevronLeft className="h-3 w-3" />
                                        {t('PaymentRequestForm.step4.startOver')}
                                    </button>
                                </div>
                            </SchemaForm>
                        </CardContent>
                    </Card>

                    {/* Info footer */}
                    <Alert className="bg-muted/40 border-muted [&>svg]:translate-y-0 [&>svg]:top-auto">
                        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <AlertDescription className="text-xs text-muted-foreground leading-normal">
                            {t('PaymentRequestForm.step4.infoAlert')}
                        </AlertDescription>
                    </Alert>
                </div>
            </div>

            <div className="shrink-0 pb-3 text-center text-xs text-gray-500">{t('PaymentRequestForm.step4.step')}</div>
        </div>
    );
}