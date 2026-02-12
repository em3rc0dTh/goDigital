
import React, { useState, useRef, useCallback } from "react";
import { WidgetProps } from "@rjsf/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Upload, Trash2, FileText, Eye } from "lucide-react";

export const FileWidget = (props: WidgetProps) => {
    const { id, readonly, disabled, required, onChange, options, value } = props;
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Internal state
    const [isDragging, setIsDragging] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    // Since RJSF only stores the dataURL in 'value', we try to reconstruct basic info or use generic if 'file-data' props are missing.
    // In a real app, you might want to store an object { name, size, type, data } if your backend supports it, 
    // or rely on just showing generic "File Selected" if you only have the Base64 string.
    // For this UI, we'll try to guess or use placeholder if we don't have the file object references anymore.
    const [localFile, setLocalFile] = useState<File | null>(null);

    // Helpers to extract info from value if it's a data URL
    const hasValue = !!value;

    const handleFileProcess = useCallback((file: File) => {
        setLocalFile(file);
        const reader = new FileReader();
        reader.onload = (upload) => {
            onChange(upload.target?.result);
        };
        reader.readAsDataURL(file);
    }, [onChange]);

    // Drag and Drop Handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !readonly) setIsDragging(true);
    }, [disabled, readonly]);

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
        if (disabled || readonly) return;

        const files = e.dataTransfer.files;
        if (files?.[0]) {
            handleFileProcess(files[0]);
        }
    }, [handleFileProcess, disabled, readonly]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            handleFileProcess(event.target.files[0]);
        }
    }, [handleFileProcess]);

    const handleRemove = useCallback(() => {
        setLocalFile(null);
        onChange(undefined);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [onChange]);

    const fileName = localFile?.name || (hasValue ? "Uploaded File" : "");
    const fileSize = localFile ? (localFile.size / 1024 / 1024).toFixed(2) + " MB" : (hasValue ? "Unknown Size" : "");

    return (
        <div className="mb-4">
            {!hasValue ? (
                // Empty / Upload State
                <div className="space-y-4">
                    <div
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="relative"
                    >
                        <label
                            htmlFor={id}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer bg-gradient-to-br transition-all duration-300 group",
                                isDragging
                                    ? "border-blue-500 from-blue-100 to-indigo-100 scale-[1.02]"
                                    : "border-gray-300 from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400",
                                (disabled || readonly) && "opacity-50 cursor-not-allowed pointer-events-none"
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
                                <p className="text-xs text-gray-500">
                                    {options.accept ? (options.accept as string).replace(/,/g, ", ") : "All files"} • Maximum 10MB
                                </p>
                            </div>
                            <Input
                                id={id}
                                ref={fileInputRef}
                                type="file"
                                accept={options.accept as string}
                                onChange={handleFileChange}
                                disabled={disabled || readonly}
                                className="hidden"
                                required={required}
                            />
                        </label>
                    </div>
                </div>
            ) : (
                // Filled / Preview State
                <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-500">
                    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-md">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                            <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <FileText className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-gray-900 truncate" title={fileName}>
                                        {fileName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs bg-white">
                                            {fileSize}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs bg-white">
                                            Selected
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
                                            type="button"
                                            className="flex-1 md:flex-none gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Preview
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-5xl h-[85vh] p-0">
                                        <DialogHeader className="px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <DialogTitle className="text-xl font-bold">File Preview</DialogTitle>
                                                    <p className="text-sm text-gray-600 mt-1">{fileName}</p>
                                                </div>
                                            </div>
                                        </DialogHeader>
                                        <div className="w-full h-[calc(85vh-80px)] bg-gray-100 flex items-center justify-center">
                                            {value?.toString().startsWith('data:image') ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={value as string} alt="Preview" className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <iframe
                                                    src={value as string}
                                                    className="w-full h-full"
                                                    title="File Preview"
                                                />
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    onClick={handleRemove}
                                    disabled={disabled || readonly}
                                    className="flex-1 md:flex-none gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
