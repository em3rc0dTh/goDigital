"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { MOCK_BANKS, MOCK_SCHEDULED_PAYMENTS } from "@/components/mission-control/payment-outflow-mock-data";

// Custom Tooltip for Chart defined outside component to avoid re-creation on render
const CustomTooltip = ({ active, payload, locale, t }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-popover text-popover-foreground p-3 rounded-md shadow-md border text-sm">
                <p className="font-bold mb-1">{data.name}</p>
                <p className="text-muted-foreground text-xs mb-2">{data.alias}</p>
                <div className="space-y-1">
                    <div className="flex justify-between gap-4">
                        <span className="text-emerald-600 font-medium">{t("PaymentRequests.dashboard.availableBalance")}:</span>
                        <span>{new Intl.NumberFormat(locale === 'es' ? 'es-PE' : 'en-US', { style: 'currency', currency: data.currency }).format(data.balance)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-red-500 font-medium">{t("PaymentRequests.dashboard.scheduledOutflow")}:</span>
                        <span>{new Intl.NumberFormat(locale === 'es' ? 'es-PE' : 'en-US', { style: 'currency', currency: data.currency }).format(data.scheduled)}</span>
                    </div>
                    <div className="border-t pt-1 mt-1 flex justify-between gap-4 font-bold">
                        <span>{t("PaymentRequests.dashboard.status")}:</span>
                        <span className={data.isOverdraft ? "text-red-600" : "text-emerald-600"}>
                            {data.isOverdraft ? t("PaymentRequests.dashboard.overdraft") : t("PaymentRequests.dashboard.safe")}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

interface PaymentOutflowDashboardProps {
    className?: string;
}

export default function PaymentOutflowDashboard({ className }: PaymentOutflowDashboardProps) {
    const { t, locale } = useI18n();
    const [date, setDate] = useState<Date | undefined>(new Date());

    // Formatting helpers
    const getDateLocale = () => (locale === 'es' ? es : enUS);

    // Logic: Calculate Financial Status per Account for Selected Date
    const dashboardData = useMemo(() => {
        if (!date) return [];

        const selectedDateStr = date.toISOString().split('T')[0];

        // Flatten all accounts from all banks
        const allAccounts = MOCK_BANKS.flatMap(bank =>
            bank.accounts.map(acc => ({
                ...acc,
                bankName: bank.name,
                bankColor: bank.color
            }))
        );

        return allAccounts.map(account => {
            // Sum Approved Outflows for this account on the selected date
            const scheduledDebits = MOCK_SCHEDULED_PAYMENTS
                .filter(p =>
                    p.accountId === account.id &&
                    p.status === 'approved' &&
                    p.attentionDate === selectedDateStr
                )
                .reduce((sum, p) => sum + p.amount, 0);

            const isOverdraft = scheduledDebits > account.balance;

            return {
                id: account.id,
                name: `${account.bankName} - ${account.currency}`,
                alias: account.alias,
                currency: account.currency,
                balance: account.balance,
                scheduled: scheduledDebits,
                remaining: account.balance - scheduledDebits,
                isOverdraft,
                bankColor: account.bankColor
            };
        }).filter(item => item.balance > 0 || item.scheduled > 0); // Only show relevant accounts
    }, [date]);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(locale === 'es' ? 'es-PE' : 'en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    // Dynamic chart height: enough rows * row height + margins, min 260px
    const chartHeight = Math.max(260, dashboardData.length * 52 + 60);

    return (
        <div className={cn("flex flex-col gap-4 h-full min-h-0", className)}>
            {/* Header / Date Selection */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card p-3 sm:p-4 rounded-lg border shadow-sm shrink-0">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 leading-tight">
                        {t("PaymentRequests.dashboard.title")}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {t("PaymentRequests.dashboard.subtitle")}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium whitespace-nowrap">{t("PaymentRequests.dashboard.selectDate")}</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[200px] sm:w-[240px] justify-start text-left font-normal text-sm",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                {date ? format(date, "PPP", { locale: getDateLocale() }) : <span>{t("PaymentRequests.dashboard.pickDate")}</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Main Content — fills remaining vertical space */}
            <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0">
                <TabsList className="grid w-full grid-cols-2 shrink-0">
                    <TabsTrigger value="overview">{t("PaymentRequests.dashboard.tab.overview")}</TabsTrigger>
                    <TabsTrigger value="details">{t("PaymentRequests.dashboard.tab.details")}</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="flex-1 min-h-0 mt-4">
                    <Card className="shadow-md flex flex-col h-full min-h-0">
                        <CardHeader className="shrink-0 pb-2">
                            <CardTitle className="text-base sm:text-lg">{t("PaymentRequests.dashboard.analysisTitle")}</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                {t("PaymentRequests.dashboard.analysisDesc")}
                                <span className="block mt-1 text-xs text-muted-foreground">
                                    {t("PaymentRequests.dashboard.analysisTip")}
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 pb-4">
                            {/* Scrollable chart container when there are many rows */}
                            <div
                                className="w-full overflow-y-auto"
                                style={{ height: "100%", minHeight: 200 }}
                            >
                                <div style={{ width: "100%", height: chartHeight }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            layout="vertical"
                                            data={dashboardData}
                                            margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                width={130}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip content={<CustomTooltip locale={locale} t={t} />} />
                                            <Legend wrapperStyle={{ fontSize: 12 }} />
                                            <Bar dataKey="balance" name={t("PaymentRequests.dashboard.availableBalance")} fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                            <Bar dataKey="scheduled" name={t("PaymentRequests.dashboard.scheduledOutflow")} fill="#ef4444" radius={[0, 4, 4, 0]} barSize={10} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="flex-1 min-h-0 mt-4 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {dashboardData.map((account) => (
                            <Card key={account.id} className={cn("border-l-4", account.isOverdraft ? "border-l-red-500 shadow-red-100" : "border-l-emerald-500")}>
                                <CardContent className="pt-5 pb-4">
                                    <div className="flex justify-between items-start mb-3 gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{account.name}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{account.alias}</p>
                                        </div>
                                        {account.isOverdraft ? (
                                            <div className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-bold shrink-0">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                {t("PaymentRequests.dashboard.overdraft")}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full text-xs font-bold shrink-0">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                {t("PaymentRequests.dashboard.safe")}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm gap-2">
                                            <span className="text-muted-foreground text-xs">{t("PaymentRequests.dashboard.currentBalance")}:</span>
                                            <span className="font-mono font-medium text-xs sm:text-sm">{formatCurrency(account.balance, account.currency)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm gap-2">
                                            <span className="text-muted-foreground text-xs">{t("PaymentRequests.dashboard.scheduledOutflow")}:</span>
                                            <span className="font-mono font-bold text-red-500 text-xs sm:text-sm">-{formatCurrency(account.scheduled, account.currency)}</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between items-center bg-muted/20 -mx-6 px-6 py-2 mt-1 gap-2">
                                            <span className="font-semibold text-xs sm:text-sm">{t("PaymentRequests.dashboard.projectedBalance")}:</span>
                                            <span className={cn("font-mono font-bold text-sm sm:text-base", account.remaining < 0 ? "text-red-600" : "text-emerald-600")}>
                                                {formatCurrency(account.remaining, account.currency)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {dashboardData.length === 0 && (
                            <div className="col-span-full py-10 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed text-sm">
                                {t("PaymentRequests.dashboard.noData")}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}