"use client";

import { useEffect, useState, useRef } from "react";
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
    Calendar,
    DollarSign,
    Download,
    Eye,
    X,
    Sparkles,
    ArrowRight,
    RefreshCw
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
    DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BankStatementProps {
    activeDatabase: string;
}

export default function BankStatement({ activeDatabase }: BankStatementProps) {
    const { t } = useI18n();
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [processedData, setProcessedData] = useState<any>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    useEffect(() => {
        if (processedData) {
            console.log("Backend connected and data received", processedData);
        }
    }, [processedData]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files[0] && files[0].type === 'application/pdf') {
            handleFileSelection(files[0]);
        }
    };

    const handleFileSelection = (selectedFile: File) => {
        setFile(selectedFile);

        // Create preview URL
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);

        setStatus(null);
        setProcessedData(null);
        setUploadProgress(0);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setStatus(null);
        setUploadProgress(0);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 200);

        const formData = new FormData();
        formData.append("file", file);
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

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Upload failed: ${res.statusText}`);
            }

            const data = await res.json();
            setProcessedData(data);
            setStatus({ type: 'success', message: data.message || t("Extract.BankStatement.success") });

            // Clear file and preview on success
            setTimeout(() => {
                setFile(null);
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                }
                if (fileInputRef.current) fileInputRef.current.value = "";
            }, 1000);

        } catch (error: any) {
            clearInterval(progressInterval);
            console.error("Upload error:", error);
            setStatus({ type: 'error', message: error.message || t("Extract.BankStatement.error") });
            setUploadProgress(0);
        } finally {
            setTimeout(() => setUploading(false), 500);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
        setStatus(null);
        setUploadProgress(0);
    };

    const handleReset = () => {
        setProcessedData(null);
        setStatus(null);
    };

    // Calculate summary statistics
    const summary = {
        totalTransactions: processedData?.transactions?.length || processedData?.count || 0,
        totalIncome: processedData?.totalIncome || processedData?.transactions?.reduce((acc: number, tx: any) => {
            const amount = tx.amount !== undefined ? tx.amount : tx.monto;
            return amount > 0 ? acc + Number(amount) : acc;
        }, 0) || 0,
        totalExpenses: processedData?.totalExpenses || processedData?.transactions?.reduce((acc: number, tx: any) => {
            const amount = tx.amount !== undefined ? tx.amount : tx.monto;
            return amount < 0 ? acc + Math.abs(Number(amount)) : acc;
        }, 0) || 0
    };

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
                            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                {t("Extract.BankStatement.title")}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-1">
                                {t("Extract.BankStatement.subtitle")}
                            </p>
                        </div>
                    </div>
                    {processedData && (
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            className="gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden sm:inline">Upload New</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Upload Card */}
            {!processedData && (
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
                                {file && (
                                    <Badge variant="secondary" className="text-xs px-3 py-1">
                                        Ready to upload
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                    </div>

                    <CardContent className="p-6 space-y-6">
                        {/* Upload Area */}
                        {!file ? (
                            <div className="space-y-4">
                                <div
                                    ref={dropZoneRef}
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
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-500">
                                {/* File Preview Card */}
                                <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-md">
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                                        <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                                <FileText className="w-7 h-7 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-bold text-gray-900 truncate">
                                                    {file.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs bg-white">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs bg-white">
                                                        PDF Document
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 md:flex-none gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Preview
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-5xl h-[85vh] p-0">
                                                    <DialogHeader className="px-6 py-4 bg-transparent">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <DialogTitle className="text-xl font-bold">PDF Preview</DialogTitle>
                                                                <p className="text-sm text-gray-600 mt-1">{file.name}</p>
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

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRemoveFile}
                                                className="flex-1 md:flex-none gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Remove
                                            </Button>

                                            <Button
                                                onClick={handleUpload}
                                                disabled={uploading}
                                                size="sm"
                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex-1 md:flex-none min-w-[120px] gap-2 shadow-lg hover:shadow-xl transition-all"
                                            >
                                                {uploading ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Processing
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-4 h-4" />
                                                        Upload
                                                        <ArrowRight className="w-4 h-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
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
                        {Array.isArray(processedData.transactions) || processedData.count ? (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="group p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors shadow-md">
                                                <FileText className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Transactions</p>
                                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                                    {summary.totalTransactions}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 hover:border-green-300 transition-all duration-300 hover:shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors shadow-md">
                                                <TrendingUp className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Income</p>
                                                <p className="text-3xl font-bold text-green-600 mt-1">
                                                    ${summary.totalIncome.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group p-5 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-100 hover:border-red-300 transition-all duration-300 hover:shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors shadow-md">
                                                <TrendingDown className="w-6 h-6 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Expenses</p>
                                                <p className="text-3xl font-bold text-red-600 mt-1">
                                                    ${summary.totalExpenses.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
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
                                        {processedData.transactions && processedData.transactions.length > 0 ? (
                                            <BusinessTable
                                                storedTransactions={processedData.transactions.map((tx: any) => ({
                                                    ...tx,
                                                    descripcion: tx.descripcion || tx.movement,
                                                    monto: tx.amount !== undefined ? tx.amount : (tx.monto * (tx.movement && tx.movement.toLowerCase().includes('cargo') ? -1 : 1))
                                                }))}
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
                                <pre className="text-xs text-gray-700 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                                    {JSON.stringify(processedData, null, 2)}
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                
                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
            `}</style>
        </div>
    );
}