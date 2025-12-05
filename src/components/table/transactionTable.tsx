"use client"
import { ChevronDown } from "lucide-react";
import { GenericTable } from "./common-table";
import { useState } from "react";

//TODO FIX IT WITH AN GENERIC TABLE
type Column = {
    label: string;
    key?: string;
    align?: "left" | "right" | "center";
    render?: (row: unknown, index?: number) => React.ReactNode;
    className?: string;
    mobile?: boolean;
};

function ResponsiveTable({ data, columns }: { data: any[], columns: Column[] }) {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const toggleExpand = (index: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedRows(newExpanded);
    };

    const mobileColumns = columns.filter(col => col.mobile !== false).slice(0, 3);
    const hiddenColumns = columns.filter(col => !mobileColumns.includes(col));

    return (
        <div className="w-full overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={`px-4 py-3 text-left font-semibold text-gray-700 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                                        }`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                                {columns.map((col, colIdx) => (
                                    <td
                                        key={colIdx}
                                        className={`px-4 py-3 text-gray-800 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                                            } ${col.className || ''}`}
                                    >
                                        {col.render ? col.render(row, idx) : row[col.key || '']}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
                {data.map((row, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        {/* Mobile Header Row */}
                        <div className="bg-gray-50 p-4 flex justify-between items-start gap-2">
                            <div className="flex-1">
                                {mobileColumns.map((col, colIdx) => (
                                    <div key={colIdx} className="mb-2">
                                        <p className="text-xs font-semibold text-gray-600 uppercase">{col.label}</p>
                                        <p className="text-sm text-gray-900 font-medium break-words">
                                            {col.render ? col.render(row, idx) : row[col.key || '']}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {hiddenColumns.length > 0 && (
                                <button
                                    onClick={() => toggleExpand(idx)}
                                    className="flex-shrink-0 p-2 hover:bg-gray-200 rounded transition"
                                    aria-label="Toggle details"
                                >
                                    <ChevronDown
                                        size={20}
                                        className={`transition-transform ${expandedRows.has(idx) ? 'rotate-180' : ''}`}
                                    />
                                </button>
                            )}
                        </div>

                        {/* Mobile Expanded Details */}
                        {expandedRows.has(idx) && hiddenColumns.length > 0 && (
                            <div className="bg-white border-t border-gray-200 p-4 space-y-3">
                                {hiddenColumns.map((col, colIdx) => (
                                    <div key={colIdx} className="flex justify-between items-start">
                                        <p className="text-xs font-semibold text-gray-600 uppercase">{col.label}</p>
                                        <p className={`text-sm text-gray-900 font-medium text-right ${col.className || ''}`}>
                                            {col.render ? col.render(row, idx) : row[col.key || '']}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function PersonalTable({ storedTransactions }: { storedTransactions: any[] }) {
    const columns: Column[] = [
        { label: "#", render: (_: any, i?: number) => (i ?? 0) + 1, mobile: true },
        { label: "Description", key: "descripcion", mobile: true },
        { label: "Date & Time", render: (tx: any) => tx.fecha_hora_raw || tx.fecha_hora, mobile: true },
        {
            label: "Amount",
            align: "right",
            mobile: true,
            render: (tx: any) => (
                <span className={tx.monto > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {tx.monto > 0 ? "+" : ""}
                    {Number(tx.monto).toFixed(2)}
                </span>
            ),
        },
        { label: "Currency", align: "center", render: (tx: any) => tx.currency_raw || tx.currency },
    ];

    return <ResponsiveTable data={storedTransactions} columns={columns} />;
}

export function BusinessTable({ storedTransactions }: { storedTransactions: any[] }) {
    const columns: Column[] = [
        { label: "Operation Date", key: "operation_date", mobile: true },
        { label: "Process Date", key: "process_date" },
        { label: "Operation #", key: "operation_number" },
        { label: "Movement", key: "movement" },
        { label: "Description", key: "descripcion", mobile: true },
        { label: "Channel", key: "channel" },
        {
            label: "Amount",
            align: "right",
            mobile: true,
            render: (tx: any) => (
                <span className={tx.monto > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {tx.monto}
                </span>
            ),
        },
        { label: "Balance", key: "balance", align: "right" },
    ];

    return <ResponsiveTable data={storedTransactions} columns={columns} />;
}