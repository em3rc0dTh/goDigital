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
    const [userEmail, setUserEmail] = useState(Cookies.get("userEmail") || "");
    // Initialize formData with default values
    const [formData, setFormData] = useState(() => {
        return {
            userIdCreator: userEmail || "",
            amount: 0,
            tax: 0,
            total_amount: 0,
        };
    });

    const API_BASE =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    // Load projects on initial mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoadingProjects(true);
                const projectsRes = await fetch(`/api/projects`);

                if (projectsRes.ok) {
                    const data = await projectsRes.json();
                    setProjects(data);
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
                const [schemaRes, providersRes] = await Promise.all([
                    fetch(`${API_BASE}/forms/name/${formName}`),
                    fetch(`/api/providers`)
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
            project: project.id,
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
            const userEmail = Cookies.get("userEmail");
            setFormData((prev: any) => ({
                ...prev,
                ...extractedData,
                userIdCreator: userEmail,
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
        });
    };

    useEffect(() => {
        console.log("Current formData:", formData);
    }, [formData]);

    const enrichedSchema: any = React.useMemo(() => {
        if (!schemaData) return null;
        const newSchema = JSON.parse(JSON.stringify(schemaData.schema));

        const updateEnum = (key: any, items: any, valueKey: any, labelKey: any) => {
            if (newSchema.properties?.[key]) {
                newSchema.properties[key].oneOf = items.map((i: any) => ({
                    const: i[valueKey],
                    title: i[labelKey]
                }));

                delete newSchema.properties[key].enum;
                delete newSchema.properties[key].enumNames;
            }
        };

        ['project', 'projectId', 'userIdProject'].forEach(key =>
            updateEnum(key, projects, 'id', 'name')
        );

        ['provider', 'providerId', 'supplier', 'userIdProvider', 'beneficiary'].forEach(key =>
            updateEnum(key, providers, 'company_id', 'name')
        );

        return newSchema;
    }, [schemaData, projects, providers]);

    const enhancedUiSchema = React.useMemo(() => {
        if (!schemaData?.uiSchema) return null;

        return {
            ...schemaData.uiSchema,
            "project": { "ui:widget": "SelectWidget" },
            "beneficiary": { "ui:widget": "SelectWidget" },
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
                        <CardHeader className="space-y-2 pb-6 sm:pb-8 bg-muted/30 px-4 sm:px-6">
                            <CardTitle className="text-xl sm:text-2xl">Available Projects</CardTitle>
                            <CardDescription className="text-sm sm:text-base">
                                Select the project associated with this payment request
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6">
                            {projects.length === 0 ? (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        No projects available. Please contact your administrator.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    {projects.map((project: any) => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleProjectSelect(project)}
                                            className="group relative p-4 sm:p-6 border-2 border-muted hover:border-primary rounded-lg transition-all hover:shadow-lg bg-card text-left"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
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
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
                        Step 1 of 5
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
                        Step 2 of 5
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
                        Step 3 of 5
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
                            <CardTitle className="text-xl sm:text-2xl">Step 4: Upload Files</CardTitle>
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
                        Step 4 of 5
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

                <Card className="shadow-lg sm:shadow-xl border-2">
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
                        />

                        <button
                            onClick={resetForm}
                            className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 underline py-2"
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
                    Step 5 of 5
                </div>
            </div>
        </div>
    );
}