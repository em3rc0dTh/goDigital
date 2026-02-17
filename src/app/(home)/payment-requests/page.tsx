"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
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
    List,
    LayoutDashboard,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentOutflowDashboard from "@/components/payment-requests/PaymentOutflowDashboard";
import PaymentCalendar from "@/components/payment-requests/PaymentCalendar";
import { useI18n } from "@/i18n/I18nProvider";

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
}

export default function PaymentRequestsPage() {
    const router = useRouter();
    const { t, locale } = useI18n();
    const [data, setData] = useState<PaymentRequest[]>([]);

    const getDateLocale = () => {
        return locale === 'es' ? es : enUS;
    };
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("");
    const [dueDateFilter, setDueDateFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = Cookies.get("session_token");
                const tenantDetailId = Cookies.get("tenantDetailId");

                const response = await fetch(`${API_BASE}/payment-requests?mine=true`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "x-tenant-detail-id": tenantDetailId || "",
                    },
                    credentials: "include",
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                } else {
                    console.error("Failed to fetch payment requests");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_BASE]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, dateFilter, dueDateFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const parseDateAsLocal = (dateString: string) => {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved': return "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200";
            case 'authorized': return "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200";
            case 'paid': return "bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-200";
            case 'rejected': return "bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200";
            case 'pending': return "bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-200";
            default: return "bg-gray-500/15 text-gray-700 hover:bg-gray-500/25 border-gray-200";
        }
    };

    const filteredData = data.filter(item => {
        const matchesSearch =
            (typeof item.project_id === 'object' ? item.project_id?.name : item.project_id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (typeof item.provider_id === 'object' ? item.provider_id?.name : item.provider_id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item._id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        const matchesDate = !dateFilter || (item.date && item.date.startsWith(dateFilter));
        const matchesDueDate = !dueDateFilter || (item.dueDate && item.dueDate.startsWith(dueDateFilter));

        return matchesSearch && matchesStatus && matchesDate && matchesDueDate;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalsByCurrency = filteredData.reduce((acc, item) => {
        const currency = item.currency || 'USD';
        if (!acc[currency]) {
            acc[currency] = { amount: 0, total: 0 };
        }
        acc[currency].amount += item.amount || 0;
        acc[currency].total += item.total || 0;
        return acc;
    }, {} as Record<string, { amount: number, total: number }>);

    return (
        // Full-height container, no outer scroll — page fits viewport
        <div className="h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-muted/50 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0 container max-w-6xl mx-auto px-4 py-6">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 shrink-0">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("PaymentRequests.title")}</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {t("PaymentRequests.subtitle")}
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push("/payment-request")}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shrink-0 self-start sm:self-auto"
                    >
                        <Plus className="h-4 w-4" />
                        {t("PaymentRequests.newRequest")}
                    </Button>
                </div>

                {/* Tabs — fills remaining height */}
                <Tabs defaultValue="list" className="flex flex-col flex-1 min-h-0">

                    <div className="flex items-center justify-between my-1">
                        <TabsList className="bg-background border">
                            <TabsTrigger value="list" className="gap-2">
                                <List className="h-4 w-4" />
                                {t("PaymentRequests.tabs.list") || "List View"}
                            </TabsTrigger>
                            <TabsTrigger value="dashboard" className="gap-2">
                                <LayoutDashboard className="h-4 w-4" />
                                {t("PaymentRequests.tabs.dashboard") || "Tablero de Egresos"}
                            </TabsTrigger>
                            <TabsTrigger value="calendar" className="gap-2">
                                <CalendarDays className="h-4 w-4" />
                                {t("PaymentRequests.tabs.calendar") || "Calendario de Pagos"}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ── LIST TAB ── */}
                    <TabsContent value="list" className="flex flex-col flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">

                        {/* Filters — fixed height */}
                        <div className="flex flex-col gap-3 mb-3 shrink-0">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t("PaymentRequests.searchPlaceholder")}
                                        className="pl-9 bg-background h-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="w-full sm:w-[180px]">
                                    <select
                                        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                            </div>

                            <div className="flex flex-wrap gap-3 items-center">
                                <div className="flex items-center gap-2 border rounded-md px-3 h-9 bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                    <span className="text-xs font-medium whitespace-nowrap text-muted-foreground">{t("PaymentRequests.filterByDate")}:</span>
                                    <input
                                        type="date"
                                        className="bg-transparent text-sm focus:outline-none h-full py-1 text-foreground"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 border rounded-md px-3 h-9 bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                    <span className="text-xs font-medium whitespace-nowrap text-muted-foreground">{t("PaymentRequests.filterByDueDate")}:</span>
                                    <input
                                        type="date"
                                        className="bg-transparent text-sm focus:outline-none h-full py-1 text-foreground"
                                        value={dueDateFilter}
                                        onChange={(e) => setDueDateFilter(e.target.value)}
                                    />
                                </div>
                                {(dateFilter || dueDateFilter) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setDateFilter(""); setDueDateFilter(""); }}
                                        className="h-9 px-2 text-muted-foreground hover:text-foreground"
                                    >
                                        {t("PaymentRequests.clearFilter")}
                                    </Button>
                                )}
                                <div className="ml-auto flex flex-wrap gap-2">
                                    {Object.entries(totalsByCurrency).map(([currency, totals]) => (
                                        <Badge key={currency} variant="secondary" className="text-sm font-mono gap-2">
                                            <span>{currency}</span>
                                            <span className="font-bold" title={t("PaymentRequests.totalAmount") || "Total with Tax"}>
                                                {totals.total.toLocaleString(locale === 'es' ? 'es-PE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Mobile cards — scrollable */}
                        <div className="md:hidden flex-1 overflow-y-auto space-y-3 pb-2">
                            {paginatedData.map((item) => (
                                <Card key={item._id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-mono text-xs text-muted-foreground">#{item._id.slice(-6).toUpperCase()}</span>
                                            <h3 className="font-medium">{typeof item.project_id === 'object' ? item.project_id?.name : 'Unknown Project'}</h3>
                                        </div>
                                        <Badge variant="outline" className={`capitalize ${getStatusColor(item.status)}`}>
                                            {t(`PaymentRequestDetail.status.${item.status.toLowerCase()}`) || item.status}
                                        </Badge>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-muted-foreground">{typeof item.provider_id === 'object' ? item.provider_id?.name : 'Unknown Provider'}</p>
                                    </div>
                                    <div className="flex justify-between text-sm items-center pt-2 border-t">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs">{t("PaymentRequests.table.dueDate")}:</span>
                                            <span>{item.dueDate ? format(parseDateAsLocal(item.dueDate) as Date, "PPP", { locale: getDateLocale() }) : "-"}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-lg">{item.currency} {item.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full mt-2" onClick={() => router.push(`/payment-request/${item._id}`)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        {t("PaymentRequests.viewDetails") || "View Details"}
                                    </Button>
                                </Card>
                            ))}
                        </div>

                        {/* Desktop table — scrollable body, sticky header */}
                        <Card className="hidden md:flex flex-col flex-1 min-h-0 shadow-sm border-muted-foreground/20">
                            <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                                <div className="overflow-auto flex-1 min-h-0">
                                    <Table>
                                        <TableHeader className="sticky top-0 z-10 bg-muted/40">
                                            <TableRow className="hover:bg-muted/40">
                                                <TableHead className="w-[90px]">{t("PaymentRequests.table.id")}</TableHead>
                                                <TableHead>{t("PaymentRequests.table.project")}</TableHead>
                                                <TableHead>{t("PaymentRequests.table.provider")}</TableHead>
                                                <TableHead>{t("PaymentRequests.table.date")}</TableHead>
                                                <TableHead>{t("PaymentRequests.table.dueDate")}</TableHead>
                                                <TableHead className="text-right">{t("PaymentRequests.table.currency")}</TableHead>
                                                <TableHead className="text-right">{t("PaymentRequests.table.amount")}</TableHead>
                                                <TableHead className="w-[110px]">{t("PaymentRequests.table.status")}</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="h-32 text-center">
                                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                            <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                                            {t("PaymentRequests.table.loading")}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : filteredData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                                        {t("PaymentRequests.table.empty")}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedData.map((item) => (
                                                    <TableRow key={item._id} className="group hover:bg-muted/5">
                                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                                            #{item._id.slice(-6).toUpperCase()}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {typeof item.project_id === 'object' ? item.project_id?.name : 'Unknown Project'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {typeof item.provider_id === 'object' ? item.provider_id?.name : 'Unknown Provider'}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">
                                                            {item.date ? format(parseDateAsLocal(item.date) as Date, "PPP", { locale: getDateLocale() }) : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">
                                                            {item.dueDate ? format(parseDateAsLocal(item.dueDate) as Date, "PPP", { locale: getDateLocale() }) : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {item.currency}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {item.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`capitalize ${getStatusColor(item.status)}`}>
                                                                {t(`PaymentRequestDetail.status.${item.status.toLowerCase()}`) || item.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex justify-end">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
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

                        {/* Pagination — fixed at bottom */}
                        {filteredData.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-end p-3 border rounded-md bg-card mt-3 gap-3 sm:gap-2 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{t("PaymentRequests.rowsPerPage") || "Rows per page"}:</span>
                                    <select
                                        className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* ── DASHBOARD TAB ── */}
                    <TabsContent value="dashboard" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
                        <PaymentOutflowDashboard className="h-full" />
                    </TabsContent>

                    {/* ── CALENDAR TAB ── */}
                    <TabsContent value="calendar" className="flex flex-col flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
                        <div className="flex flex-col flex-1 min-h-0 gap-3">
                            <div className="bg-card p-3 sm:p-4 rounded-lg border shadow-sm shrink-0">
                                <h2 className="text-base sm:text-lg font-semibold">{t("PaymentRequests.tabs.calendar") || "Payment Calendar"}</h2>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    View your payment requests by their due date.
                                </p>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <PaymentCalendar data={data} />
                            </div>
                        </div>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}