"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LiquidityChart from "./LiquidityChart";
import AssetDistributionChart from "./AssetDistributionChart";
import AccountCard from "./AccountCard";
import { mockData } from "./mock-data";
import { formatCurrency } from "@/utils/format";
import { Activity, Layers, Landmark } from "lucide-react";

export default function MissionControlDashboard() {
    const [selectedBank, setSelectedBank] = useState<string>("general");

    const totalLiquidity = mockData.general.totalLiquidity;
    const generalTrend = mockData.general.trends;

    return (
        <div className="p-8 space-y-8 bg-background min-h-screen text-foreground">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        MISSION CONTROL
                    </h1>
                    <p className="text-muted-foreground mt-2">Finances & Liquidity Overview</p>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full" onValueChange={setSelectedBank}>
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    {mockData.banks.map((bank) => (
                        <TabsTrigger key={bank.id} value={bank.id}>{bank.name}</TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="general" className="space-y-6 mt-6">
                    {/* GENERAL DASHBOARD */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* MAIN STATS */}
                        <Card className="md:col-span-2 bg-gradient-to-br from-card to-card/50 border-border/50">
                            <CardHeader>
                                <CardTitle>Temporal Evolution</CardTitle>
                                <div className="text-3xl font-bold font-mono flex items-center">
                                    {formatCurrency(totalLiquidity)}
                                    <span className="text-sm font-normal text-emerald-500 ml-4 bg-emerald-500/10 px-2 py-1 rounded">
                                        +{generalTrend}%
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <LiquidityChart data={mockData.general.evolution} />
                            </CardContent>
                        </Card>

                        {/* SIDE METRICS */}
                        <div className="space-y-6">
                            <Card className="bg-card/50 border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Aggregated Indicators</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-blue-500" />
                                                <span>Trends</span>
                                            </div>
                                            <span className="text-emerald-500 font-bold">+{generalTrend}%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-purple-500" />
                                                <span>Variations</span>
                                            </div>
                                            <span className="text-rose-500 font-bold">{mockData.general.variation}%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-emerald-500/5 border-emerald-500/20">
                                <CardHeader>
                                    <CardTitle className="text-emerald-500">Global Consolidated</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{formatCurrency(totalLiquidity)}</div>
                                    <div className="text-sm text-emerald-600 mt-1 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Active Liquidity
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {mockData.banks.map((bank) => (
                    <TabsContent key={bank.id} value={bank.id} className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-4 space-y-6">
                                {/* ASSET DISTRIBUTION */}
                                <Card className="h-full border-border/50 relative overflow-hidden">
                                    <CardHeader>
                                        <CardTitle className="text-emerald-400">Asset Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <AssetDistributionChart data={bank.distribution} totalLabel={(bank.totalAssets / 1000000).toFixed(1) + 'M'} />
                                        <div className="grid grid-cols-2 gap-4 mt-8">
                                            {bank.distribution.map((item, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                                                    <span className="text-muted-foreground truncate">{item.name} ({item.value}%)</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="md:col-span-8 space-y-6">
                                {/* BANK METRICS ROW */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card className="bg-blue-500/5 border-blue-500/20 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-blue-500">Total Assets</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold relative z-10">{formatCurrency(bank.totalAssets)}</div>
                                            <Landmark className="absolute top-4 right-4 w-6 h-6 text-blue-500/20" />
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-card/50 border-border/50">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Treasury Funds</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-xl font-bold">{formatCurrency(bank.treasury)}</div>
                                            <div className="h-1 w-full bg-muted mt-2 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500" style={{ width: '45%' }} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-card/50 border-border/50">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Investments</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-xl font-bold">{formatCurrency(bank.investments)}</div>
                                            <div className="h-1 w-full bg-muted mt-2 rounded-full overflow-hidden">
                                                <div className="h-full bg-pink-500" style={{ width: '25%' }} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* ACCOUNTS LIST */}
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2">
                                        Account Breakdown
                                    </h3>
                                    <div className="space-y-4">
                                        {bank.accounts.map((account) => (
                                            <AccountCard key={account.id} data={account} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
