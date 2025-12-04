"use client";

import React from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";

type Column = {
    label: string;
    key?: string;
    align?: "left" | "right" | "center";
    render?: (row: unknown, index?: number) => React.ReactNode;
    className?: string;
};

export function GenericTable({
    data,
    columns,
}: {
    data: any[];
    columns: readonly Column[];
}) {
    return (
        <div className="overflow-x-auto border rounded-md">
            <Table>
                <TableHeader className="bg-muted/40">
                    <TableRow>
                        {columns.map((col, i) => (
                            <TableHead
                                key={i}
                                className={`${getAlign(col.align)} ${col.className || ""}`}
                            >
                                {col.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.map((row, rowIndex) => (
                        <TableRow key={rowIndex} className="hover:bg-muted/50">
                            {columns.map((col, colIndex) => {
                                const value = col.render
                                    ? col.render(row, rowIndex)
                                    : row[col.key!];

                                return (
                                    <TableCell
                                        key={colIndex}
                                        className={`${getAlign(col.align)}`}
                                    >
                                        {value}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

// Helper: alineación
function getAlign(align?: "left" | "right" | "center") {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-left";
}
