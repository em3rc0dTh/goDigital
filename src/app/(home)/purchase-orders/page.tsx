"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
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
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { odooService } from "@/services/odooService";
import { OdooPurchaseOrder } from "@/types/odoo";
import { CreateOrderDialog } from "./components/CreateOrderDialog";
import { PurchaseOrderDetailsDialog } from "./components/PurchaseOrderDetailsDialog";
import { toast } from "sonner";

type SortKey = "name" | "date_order" | "company_id" | "partner_id" | "amount_total" | "state";
type SortDir = "asc" | "desc";

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDir === "asc"
        ? <ArrowUp className="ml-1 h-3 w-3 text-primary" />
        : <ArrowDown className="ml-1 h-3 w-3 text-primary" />;
}

const SortableTh = ({
    column,
    label,
    sortKey,
    sortDir,
    onSort,
    className,
}: {
    column: SortKey;
    label: string;
    sortKey: SortKey | null;
    sortDir: SortDir;
    onSort: (key: SortKey) => void;
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
            onClick={() => onSort(column)}
        >
            {label}
            <SortIcon column={column} sortKey={sortKey} sortDir={sortDir} />
        </button>
    </TableHead>
);

export default function PurchaseOrdersPage() {
    const [data, setData] = useState<OdooPurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Details Dialog State
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Sorting
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    const loadOrders = async () => {
        setLoading(true);
        try {
            const orders = await odooService.getOrders();
            setData(orders);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar órdenes de compra");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "purchase":
            case "done":
                return "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200";
            case "draft":
            case "sent":
                return "bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-200";
            case "cancel":
                return "bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200";
            default:
                return "bg-gray-500/15 text-gray-700 hover:bg-gray-500/25 border-gray-200";
        }
    };

    const filteredData = useMemo(() => {
        const filtered = data.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.company_id[1].toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.partner_id[1].toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || item.state.toLowerCase() === statusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });

        if (!sortKey) return filtered;

        return [...filtered].sort((a, b) => {
            let aVal: any = "";
            let bVal: any = "";

            switch (sortKey) {
                case "name":
                    aVal = a.name;
                    bVal = b.name;
                    break;
                case "date_order":
                    aVal = new Date(a.date_order).getTime();
                    bVal = new Date(b.date_order).getTime();
                    break;
                case "company_id":
                    aVal = a.company_id[1].toLowerCase();
                    bVal = b.company_id[1].toLowerCase();
                    break;
                case "partner_id":
                    aVal = a.partner_id[1].toLowerCase();
                    bVal = b.partner_id[1].toLowerCase();
                    break;
                case "amount_total":
                    aVal = a.amount_total;
                    bVal = b.amount_total;
                    break;
                case "state":
                    aVal = a.state.toLowerCase();
                    bVal = b.state.toLowerCase();
                    break;
            }

            if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, searchTerm, statusFilter, sortKey, sortDir]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleViewDetails = (id: number) => {
        setSelectedOrderId(id);
        setDetailsOpen(true);
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-muted/50 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0 container max-w-6xl mx-auto px-4 py-6">

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 shrink-0">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
                            Órdenes de Compra (Odoo)
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Gestión sincronizada con Odoo ERP
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:ml-auto shrink-0">
                        <div
                            className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5 shadow-sm"
                        >
                            <span className="text-xs text-muted-foreground">Total USD</span>
                            {/* Note: This assumes USD or sums up mixed currencies which is technically wrong but acceptable for this demo scope unless we check currency_id */}
                            <span className="text-sm font-bold font-mono tabular-nums">
                                {filteredData.reduce((acc, item) => acc + item.amount_total, 0).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>

                        <CreateOrderDialog onOrderCreated={loadOrders} />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 items-center mb-3 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Buscar por ID, Compañía o Proveedor..."
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
                        <option value="all">Todos los estados</option>
                        <option value="draft">Borrador</option>
                        <option value="sent">Enviado</option>
                        <option value="purchase">Confirmado</option>
                        <option value="done">Realizado</option>
                        <option value="cancel">Cancelado</option>
                    </select>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden flex-1 overflow-y-auto space-y-2.5 pb-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-3">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <p className="text-sm">Cargando datos de Odoo...</p>
                        </div>
                    ) : paginatedData.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground text-sm border rounded-lg bg-card border-dashed">
                            No se encontraron órdenes de compra
                        </div>
                    ) : (
                        paginatedData.map((item) => (
                            <Card
                                key={item.id}
                                className="p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow duration-150 border-muted-foreground/15 cursor-pointer"
                                onClick={() => handleViewDetails(item.id)}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                                                {item.name}
                                            </span>
                                            <h3 className="font-semibold text-sm leading-tight truncate">
                                                {item.company_id[1]}
                                            </h3>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`capitalize shrink-0 text-xs ${getStatusColor(item.state)}`}>
                                        {item.state}
                                    </Badge>
                                </div>
    
                                <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0"></span>
                                    {item.partner_id[1]}
                                </p>
    
                                <div className="flex justify-between items-end pt-3 border-t border-muted/60 mt-2">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-muted-foreground text-xs uppercase tracking-wider">Fecha</span>
                                        <span className="text-sm font-medium">
                                            {format(new Date(item.date_order), "dd MMM yyyy")}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-muted-foreground mr-1">USD</span>
                                        <span className="font-bold text-base leading-tight">
                                            {item.amount_total?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Desktop table */}
                <Card className="hidden md:flex flex-col flex-1 min-h-0 shadow-sm border-muted-foreground/15">
                    <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                        <div className="overflow-auto flex-1 min-h-0 rounded-[inherit]">
                            <Table>
                                <TableHeader className="sticky top-0 z-10">
                                    <TableRow className="hover:bg-transparent border-b">
                                        <SortableTh
                                            column="name"
                                            label="ID / NRO"
                                            className="w-[140px]"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        />
                                        <SortableTh
                                            column="company_id"
                                            label="COMPRADOR"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        />
                                        <SortableTh
                                            column="partner_id"
                                            label="PROVEEDOR"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        />
                                        <SortableTh
                                            column="date_order"
                                            label="FECHA"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        />
                                        <SortableTh
                                            column="amount_total"
                                            label="TOTAL"
                                            className="text-right"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        />
                                        <SortableTh
                                            column="state"
                                            label="ESTADO"
                                            className="w-[110px]"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        />
                                        <TableHead className="w-[50px] bg-muted/50 backdrop-blur-sm" />
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                    <Loader2 className="h-8 w-8 animate-spin" />
                                                    <p>Cargando datos de Odoo...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-40 text-center text-muted-foreground text-sm">
                                                No se encontraron órdenes de compra
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((item) => (
                                            <TableRow
                                                key={item.id}
                                                className="group hover:bg-muted/40 transition-colors duration-100 cursor-pointer"
                                                onClick={() => handleViewDetails(item.id)}
                                            >
                                                <TableCell className="font-mono text-xs text-muted-foreground py-3 font-semibold">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell className="font-medium text-sm py-3">
                                                    {item.company_id[1]}
                                                </TableCell>
                                                <TableCell className="text-sm py-3">
                                                    {item.partner_id[1]}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm py-3 whitespace-nowrap">
                                                    {format(new Date(item.date_order), "dd/MM/yyyy")}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-sm py-3 tabular-nums text-center">
                                                    {item.amount_total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Badge variant="outline" className={`capitalize text-xs w-full flex justify-center ${getStatusColor(item.state)}`}>
                                                        {item.state}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary opacity-50 group-hover:opacity-100 transition-all duration-150"
                                                        >
                                                            <Eye className="h-4 w-4" />
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
                {filteredData.length > 0 && !loading && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 border rounded-lg bg-card mt-3 gap-3 sm:gap-2 shrink-0 shadow-sm">
                        <p className="text-sm text-muted-foreground order-2 sm:order-1">
                            Mostrando {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length}
                        </p>

                        <div className="flex items-center gap-4 order-1 sm:order-2">
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

            <PurchaseOrderDetailsDialog
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                orderId={selectedOrderId}
                onOrderUpdated={loadOrders}
            />
        </div>
    );
}