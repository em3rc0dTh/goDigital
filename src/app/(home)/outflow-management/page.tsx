"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
    LayoutDashboard,
    CalendarDays,
    Plus,
    FileText,
    Receipt,
    Building2,
    ArrowRight,
    ShoppingBag,
    Wallet,
    GitBranch,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentOutflowDashboard from "@/components/payment-requests/PaymentOutflowDashboard";
import PaymentCalendar from "@/components/payment-requests/PaymentCalendar";
import { useI18n } from "@/i18n/I18nProvider";
import { useRouter } from "next/navigation";

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
    project?: any;
    payment_date?: string;
    provider?: any;
}

/* ─── Action card definitions ───────────────────────────────────────────────── */
const NEW_ITEMS = [
    {
        key: "payment",
        icon: FileText,
        titleKey: "Outflow.paymentRequest.title",
        descriptionKey: "Outflow.paymentRequest.description",
        defaultTitle: "Payment Request",
        defaultDescription: "Request a payment to a provider linked to a project or purchase order.",
        gradient: "from-blue-500/10 to-blue-500/3",
        border: "border-blue-200/70 hover:border-blue-300/90",
        iconColor: "text-blue-600",
        iconBg: "bg-blue-500/10",
        ctaColor: "text-blue-600",
        href: "/payment-request",
    },
    {
        key: "purchaseOrder",
        icon: ShoppingBag,
        titleKey: "Outflow.purchaseOrder.title",
        descriptionKey: "Outflow.purchaseOrder.description",
        defaultTitle: "Purchase Order",
        defaultDescription: "Create a new purchase order for a project or vendor.",
        gradient: "from-amber-500/10 to-amber-500/3",
        border: "border-amber-200/70 hover:border-amber-300/90",
        iconColor: "text-amber-600",
        iconBg: "bg-amber-500/10",
        ctaColor: "text-amber-600",
        href: "/purchase-orders",
    },
    {
        key: "cashRequest",
        icon: Wallet,
        titleKey: "Outflow.cashRequest.title",
        descriptionKey: "Outflow.cashRequest.description",
        defaultTitle: "Cash Request",
        defaultDescription: "Request a cash advance or reimbursement for expenses to report.",
        gradient: "from-rose-500/10 to-rose-500/3",
        border: "border-rose-200/70 hover:border-rose-300/90",
        iconColor: "text-rose-600",
        iconBg: "bg-rose-500/10",
        ctaColor: "text-rose-600",
        href: "/cash-requests",
    },
    {
        key: "expense",
        icon: Receipt,
        titleKey: "Outflow.expenseRequest.title",
        descriptionKey: "Outflow.expenseRequest.description",
        defaultTitle: "Expense Request",
        defaultDescription: "Submit a reimbursable expense for approval and processing.",
        gradient: "from-emerald-500/10 to-emerald-500/3",
        border: "border-emerald-200/70 hover:border-emerald-300/90",
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-500/10",
        ctaColor: "text-emerald-600",
        href: "/expense-request",
    },
    {
        key: "admin",
        icon: Building2,
        titleKey: "Outflow.administrativePayment.title",
        descriptionKey: "Outflow.administrativePayment.description",
        defaultTitle: "Administrative Payment",
        defaultDescription: "Register an administrative payment outside of project scope.",
        gradient: "from-violet-500/10 to-violet-500/3",
        border: "border-violet-200/70 hover:border-violet-300/90",
        iconColor: "text-violet-600",
        iconBg: "bg-violet-500/10",
        ctaColor: "text-violet-600",
        href: "/administrative-payment",
    },
    {
        key: "workflows",
        icon: GitBranch,
        titleKey: "Outflow.workflows.title",
        descriptionKey: "Outflow.workflows.description",
        defaultTitle: "Workflows",
        defaultDescription: "Automate and manage your internal approval and payment flows.",
        gradient: "from-teal-500/10 to-teal-500/3",
        border: "border-teal-200/70 hover:border-teal-300/90",
        iconColor: "text-teal-600",
        iconBg: "bg-teal-500/10",
        ctaColor: "text-teal-600",
        href: "/workflows",
    },
] as const;

/* ─── Reusable action card ──────────────────────────────────────────────────── */
function ActionCard({
    icon: Icon,
    title,
    description,
    gradient,
    border,
    iconColor,
    iconBg,
    ctaColor,
    onClick,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    gradient: string;
    border: string;
    iconColor: string;
    iconBg: string;
    ctaColor: string;
    onClick: () => void;
}) {
    const { t } = useI18n();

    return (
        <button
            onClick={onClick}
            className={`
                group relative flex flex-col items-start text-left w-full
                rounded-xl border bg-gradient-to-br p-5 sm:p-6
                shadow-sm hover:shadow-md
                transition-all duration-200 ease-out
                hover:-translate-y-0.5
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-ring focus-visible:ring-offset-2
                ${gradient} ${border}
            `}
        >
            <div className={`flex items-center justify-center h-11 w-11 rounded-xl mb-4 ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight mb-2">{title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">{description}</p>
            <div className={`flex items-center gap-1.5 mt-5 text-sm font-medium ${ctaColor} opacity-70 group-hover:opacity-100 transition-opacity duration-150`}>
                <span>{t("Outflow.getStarted") || "Get started"}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </div>
        </button>
    );
}

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function Outflow() {
    const { t } = useI18n();
    const router = useRouter();
    const [data, setData] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = Cookies.get("session_token");
                const tenantDetailId = Cookies.get("tenantDetailId");

                const response = await fetch(`${API_BASE}/payment-requests`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-tenant-detail-id": tenantDetailId || "",
                    },
                    credentials: "include",
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(Array.isArray(result) ? result : []);
                } else {
                    setData([]);
                    if (response.status !== 404 && response.status !== 500) {
                        console.warn(`Fetch notice: ${response.status}`);
                    }
                }
            } catch (error) {
                setData([]);
                console.warn("Fetch failed, using empty data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_BASE]);

    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden bg-background">
            <Tabs
                defaultValue="dashboard"
                className="flex flex-col flex-1 min-h-0 px-4 pt-4 pb-4 sm:px-6 sm:pt-5 sm:pb-5"
            >
                {/* ── Tab bar ── */}
                <div className="shrink-0 mb-4">
                    <TabsList className="h-auto p-0.5 gap-0.5 bg-muted/50 border border-border/50 shadow-sm">
                        <TabsTrigger
                            value="dashboard"
                            className="gap-2 text-sm px-3 sm:px-4 py-2 rounded-[5px] data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-150"
                        >
                            <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
                            <span className="hidden xs:inline sm:inline">
                                {t("Outflow.tabs.dashboard") || "Tablero de Egresos"}
                            </span>
                            <span className="xs:hidden sm:hidden">{t("Outflow.tabs.dashboardShort") || "Dashboard"}</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="calendar"
                            className="gap-2 text-sm px-3 sm:px-4 py-2 rounded-[5px] data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-150"
                        >
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                            <span className="hidden xs:inline sm:inline">
                                {t("Outflow.tabs.calendar") || "Calendario de Pagos"}
                            </span>
                            <span className="xs:hidden sm:hidden">{t("Outflow.tabs.calendarShort") || "Calendar"}</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="new"
                            className="gap-2 text-sm px-3 sm:px-4 py-2 rounded-[5px] data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-150"
                        >
                            <Plus className="h-3.5 w-3.5 shrink-0" />
                            <span>{t("Outflow.tabs.new") || "Nuevo"}</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ── DASHBOARD TAB ── */}
                <TabsContent
                    value="dashboard"
                    className="flex-1 min-h-[500px] mt-0 overflow-hidden data-[state=inactive]:hidden"
                >
                    <PaymentOutflowDashboard className="h-full w-full" />
                </TabsContent>

                <TabsContent
                    value="calendar"
                    className="flex flex-col flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden"
                >
                    <div className="shrink-0 flex items-baseline gap-2 mb-2 px-0.5">
                        <h2 className="text-sm sm:text-base font-semibold tracking-tight leading-tight">
                            {t("Outflow.calendar.title") || "Payment Calendar"}
                        </h2>
                        <span className="hidden sm:block text-xs text-muted-foreground">
                            — {t("Outflow.calendar.description") || "organised by due date"}
                        </span>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
                        <PaymentCalendar data={data} className="h-full w-full" />
                    </div>
                </TabsContent>

                {/* ── NEW TAB ── */}
                <TabsContent
                    value="new"
                    className="flex flex-col flex-1 min-h-0 mt-0 overflow-y-auto custom-scrollbar data-[state=inactive]:hidden"
                >
                    <div className="flex flex-col items-center py-6 sm:py-10 gap-8">
                        {/* Centred heading */}
                        <div className="text-center">
                            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
                                {t("Outflow.newRequest.title") || "New Outflow Request"}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("Outflow.newRequest.subtitle") || "Select the type of request you'd like to create."}
                            </p>
                        </div>

                        {/* Responsive Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl px-2">
                            {NEW_ITEMS.map(
                                ({ key, icon: Icon, titleKey, descriptionKey, defaultTitle, defaultDescription, gradient, border, iconColor, iconBg, ctaColor, href }) => (
                                    <ActionCard
                                        key={key}
                                        icon={Icon}
                                        title={t(titleKey) || defaultTitle}
                                        description={t(descriptionKey) || defaultDescription}
                                        gradient={gradient}
                                        border={border}
                                        iconColor={iconColor}
                                        iconBg={iconBg}
                                        ctaColor={ctaColor}
                                        onClick={() => router.push(href)}
                                    />
                                )
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}