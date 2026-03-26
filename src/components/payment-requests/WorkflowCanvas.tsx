"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Position,
    Handle,
    Node,
    Edge,
    NodeProps,
    BackgroundVariant,
    Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    FileText,
    CheckCircle2,
    ShieldCheck,
    CreditCard,
    XCircle,
    Clock,
    Loader2,
    RefreshCw,
    Mail,
} from "lucide-react";
import { format } from "date-fns";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PRWorkflowState {
    status: string;
    history: { status: string; timestamp: string; actor?: string }[];
    aprobacion?: { userName?: string; notes?: string; timestamp: string };
    autorizacion?: { userName?: string; paymentDate?: string; bankAccountName?: string; notes?: string; timestamp: string };
    pago?: { userName?: string; paymentProof?: string; notes?: string; timestamp: string };
    rechazo?: { userName?: string; reason?: string; timestamp: string };
    pr?: {
        createdByEmail?: string; createdByName?: string;
        projectOwnerEmail?: string; projectOwnerName?: string;
        projectName?: string;
    };
    message?: string;
}

// ── Step config ────────────────────────────────────────────────────────────────

const STEP_CFG: Record<string, {
    label: string; icon: React.ElementType;
    bg: string; border: string; text: string; ring: string;
    notifLabel: string;
}> = {
    pending: {
        label: "Submitted", icon: FileText,
        bg: "bg-blue-50 dark:bg-blue-950/50",
        border: "border-blue-300 dark:border-blue-700",
        text: "text-blue-700 dark:text-blue-300",
        ring: "ring-blue-200 dark:ring-blue-800",
        notifLabel: "Notifies creator + asks project owner to approve",
    },
    approved: {
        label: "Approved", icon: CheckCircle2,
        bg: "bg-emerald-50 dark:bg-emerald-950/50",
        border: "border-emerald-300 dark:border-emerald-700",
        text: "text-emerald-700 dark:text-emerald-300",
        ring: "ring-emerald-200 dark:ring-emerald-800",
        notifLabel: "Notifies creator + asks project owner to authorize",
    },
    authorized: {
        label: "Authorized", icon: ShieldCheck,
        bg: "bg-violet-50 dark:bg-violet-950/50",
        border: "border-violet-300 dark:border-violet-700",
        text: "text-violet-700 dark:text-violet-300",
        ring: "ring-violet-200 dark:ring-violet-800",
        notifLabel: "Notifies creator + asks project owner to pay",
    },
    paid: {
        label: "Paid", icon: CreditCard,
        bg: "bg-teal-50 dark:bg-teal-950/50",
        border: "border-teal-300 dark:border-teal-700",
        text: "text-teal-700 dark:text-teal-300",
        ring: "ring-teal-200 dark:ring-teal-800",
        notifLabel: "Notifies creator + confirms to project owner",
    },
    rejected: {
        label: "Rejected", icon: XCircle,
        bg: "bg-red-50 dark:bg-red-950/50",
        border: "border-red-300 dark:border-red-700",
        text: "text-red-700 dark:text-red-300",
        ring: "ring-red-200 dark:ring-red-800",
        notifLabel: "Notifies creator with rejection reason",
    },
    timeout: {
        label: "Timeout", icon: Clock,
        bg: "bg-orange-50 dark:bg-orange-950/50",
        border: "border-orange-300 dark:border-orange-700",
        text: "text-orange-700 dark:text-orange-300",
        ring: "ring-orange-200 dark:ring-orange-800",
        notifLabel: "Auto-rejected after 7/5/3 days timeout",
    },
};

// ── Custom Node ────────────────────────────────────────────────────────────────

interface NodeData {
    statusKey: string;
    isActive: boolean;
    isCompleted: boolean;
    isTerminal: boolean;
    isPending: boolean;
    historyEntry?: { timestamp: string; actor?: string };
    detail?: string;
    timeout?: string;
    [key: string]: unknown;
}

function WorkflowNode({ data }: NodeProps) {
    const nd = data as NodeData;
    const cfg = STEP_CFG[nd.statusKey] ?? STEP_CFG["pending"];
    const Icon = cfg.icon;

    return (
        <div
            className={cn(
                "relative rounded-2xl border-2 p-4 min-w-[160px] max-w-[200px] shadow-sm transition-all duration-300 select-none",
                cfg.bg,
                cfg.border,
                nd.isActive && `ring-4 shadow-lg ${cfg.ring}`,
                nd.isPending && "opacity-40",
            )}
        >
            <Handle type="target" position={Position.Left} className="!border-0 !bg-transparent !w-0 !h-0" />

            {/* Status dot */}
            {nd.isActive && (
                <div className="absolute -top-1.5 -right-1.5">
                    <span className={cn("flex h-3.5 w-3.5 rounded-full ring-2 ring-background", cfg.border.replace("border-", "bg-"))}>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
                    </span>
                </div>
            )}
            {nd.isCompleted && (
                <div className="absolute -top-1.5 -right-1.5">
                    <CheckCircle2 className={cn("h-4 w-4 rounded-full bg-background", cfg.text)} />
                </div>
            )}

            {/* Icon + Label */}
            <div className="flex items-center gap-2 mb-1.5">
                <div className={cn("p-1.5 rounded-lg", cfg.border.replace("border", "bg").replace("-300", "-100").replace("-700", "-900/30"))}>
                    <Icon className={cn("h-4 w-4", cfg.text)} />
                </div>
                <span className={cn("text-sm font-bold leading-tight", cfg.text)}>
                    {cfg.label}
                </span>
            </div>

            {/* Timestamp + actor */}
            {nd.historyEntry && (
                <div className="space-y-0.5 mt-2 border-t border-current/10 pt-2">
                    <p className="text-[10px] font-mono text-muted-foreground">
                        {format(new Date(nd.historyEntry.timestamp), "d/M/yy h:mm a")}
                    </p>
                    {nd.historyEntry.actor && (
                        <p className="text-[10px] text-muted-foreground truncate">{nd.historyEntry.actor}</p>
                    )}
                </div>
            )}

            {/* Detail */}
            {nd.detail && (
                <p className="text-[10px] text-muted-foreground mt-1.5 italic truncate">{nd.detail}</p>
            )}

            {/* Timeout badge */}
            {nd.timeout && (
                <div className="mt-2">
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 text-orange-600 border-orange-300 bg-orange-50">
                        <Clock className="h-2.5 w-2.5" /> {nd.timeout}
                    </Badge>
                </div>
            )}

            {/* Notif hint */}
            <div className="mt-2 flex items-start gap-1">
                <Mail className="h-2.5 w-2.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[9px] text-muted-foreground leading-tight">{cfg.notifLabel}</p>
            </div>

            <Handle type="source" position={Position.Right} className="!border-0 !bg-transparent !w-0 !h-0" />
            <Handle type="source" id="bottom" position={Position.Bottom} className="!border-0 !bg-transparent !w-0 !h-0" />
        </div>
    );
}

const nodeTypes = { workflowNode: WorkflowNode };

// ── Build nodes + edges from workflow state ────────────────────────────────────

const MAIN_FLOW = ["pending", "approved", "authorized", "paid"] as const;
const TIMEOUTS: Record<string, string> = {
    pending: "7-day approval timeout",
    approved: "5-day authorization timeout",
    authorized: "3-day payment timeout",
};

function buildGraph(workflow: PRWorkflowState | null): { nodes: Node[]; edges: Edge[] } {
    const history = workflow?.history ?? [];
    const currentStatus = workflow?.status ?? "pending";
    const completedStatuses = new Set(history.map(h => h.status));
    const isTerminal = ["paid", "rejected"].includes(currentStatus);

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Main flow nodes
    MAIN_FLOW.forEach((status, i) => {
        const isCompleted = completedStatuses.has(status);
        const isActive = currentStatus === status && !isTerminal;
        const isPending = !isCompleted && !isActive;
        const historyEntry = history.find(h => h.status === status);

        let detail: string | undefined;
        if (status === "approved" && workflow?.aprobacion?.notes) detail = `"${workflow.aprobacion.notes}"`;
        if (status === "authorized" && workflow?.autorizacion?.bankAccountName) detail = workflow.autorizacion.bankAccountName;
        if (status === "paid" && workflow?.pago?.notes) detail = `"${workflow.pago.notes}"`;

        nodes.push({
            id: status,
            type: "workflowNode",
            position: { x: i * 240, y: 100 },
            data: {
                statusKey: status,
                isActive,
                isCompleted,
                isTerminal: status === "paid" && currentStatus === "paid",
                isPending,
                historyEntry,
                detail,
                timeout: isPending || isActive ? TIMEOUTS[status] : undefined,
            } satisfies NodeData,
        });
    });

    // Main flow edges
    for (let i = 0; i < MAIN_FLOW.length - 1; i++) {
        const src = MAIN_FLOW[i];
        const tgt = MAIN_FLOW[i + 1];
        const srcCompleted = completedStatuses.has(src);
        edges.push({
            id: `${src}->${tgt}`,
            source: src,
            target: tgt,
            label: srcCompleted ? "✓ done" : "signal",
            animated: currentStatus === src,
            style: { stroke: srcCompleted ? "#10b981" : "#94a3b8", strokeWidth: 2 },
            labelStyle: { fontSize: 10, fill: "#94a3b8" },
            labelBgStyle: { fill: "transparent" },
        });
    }

    // Rejection node — sits below the main flow
    const rejHistoryEntry = history.find(h => h.status === "rejected");
    const isRejected = currentStatus === "rejected";
    nodes.push({
        id: "rejected",
        type: "workflowNode",
        position: { x: 240, y: 340 },
        data: {
            statusKey: "rejected",
            isActive: false,
            isCompleted: isRejected,
            isTerminal: isRejected,
            isPending: !isRejected,
            historyEntry: rejHistoryEntry,
            detail: workflow?.rechazo?.reason ? `"${workflow.rechazo.reason}"` : undefined,
        } satisfies NodeData,
    });

    // Timeout node (below rejected)
    nodes.push({
        id: "timeout",
        type: "workflowNode",
        position: { x: 480, y: 340 },
        data: {
            statusKey: "timeout",
            isActive: false,
            isCompleted: false,
            isTerminal: false,
            isPending: true,
            timeout: "Auto-reject after timeout",
        } satisfies NodeData,
    });

    // Rejection edges from each intermediate node
    ["pending", "approved", "authorized"].forEach((src) => {
        const srcCompleted = completedStatuses.has(src);
        edges.push({
            id: `${src}->rejected`,
            source: src,
            sourceHandle: "bottom",
            target: "rejected",
            label: isRejected && currentStatus === "rejected" ? "rejected" : "reject signal",
            animated: false,
            type: "step",
            style: { stroke: isRejected ? "#ef4444" : "#cbd5e1", strokeWidth: 1.5, strokeDasharray: srcCompleted && !isRejected ? "0" : "4 3" },
            labelStyle: { fontSize: 9, fill: "#f87171" },
            labelBgStyle: { fill: "transparent" },
        });
        edges.push({
            id: `${src}->timeout`,
            source: src,
            sourceHandle: "bottom",
            target: "timeout",
            label: "timeout",
            animated: false,
            type: "step",
            style: { stroke: "#f97316", strokeWidth: 1, strokeDasharray: "3 4", opacity: 0.5 },
            labelStyle: { fontSize: 9, fill: "#f97316" },
            labelBgStyle: { fill: "transparent" },
        });
    });

    return { nodes, edges };
}

// ── Main component ─────────────────────────────────────────────────────────────

interface WorkflowCanvasProps {
    paymentRequestId: string;
}

export function WorkflowCanvas({ paymentRequestId }: WorkflowCanvasProps) {
    const [workflow, setWorkflow] = useState<PRWorkflowState | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchWorkflow = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
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
            if (res.ok) setWorkflow(await res.json());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [paymentRequestId]);

    useEffect(() => { fetchWorkflow(false); }, [fetchWorkflow]);

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildGraph(workflow), [workflow]);

    // Sync nodes/edges when workflow changes
    const [syncedNodes, setSyncedNodes] = useState(initialNodes);
    const [syncedEdges, setSyncedEdges] = useState(initialEdges);

    useEffect(() => {
        const { nodes: n, edges: e } = buildGraph(workflow);
        setSyncedNodes(n);
        setSyncedEdges(e);
    }, [workflow]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">Loading workflow canvas…</span>
            </div>
        );
    }

    if (workflow?.message && !workflow?.history) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                {workflow.message}
            </div>
        );
    }

    const currentStatus = workflow?.status ?? "pending";
    const cfg = STEP_CFG[currentStatus] ?? STEP_CFG["pending"];

    return (
        <div className="w-full h-full relative">
            <ReactFlow
                nodes={syncedNodes}
                edges={syncedEdges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.4}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-30" />
                <Controls showInteractive={false} className="rounded-lg shadow-sm" />
                <MiniMap
                    nodeColor={(n) => {
                        const nd = n.data as NodeData;
                        if (nd.isCompleted) return "#10b981";
                        if (nd.isActive) return "#6366f1";
                        return "#cbd5e1";
                    }}
                    className="rounded-lg shadow-sm !border-border"
                />

                {/* Status + refresh panel */}
                <Panel position="top-right" className="flex items-center gap-2 m-3">
                    <Badge
                        variant="outline"
                        className={cn("capitalize text-xs px-2.5 py-1 border font-semibold flex items-center gap-1.5", cfg.text, cfg.bg, cfg.border)}
                    >
                        <cfg.icon className="h-3 w-3" />
                        {cfg.label}
                    </Badge>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 rounded-lg shadow-sm"
                        onClick={() => fetchWorkflow(true)}
                        disabled={refreshing}
                        title="Refresh"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                    </Button>
                </Panel>

                {/* Legend panel */}
                <Panel position="bottom-left" className="m-3">
                    <div className="bg-background/90 backdrop-blur-sm border border-border rounded-xl p-3 shadow-sm space-y-1.5 text-[11px]">
                        <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mb-2">Legend</p>
                        {[
                            { color: "bg-emerald-500", label: "Completed" },
                            { color: "bg-indigo-500 animate-pulse", label: "Active (current)" },
                            { color: "bg-slate-300", label: "Pending" },
                            { color: "bg-red-400", label: "Rejected" },
                            { color: "bg-orange-400", label: "Timeout" },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-2">
                                <span className={cn("w-3 h-3 rounded-full shrink-0", color)} />
                                <span className="text-muted-foreground">{label}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}
