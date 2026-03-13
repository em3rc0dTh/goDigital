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
    PanelLeftClose,
    PanelLeftOpen,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import {
    ALL_WORKFLOWS,
    WorkflowDefinition,
} from "@/components/workflows/GlobalWorkflowCanvas";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

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

// ── Status config helper ───────────────────────────────────────────────────────

function useStatusConfig(t: (k: string) => string) {
    return {
        production: {
            label: t("Workflows.production"),
            className: "text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-300 dark:border-emerald-700 dark:bg-emerald-950/40",
            dot: "bg-emerald-500",
        },
        demo: {
            label: t("Workflows.demo"),
            className: "text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-700 dark:bg-amber-950/40",
            dot: "bg-amber-500",
        },
        planned: {
            label: t("Workflows.planned") ?? "Planned",
            className: "text-slate-500 border-slate-300 bg-slate-50 dark:text-slate-400 dark:border-slate-700 dark:bg-slate-900/40",
            dot: "bg-slate-400",
        },
    };
}

// ── Workflow card ──────────────────────────────────────────────────────────────

function WorkflowCard({
    def,
    selected,
    onClick,
    compact = false,
}: {
    def: WorkflowDefinition;
    selected: boolean;
    onClick: () => void;
    compact?: boolean;
}) {
    const { t } = useI18n();
    const statusConfigs = useStatusConfig(t);
    const statusConfig = statusConfigs[def.status];

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left rounded-xl border-2 transition-all duration-200 group",
                compact ? "p-3" : "p-4",
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
                        <FlaskConical className={cn("h-4 w-4", selected ? "text-primary" : "text-muted-foreground")} />
                    ) : (
                        <Zap className={cn("h-4 w-4", selected ? "text-primary" : "text-muted-foreground")} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold truncate">{def.name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono shrink-0">v{def.version}</Badge>
                    </div>

                    {!compact && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{def.description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px] border flex items-center gap-1", statusConfig.className)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusConfig.dot)} />
                            {statusConfig.label}
                        </Badge>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <GitBranch className="h-3 w-3 shrink-0" />
                            {def.steps.length} {t("Workflows.steps")}
                        </div>
                        {!compact && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <CreditCard className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[80px]">{def.taskQueue}</span>
                            </div>
                        )}
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

// ── Timeout summary panel ──────────────────────────────────────────────────────

function TimeoutSummary({ selected }: { selected: WorkflowDefinition }) {
    const { t } = useI18n();
    if (!selected.timeoutSummary?.length) return null;

    return (
        <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                {t("Workflows.timeouts")}
            </p>
            {selected.timeoutSummary.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="truncate">{label}</span>
                    </div>
                    <span className="font-mono font-semibold text-foreground shrink-0">{value}</span>
                </div>
            ))}
            {selected.status === "demo" && (
                <div className="flex items-start gap-1.5 pt-1 border-t border-border mt-1">
                    <FlaskConical className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        {t("Workflows.demoWarning")}
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Workflow list panel (shared between desktop sidebar + mobile sheet) ────────

function WorkflowList({
    selected,
    onSelect,
    compact = false,
}: {
    selected: WorkflowDefinition;
    onSelect: (def: WorkflowDefinition) => void;
    compact?: boolean;
}) {
    const { t } = useI18n();

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-border shrink-0">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                    {t("Workflows.registered")}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {ALL_WORKFLOWS.map(def => (
                    <WorkflowCard
                        key={def.id}
                        def={def}
                        selected={selected.id === def.id}
                        onClick={() => onSelect(def)}
                        compact={compact}
                    />
                ))}

                <div className="rounded-xl border-2 border-dashed border-border p-4 text-center opacity-40">
                    <Zap className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{t("Workflows.moreComing")}</p>
                </div>
            </div>

            <TimeoutSummary selected={selected} />
        </div>
    );
}

// ── Mobile workflow selector bar ───────────────────────────────────────────────

function MobileWorkflowBar({
    selected,
    onSelect,
}: {
    selected: WorkflowDefinition;
    onSelect: (def: WorkflowDefinition) => void;
}) {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const statusConfigs = useStatusConfig(t);
    const statusConfig = statusConfigs[selected.status];

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-card border-b border-border hover:bg-muted/40 transition-colors text-left">
                    <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                        {selected.status === "demo"
                            ? <FlaskConical className="h-3.5 w-3.5 text-primary" />
                            : <Zap className="h-3.5 w-3.5 text-primary" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">{selected.name}</span>
                            <Badge variant="outline" className="text-[10px] font-mono shrink-0">v{selected.version}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={cn("text-[10px] border flex items-center gap-1 px-1.5 py-0", statusConfig.className)}>
                                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusConfig.dot)} />
                                {statusConfig.label}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <GitBranch className="h-3 w-3" />
                                {selected.steps.length} {t("Workflows.steps")}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground font-medium">
                        <span className="hidden xs:inline">{t("Workflows.registered")}</span>
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[80dvh] flex flex-col">
                <SheetHeader className="px-5 pt-5 pb-0 shrink-0">
                    <SheetTitle className="text-base">{t("Workflows.registered")}</SheetTitle>
                </SheetHeader>
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 pb-safe">
                    {ALL_WORKFLOWS.map(def => (
                        <WorkflowCard
                            key={def.id}
                            def={def}
                            selected={selected.id === def.id}
                            onClick={() => { onSelect(def); setOpen(false); }}
                        />
                    ))}
                    <div className="rounded-xl border-2 border-dashed border-border p-4 text-center opacity-40">
                        <Zap className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">{t("Workflows.moreComing")}</p>
                    </div>
                </div>
                {selected.timeoutSummary?.length ? (
                    <div className="shrink-0 pb-safe">
                        <TimeoutSummary selected={selected} />
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
    const { t } = useI18n();
    const [selected, setSelected] = useState<WorkflowDefinition>(ALL_WORKFLOWS[0]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const productionCount = ALL_WORKFLOWS.filter(w => w.status === "production").length;
    const demoCount = ALL_WORKFLOWS.filter(w => w.status === "demo").length;

    return (
        <div className="flex flex-col h-[100dvh] bg-gradient-to-br from-background via-muted/20 to-muted/40 overflow-hidden">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="shrink-0 border-b border-border bg-background/80 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between gap-3 max-w-screen-2xl mx-auto">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="p-1.5 sm:p-2 rounded-xl bg-primary/10 shrink-0">
                            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">
                                {t("Workflows.title")}
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0 sm:mt-0.5 hidden sm:block">
                                {t("Workflows.description")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px] sm:text-[11px] font-mono gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/40">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                            <span className="hidden xs:inline">{productionCount}</span>
                            <span className="hidden sm:inline"> {t("Workflows.production")}</span>
                            <span className="xs:hidden">{productionCount}</span>
                        </Badge>
                        {demoCount > 0 && (
                            <Badge variant="outline" className="text-[10px] sm:text-[11px] font-mono gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:bg-amber-950/40">
                                <FlaskConical className="h-2.5 w-2.5 shrink-0" />
                                <span>{demoCount}</span>
                                <span className="hidden sm:inline"> {t("Workflows.demo")}</span>
                            </Badge>
                        )}

                        {/* Desktop sidebar toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden md:flex h-8 w-8"
                            onClick={() => setSidebarCollapsed(v => !v)}
                            title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                        >
                            {sidebarCollapsed
                                ? <PanelLeftOpen className="h-4 w-4" />
                                : <PanelLeftClose className="h-4 w-4" />
                            }
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Mobile: selector bar (visible below md) ───────────────────── */}
            <div className="md:hidden shrink-0">
                <MobileWorkflowBar selected={selected} onSelect={setSelected} />
            </div>

            {/* ── Body ─────────────────────────────────────────────────────── */}
            <div className="flex flex-1 min-h-0 max-w-screen-2xl mx-auto w-full overflow-hidden">

                {/* Desktop sidebar */}
                <div className={cn(
                    "hidden md:flex flex-col shrink-0 border-r border-border bg-background/60 transition-all duration-300 ease-in-out overflow-hidden",
                    sidebarCollapsed ? "w-0 border-r-0" : "w-[300px] lg:w-[340px]"
                )}>
                    <div className={cn(
                        "w-[300px] lg:w-[340px] h-full flex flex-col transition-opacity duration-200",
                        sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
                    )}>
                        <WorkflowList selected={selected} onSelect={setSelected} />
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 min-w-0 relative">
                    {selected ? (
                        <GlobalWorkflowCanvas key={selected.id} initialDef={selected} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8 text-center">
                            <Zap className="h-8 w-8 opacity-30" />
                            <p className="text-sm">{t("Workflows.selectPrompt")}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}