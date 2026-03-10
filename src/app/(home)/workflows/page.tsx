"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
    Zap,
    GitBranch,
    Clock,
    ChevronRight,
    CreditCard,
    Loader2,
    FlaskConical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    ALL_WORKFLOWS,
    WorkflowDefinition,
} from "@/components/workflows/GlobalWorkflowCanvas";

// Lazy-load canvas (ReactFlow is client-only)
const GlobalWorkflowCanvas = dynamic(
    () =>
        import("@/components/workflows/GlobalWorkflowCanvas").then(
            (m) => ({ default: (props: { initialDef: WorkflowDefinition }) => <m.GlobalWorkflowCanvas {...props} /> })
        ),
    {
        ssr: false,
        loading: () => (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Loading workflow canvas…</span>
            </div>
        ),
    }
);

// ── Workflow card ──────────────────────────────────────────────────────────────

function WorkflowCard({
    def,
    selected,
    onClick,
}: {
    def: WorkflowDefinition;
    selected: boolean;
    onClick: () => void;
}) {
    const statusConfig = {
        production: {
            label: "Production",
            className: "text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-300 dark:border-emerald-700 dark:bg-emerald-950/40",
            dot: "bg-emerald-500",
        },
        demo: {
            label: "Demo",
            className: "text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-700 dark:bg-amber-950/40",
            dot: "bg-amber-500",
        },
        planned: {
            label: "Planned",
            className: "text-slate-500 border-slate-300 bg-slate-50 dark:text-slate-400 dark:border-slate-700 dark:bg-slate-900/40",
            dot: "bg-slate-400",
        },
    }[def.status];

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left rounded-xl border-2 p-4 transition-all duration-200 group",
                selected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "p-2 rounded-xl shrink-0 transition-colors",
                    selected ? "bg-primary/10" : "bg-muted group-hover:bg-primary/5"
                )}>
                    {def.status === "demo" ? (
                        <FlaskConical className={cn("h-5 w-5", selected ? "text-primary" : "text-muted-foreground")} />
                    ) : (
                        <Zap className={cn("h-5 w-5", selected ? "text-primary" : "text-muted-foreground")} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold truncate">{def.name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono shrink-0">v{def.version}</Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{def.description}</p>

                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px] border flex items-center gap-1", statusConfig.className)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dot)} />
                            {statusConfig.label}
                        </Badge>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <GitBranch className="h-3 w-3" />
                            {def.steps.length} steps
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CreditCard className="h-3 w-3" />
                            {def.taskQueue}
                        </div>
                    </div>
                </div>

                <ChevronRight className={cn(
                    "h-4 w-4 shrink-0 mt-1 transition-transform duration-200",
                    selected ? "rotate-90 text-primary" : "text-muted-foreground/50"
                )} />
            </div>
        </button>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
    const [selected, setSelected] = useState<WorkflowDefinition>(ALL_WORKFLOWS[0]);

    const productionCount = ALL_WORKFLOWS.filter(w => w.status === "production").length;
    const demoCount = ALL_WORKFLOWS.filter(w => w.status === "demo").length;

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 overflow-hidden">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="shrink-0 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4">
                <div className="flex items-start justify-between gap-4 max-w-screen-2xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Temporal Workflows</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Visual explorer — click any node to inspect signals, timeouts, and notifications
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[11px] font-mono gap-1.5 px-2 py-1 border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/40">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                            {productionCount} production
                        </Badge>
                        {demoCount > 0 && (
                            <Badge variant="outline" className="text-[11px] font-mono gap-1.5 px-2 py-1 border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:bg-amber-950/40">
                                <FlaskConical className="h-2.5 w-2.5" />
                                {demoCount} demo
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Body ─────────────────────────────────────────────────────── */}
            <div className="flex flex-1 min-h-0 max-w-screen-2xl mx-auto w-full">

                {/* Left: workflow list */}
                <div className="w-[320px] shrink-0 border-r border-border bg-background/60 flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-border shrink-0">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                            Registered Workflows
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {ALL_WORKFLOWS.map(def => (
                            <WorkflowCard
                                key={def.id}
                                def={def}
                                selected={selected.id === def.id}
                                onClick={() => setSelected(def)}
                            />
                        ))}

                        {/* Placeholder */}
                        <div className="rounded-xl border-2 border-dashed border-border p-4 text-center opacity-40">
                            <Zap className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">More workflows coming soon</p>
                        </div>
                    </div>

                    {/* Selected workflow timeout summary */}
                    {selected.timeoutSummary && selected.timeoutSummary.length > 0 && (
                        <div className="border-t border-border bg-muted/30 px-4 py-3 shrink-0 space-y-2">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Timeouts</p>
                            {selected.timeoutSummary.map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {label}
                                    </div>
                                    <span className="font-mono font-semibold text-foreground">{value}</span>
                                </div>
                            ))}
                            {selected.status === "demo" && (
                                <div className="flex items-start gap-1.5 pt-1 border-t border-border mt-1">
                                    <FlaskConical className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400">
                                        Demo workflow — not yet implemented in temporal-suite. Canvas is for design/preview only.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: canvas */}
                <div className="flex-1 min-w-0 relative">
                    {selected ? (
                        <GlobalWorkflowCanvas key={selected.id} initialDef={selected} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                            <Zap className="h-8 w-8 opacity-30" />
                            <p className="text-sm">Select a workflow to explore it</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
