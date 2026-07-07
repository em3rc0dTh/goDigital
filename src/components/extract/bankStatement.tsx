"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardContent,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Upload,
    Trash2,
    CheckCircle2,
    AlertCircle,
    FileText,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Download,
    Eye,
    Sparkles,
    ArrowRight,
    RefreshCw,
    Info,
    History,
    ArrowLeft,
    Calendar,
    Hash
} from "lucide-react";
import Cookies from "js-cookie";
import { useI18n } from "@/i18n/I18nProvider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BusinessTable } from "../table/transactionTable";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BankStatementProps {
    activeDatabase: string;
}

interface Transaction {
    descripcion?: string;
    movement?: string;
    amount?: number;
    monto?: number;
    [key: string]: any;
}

interface ProcessedData {
    transactions?: Transaction[];
    count?: number;
    totalIncome?: number;
    totalExpenses?: number;
    message?: string;
    [key: string]: any;
}

interface Summary {
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    netFlow: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPE = "application/pdf";

export default function BankStatement({ activeDatabase }: BankStatementProps) {
    const { t } = useI18n();
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [view, setView] = useState<"upload" | "history" | "details">("upload");
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);



    // Memoized summary calculations
    const summary: Summary = useMemo(() => {
        const totalTransactions = processedData?.transactions?.length || processedData?.count || 0;

        const totalIncome = processedData?.totalIncome ||
            processedData?.transactions?.reduce((acc: number, tx: Transaction) => {
                const amount = tx.amount !== undefined ? tx.amount : tx.monto || 0;
                return amount > 0 ? acc + Number(amount) : acc;
            }, 0) || 0;

        const totalExpenses = processedData?.totalExpenses ||
            processedData?.transactions?.reduce((acc: number, tx: Transaction) => {
                const amount = tx.amount !== undefined ? tx.amount : tx.monto || 0;
                return amount < 0 ? acc + Math.abs(Number(amount)) : acc;
            }, 0) || 0;

        const netFlow = totalIncome - totalExpenses;

        return {
            totalTransactions,
            totalIncome,
            totalExpenses,
            netFlow
        };
    }, [processedData]);

    // Validate file
    const validateFile = useCallback((selectedFile: File): boolean => {
        if (selectedFile.type !== ACCEPTED_FILE_TYPE) {
            toast.error("Invalid file type", {
                description: "Please upload a PDF file only"
            });
            return false;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            toast.error("File too large", {
                description: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
            });
            return false;
        }

        return true;
    }, []);

    // Handle file selection
    const handleFileSelection = useCallback((selectedFiles: FileList | File[]) => {
        const validFiles = Array.from(selectedFiles).filter(validateFile);
        if (validFiles.length === 0) return;

        setFiles(prev => [...prev, ...validFiles]);
        setStatus(null);
        setProcessedData(null);
        setUploadProgress(0);

        toast.success("Files selected", {
            description: `${validFiles.length} file(s) ready to upload`
        });
    }, [validateFile]);

    // Drag and drop handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files?.length > 0) {
            handleFileSelection(e.dataTransfer.files);
        }
    }, [handleFileSelection]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            handleFileSelection(e.target.files);
        }
    }, [handleFileSelection]);

    // Upload handler
    const handleUpload = useCallback(async () => {
        if (files.length === 0) return;

        setUploading(true);
        setStatus(null);
        setUploadProgress(0);

        // Simulate progress
        progressIntervalRef.current = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    if (progressIntervalRef.current) {
                        clearInterval(progressIntervalRef.current);
                    }
                    return 90;
                }
                return prev + 10;
            });
        }, 200);

        const formData = new FormData();
        files.forEach(f => formData.append("files", f));
        formData.append("entityId", activeDatabase);

        try {
            const token = Cookies.get("session_token");
            const res = await fetch(`${API_BASE}/statements/upload`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                credentials: "include",
                body: formData,
            });

            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            setUploadProgress(100);

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Upload failed: ${res.statusText}`);
            }

            toast.success("Upload successful", {
                description: "Statements are processing in the background."
            });

            // Clear files and switch to history
            setTimeout(() => {
                setFiles([]);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                setView("history");
            }, 1000);

        } catch (error: any) {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }

            console.error("Upload error:", error.message || 'Unknown error');
            const errorMessage = error.message || t("Extract.BankStatement.error");
            setStatus({ type: 'error', message: errorMessage });
            setUploadProgress(0);

            toast.error("Upload failed", {
                description: errorMessage
            });
        } finally {
            setTimeout(() => setUploading(false), 500);
        }
    }, [files, activeDatabase, API_BASE, t]);

    // Preview file handler
    const handlePreview = useCallback((file: File) => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        const url = URL.createObjectURL(file);
        setPreviewFile(file);
        setPreviewUrl(url);
        setIsPreviewOpen(true);
    }, [previewUrl]);

    // Remove file handler
    const handleRemoveFile = useCallback((index?: number) => {
        if (index !== undefined) {
            setFiles(prev => prev.filter((_, i) => i !== index));
        } else {
            setFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
        setStatus(null);
        setUploadProgress(0);
    }, []);

    // History fetching
    const fetchHistory = useCallback(async (silent = false) => {
        if (!silent) setLoadingHistory(true);
        try {
            const token = Cookies.get("session_token");
            const res = await fetch(`${API_BASE}/statements`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to fetch history");
            const data = await res.json();
            setHistory(data.statements || []);
            if (!silent) setView("history");
        } catch (error) {
            console.error("History fetch error:", error);
            if (!silent) toast.error("Error loading historical statements");
        } finally {
            if (!silent) setLoadingHistory(false);
        }
    }, [API_BASE]);

    // Polling for history
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (view === "history") {
            interval = setInterval(() => {
                fetchHistory(true);
            }, 10000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [view, fetchHistory]);

    const fetchHistoryDetails = useCallback(async (fileId: string, accountNumber?: string) => {
        setLoadingHistory(true);
        try {
            const token = Cookies.get("session_token");
            const url = accountNumber 
                ? `${API_BASE}/statements/${fileId}?accountNumber=${encodeURIComponent(accountNumber)}`
                : `${API_BASE}/statements/${fileId}`;
            
            const res = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to fetch statement details");
            const data = await res.json();
            
            // Re-use logic for processedData
            const txs = data.transactions || data;
            setProcessedData({
                transactions: txs,
                count: txs.length,
                totalIncome: txs.reduce((acc: number, tx: any) => tx.amount > 0 ? acc + tx.amount : acc, 0),
                totalExpenses: txs.reduce((acc: number, tx: any) => tx.amount < 0 ? acc + Math.abs(tx.amount) : acc, 0)
            });
            setView("details");
        } catch (error) {
            console.error("Details fetch error:", error);
            toast.error("Error loading statement details");
        } finally {
            setLoadingHistory(false);
        }
    }, [API_BASE]);

    // Reset handler
    const handleReset = useCallback(() => {
        setProcessedData(null);
        setStatus(null);
        toast.info("Ready for new upload");
    }, []);

    // Export handler
    const handleExport = useCallback(() => {
        if (!processedData?.transactions) return;

        const dataStr = JSON.stringify(processedData.transactions, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Export successful", {
            description: "Transactions downloaded as JSON"
        });
    }, [processedData]);

    // Format currency
    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }, []);

    // Check if a field has more than 50% null values
    const shouldShowColumn = useCallback((fieldName: string) => {
        if (!processedData?.transactions || processedData.transactions.length === 0) return true;

        const nonNullCount = processedData.transactions.filter(tx =>
            tx[fieldName] !== null && tx[fieldName] !== undefined && tx[fieldName] !== ''
        ).length;

        const percentageNonNull = (nonNullCount / processedData.transactions.length) * 100;
        return percentageNonNull > 50;
    }, [processedData?.transactions]);

    // Determine which columns to show
    const showOperationNumber = useMemo(() => shouldShowColumn('operation_number'), [shouldShowColumn]);
    const showChannel = useMemo(() => shouldShowColumn('channel'), [shouldShowColumn]);

    // Normalize transactions for table
    const normalizedTransactions = useMemo(() => {
        if (!processedData?.transactions) return [];

        return processedData.transactions.map((tx: Transaction) => {
            // Remove unwanted fields
            const {
                balance: _balance,
                processed: _processed,
                processedAt: _processedAt,
                error: _error,
                __v: ___v,
                createdAt: _createdAt,
                updatedAt: _updatedAt,
                _id: __id,
                fileId: _fileId,
                fileName: _fileName,
                fecha_hora_raw: _fecha_hora_raw,
                currency_raw: _currency_raw,
                ...cleanTransaction
            } = tx;

            return {
                ...cleanTransaction,
                descripcion: tx.descripcion || tx.movement,
                monto: tx.amount !== undefined
                    ? tx.amount
                    : (tx.monto || 0) * (tx.movement?.toLowerCase().includes('cargo') ? -1 : 1)
            };
        });
    }, [processedData?.transactions]);

    return (
        <div className="w-full mx-auto space-y-6 pb-10">
            {/* Header Section */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                {view !== "upload" && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            if (view === "details") setView("history");
                                            else setView("upload");
                                            if (view === "history") setProcessedData(null);
                                        }}
                                        className="h-8 w-8 text-gray-500 hover:text-blue-600"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                )}
                                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    {view === "history" ? t("Extract.BankStatement.historyTitle") : t("Extract.BankStatement.title")}
                                </h1>
                            </div>
                            <p className="text-sm sm:text-base text-gray-600 mt-1">
                                {view === "history" ? t("Extract.BankStatement.historySubtitle") : t("Extract.BankStatement.subtitle")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {view === "upload" && !processedData && (
                            <Button
                                onClick={() => fetchHistory(false)}
                                variant="outline"
                                disabled={loadingHistory}
                                className="gap-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                            >
                                <History className={cn("w-4 h-4", loadingHistory && "animate-spin")} />
                                <span>{t("Extract.BankStatement.viewHistory")}</span>
                            </Button>
                        )}
                        {processedData && (
                            <Button
                                onClick={() => {
                                    handleReset();
                                    setView("upload");
                                }}
                                variant="outline"
                                className="gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span className="hidden sm:inline">Upload New</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Card */}
            {view === "upload" && !processedData && (
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-blue-600" />
                                        {t("Extract.BankStatement.title")}
                                    </CardTitle>
                                    <CardDescription className="text-gray-600 mt-1">
                                        {t("Extract.BankStatement.subtitle")}
                                    </CardDescription>
                                </div>
                                {files.length > 0 && (
                                    <Badge variant="secondary" className="text-xs px-3 py-1">
                                        Ready to upload {files.length} {files.length === 1 ? 'file' : 'files'}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                    </div>

                    <CardContent className="p-6 space-y-6">
                        {/* Upload Area */}
                        {files.length === 0 ? (
                            <div className="space-y-4">
                                <div
                                    onDragEnter={handleDragEnter}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className="relative"
                                >
                                    <label
                                        htmlFor="file-upload"
                                        className={cn(
                                            "flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer bg-gradient-to-br transition-all duration-300 group",
                                            isDragging
                                                ? "border-blue-500 from-blue-100 to-indigo-100 scale-[1.02]"
                                                : "border-gray-300 from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400"
                                        )}
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                                            <div className={cn(
                                                "w-20 h-20 mb-4 rounded-full flex items-center justify-center transition-all duration-300",
                                                isDragging ? "bg-blue-200 scale-110" : "bg-blue-100 group-hover:bg-blue-200"
                                            )}>
                                                <Upload className={cn(
                                                    "w-10 h-10 text-blue-600 transition-transform",
                                                    isDragging && "animate-bounce"
                                                )} />
                                            </div>
                                            <p className="mb-2 text-base font-semibold text-gray-700">
                                                {isDragging ? (
                                                    <span className="text-blue-600">Drop your file here</span>
                                                ) : (
                                                    <>
                                                        <span className="text-blue-600">Click to upload</span> or drag and drop
                                                    </>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500">PDF files only • Maximum 10MB</p>
                                            <div className="flex items-center gap-2 mt-4">
                                                <div className="h-px w-12 bg-gray-300"></div>
                                                <span className="text-xs text-gray-400 font-medium">Supported Format</span>
                                                <div className="h-px w-12 bg-gray-300"></div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-medium text-gray-600">PDF</span>
                                            </div>
                                        </div>
                                        <Input
                                            id="file-upload"
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            aria-label="Upload bank statement PDFs"
                                        />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-500">
                                {/* Files Preview List */}
                                <div className="space-y-3">
                                    {files.map((f, idx) => (
                                        <div key={`${f.name}-${idx}`} className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow">
                                                    <FileText className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate" title={f.name}>
                                                        {f.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {(f.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handlePreview(f)}
                                                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveFile(idx)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                        </div>
                                    ))}
                                </div>
                                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                                    <DialogContent className="max-w-5xl h-[85vh] p-0">
                                        <DialogHeader className="px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <DialogTitle className="text-xl font-bold">PDF Preview</DialogTitle>
                                                    {previewFile && <p className="text-sm text-gray-600 mt-1">{previewFile.name}</p>}
                                                </div>
                                            </div>
                                        </DialogHeader>
                                        {previewUrl && (
                                            <div className="w-full h-[calc(85vh-80px)] bg-gray-100">
                                                <iframe
                                                    src={previewUrl}
                                                    className="w-full h-full"
                                                    title="PDF Preview"
                                                />
                                            </div>
                                        )}
                                    </DialogContent>
                                </Dialog>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleRemoveFile()}
                                        className="gap-2 hover:bg-gray-50"
                                    >
                                        Clear All
                                    </Button>
                                    <Button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[140px] gap-2 shadow-md transition-all"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Processing
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
                                            </>
                                        )}
                                    </Button>
                                </div>

                                    {/* Upload Progress Bar */}
                                    {uploading && (
                                        <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                                                <span>Uploading and processing...</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ease-out rounded-full"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                        )}

                        {/* Status Messages */}
                        {status && (
                            <div
                                className={cn(
                                    "p-4 rounded-xl flex items-center gap-3 shadow-lg border-2 animate-in fade-in slide-in-from-top-2",
                                    status.type === 'success'
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                                        : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
                                )}
                            >
                                {status.type === 'success' ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 animate-in zoom-in" />
                                ) : (
                                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 animate-in zoom-in" />
                                )}
                                <p className={cn(
                                    "text-sm font-semibold flex-1",
                                    status.type === 'success' ? 'text-green-800' : 'text-red-800'
                                )}>
                                    {status.message}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* History Table */}
            {view === "history" && (
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-600" />
                            {t("Extract.BankStatement.historyTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingHistory ? (
                            <div className="p-20 text-center">
                                <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                                <p className="text-gray-500">Loading processed statements...</p>
                            </div>
                        ) : history.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Extract.BankStatement.file")}</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Extract.BankStatement.bank")}</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Extract.BankStatement.date")}</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Extract.BankStatement.transactions")}</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    {Object.entries(
                                        history.reduce((acc, stmt) => {
                                            const accNum = stmt.accountNumber || "Cuenta Desconocida";
                                            if (!acc[accNum]) acc[accNum] = [];
                                            acc[accNum].push(stmt);
                                            return acc;
                                        }, {} as Record<string, any[]>)
                                    ).map(([accNum, stmts]) => (
                                        <tbody key={accNum} className="divide-y divide-gray-100">
                                            <tr className="bg-indigo-50/50">
                                                <td colSpan={5} className="px-6 py-2 text-sm font-bold text-indigo-900 border-t border-b border-indigo-100">
                                                    💳 Cuenta: {accNum}
                                                </td>
                                            </tr>
                                            {stmts.map((stmt, index) => (
                                                <tr key={`${stmt.fileId || stmt._id}-${stmt.accountNumber || index}`} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                <FileText className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{stmt.fileName}</p>
                                                                {stmt.accountNumber && (
                                                                    <p className="text-xs text-gray-500 font-mono">{stmt.accountNumber}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {stmt.bank || "Unknown Bank"}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            {new Date(stmt.createdAt || Date.now()).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                                                            <Hash className="w-3 h-3 mr-1" />
                                                            {stmt.transactionCount}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => fetchHistoryDetails(stmt.fileId || stmt._id, stmt.accountNumber)}
                                                            className="opacity-0 group-hover:opacity-100 transition-all gap-2"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Ver Detalle
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    ))}
                                </table>
                            </div>
                        ) : (
                            <div className="p-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">No statements found</h3>
                                <p className="text-gray-500 mt-1 max-w-xs mx-auto">
                                    You haven&apos;t processed any bank statements yet. Upload one to get started.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setView("upload")}
                                    className="mt-6 gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    Subir mi primer estado
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Processed Data Display */}
            {processedData && (
                <Card className="border-none shadow-xl bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                        <CheckCircle2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                                            {t("Extract.BankStatement.viewTransactions")}
                                            <Badge variant="secondary" className="text-xs">
                                                {summary.totalTransactions} items
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="text-gray-600 mt-1">
                                            Successfully processed bank statement data
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleExport}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 border-green-300 hover:bg-green-50 text-green-700 hover:border-green-400 transition-all shadow-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Export Data
                                </Button>
                            </div>
                        </CardHeader>
                    </div>

                    <CardContent className="p-6">
                        {processedData.transactions || processedData.count ? (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <SummaryCard
                                        icon={FileText}
                                        label="Total Transactions"
                                        value={summary.totalTransactions.toString()}
                                        gradient="from-blue-50 to-indigo-50"
                                        iconBg="bg-blue-100 group-hover:bg-blue-200"
                                        iconColor="text-blue-600"
                                        borderColor="border-blue-100 hover:border-blue-300"
                                    />

                                    <SummaryCard
                                        icon={TrendingUp}
                                        label="Inflow"
                                        value={formatCurrency(summary.totalIncome)}
                                        gradient="from-green-50 to-emerald-50"
                                        iconBg="bg-green-100 group-hover:bg-green-200"
                                        iconColor="text-green-600"
                                        valueColor="text-green-600"
                                        borderColor="border-green-100 hover:border-green-300"
                                    />

                                    <SummaryCard
                                        icon={TrendingDown}
                                        label="Outflow"
                                        value={formatCurrency(summary.totalExpenses)}
                                        gradient="from-red-50 to-rose-50"
                                        iconBg="bg-red-100 group-hover:bg-red-200"
                                        iconColor="text-red-600"
                                        valueColor="text-red-600"
                                        borderColor="border-red-100 hover:border-red-300"
                                    />

                                    <SummaryCard
                                        icon={DollarSign}
                                        label="Net Flow"
                                        value={formatCurrency(summary.netFlow)}
                                        gradient={summary.netFlow >= 0 ? "from-green-50 to-emerald-50" : "from-red-50 to-rose-50"}
                                        iconBg={summary.netFlow >= 0 ? "bg-green-100 group-hover:bg-green-200" : "bg-red-100 group-hover:bg-red-200"}
                                        iconColor={summary.netFlow >= 0 ? "text-green-600" : "text-red-600"}
                                        valueColor={summary.netFlow >= 0 ? "text-green-600" : "text-red-600"}
                                        borderColor={summary.netFlow >= 0 ? "border-green-100 hover:border-green-300" : "border-red-100 hover:border-red-300"}
                                    />
                                </div>

                                <Separator className="my-6" />

                                {/* Transactions Table */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                                        <Badge variant="outline" className="text-xs">
                                            All Transactions
                                        </Badge>
                                    </div>

                                    <div className="rounded-xl border-2 border-gray-200 overflow-hidden bg-white shadow-sm">
                                        {normalizedTransactions.length > 0 ? (
                                            <BusinessTable
                                                storedTransactions={normalizedTransactions}
                                                showOperationNumber={showOperationNumber}
                                                showChannel={showChannel}
                                                showBalance={false}
                                            />
                                        ) : (
                                            <div className="text-center py-12 px-4">
                                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                                </div>
                                                <p className="text-xl font-bold text-gray-900 mb-2">File Processed Successfully</p>
                                                <p className="text-sm text-gray-600">
                                                    Processed {processedData.count || 0} items from your bank statement.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200">
                                <div className="flex items-start gap-3 mb-3">
                                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Raw Response Data</h4>
                                        <p className="text-sm text-gray-600">The server returned the following data:</p>
                                    </div>
                                </div>
                                <pre className="text-xs text-gray-700 overflow-auto max-h-96 whitespace-pre-wrap font-mono bg-white p-4 rounded-lg border">
                                    {JSON.stringify(processedData, null, 2)}
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Summary Card Component
interface SummaryCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    gradient: string;
    iconBg: string;
    iconColor: string;
    valueColor?: string;
    borderColor: string;
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    gradient,
    iconBg,
    iconColor,
    valueColor = "text-gray-900",
    borderColor
}: SummaryCardProps) {
    return (
        <div className={cn(
            "group p-5 rounded-xl bg-gradient-to-br border-2 transition-all duration-300 hover:shadow-lg",
            gradient,
            borderColor
        )}>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-md",
                    iconBg
                )}>
                    <Icon className={cn("w-6 h-6", iconColor)} />
                </div>
                <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">{label}</p>
                    <p className={cn("text-2xl lg:text-3xl font-bold mt-1", valueColor)}>
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}