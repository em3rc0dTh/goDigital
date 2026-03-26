"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    FileText,
    CheckCircle2,
    ShieldCheck,
    CreditCard,
    XCircle,
    Loader2,
    Clock,
    AlertCircle,
    RefreshCw,
    ArrowDownUp,
    Download,
    ChevronRight,
    User,
    Mail,
    BellRing,
} from "lucide-react";
import { format } from "date-fns";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PRData {
    _id: string;
    projectName?: string;
    providerName?: string;
    total?: number;
    currency?: string;
    createdByEmail?: string;
    createdByName?: string;
    projectOwnerEmail?: string;
    projectOwnerName?: string;
}

interface HistoryEntry {
    status: string;
    timestamp: string;
    actor?: string;
}

interface ActionPayload {
    userId?: string;
    userName?: string;
    notes?: string;
    reason?: string;
    paymentDate?: string;
    bankAccountName?: string;
    paymentProof?: string;
    timestamp: string;
}

interface PRWorkflowState {
    status: string;
    pr?: PRData;
    aprobacion?: ActionPayload;
    autorizacion?: ActionPayload;
    pago?: ActionPayload;
    rechazo?: ActionPayload;
    history: HistoryEntry[];
    temporalEnabled?: boolean;
    message?: string;
}

// ── Step visual config ─────────────────────────────────────────────────────────

const STEP_CONFIG: Record<
    string,
    {
        label: string;
        icon: React.ElementType;
        color: string;
        barColor: string;
        dotColor: string;
        textColor: string;
        badgeBg: string;
    }
> = {
    pending: {
        label: "Submitted",
        icon: FileText,
        color: "border-blue-400 dark:border-blue-500",
        barColor: "bg-blue-500",
        dotColor: "bg-blue-500 ring-blue-200 dark:ring-blue-900",
        textColor: "text-blue-700 dark:text-blue-400",
        badgeBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    },
    approved: {
        label: "Approved",
        icon: CheckCircle2,
        color: "border-emerald-400 dark:border-emerald-500",
        barColor: "bg-emerald-500",
        dotColor: "bg-emerald-500 ring-emerald-200 dark:ring-emerald-900",
        textColor: "text-emerald-700 dark:text-emerald-400",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    },
    authorized: {
        label: "Authorized",
        icon: ShieldCheck,
        color: "border-violet-400 dark:border-violet-500",
        barColor: "bg-violet-500",
        dotColor: "bg-violet-500 ring-violet-200 dark:ring-violet-900",
        textColor: "text-violet-700 dark:text-violet-400",
        badgeBg: "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800",
    },
    paid: {
        label: "Paid",
        icon: CreditCard,
        color: "border-teal-400 dark:border-teal-500",
        barColor: "bg-teal-500",
        dotColor: "bg-teal-500 ring-teal-200 dark:ring-teal-900",
        textColor: "text-teal-700 dark:text-teal-400",
        badgeBg: "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800",
    },
    rejected: {
        label: "Rejected",
        icon: XCircle,
        color: "border-red-400 dark:border-red-500",
        barColor: "bg-red-500",
        dotColor: "bg-red-500 ring-red-200 dark:ring-red-900",
        textColor: "text-red-700 dark:text-red-400",
        badgeBg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    },
};

// ── Notification map (mirrors activities.ts logic exactly) ────────────────────
// Returns which emails Temporal sent and what subject, for each status transition.

interface NotifEntry {
    to: string;
    name: string;
    subject: string;
    role: string;
}

function getNotifications(status: string, pr: PRData | undefined): NotifEntry[] {
    if (!pr) return [];

    const isSamePerson = pr.createdByEmail === pr.projectOwnerEmail;

    switch (status) {
        case "pending": {
            const notifs: NotifEntry[] = [];
            if (!isSamePerson && pr.createdByEmail) {
                notifs.push({
                    to: pr.createdByEmail,
                    name: pr.createdByName ?? pr.createdByEmail,
                    subject: `Payment Request Submitted - ${pr.projectName}`,
                    role: "Creator",
                });
            }
            if (pr.projectOwnerEmail) {
                notifs.push({
                    to: pr.projectOwnerEmail,
                    name: pr.projectOwnerName ?? pr.projectOwnerEmail,
                    subject: `Action Required: Approve Payment Request - ${pr.projectName}`,
                    role: "Project Owner",
                });
            }
            return notifs;
        }

        case "approved": {
            const notifs: NotifEntry[] = [];
            if (pr.createdByEmail) {
                notifs.push({
                    to: pr.createdByEmail,
                    name: pr.createdByName ?? pr.createdByEmail,
                    subject: `Payment Request Approved - ${pr.projectName}`,
                    role: "Creator",
                });
            }
            if (pr.projectOwnerEmail) {
                notifs.push({
                    to: pr.projectOwnerEmail,
                    name: pr.projectOwnerName ?? pr.projectOwnerEmail,
                    subject: `Payment Request Approved (Confirmation) - ${pr.projectName}`,
                    role: "Project Owner (approver)",
                });
                notifs.push({
                    to: pr.projectOwnerEmail,
                    name: pr.projectOwnerName ?? pr.projectOwnerEmail,
                    subject: `Action Required: Authorize Payment Request - ${pr.projectName}`,
                    role: "Project Owner (next step)",
                });
            }
            return notifs;
        }

        case "authorized": {
            const notifs: NotifEntry[] = [];
            if (pr.createdByEmail) {
                notifs.push({
                    to: pr.createdByEmail,
                    name: pr.createdByName ?? pr.createdByEmail,
                    subject: `Payment Request Authorized - ${pr.projectName}`,
                    role: "Creator",
                });
            }
            if (pr.projectOwnerEmail) {
                notifs.push({
                    to: pr.projectOwnerEmail,
                    name: pr.projectOwnerName ?? pr.projectOwnerEmail,
                    subject: `Action Required: Attend Payment Request - ${pr.projectName}`,
                    role: "Project Owner (next step)",
                });
            }
            return notifs;
        }

        case "paid": {
            const notifs: NotifEntry[] = [];
            if (pr.createdByEmail) {
                notifs.push({
                    to: pr.createdByEmail,
                    name: pr.createdByName ?? pr.createdByEmail,
                    subject: `Payment Completed - ${pr.projectName}`,
                    role: "Creator",
                });
            }
            if (pr.projectOwnerEmail) {
                notifs.push({
                    to: pr.projectOwnerEmail,
                    name: pr.projectOwnerName ?? pr.projectOwnerEmail,
                    subject: `Payment Processed (Confirmation) - ${pr.projectName}`,
                    role: "Project Owner (payer)",
                });
            }
            return notifs;
        }

        case "rejected": {
            const notifs: NotifEntry[] = [];
            if (pr.createdByEmail) {
                notifs.push({
                    to: pr.createdByEmail,
                    name: pr.createdByName ?? pr.createdByEmail,
                    subject: `Payment Request Rejected - ${pr.projectName}`,
                    role: "Creator",
                });
            }
            return notifs;
        }

        default:
            return [];
    }
}

// ── Event detail items ─────────────────────────────────────────────────────────

interface DetailItem {
    label: string;
    value: string;
    isUrl?: boolean;
}

function getEventDetails(status: string, workflow: PRWorkflowState): DetailItem[] {
    const items: DetailItem[] = [];
    switch (status) {
        case "approved":
            if (workflow.aprobacion?.notes) items.push({ label: "Notes", value: `"${workflow.aprobacion.notes}"` });
            break;
        case "authorized":
            if (workflow.autorizacion?.paymentDate) items.push({ label: "Payment Date", value: workflow.autorizacion.paymentDate });
            if (workflow.autorizacion?.bankAccountName) items.push({ label: "Account", value: workflow.autorizacion.bankAccountName });
            if (workflow.autorizacion?.notes) items.push({ label: "Notes", value: `"${workflow.autorizacion.notes}"` });
            break;
        case "paid":
            if (workflow.pago?.paymentProof) items.push({ label: "Proof", value: workflow.pago.paymentProof, isUrl: true });
            if (workflow.pago?.notes) items.push({ label: "Notes", value: `"${workflow.pago.notes}"` });
            break;
        case "rejected":
            if (workflow.rechazo?.reason) items.push({ label: "Reason", value: `"${workflow.rechazo.reason}"` });
            break;
    }
    return items;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

// ── Gantt Timeline ─────────────────────────────────────────────────────────────

function GanttTimeline({ history, workflow, ascending }: {
    history: HistoryEntry[];
    workflow: PRWorkflowState;
    ascending: boolean;
}) {
    if (history.length < 2) return null;

    const sorted = ascending ? [...history] : [...history].reverse();
    const timestamps = history.map((h) => new Date(h.timestamp).getTime());
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const totalSpan = maxTs - minTs || 5000;
    const PAD = 8;

    const TICK_COUNT = 8;
    const ticks: number[] = Array.from({ length: TICK_COUNT + 1 }, (_, i) =>
        minTs + (totalSpan * i) / TICK_COUNT
    );

    function pct(ts: number) {
        return PAD + ((ts - minTs) / totalSpan) * (100 - PAD * 2);
    }

    return (
        <div className="w-full">
            {/* Ruler */}
            <div className="relative h-7 border-b border-border mb-1 select-none">
                {ticks.map((t, i) => (
                    <div
                        key={i}
                        className="absolute flex flex-col items-center"
                        style={{ left: `${pct(t)}%`, transform: "translateX(-50%)" }}
                    >
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(t), "h:mm:ss a")}
                        </span>
                        <div className="w-px h-1.5 bg-border mt-0.5" />
                    </div>
                ))}
            </div>

            {/* Grid + Rows */}
            <div className="relative">
                {ticks.map((t, i) => (
                    <div key={i} className="absolute top-0 bottom-0 w-px bg-border/30 z-0"
                        style={{ left: `${pct(t)}%` }} />
                ))}
                <div className="space-y-1.5 relative z-10 py-1.5">
                    {sorted.map((entry, idx) => {
                        const cfg = STEP_CONFIG[entry.status] ?? STEP_CONFIG["pending"];
                        const Icon = cfg.icon;
                        const entryTs = new Date(entry.timestamp).getTime();
                        const dotPct = pct(entryTs);
                        const origIdx = history.findIndex(h => h.status === entry.status && h.timestamp === entry.timestamp);
                        const nextTs = history[origIdx + 1] ? new Date(history[origIdx + 1].timestamp).getTime() : null;
                        const barWidth = nextTs ? pct(nextTs) - dotPct : pct(entryTs + Math.min(totalSpan * 0.12, 2000)) - dotPct;
                        const duration = nextTs ? nextTs - entryTs : null;
                        const notifs = getNotifications(entry.status, workflow.pr);
                        const details = getEventDetails(entry.status, workflow);

                        return (
                            <div key={`gantt-${entry.status}-${idx}`} className="relative group flex items-center h-9">
                                {barWidth > 0 && (
                                    <div className={cn("absolute h-2 rounded-r-full opacity-20 group-hover:opacity-35 transition-opacity", cfg.barColor)}
                                        style={{ left: `${dotPct}%`, width: `${barWidth}%`, top: "50%", transform: "translateY(-50%)" }} />
                                )}
                                <div className="absolute z-20" style={{ left: `${dotPct}%`, top: "50%", transform: "translate(-50%,-50%)" }}>
                                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center ring-2 cursor-pointer transition-transform hover:scale-125", cfg.dotColor)}>
                                        <Icon className="h-2.5 w-2.5 text-white" />
                                    </div>

                                    {/* Tooltip */}
                                    <div className={cn(
                                        "absolute bottom-7 left-1/2 -translate-x-1/2 z-50 pointer-events-none",
                                        "w-64 rounded-xl border shadow-xl p-3 space-y-2",
                                        "bg-popover text-popover-foreground",
                                        "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                                    )}>
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Icon className={cn("h-3.5 w-3.5", cfg.textColor)} />
                                                <span className={cn("text-xs font-bold", cfg.textColor)}>{cfg.label}</span>
                                            </div>
                                            {duration !== null && (
                                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                    +{formatDuration(duration)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Timestamp & actor */}
                                        <p className="text-[10px] text-muted-foreground font-mono">
                                            {format(new Date(entry.timestamp), "d/M/yy, h:mm:ss.SS a")}
                                        </p>
                                        {entry.actor && (
                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                <User className="h-3 w-3" />{entry.actor}
                                            </div>
                                        )}

                                        {/* Details */}
                                        {details.length > 0 && (
                                            <div className="space-y-0.5 border-t border-border pt-1.5">
                                                {details.map((d, di) => (
                                                    <div key={di} className="flex gap-1 text-[11px]">
                                                        <span className="text-muted-foreground shrink-0">{d.label}:</span>
                                                        {d.isUrl ? (
                                                            <a href={d.value} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline truncate">View</a>
                                                        ) : (
                                                            <span className={cn("font-medium truncate", d.label === "Reason" ? "text-red-600" : "text-foreground")}>{d.value}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Notifications */}
                                        {notifs.length > 0 && (
                                            <div className="border-t border-border pt-1.5 space-y-1">
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
                                                    <Mail className="h-2.5 w-2.5" />Notifications sent
                                                </div>
                                                {notifs.map((n, ni) => (
                                                    <div key={ni} className="text-[10px] flex items-start gap-1">
                                                        <span className="text-muted-foreground shrink-0">→</span>
                                                        <span className="text-foreground break-all">{n.to}</span>
                                                        <span className="text-muted-foreground shrink-0">({n.role})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 border-b border-r border-border bg-popover rotate-45" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Event List row ─────────────────────────────────────────────────────────────

function EventRow({ entry, idx, workflow, history, isLast, isTerminal }: {
    entry: HistoryEntry;
    idx: number;
    workflow: PRWorkflowState;
    history: HistoryEntry[];
    isLast: boolean;
    isTerminal: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const cfg = STEP_CONFIG[entry.status] ?? STEP_CONFIG["pending"];
    const Icon = cfg.icon;

    const origIdx = history.findIndex(h => h.status === entry.status && h.timestamp === entry.timestamp);
    const nextEntry = history[origIdx + 1];
    const duration = nextEntry ? new Date(nextEntry.timestamp).getTime() - new Date(entry.timestamp).getTime() : null;

    const details = getEventDetails(entry.status, workflow);
    const notifs = getNotifications(entry.status, workflow.pr);
    const hasExtra = details.length > 0 || notifs.length > 0;

    return (
        <div
            className={cn(
                "py-2.5 px-1 rounded-lg transition-colors",
                hasExtra && "cursor-pointer hover:bg-muted/30",
                expanded && "bg-muted/20",
                "animate-in fade-in slide-in-from-bottom-1 duration-200",
            )}
            style={{ animationDelay: `${idx * 40}ms` }}
            onClick={() => hasExtra && setExpanded(v => !v)}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn("flex-shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center ring-2", cfg.dotColor)}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-sm font-semibold", cfg.textColor)}>{cfg.label}</span>
                        {duration !== null && (
                            <span className="text-[11px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                +{formatDuration(duration)}
                            </span>
                        )}
                        {notifs.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {notifs.length} email{notifs.length > 1 ? "s" : ""} sent
                            </span>
                        )}
                        {isLast && !isTerminal && (
                            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full animate-pulse">
                                CURRENT
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <time className="text-[11px] text-muted-foreground font-mono">
                            {format(new Date(entry.timestamp), "d/M/yy, h:mm:ss.SS a")}
                        </time>
                        {entry.actor && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <User className="h-3 w-3" />{entry.actor}
                            </span>
                        )}
                    </div>
                </div>

                {/* Expand chevron */}
                {hasExtra && (
                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform", expanded && "rotate-90")} />
                )}
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="ml-10 mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Action details */}
                    {details.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Action Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {details.map((d, di) => (
                                    <div key={di} className="flex gap-1.5 text-xs bg-muted/40 rounded-lg px-3 py-2">
                                        <span className="text-muted-foreground shrink-0 font-medium">{d.label}:</span>
                                        {d.isUrl ? (
                                            <a href={d.value} target="_blank" rel="noopener noreferrer"
                                                className="text-teal-600 hover:underline flex items-center gap-0.5 font-medium"
                                                onClick={e => e.stopPropagation()}>
                                                View voucher <ChevronRight className="h-3 w-3" />
                                            </a>
                                        ) : (
                                            <span className={cn("font-medium break-words", d.label === "Reason" ? "text-red-600" : "text-foreground")}>
                                                {d.value}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notifications */}
                    {notifs.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                <BellRing className="h-3 w-3" />
                                Notifications sent by Temporal
                            </div>
                            <div className="space-y-1">
                                {notifs.map((n, ni) => (
                                    <div key={ni} className="flex items-start gap-2 text-xs bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-foreground">{n.name}</span>
                                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 font-normal">
                                                    {n.role}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground text-[11px] mt-0.5 font-mono break-all">{n.to}</p>
                                            <p className="text-[11px] mt-0.5 text-muted-foreground/70 italic truncate">{n.subject}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function WorkflowTimeline({ paymentRequestId }: { paymentRequestId: string }) {
    const [workflow, setWorkflow] = useState<PRWorkflowState | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ascending, setAscending] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastFetched, setLastFetched] = useState<Date | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchTimeline = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            setError(null);
            
            const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            const res = await fetch(`${API_BASE}/payment-requests/${paymentRequestId}/workflow-status`, { 
                cache: "no-store",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "x-tenant-detail-id": tenantDetailId || "",
                },
                credentials: "include",
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: PRWorkflowState = await res.json();
            setWorkflow(data);
            setLastFetched(new Date());
        } catch (err: any) {
            setError(err.message || "Failed to load workflow timeline");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [paymentRequestId]);

    useEffect(() => { fetchTimeline(false); }, [fetchTimeline]);

    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(() => fetchTimeline(true), 5000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [autoRefresh, fetchTimeline]);

    const handleDownload = () => {
        if (!workflow) return;
        const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `workflow-${paymentRequestId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // States
    if (loading) {
        return (
            <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">Loading workflow timeline…</span>
            </div>
        );
    }

    if (workflow && !workflow.history && workflow.message) {
        return (
            <div className="flex flex-col items-center gap-3 py-10">
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{workflow.message}</p>
                </div>
            </div>
        );
    }

    if (error || !workflow) {
        return (
            <div className="flex flex-col items-center gap-3 py-8">
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 px-4 py-3 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error ?? "Could not load timeline"}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => fetchTimeline(false)} className="gap-2 text-xs">
                    <RefreshCw className="h-3.5 w-3.5" />Retry
                </Button>
            </div>
        );
    }

    const history = workflow.history ?? [];
    const isTerminal = ["paid", "rejected"].includes(workflow.status);
    const cfg = STEP_CONFIG[workflow.status] ?? STEP_CONFIG["pending"];
    const timestamps = history.map(h => new Date(h.timestamp).getTime());
    const totalDurationMs = timestamps.length >= 2 ? Math.max(...timestamps) - Math.min(...timestamps) : 0;
    const sorted = ascending ? [...history] : [...history].reverse();

    return (
        <div className="w-full space-y-4 font-mono text-xs">

            {/* ── TOP BAR ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-2 flex-wrap font-sans">
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn("text-xs px-2.5 py-1 border font-semibold capitalize gap-1.5 flex items-center", cfg.textColor, cfg.badgeBg, cfg.color)}>
                        <cfg.icon className="h-3 w-3" />
                        {cfg.label}
                    </Badge>
                    {!isTerminal && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className={cn("h-2 w-2 rounded-full animate-pulse inline-block", cfg.dotColor.split(" ")[0])} />
                            Running
                        </div>
                    )}
                    {totalDurationMs > 0 && (
                        <span className="text-xs text-muted-foreground">
                            Total: <span className="font-semibold text-foreground">{formatDuration(totalDurationMs)}</span>
                        </span>
                    )}
                    {lastFetched && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                            Updated {format(lastFetched, "h:mm:ss a")}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setAscending(v => !v)} className="gap-1.5 h-8 text-xs font-sans">
                        <ArrowDownUp className="h-3.5 w-3.5" />
                        {ascending ? "Ascending" : "Descending"}
                    </Button>
                    <Button variant={autoRefresh ? "secondary" : "ghost"} size="sm" onClick={() => setAutoRefresh(v => !v)}
                        className={cn("h-8 text-xs gap-1.5 font-sans", autoRefresh && "text-primary")}>
                        <RefreshCw className={cn("h-3.5 w-3.5", autoRefresh && "animate-spin [animation-duration:3s]")} />
                        {autoRefresh ? "Auto On" : "Auto Off"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => fetchTimeline(true)} disabled={refreshing} className="h-8 w-8 p-0">
                        <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8 w-8 p-0" title="Download JSON">
                        <Download className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* ── GANTT ───────────────────────────────────────────────────── */}
            {history.length >= 2 && (
                <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted-foreground font-sans tracking-widest uppercase">Timeline</span>
                        <span className="text-[10px] text-muted-foreground font-sans">
                            {format(new Date(Math.min(...timestamps)), "d/M/yy, h:mm:ss.SS a")}
                            {" → "}
                            {format(new Date(Math.max(...timestamps)), "h:mm:ss.SS a")}
                        </span>
                    </div>
                    <div className="px-4 py-3 overflow-x-auto">
                        <div className="min-w-[480px]">
                            <GanttTimeline history={history} workflow={workflow} ascending={ascending} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── EVENT LIST ──────────────────────────────────────────────── */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground font-sans tracking-widest uppercase">Events</span>
                    <span className="text-[10px] text-muted-foreground font-sans">
                        {history.length} event{history.length !== 1 ? "s" : ""} · click to expand
                    </span>
                </div>
                <div className="px-3 py-1 divide-y divide-border/50">
                    {sorted.map((entry, idx) => {
                        const origIdx = history.findIndex(h => h.status === entry.status && h.timestamp === entry.timestamp);
                        const isLast = origIdx === history.length - 1;
                        return (
                            <EventRow
                                key={`row-${entry.status}-${idx}`}
                                entry={entry}
                                idx={idx}
                                workflow={workflow}
                                history={history}
                                isLast={isLast}
                                isTerminal={isTerminal}
                            />
                        );
                    })}

                    {!isTerminal && (
                        <div className="flex items-center gap-3 py-3">
                            <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
                            </div>
                            <span className="text-xs text-muted-foreground font-sans italic animate-pulse">
                                Waiting for next action on this workflow…
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
