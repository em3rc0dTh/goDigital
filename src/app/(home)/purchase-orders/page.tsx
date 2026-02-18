"use client";

import React, { useState, useMemo } from "react";
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
    Plus,
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Interface based on user provided data
interface PurchaseOrder {
    _id: string; // Orden de compra #
    shippingAddress: {
        company: string;
        address: string;
        city: string;
        region: string;
        country: string;
        zip: string;
    };
    supplier: {
        name: string;
        ruc: string;
        city?: string;
        country?: string;
    };
    buyer: string;
    date: string; // Fecha de la orden
    expectedArrival: string; // Llegada esperada
    quote: string; // Cotización
    paymentCondition: string;
    paymentMethod: string;
    bankDetails: {
        bank: string;
        currency: string;
        account: string;
        cci: string;
    };
    project: string; // Proyecto
    deliveryPlace: string; // Lugar de entrega
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        currency: string;
        discount: number;
        taxRate: string;
        total: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    status: string;
    notes: string[];
}

const DUMMY_DATA: PurchaseOrder[] = [
    {
        _id: "OC-TH202600007",
        shippingAddress: {
            company: "THRADEX TECHNOLOGIES SAC",
            address: "Av. Arequipa 2650",
            city: "Lince",
            region: "Lima",
            country: "Perú",
            zip: "15046"
        },
        supplier: {
            name: "OPTICAL NETWORK PERU S.A.C.",
            ruc: "20607894561",
            city: "Lima",
            country: "Perú"
        },
        buyer: "María Torres",
        date: "2026-02-12",
        expectedArrival: "2026-02-20",
        quote: "ONP-2201-26",
        paymentCondition: "Crédito 15 días",
        paymentMethod: "Transferencia bancaria",
        bankDetails: {
            bank: "BCP",
            currency: "USD",
            account: "191-5566778899",
            cci: "002-191-5566778899-55"
        },
        project: "PRY43300_FO_EXPANSION_2026",
        deliveryPlace: "Almacén Central Lima",
        items: [
            {
                description: "ODF 24 puertos LC duplex rackeable",
                quantity: 3,
                unitPrice: 320,
                currency: "USD",
                discount: 0,
                taxRate: "IGV 18%",
                total: 960
            }
        ],
        subtotal: 960,
        tax: 172.8,
        total: 1132.8,
        currency: "USD",
        status: "Emitida",
        notes: ["Incluye bandejas y accesorios."]
    },
    {
        _id: "OC-TH202600008",
        shippingAddress: {
            company: "THRADEX TECHNOLOGIES SAC",
            address: "Av. Universitaria 1800",
            city: "Los Olivos",
            region: "Lima",
            country: "Perú",
            zip: "15301"
        },
        supplier: {
            name: "TECNO INDUSTRIAL PERU S.A.C.",
            ruc: "20599887766",
            city: "Lima",
            country: "Perú"
        },
        buyer: "Pedro Ramos",
        date: "2026-02-14",
        expectedArrival: "2026-02-22",
        quote: "TIP-7782-26",
        paymentCondition: "Contado",
        paymentMethod: "Transferencia bancaria",
        bankDetails: {
            bank: "Interbank",
            currency: "PEN",
            account: "898-1122334455",
            cci: "003-898-1122334455-66"
        },
        project: "PRY43320_DATACENTER_RACKS_2026",
        deliveryPlace: "Data Center Norte",
        items: [
            {
                description: "Rack 42U cerrado con ventilación",
                quantity: 2,
                unitPrice: 2800,
                currency: "PEN",
                discount: 0,
                taxRate: "IGV 18%",
                total: 5600
            }
        ],
        subtotal: 5600,
        tax: 1008,
        total: 6608,
        currency: "PEN",
        status: "Pendiente",
        notes: ["Entrega en horario laboral."]
    },
    {
        _id: "OC-TH202600009",
        shippingAddress: {
            company: "THRADEX TECHNOLOGIES SAC",
            address: "Av. Brasil 3450",
            city: "Magdalena",
            region: "Lima",
            country: "Perú",
            zip: "15086"
        },
        supplier: {
            name: "DATA LINK SOLUTIONS S.A.C.",
            ruc: "20456789123",
            city: "Lima",
            country: "Perú"
        },
        buyer: "Andrea Ponce",
        date: "2026-02-15",
        expectedArrival: "2026-02-23",
        quote: "DLS-9901-26",
        paymentCondition: "Crédito 30 días",
        paymentMethod: "Transferencia bancaria",
        bankDetails: {
            bank: "BBVA",
            currency: "USD",
            account: "001-8899776655",
            cci: "011-001-8899776655-77"
        },
        project: "PRY43350_WIFI_CORPORATIVO_2026",
        deliveryPlace: "Oficina Magdalena",
        items: [
            {
                description: "Access Point WiFi 6 empresarial",
                quantity: 8,
                unitPrice: 210,
                currency: "USD",
                discount: 0,
                taxRate: "IGV 18%",
                total: 1680
            }
        ],
        subtotal: 1680,
        tax: 302.4,
        total: 1982.4,
        currency: "USD",
        status: "Emitida",
        notes: ["Configurar SSID corporativo."]
    },

    // 10, 11, 12, 13, 14, 15, 16
    {
        _id: "OC-TH202600010",
        shippingAddress: { company: "THRADEX TECHNOLOGIES SAC", address: "Av. Primavera 1234", city: "Surco", region: "Lima", country: "Perú", zip: "15038" },
        supplier: { name: "GLOBAL FIBER S.A.C.", ruc: "20601234567", city: "Lima", country: "Perú" },
        buyer: "Luis Gutiérrez",
        date: "2026-02-16",
        expectedArrival: "2026-02-28",
        quote: "GF-1002-26",
        paymentCondition: "Contado",
        paymentMethod: "Transferencia bancaria",
        bankDetails: { bank: "BCP", currency: "USD", account: "191-2233445566", cci: "002-191-2233445566-88" },
        project: "PRY43400_FTTH_SUR_2026",
        deliveryPlace: "Proyecto Surco",
        items: [{ description: "Splitter óptico 1x8 SC/APC", quantity: 20, unitPrice: 12, currency: "USD", discount: 0, taxRate: "IGV 18%", total: 240 }],
        subtotal: 240,
        tax: 43.2,
        total: 283.2,
        currency: "USD",
        status: "Pendiente",
        notes: []
    },
    {
        _id: "OC-TH202600011",
        shippingAddress: { company: "THRADEX TECHNOLOGIES SAC", address: "Av. Grau 890", city: "Barranco", region: "Lima", country: "Perú", zip: "15063" },
        supplier: { name: "POWER SYSTEMS PERU S.A.C.", ruc: "20566778899", city: "Lima", country: "Perú" },
        buyer: "Rosa Díaz",
        date: "2026-02-17",
        expectedArrival: "2026-02-25",
        quote: "PSP-4455-26",
        paymentCondition: "Crédito 15 días",
        paymentMethod: "Transferencia bancaria",
        bankDetails: { bank: "Scotiabank", currency: "PEN", account: "000-99887766", cci: "009-000-99887766-11" },
        project: "PRY43420_UPS_LIMA_2026",
        deliveryPlace: "Oficina Barranco",
        items: [{ description: "UPS Online 3KVA", quantity: 3, unitPrice: 4200, currency: "PEN", discount: 0, taxRate: "IGV 18%", total: 12600 }],
        subtotal: 12600,
        tax: 2268,
        total: 14868,
        currency: "PEN",
        status: "Emitida",
        notes: []
    },
    {
        _id: "OC-TH202600012",
        shippingAddress: { company: "THRADEX TECHNOLOGIES SAC", address: "Av. Faucett 455", city: "Callao", region: "Lima", country: "Perú", zip: "07031" },
        supplier: { name: "SECURITY TECH S.A.C.", ruc: "20609988776", city: "Lima", country: "Perú" },
        buyer: "Juan Castro",
        date: "2026-02-18",
        expectedArrival: "2026-02-27",
        quote: "ST-7788-26",
        paymentCondition: "Contado",
        paymentMethod: "Transferencia bancaria",
        bankDetails: { bank: "Interbank", currency: "USD", account: "898-44556677", cci: "003-898-44556677-22" },
        project: "PRY43450_CCTV_CALLAO_2026",
        deliveryPlace: "Almacén Callao",
        items: [{ description: "Cámara IP 4MP exterior", quantity: 12, unitPrice: 85, currency: "USD", discount: 0, taxRate: "IGV 18%", total: 1020 }],
        subtotal: 1020,
        tax: 183.6,
        total: 1203.6,
        currency: "USD",
        status: "Pendiente",
        notes: []
    },
    {
        _id: "OC-TH202600013",
        shippingAddress: { company: "THRADEX TECHNOLOGIES SAC", address: "Av. Canadá 321", city: "La Victoria", region: "Lima", country: "Perú", zip: "15034" },
        supplier: { name: "INDUSTRIAL CABLE PERU S.A.C.", ruc: "20499887744", city: "Lima", country: "Perú" },
        buyer: "Sofía Herrera",
        date: "2026-02-19",
        expectedArrival: "2026-03-01",
        quote: "ICP-8899-26",
        paymentCondition: "Crédito 30 días",
        paymentMethod: "Transferencia bancaria",
        bankDetails: { bank: "BBVA", currency: "USD", account: "001-55443322", cci: "011-001-55443322-33" },
        project: "PRY43500_CABLEADO_ESTRUCTURADO_2026",
        deliveryPlace: "Proyecto La Victoria",
        items: [{ description: "Cable UTP Cat6 caja 305m", quantity: 15, unitPrice: 95, currency: "USD", discount: 0, taxRate: "IGV 18%", total: 1425 }],
        subtotal: 1425,
        tax: 256.5,
        total: 1681.5,
        currency: "USD",
        status: "Emitida",
        notes: []
    },
    {
        _id: "OC-TH202600014",
        shippingAddress: { company: "THRADEX TECHNOLOGIES SAC", address: "Av. Ejército 789", city: "Miraflores", region: "Lima", country: "Perú", zip: "15074" },
        supplier: { name: "DIGITAL INFRASTRUCTURE S.A.C.", ruc: "20601122334", city: "Lima", country: "Perú" },
        buyer: "Fernando Vega",
        date: "2026-02-20",
        expectedArrival: "2026-03-02",
        quote: "DI-3344-26",
        paymentCondition: "Contado",
        paymentMethod: "Transferencia bancaria",
        bankDetails: { bank: "BCP", currency: "PEN", account: "191-77889900", cci: "002-191-77889900-44" },
        project: "PRY43520_SERVERS_LIMA_2026",
        deliveryPlace: "Data Center Miraflores",
        items: [{ description: "Servidor rack 2U 64GB RAM", quantity: 2, unitPrice: 18500, currency: "PEN", discount: 0, taxRate: "IGV 18%", total: 37000 }],
        subtotal: 37000,
        tax: 6660,
        total: 43660,
        currency: "PEN",
        status: "Pendiente",
        notes: []
    },
    {
        _id: "OC-TH202600015",
        shippingAddress: { company: "THRADEX TECHNOLOGIES SAC", address: "Av. Larco 456", city: "Miraflores", region: "Lima", country: "Perú", zip: "15074" },
        supplier: { name: "SMART CONNECT S.A.C.", ruc: "20544332211", city: "Lima", country: "Perú" },
        buyer: "Diego Morales",
        date: "2026-02-21",
        expectedArrival: "2026-03-05",
        quote: "SC-5566-26",
        paymentCondition: "Crédito 15 días",
        paymentMethod: "Transferencia bancaria",
        bankDetails: { bank: "Interbank", currency: "USD", account: "898-33445566", cci: "003-898-33445566-55" },
        project: "PRY43550_SWITCHING_CORE_2026",
        deliveryPlace: "Oficina Miraflores",
        items: [{ description: "Switch acceso 24 puertos Gigabit", quantity: 10, unitPrice: 320, currency: "USD", discount: 0, taxRate: "IGV 18%", total: 3200 }],
        subtotal: 3200,
        tax: 576,
        total: 3776,
        currency: "USD",
        status: "Emitida",
        notes: []
    }

];


type SortKey = "id" | "date" | "project" | "supplier" | "total" | "status" | "expectedArrival";
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
    // Using hardcoded data instead of fetch
    const [data] = useState<PurchaseOrder[]>(DUMMY_DATA);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Sorting
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>("asc");

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
            case "emitida": return "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200";
            case "pendiente": return "bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-200";
            default: return "bg-gray-500/15 text-gray-700 hover:bg-gray-500/25 border-gray-200";
        }
    };

    const filteredData = useMemo(() => {
        const filtered = data.filter((item) => {
            const matchesSearch =
                item._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });

        if (!sortKey) return filtered;

        return [...filtered].sort((a, b) => {
            let aVal: any;
            let bVal: any;

            switch (sortKey) {
                case "id":
                    aVal = a._id;
                    bVal = b._id;
                    break;
                case "date":
                    aVal = new Date(a.date).getTime();
                    bVal = new Date(b.date).getTime();
                    break;
                case "project":
                    aVal = a.project.toLowerCase();
                    bVal = b.project.toLowerCase();
                    break;
                case "supplier":
                    aVal = a.supplier.name.toLowerCase();
                    bVal = b.supplier.name.toLowerCase();
                    break;
                case "total":
                    aVal = a.total;
                    bVal = b.total;
                    break;
                case "status":
                    aVal = a.status.toLowerCase();
                    bVal = b.status.toLowerCase();
                    break;
                case "expectedArrival":
                    aVal = new Date(a.expectedArrival).getTime();
                    bVal = new Date(b.expectedArrival).getTime();
                    break;
                default:
                    return 0;
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

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-muted/50 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0 container max-w-6xl mx-auto px-4 py-6">

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 shrink-0">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
                            Órdenes de Compra
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Gestión y seguimiento de órdenes
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:ml-auto shrink-0">
                        <div
                            className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5 shadow-sm"
                        >
                            <span className="text-xs text-muted-foreground">Total USD</span>
                            <span className="text-sm font-bold font-mono tabular-nums">
                                {filteredData.reduce((acc, item) => acc + item.total, 0).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>

                        <Button
                            onClick={() => { }} // Placeholder
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm transition-all duration-150 hover:shadow-md"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva Orden
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 items-center mb-3 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Buscar por ID, Proyecto o Proveedor..."
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
                        <option value="Emitida">Emitida</option>
                        <option value="Pendiente">Pendiente</option>
                    </select>
                </div>

                {/* Desktop table */}
                <Card className="hidden md:flex flex-col flex-1 min-h-0 shadow-sm border-muted-foreground/15">
                    <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                        <div className="overflow-auto flex-1 min-h-0 rounded-[inherit]">
                            <Table>
                                <TableHeader className="sticky top-0 z-10">
                                    <TableRow className="hover:bg-transparent border-b">
                                        <SortableTh
                                            column="id"
                                            label="ID / NRO"
                                            className="w-[140px]"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        />
                                        <SortableTh
                                            column="project"
                                            label="PROYECTO"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        />
                                        <SortableTh
                                            column="supplier"
                                            label="PROVEEDOR"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        />
                                        <SortableTh
                                            column="date"
                                            label="FECHA"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        />
                                        <SortableTh
                                            column="expectedArrival"
                                            label="LLEGADA ESP."
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        />
                                        <SortableTh
                                            column="total"
                                            label="TOTAL (USD)"
                                            className="text-right"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        />
                                        <SortableTh
                                            column="status"
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
                                    {filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-40 text-center text-muted-foreground text-sm">
                                                No se encontraron órdenes de compra
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((item) => (
                                            <TableRow
                                                key={item._id}
                                                className="group hover:bg-muted/40 transition-colors duration-100 cursor-pointer"
                                                onClick={() => { }}
                                            >
                                                <TableCell className="font-mono text-xs text-muted-foreground py-3 font-semibold">
                                                    {item._id}
                                                </TableCell>
                                                <TableCell className="font-medium text-sm py-3">
                                                    {(() => {
                                                        const name = item.project;
                                                        return name.length > 40 ? name.slice(0, 40) + "…" : name;
                                                    })()}
                                                </TableCell>
                                                <TableCell className="text-sm py-3">
                                                    {item.supplier.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm py-3 whitespace-nowrap">
                                                    {format(new Date(item.date), "dd/MM/yyyy")}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm py-3 whitespace-nowrap">
                                                    {format(new Date(item.expectedArrival), "dd/MM/yyyy")}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-sm py-3 tabular-nums text-center">
                                                    {item.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Badge variant="outline" className={`capitalize text-xs w-full flex justify-center ${getStatusColor(item.status)}`}>
                                                        {item.status}
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
                {filteredData.length > 0 && (
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
        </div>
    );
}