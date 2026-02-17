"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface AssetData {
    name: string;
    value: number;
    fill: string;
}

interface AssetDistributionChartProps {
    data: AssetData[];
    totalLabel: string;
}

export default function AssetDistributionChart({ data, totalLabel }: AssetDistributionChartProps) {
    return (
        <div className="h-[250px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#f8fafc", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                        itemStyle={{ color: "#e2e8f0", textTransform: "capitalize" }}
                        formatter={(value: number) => [`${value}%`, "Distribution"]}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</span>
                <span className="text-2xl font-bold text-foreground">
                    {totalLabel}
                </span>
            </div>
        </div>
    );
}
