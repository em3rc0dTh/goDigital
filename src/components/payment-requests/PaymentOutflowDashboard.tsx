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
    LabelList,
    ResponsiveContainer,
} from "recharts";
import { MOCK_BANKS, MOCK_SCHEDULED_PAYMENTS } from "@/components/mission-control/payment-outflow-mock-data";

/* ─── Custom tooltip ────────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, locale, t }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
        <div className="bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border text-sm min-w-[220px]">
            <p className="font-bold mb-0.5 leading-tight">{data.name}</p>
            <p className="text-muted-foreground text-xs mb-2">{data.alias}</p>
            <div className="space-y-1.5">
                <div className="flex justify-between gap-4">
                    <span className="text-emerald-600 font-medium">{t("PaymentRequests.dashboard.availableBalance")}:</span>
                    <span className="font-mono text-xs">
                        {new Intl.NumberFormat(locale === "es" ? "es-PE" : "en-US", {
                            style: "currency", currency: data.currency,
                        }).format(data.balance)}
                    </span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-red-500 font-medium">{t("PaymentRequests.dashboard.scheduledOutflow")}:</span>
                    <span className="font-mono text-xs">
                        {new Intl.NumberFormat(locale === "es" ? "es-PE" : "en-US", {
                            style: "currency", currency: data.currency,
                        }).format(data.scheduled)}
                    </span>
                </div>
                <div className="border-t pt-1.5 flex justify-between gap-4 font-bold">
                    <span>{t("PaymentRequests.dashboard.status")}:</span>
                    <span className={data.isOverdraft ? "text-red-600" : "text-emerald-600"}>
                        {data.isOverdraft
                            ? t("PaymentRequests.dashboard.overdraft")
                            : t("PaymentRequests.dashboard.safe")}
                    </span>
                </div>
            </div>
        </div>
    );
};

/* ─── Custom bar label ───────────────────────────────────────────────────────── */
const BarValueLabel = ({ x, y, width, height, value, currency, locale }: any) => {
    if (!value || value === 0) return null;

    const formatted = new Intl.NumberFormat(locale === "es" ? "es-PE" : "en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
        style: "currency",
        currency: currency ?? "USD",
    }).format(value);

    const labelX = (x ?? 0) + (width ?? 0) + 5;
    const labelY = (y ?? 0) + (height ?? 0) / 2;

    return (
        <text
            x={labelX}
            y={labelY}
            dy="0.35em"
            fontSize={11}
            fill="currentColor"
            className="fill-muted-foreground"
        >
            {formatted}
        </text>
    );
};

/* ─── Component ─────────────────────────────────────────────────────────────── */
interface PaymentOutflowDashboardProps {
    className?: string;
}

export default function PaymentOutflowDashboard({ className }: PaymentOutflowDashboardProps) {
    const { t, locale } = useI18n();
    const [date, setDate] = useState<Date | undefined>(new Date());

    const getDateLocale = () => (locale === "es" ? es : enUS);

    const dashboardData = useMemo(() => {
        if (!date) return [];
        const selectedDateStr = date.toISOString().split("T")[0];

        const allAccounts = MOCK_BANKS.flatMap(bank =>
            bank.accounts.map(acc => ({ ...acc, bankName: bank.name, bankColor: bank.color }))
        );

        return allAccounts
            .map(account => {
                const scheduledDebits = MOCK_SCHEDULED_PAYMENTS
                    .filter(p =>
                        p.accountId === account.id &&
                        p.status === "approved" &&
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
                    bankColor: account.bankColor,
                };
            })
            .filter(item => item.balance > 0 || item.scheduled > 0);
    }, [date]);

    const formatCurrency = (amount: number, currency: string) =>
        new Intl.NumberFormat(locale === "es" ? "es-PE" : "en-US", {
            style: "currency",
            currency,
        }).format(amount);

    return (
        <div className={cn("flex flex-col h-full min-h-0 gap-3", className)}>

            {/* ── Header / date picker ── */}
            <div className="shrink-0 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 bg-card px-4 py-3 rounded-xl border shadow-sm">
                <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-semibold leading-tight">
                        {t("PaymentRequests.dashboard.title")}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {t("PaymentRequests.dashboard.subtitle")}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap hidden sm:block">
                        {t("PaymentRequests.dashboard.selectDate")}
                    </span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "w-[180px] sm:w-[210px] justify-start text-left font-normal text-xs sm:text-sm h-8",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                                {date
                                    ? format(date, "PPP", { locale: getDateLocale() })
                                    : <span>{t("PaymentRequests.dashboard.pickDate")}</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* ── Tabs ── */}
            <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0">
                <TabsList className="shrink-0 grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="overview" className="text-xs sm:text-sm">
                        {t("PaymentRequests.dashboard.tab.overview")}
                    </TabsTrigger>
                    <TabsTrigger value="details" className="text-xs sm:text-sm">
                        {t("PaymentRequests.dashboard.tab.details")}
                    </TabsTrigger>
                </TabsList>

                {/* ── OVERVIEW TAB ── */}
                <TabsContent
                    value="overview"
                    className="flex-1 min-h-0 mt-3 data-[state=inactive]:hidden"
                >
                    <Card className="flex flex-col h-full min-h-0 shadow-sm border-border/60">
                        <CardHeader className="shrink-0 pb-2 px-4 pt-4">
                            <CardTitle className="text-sm sm:text-base">
                                {t("PaymentRequests.dashboard.analysisTitle")}
                            </CardTitle>
                            <CardDescription className="text-xs leading-snug">
                                {t("PaymentRequests.dashboard.analysisDesc")}
                                <span className="block mt-0.5 text-xs text-muted-foreground/70">
                                    {t("PaymentRequests.dashboard.analysisTip")}
                                </span>
                            </CardDescription>
                        </CardHeader>

                        {/* Extend right margin to give LabelList room */}
                        <CardContent className="flex-1 min-h-0 px-2 pb-3">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={dashboardData}
                                    margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.4} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={120}
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip locale={locale} t={t} />}
                                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                                        iconSize={10}
                                    />
                                    <Bar
                                        dataKey="balance"
                                        name={t("PaymentRequests.dashboard.availableBalance")}
                                        fill="#10b981"
                                        radius={[0, 4, 4, 0]}
                                        barSize={14}
                                    >
                                        <LabelList
                                            dataKey="balance"
                                            position="right"
                                            content={(props) => (
                                                <BarValueLabel
                                                    {...props}
                                                    currency={dashboardData[props.index as number]?.currency}
                                                    locale={locale}
                                                />
                                            )}
                                        />
                                    </Bar>
                                    <Bar
                                        dataKey="scheduled"
                                        name={t("PaymentRequests.dashboard.scheduledOutflow")}
                                        fill="#ef4444"
                                        radius={[0, 4, 4, 0]}
                                        barSize={8}
                                    >
                                        <LabelList
                                            dataKey="scheduled"
                                            position="right"
                                            content={(props) => (
                                                <BarValueLabel
                                                    {...props}
                                                    currency={dashboardData[props.index as number]?.currency}
                                                    locale={locale}
                                                />
                                            )}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── DETAILS TAB ── */}
                <TabsContent
                    value="details"
                    className="flex-1 min-h-0 mt-3 data-[state=inactive]:hidden"
                >
                    {dashboardData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                            {t("PaymentRequests.dashboard.noData")}
                        </div>
                    ) : (
                        <div className="h-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-fr">
                            {dashboardData.map((account) => (
                                <Card
                                    key={account.id}
                                    className={cn(
                                        "flex flex-col border-l-4 shadow-sm overflow-hidden",
                                        account.isOverdraft
                                            ? "border-l-red-500"
                                            : "border-l-emerald-500"
                                    )}
                                >
                                    <CardContent className="flex flex-col flex-1 justify-between pt-4 pb-3 px-4">
                                        <div className="flex justify-between items-start gap-2 mb-3">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-xs sm:text-sm leading-tight truncate">
                                                    {account.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    {account.alias}
                                                </p>
                                            </div>
                                            {account.isOverdraft ? (
                                                <div className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs font-bold shrink-0">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {t("PaymentRequests.dashboard.overdraft")}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-bold shrink-0">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    {t("PaymentRequests.dashboard.safe")}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="text-muted-foreground text-xs">
                                                    {t("PaymentRequests.dashboard.currentBalance")}:
                                                </span>
                                                <span className="font-mono font-medium text-xs">
                                                    {formatCurrency(account.balance, account.currency)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="text-muted-foreground text-xs">
                                                    {t("PaymentRequests.dashboard.scheduledOutflow")}:
                                                </span>
                                                <span className="font-mono font-bold text-red-500 text-xs">
                                                    -{formatCurrency(account.scheduled, account.currency)}
                                                </span>
                                            </div>
                                            <div className="border-t pt-1.5 flex justify-between items-center gap-2">
                                                <span className="font-semibold text-xs">
                                                    {t("PaymentRequests.dashboard.projectedBalance")}:
                                                </span>
                                                <span className={cn(
                                                    "font-mono font-bold text-xs sm:text-sm",
                                                    account.remaining < 0 ? "text-red-600" : "text-emerald-600"
                                                )}>
                                                    {formatCurrency(account.remaining, account.currency)}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}