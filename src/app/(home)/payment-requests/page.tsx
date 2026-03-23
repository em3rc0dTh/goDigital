"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import dynamic from "next/dynamic";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Plus,
    Search,
    Eye,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    X,
    Filter,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Zap,
    GitBranch,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/i18n/I18nProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Lazy-load WorkflowCanvas (uses ReactFlow — client only)
const WorkflowCanvas = dynamic(
    () => import("@/components/payment-requests/WorkflowCanvas").then(m => ({ default: m.WorkflowCanvas })),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">Loading canvas…</span>
            </div>
        ),
    }
);

interface PaymentRequest {
    _id: string;
    project_id: { _id: string; name: string } | string;
    provider_id: { _id: string; name: string } | string;
    amount: number;
    tax: number;
    total: number;
    currency: string;
    status: string;
    date: string;
    dueDate: string;
    createdAt: string;
    purchase_order_id?: any;
    project?: any;
    payment_date?: string;
    provider?: any;
}

type SortKey =
    | "id"
    | "date"
    | "project"
    | "provider"
    | "payment_date"
    | "dueDate"
    | "currency"
    | "total"
    | "status";

type SortDir = "asc" | "desc";

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDir === "asc"
        ? <ArrowUp className="ml-1 h-3 w-3 text-primary" />
        : <ArrowDown className="ml-1 h-3 w-3 text-primary" />;
}

export default function PaymentRequestsPage() {
    const router = useRouter();
    const { t, locale } = useI18n();
    const [data, setData] = useState<PaymentRequest[]>([]);

    // Workflow canvas dialog state
    const [canvasOpen, setCanvasOpen] = useState(false);
    const [canvasPrId, setCanvasPrId] = useState<string | null>(null);

    const openCanvas = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCanvasPrId(id);
        setCanvasOpen(true);
    };

    const getDateLocale = () => (locale === "es" ? es : enUS);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("");
    const [dueDateFilter, setDueDateFilter] = useState<string>("");
    const [scheduledDateFilter, setScheduledDateFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Sorting
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = Cookies.get("session_token");
                const tenantDetailId = Cookies.get("tenantDetailId");

                const response = await fetch(`${API_BASE}/payment-requests`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-tenant-detail-id": tenantDetailId || "",
                    },
                    credentials: "include",
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(Array.isArray(result) ? result : []);
                } else {
                    // If no data is found (404), we just set an empty array without logging an error
                    setData([]);
                    if (response.status !== 404 && response.status !== 500) {
                        console.warn(`Fetch notice: ${response.status}`);
                    }
                }
            } catch (error) {
                setData([]);
                console.warn("Fetch failed, using empty data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_BASE]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, dateFilter, dueDateFilter, scheduledDateFilter, sortKey, sortDir]);

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const parseDateAsLocal = (dateString: string) => {
        if (!dateString) return null;
        const [year, month, day] = dateString.split("T")[0].split("-").map(Number);
        return new Date(year, month - 1, day);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "approved": return "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200";
            case "authorized": return "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200";
            case "paid": return "bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-200";
            case "rejected": return "bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200";
            case "pending": return "bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-200";
            default: return "bg-gray-500/15 text-gray-700 hover:bg-gray-500/25 border-gray-200";
        }
    };

    const filteredData = useMemo(() => {
        const filtered = data.filter((item) => {
            const matchesSearch =
                (typeof item.project_id === "object" ? item.project_id?.name : item.project_id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (typeof item.provider_id === "object" ? item.provider_id?.name : item.provider_id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.project?.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                item._id.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || item.status === statusFilter;
            const matchesDate = !dateFilter || (item.date && item.date.startsWith(dateFilter));
            const matchesDueDate = !dueDateFilter || (item.dueDate && item.dueDate.startsWith(dueDateFilter));
            const matchesScheduledDate = !scheduledDateFilter || (item.payment_date && item.payment_date.startsWith(scheduledDateFilter));

            return matchesSearch && matchesStatus && matchesDate && matchesDueDate && matchesScheduledDate;
        });

        if (!sortKey) return filtered;

        return [...filtered].sort((a, b) => {
            let aVal: any;
            let bVal: any;

            switch (sortKey) {
                case "id":
                    aVal = a._id.slice(-6).toUpperCase();
                    bVal = b._id.slice(-6).toUpperCase();
                    break;
                case "date":
                    aVal = a.date ? new Date(a.date).getTime() : 0;
                    bVal = b.date ? new Date(b.date).getTime() : 0;
                    break;
                case "project":
                    aVal = (typeof a.project === "object" && a.project?.name ? `${a.project.code ?? ""} - ${a.project.name}` : "").toLowerCase();
                    bVal = (typeof b.project === "object" && b.project?.name ? `${b.project.code ?? ""} - ${b.project.name}` : "").toLowerCase();
                    break;
                case "provider":
                    aVal = (typeof a.provider_id === "object" ? a.provider_id?.name : "").toLowerCase();
                    bVal = (typeof b.provider_id === "object" ? b.provider_id?.name : "").toLowerCase();
                    break;
                case "payment_date":
                    aVal = a.payment_date ? new Date(a.payment_date).getTime() : 0;
                    bVal = b.payment_date ? new Date(b.payment_date).getTime() : 0;
                    break;
                case "dueDate":
                    aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                    bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                    break;
                case "currency":
                    aVal = a.currency || "";
                    bVal = b.currency || "";
                    break;
                case "total":
                    aVal = a.total ?? 0;
                    bVal = b.total ?? 0;
                    break;
                case "status":
                    aVal = a.status || "";
                    bVal = b.status || "";
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, searchTerm, statusFilter, dateFilter, dueDateFilter, scheduledDateFilter, sortKey, sortDir]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalsByCurrency = filteredData.reduce((acc, item) => {
        const currency = item.currency || "USD";
        if (!acc[currency]) acc[currency] = { amount: 0, total: 0 };
        acc[currency].amount += item.amount || 0;
        acc[currency].total += item.total || 0;
        return acc;
    }, {} as Record<string, { amount: number; total: number }>);

    const hasDateFilters = dateFilter || dueDateFilter || scheduledDateFilter;

    // Reusable sortable header button
    const SortableTh = ({
        column,
        label,
        className,
    }: {
        column: SortKey;
        label: string;
        className?: string;
    }) => (
        <TableHead
            className={cn(
                "bg-muted/50 backdrop-blur-sm font-semibold text-xs uppercase tracking-wide text-muted-foreground select-none",
                className
            )}
        >
            <button
                className="flex items-center gap-0.5 hover:text-foreground transition-colors"
                onClick={() => handleSort(column)}
            >
                {label}
                <SortIcon column={column} sortKey={sortKey} sortDir={sortDir} />
            </button>
        </TableHead>
    );

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-muted/50 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0 container max-w-6xl mx-auto px-4 py-6">

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 shrink-0">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
                            {t("PaymentRequests.title")}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            {t("PaymentRequests.subtitle")}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:ml-auto shrink-0">
                        {Object.entries(totalsByCurrency).map(([currency, totals]) => (
                            <div
                                key={currency}
                                title={t("PaymentRequests.totalAmount") || "Total with Tax"}
                                className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5 shadow-sm"
                            >
                                <span className="text-xs text-muted-foreground">{t("PaymentRequests.totalAmount") || "Total with Tax"}</span>
                                <span className="text-xs text-muted-foreground font-medium">{currency}</span>
                                <span className="text-xs text-muted-foreground">·</span>
                                <span className="text-sm font-bold font-mono tabular-nums">
                                    {totals.total.toLocaleString(locale === "es" ? "es-PE" : "en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        ))}

                        {/* Examina tu flujo — global workflows */}
                        <Button
                            variant="outline"
                            onClick={() => router.push("/workflows")}
                            className="gap-2 shadow-sm border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/60 transition-all"
                        >
                            <GitBranch className="h-4 w-4" />
                            Examina tu flujo
                        </Button>

                        <Button
                            onClick={() => router.push("/payment-request")}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm transition-all duration-150 hover:shadow-md"
                        >
                            <Plus className="h-4 w-4" />
                            {t("PaymentRequests.newRequest")}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 items-center mb-3 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder={t("PaymentRequests.searchPlaceholder")}
                            className="pl-9 h-9 bg-background shadow-sm transition-shadow focus-visible:shadow-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="hidden md:flex h-9 w-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">{t("PaymentRequests.allStatuses")}</option>
                        <option value="pending">{t("PaymentRequestDetail.status.pending")}</option>
                        <option value="approved">{t("PaymentRequestDetail.status.approved")}</option>
                        <option value="authorized">{t("PaymentRequestDetail.status.authorized")}</option>
                        <option value="paid">{t("PaymentRequestDetail.status.paid")}</option>
                        <option value="rejected">{t("PaymentRequestDetail.status.rejected")}</option>
                    </select>

                    {/* Desktop date popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "hidden md:flex h-9 gap-1.5 px-3 text-sm font-normal transition-colors",
                                    hasDateFilters
                                        ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                {t("PaymentRequests.filterByDate") || "Dates"}
                                {hasDateFilters && (
                                    <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {[dateFilter, dueDateFilter, scheduledDateFilter].filter(Boolean).length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-72 p-4 space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {t("PaymentRequests.filterByDate") || "Filter by date"}
                            </p>
                            {[
                                { label: t("PaymentRequests.filterByCreatedDate"), value: dateFilter, onChange: setDateFilter },
                                { label: t("PaymentRequests.filterByDueDate"), value: dueDateFilter, onChange: setDueDateFilter },
                                { label: t("PaymentRequests.filterByScheduledDate"), value: scheduledDateFilter, onChange: setScheduledDateFilter },
                            ].map(({ label, value, onChange }) => (
                                <div key={label} className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">{label}</label>
                                    <input
                                        type="date"
                                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                    />
                                </div>
                            ))}
                            {hasDateFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                                    onClick={() => { setDateFilter(""); setDueDateFilter(""); setScheduledDateFilter(""); }}
                                >
                                    <X className="h-3.5 w-3.5" />
                                    {t("PaymentRequests.clearFilter")}
                                </Button>
                            )}
                        </PopoverContent>
                    </Popover>

                    {/* Mobile sheet */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9 md:hidden shrink-0 relative">
                                <Filter className="h-4 w-4" />
                                {(statusFilter !== "all" || hasDateFilters) && (
                                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-primary rounded-full border-2 border-background" />
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[360px]">
                            <SheetHeader>
                                <SheetTitle>{t("PaymentRequests.filters")}</SheetTitle>
                                <SheetDescription>{t("PaymentRequests.filtersDescription")}</SheetDescription>
                            </SheetHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>{t("PaymentRequests.table.status")}</Label>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">{t("PaymentRequests.allStatuses")}</option>
                                        <option value="pending">{t("PaymentRequestDetail.status.pending")}</option>
                                        <option value="approved">{t("PaymentRequestDetail.status.approved")}</option>
                                        <option value="authorized">{t("PaymentRequestDetail.status.authorized")}</option>
                                        <option value="paid">{t("PaymentRequestDetail.status.paid")}</option>
                                        <option value="rejected">{t("PaymentRequestDetail.status.rejected")}</option>
                                    </select>
                                </div>
                                <Separator />
                                {[
                                    { label: t("PaymentRequests.filterByDate"), value: dateFilter, onChange: setDateFilter },
                                    { label: t("PaymentRequests.filterByDueDate"), value: dueDateFilter, onChange: setDueDateFilter },
                                    { label: t("PaymentRequests.filterByScheduledDate"), value: scheduledDateFilter, onChange: setScheduledDateFilter },
                                ].map(({ label, value, onChange }) => (
                                    <div key={label} className="space-y-2">
                                        <Label>{label}</Label>
                                        <input
                                            type="date"
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={value}
                                            onChange={(e) => onChange(e.target.value)}
                                        />
                                    </div>
                                ))}
                                {hasDateFilters && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => { setDateFilter(""); setDueDateFilter(""); setScheduledDateFilter(""); }}
                                        className="w-full"
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        {t("PaymentRequests.clearFilter")}
                                    </Button>
                                )}
                            </div>
                            <SheetFooter>
                                <SheetClose asChild>
                                    <Button className="w-full">{t("Common.apply")}</Button>
                                </SheetClose>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden flex-1 overflow-y-auto space-y-2.5 pb-2">
                    {paginatedData.map((item) => (
                        <Card
                            key={item._id}
                            className="p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow duration-150 border-muted-foreground/15"
                        >
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <span className="font-mono text-xs text-muted-foreground">
                                        #{item._id.slice(-6).toUpperCase()}
                                    </span>
                                    <h3 className="font-semibold text-sm leading-tight mt-0.5 truncate">
                                        {typeof item.project_id === "object" ? item.project_id?.name : "Unknown Project"}
                                    </h3>
                                </div>
                                <Badge variant="outline" className={`capitalize shrink-0 text-xs ${getStatusColor(item.status)}`}>
                                    {t(`PaymentRequestDetail.status.${item.status.toLowerCase()}`) || item.status}
                                </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground truncate">
                                {typeof item.provider_id === "object" ? item.provider_id?.name : "Unknown Provider"}
                            </p>

                            <div className="flex justify-between items-end pt-2 border-t border-muted/60">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground text-xs">{t("PaymentRequests.table.dueDate")}</span>
                                    <span className="text-sm font-medium">
                                        {item.dueDate
                                            ? format(parseDateAsLocal(item.dueDate) as Date, "PPP", { locale: getDateLocale() })
                                            : "—"}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-muted-foreground">{item.currency}</span>
                                    <p className="font-bold text-base leading-tight">
                                        {item.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 h-8 text-sm transition-colors"
                                onClick={() => router.push(`/payment-request/${item._id}`)}
                            >
                                <Eye className="h-3.5 w-3.5" />
                                {t("PaymentRequests.viewDetails") || "View Details"}
                            </Button>
                        </Card>
                    ))}
                </div>

                {/* Desktop table */}
                <Card className="hidden md:flex flex-col flex-1 min-h-0 shadow-sm border-muted-foreground/15">
                    <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                        <div className="overflow-auto flex-1 min-h-0 rounded-[inherit]">
                            <Table>
                                <TableHeader className="sticky top-0 z-10">
                                    <TableRow className="hover:bg-transparent border-b">
                                        <SortableTh column="id" label={t("PaymentRequests.table.id")} className="w-[90px]" />
                                        <SortableTh column="date" label={t("PaymentRequests.table.date")} />
                                        <SortableTh column="project" label={t("PaymentRequests.table.project")} />
                                        <SortableTh column="provider" label={t("PaymentRequests.table.provider")} />
                                        <SortableTh column="payment_date" label={t("PaymentRequests.table.scheduledDate")} />
                                        <SortableTh column="dueDate" label={t("PaymentRequests.table.dueDate")} />
                                        <SortableTh column="currency" label={t("PaymentRequests.table.currency")} className="text-right" />
                                        <SortableTh column="total" label={t("PaymentRequests.table.amount")} className="text-right" />
                                        <SortableTh column="status" label={t("PaymentRequests.table.status")} className="w-[110px]" />
                                        <TableHead className="w-[50px] bg-muted/50 backdrop-blur-sm" />
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    <span className="text-sm">{t("PaymentRequests.table.loading")}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-40 text-center text-muted-foreground text-sm">
                                                {t("PaymentRequests.table.empty")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((item) => (
                                            <TableRow
                                                key={item._id}
                                                className="group hover:bg-muted/40 transition-colors duration-100 cursor-pointer"
                                                onClick={() => router.push(`/payment-request/${item._id}`)}
                                            >
                                                <TableCell className="font-mono text-xs text-muted-foreground py-3">
                                                    #{item._id.slice(-6).toUpperCase()}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm py-3 whitespace-nowrap">
                                                    {item.date
                                                        ? format(parseDateAsLocal(item.date) as Date, "dd/MM/yyyy", { locale: getDateLocale() })
                                                        : "—"}
                                                </TableCell>
                                                <TableCell className="font-medium text-sm py-3">
                                                    {typeof item.project === "object" && item.project?.name
                                                        ? (() => {
                                                            const fullName = `${item.project.code ?? ""} - ${item.project.name}`;
                                                            return fullName.length > 30 ? fullName.slice(0, 30) + "…" : fullName;
                                                        })()
                                                        : "Unknown Project"}
                                                </TableCell>
                                                <TableCell className="text-sm py-3">
                                                    {typeof item.provider_id === "object" && item.provider_id?.name
                                                        ? (() => {
                                                            const fullName = item.provider_id.name;
                                                            return fullName.length > 30 ? fullName.slice(0, 30) + "…" : fullName;
                                                        })()
                                                        : "Unknown Provider"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm py-3 whitespace-nowrap">
                                                    {item.payment_date
                                                        ? format(parseDateAsLocal(item.payment_date) as Date, "dd/MM/yyyy", { locale: getDateLocale() })
                                                        : "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm py-3 whitespace-nowrap">
                                                    {item.dueDate
                                                        ? format(parseDateAsLocal(item.dueDate) as Date, "dd/MM/yyyy", { locale: getDateLocale() })
                                                        : "—"}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-sm py-3 text-muted-foreground text-center">
                                                    {item.currency}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-sm py-3 tabular-nums text-center">
                                                    {item.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Badge variant="outline" className={`capitalize text-xs w-full flex justify-center ${getStatusColor(item.status)}`}>
                                                        {t(`PaymentRequestDetail.status.${item.status.toLowerCase()}`) || item.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 gap-1.5 text-xs text-primary opacity-0 group-hover:opacity-100 transition-all px-2"
                                                            onClick={(e) => openCanvas(item._id, e)}
                                                            title="Examina el flujo de esta solicitud"
                                                        >
                                                            <Zap className="h-3.5 w-3.5" />
                                                            Flujo
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary opacity-50 group-hover:opacity-100 transition-all duration-150"
                                                            onClick={() => router.push(`/payment-request/${item._id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            <span className="sr-only">View</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {filteredData.length > 0 && (
                    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between px-4 py-2.5 border rounded-lg bg-card mt-3 gap-3 sm:gap-2 shrink-0 shadow-sm w-full">
                        <p className="text-sm text-muted-foreground order-2 sm:order-1 text-center w-full sm:w-auto">
                            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 order-1 sm:order-2 w-full sm:w-auto">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {t("PaymentRequests.rowsPerPage") || "Rows per page"}:
                                </span>
                                <select
                                    className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow shadow-sm"
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 p-0 shadow-sm"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium tabular-nums min-w-[4rem] text-center">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 w-8 p-0 shadow-sm"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Workflow Canvas Dialog ─────────────────────────────────── */}
            <Dialog open={canvasOpen} onOpenChange={setCanvasOpen}>
                <DialogContent className="max-w-[95vw] w-[1100px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-5 py-3 border-b border-border shrink-0">
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Zap className="h-4 w-4 text-primary" />
                            Workflow — {canvasPrId ? `#${canvasPrId.slice(-6).toUpperCase()}` : ""}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 min-h-0">
                        {canvasPrId && <WorkflowCanvas paymentRequestId={canvasPrId} />}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}