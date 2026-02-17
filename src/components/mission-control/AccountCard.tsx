"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/utils/format";
import { ArrowUpRight, ArrowDownRight, Clock, Calendar, Briefcase, Landmark } from "lucide-react";

interface AccountProps {
    data: {
        id: number;
        name: string;
        number: string;
        type: string;
        balance: number;
        trend: number;
        creationDate: string;
        serviceDate: string;
        termDays?: number;
    };
}

export default function AccountCard({ data }: AccountProps) {
    const isPositive = data.trend >= 0;

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors duration-300">
            <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                {data.type === "INVERSIÓN" ? <Landmark className="w-6 h-6 text-blue-500" /> : <Briefcase className="w-6 h-6 text-blue-500" />}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{data.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{data.number}</span>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs font-normal border-blue-500/20 text-blue-500 bg-blue-500/5">
                                        {data.type}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold font-mono tracking-tight">
                                {formatCurrency(data.balance)}
                            </div>
                            <div className={`flex items-center justify-end text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                {Math.abs(data.trend)}%
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                        <div className="flex flex-col space-y-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Real Opening
                            </span>
                            <span className="text-sm font-medium">{formatDate(data.creationDate)}</span>
                        </div>
                        <div className="flex flex-col space-y-1 text-right">
                            <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                <Clock className="w-3 h-3" /> Service Date
                            </span>
                            <span className="text-sm font-medium">{formatDate(data.serviceDate)}</span>
                        </div>
                    </div>

                    {data.termDays && (
                        <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full w-fit mt-2">
                            <Clock className="w-3 h-3" />
                            <span>Length: {data.termDays} days</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
