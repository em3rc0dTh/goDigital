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
    RotateCcw,
    BadgeCheck,
    Banknote,
    Search,
    AlertTriangle,
    Mail,
    Zap,
    Info,
    Edit2,
    Save,
    X,
    Wallet,
    ReceiptText,
    ScanLine,
    PackageCheck,
    ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    taskQueue: string;
    version: string;
    status: "production" | "demo" | "planned";
    /**
     * Ordered list of step IDs that form the MAIN (happy) path.
     * All other steps in `steps[]` are treated as branch/terminal nodes.
     */
    mainPath: string[];
    /**
     * IDs of steps that are reachable from any main-path step via rejection/timeout.
     * These will be rendered in a row below the main path.
     */
    branchPath: string[];
    /** All steps (main + branches) */
    steps: WorkflowStep[];
    /** Generic timeout labels — shown in the sidebar summary */
    timeoutSummary?: { label: string; value: string }[];
}

export interface WorkflowStep {
    id: string;
    label: string;
    type: "start" | "action" | "terminal" | "branch-terminal";
    /** Temporal signal name that advances TO this step (from the previous step) */
    signal?: string;
    notifications: string[];
    /** How long this step waits before auto-rejecting */
    timeout?: string;
    nextOnSuccess?: string;
    nextOnReject?: string;
    nextOnTimeout?: string;
    /** Which branch node(s) this step can fall back to */
    rejectsTo?: string[];
    /** Visual color theme override */
    color?: "blue" | "emerald" | "violet" | "teal" | "red" | "orange" | "amber" | "rose" | "cyan" | "indigo";
}

// ── Icon map ───────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
    FileText, CheckCircle2, ShieldCheck, CreditCard, XCircle,
    Clock, RotateCcw, BadgeCheck, Banknote, Search,
    AlertTriangle, Mail, Zap,
    Wallet, ReceiptText, ScanLine, PackageCheck, ArrowLeftRight,
};

// ── Color map ──────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-700", text: "text-blue-700 dark:text-blue-300", badge: "bg-blue-600" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-700 dark:text-emerald-300", badge: "bg-emerald-600" },
    violet: { bg: "bg-violet-50 dark:bg-violet-950/40", border: "border-violet-300 dark:border-violet-700", text: "text-violet-700 dark:text-violet-300", badge: "bg-violet-600" },
    teal: { bg: "bg-teal-50 dark:bg-teal-950/40", border: "border-teal-300 dark:border-teal-700", text: "text-teal-700 dark:text-teal-300", badge: "bg-teal-600" },
    red: { bg: "bg-red-50 dark:bg-red-950/40", border: "border-red-300 dark:border-red-700", text: "text-red-700 dark:text-red-300", badge: "bg-red-600" },
    orange: { bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-300 dark:border-orange-700", text: "text-orange-700 dark:text-orange-300", badge: "bg-orange-600" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-300 dark:border-amber-700", text: "text-amber-700 dark:text-amber-300", badge: "bg-amber-600" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-300 dark:border-rose-700", text: "text-rose-700 dark:text-rose-300", badge: "bg-rose-600" },
    cyan: { bg: "bg-cyan-50 dark:bg-cyan-950/40", border: "border-cyan-300 dark:border-cyan-700", text: "text-cyan-700 dark:text-cyan-300", badge: "bg-cyan-600" },
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-300 dark:border-indigo-700", text: "text-indigo-700 dark:text-indigo-300", badge: "bg-indigo-600" },
};

// Default color for unlabeled steps (cycles through palette)
const PALETTE = ["blue", "emerald", "violet", "teal", "cyan", "indigo", "amber", "orange"];

function getCfg(step: WorkflowStep, index: number) {
    const colorKey = step.color ?? PALETTE[index % PALETTE.length];
    return COLOR_MAP[colorKey] ?? COLOR_MAP["blue"];
}

// ── Custom Node ────────────────────────────────────────────────────────────────

function DefinitionNode({ data }: NodeProps) {
    const step = data as WorkflowStep & { _index: number;[key: string]: unknown };
    const cfg = getCfg(step, step._index ?? 0);
    const isBranchTerminal = step.type === "branch-terminal" || step.type === "terminal";
    const isStart = step.type === "start";

    const iconName = (data as any)._icon as string | undefined;
    const Icon: React.ElementType = (iconName && ICON_MAP[iconName]) ? ICON_MAP[iconName] : FileText;

    return (
        <div className={cn(
            "relative rounded-2xl border-2 p-4 w-[200px] shadow-sm",
            cfg.bg, cfg.border,
        )}>
            <Handle type="target" position={Position.Left} className="!border-0 !bg-transparent !w-0 !h-0" />
            <Handle type="target" id="top" position={Position.Top} className="!border-0 !bg-transparent !w-0 !h-0" />

            {isStart && (
                <Badge className={cn("absolute -top-3 left-4 text-[9px] px-1.5 py-0 h-5 text-white border-0", cfg.badge)}>START</Badge>
            )}
            {isBranchTerminal && (
                <Badge className="absolute -top-3 left-4 text-[9px] px-1.5 py-0 h-5 text-white border-0 bg-slate-600">TERMINAL</Badge>
            )}
            {step.type === "terminal" && (
                <Badge className={cn("absolute -top-3 left-4 text-[9px] px-1.5 py-0 h-5 text-white border-0", cfg.badge)}>TERMINAL ✓</Badge>
            )}

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-lg border", cfg.border, cfg.bg)}>
                    <Icon className={cn("h-4 w-4", cfg.text)} />
                </div>
                <span className={cn("text-sm font-bold leading-tight", cfg.text)}>{step.label}</span>
            </div>

            {/* Signal */}
            {step.signal && (
                <div className="flex items-center gap-1 mb-2">
                    <Zap className="h-2.5 w-2.5 text-amber-500" />
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{step.signal}</span>
                </div>
            )}

            {/* Timeout */}
            {step.timeout && (
                <div className="flex items-center gap-1 mb-2">
                    <Clock className="h-2.5 w-2.5 text-orange-500" />
                    <span className="text-[10px] text-orange-700 dark:text-orange-400">{step.timeout} timeout</span>
                </div>
            )}

            {/* Notifications */}
            {step.notifications.length > 0 && (
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1 mb-1">
                        <Mail className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Notifies</span>
                    </div>
                    {step.notifications.map((n, i) => (
                        <p key={i} className="text-[9px] text-muted-foreground leading-tight pl-3">{n}</p>
                    ))}
                </div>
            )}

            <Handle type="source" position={Position.Right} className="!border-0 !bg-transparent !w-0 !h-0" />
            <Handle type="source" id="bottom" position={Position.Bottom} className="!border-0 !bg-transparent !w-0 !h-0" />
        </div>
    );
}

const nodeTypes = { definitionNode: DefinitionNode };

// ── Icon assignment per step type (heuristic) ──────────────────────────────────

const STEP_ICON_HINTS: Record<string, string> = {
    pending: "FileText",
    submitted: "FileText",
    created: "FileText",
    review: "Search",
    under_review: "Search",
    validated: "BadgeCheck",
    approved: "CheckCircle2",
    authorized: "ShieldCheck",
    paid: "CreditCard",
    payment: "CreditCard",
    cash: "Wallet",
    expense: "ReceiptText",
    draft: "ReceiptText",
    scan: "ScanLine",
    analysis: "ScanLine",
    closed: "PackageCheck",
    reimbursement: "ArrowLeftRight",
    refund: "RotateCcw",
    reimbursed: "Banknote",
    completed: "BadgeCheck",
    rejected: "XCircle",
    cancelled: "XCircle",
    denied: "AlertTriangle",
    timeout: "Clock",
};

function inferIcon(stepId: string): string {
    for (const [key, icon] of Object.entries(STEP_ICON_HINTS)) {
        if (stepId.toLowerCase().includes(key)) return icon;
    }
    return "FileText";
}

// ── Build graph from a generic WorkflowDefinition ─────────────────────────────

const NODE_WIDTH = 220;
const NODE_GAP_X = 300;   // horizontal gap between nodes (wider to avoid crowding)
const NODE_GAP_Y = 340;   // vertical distance: main row → branch row

function buildGraph(def: WorkflowDefinition): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const allStepIds = new Set(def.steps.map(s => s.id));

    // ── Main path nodes (horizontal row, y = 100) ──────────────────────────────
    def.mainPath.forEach((id, i) => {
        const step = def.steps.find(s => s.id === id);
        if (!step) return;
        nodes.push({
            id,
            type: "definitionNode",
            position: { x: i * NODE_GAP_X, y: 100 },
            data: { ...step, _index: i, _icon: inferIcon(id) },
        });
    });

    // ── Main path edges ─────────────────────────────────────────────────────
    for (let i = 0; i < def.mainPath.length - 1; i++) {
        const src = def.mainPath[i];
        const tgt = def.mainPath[i + 1];
        const tgtStep = def.steps.find(s => s.id === tgt);
        edges.push({
            id: `${src}->${tgt}`,
            source: src,
            target: tgt,
            label: tgtStep?.signal ? `signal: ${tgtStep.signal}` : "→",
            animated: true,
            style: { stroke: "#10b981", strokeWidth: 2 },
            labelStyle: { fontSize: 9, fill: "#6b7280" },
            labelBgStyle: { fill: "transparent" },
        });
    }

    // ── Branch path nodes (row below, uniformly spread & centered) ────────────
    //
    // Distribute branch nodes evenly across the full width of the main path
    // so they never overlap each other or crowd under a single column.
    //
    const mainTotalWidth = (def.mainPath.length - 1) * NODE_GAP_X;
    const branchCount = def.branchPath.length;

    def.branchPath.forEach((id, i) => {
        const step = def.steps.find(s => s.id === id);
        if (!step) return;

        let posX: number;
        if (branchCount === 1) {
            // Single branch node → center it under the main row
            posX = mainTotalWidth / 2 - NODE_WIDTH / 2;
        } else {
            // Multiple branch nodes → spread evenly across the main row width
            const branchSpan = Math.max(
                (branchCount - 1) * NODE_GAP_X,
                mainTotalWidth,
            );
            const startX = (mainTotalWidth - branchSpan) / 2;
            posX = startX + i * (branchSpan / (branchCount - 1));
        }

        nodes.push({
            id,
            type: "definitionNode",
            position: { x: posX, y: 100 + NODE_GAP_Y },
            data: { ...step, _index: def.mainPath.length + i, _icon: inferIcon(id) },
        });
    });

    // ── Branch edges: from each main step that rejects to branch nodes ─────────
    //
    // Include both src and tgt in the id to guarantee uniqueness across steps.
    //
    def.mainPath.forEach((srcId) => {
        const srcStep = def.steps.find(s => s.id === srcId);
        if (!srcStep?.rejectsTo) return;
        srcStep.rejectsTo.forEach(tgtId => {
            if (!allStepIds.has(tgtId)) return;
            edges.push({
                id: `branch-${srcId}->${tgtId}`,
                source: srcId,
                sourceHandle: "bottom",
                target: tgtId,
                targetHandle: "top",
                label: srcStep.signal ? "rechazar / timeout" : "→",
                type: "step",
                style: { stroke: "#ef4444", strokeWidth: 1.5, strokeDasharray: "4 3", opacity: 0.75 },
                labelStyle: { fontSize: 9, fill: "#ef4444" },
                labelBgStyle: { fill: "transparent" },
            });
        });
    });

    return { nodes, edges };
}

// ── Edit panel ─────────────────────────────────────────────────────────────────

function EditPanel({ def, onSave, onCancel }: {
    def: WorkflowDefinition;
    onSave: (d: WorkflowDefinition) => void;
    onCancel: () => void;
}) {
    const [draft, setDraft] = useState<WorkflowDefinition>(JSON.parse(JSON.stringify(def)));

    return (
        <div className="h-full overflow-y-auto px-6 py-5 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Edit Workflow</h3>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={onCancel} className="gap-1.5 h-8">
                        <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                    <Button size="sm" onClick={() => onSave(draft)} className="gap-1.5 h-8">
                        <Save className="h-3.5 w-3.5" /> Save
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {[
                    { key: "name", label: "Workflow Name" },
                    { key: "taskQueue", label: "Task Queue", mono: true },
                    { key: "version", label: "Version", mono: true },
                ].map(({ key, label, mono }) => (
                    <div key={key} className="space-y-1">
                        <Label className="text-xs">{label}</Label>
                        <Input
                            value={(draft as any)[key]}
                            className={cn("h-8 text-sm", mono && "font-mono")}
                            onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                        />
                    </div>
                ))}
                <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea value={draft.description} className="text-sm min-h-[80px] resize-none"
                        onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Steps</p>
                {draft.steps.map((step, si) => (
                    <div key={step.id} className="border border-border rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-mono">{step.id}</Badge>
                            <span className="text-sm font-semibold">{step.label}</span>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px]">Step Label</Label>
                            <Input value={step.label} className="h-7 text-xs"
                                onChange={e => setDraft(d => {
                                    const steps = [...d.steps];
                                    steps[si] = { ...steps[si], label: e.target.value };
                                    return { ...d, steps };
                                })} />
                        </div>
                        {step.signal !== undefined && (
                            <div className="space-y-1">
                                <Label className="text-[11px]">Signal name</Label>
                                <Input value={step.signal} className="h-7 text-xs font-mono"
                                    onChange={e => setDraft(d => {
                                        const steps = [...d.steps];
                                        steps[si] = { ...steps[si], signal: e.target.value };
                                        return { ...d, steps };
                                    })} />
                            </div>
                        )}
                        {step.timeout !== undefined && (
                            <div className="space-y-1">
                                <Label className="text-[11px]">Timeout</Label>
                                <Input value={step.timeout} className="h-7 text-xs font-mono"
                                    onChange={e => setDraft(d => {
                                        const steps = [...d.steps];
                                        steps[si] = { ...steps[si], timeout: e.target.value };
                                        return { ...d, steps };
                                    })} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <p>Changes are stored locally in this session. To apply to production, update the corresponding <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">workflow.ts</code> in temporal-suite and restart the worker.</p>
                </div>
            </div>
        </div>
    );
}

// ── Main canvas export ─────────────────────────────────────────────────────────

interface GlobalWorkflowCanvasProps {
    initialDef: WorkflowDefinition;
}

export function GlobalWorkflowCanvas({ initialDef }: GlobalWorkflowCanvasProps) {
    const [def, setDef] = useState<WorkflowDefinition>(initialDef);
    const [editing, setEditing] = useState(false);
    const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

    // Rebuild when def or initialDef changes
    useEffect(() => { setDef(initialDef); }, [initialDef]);

    const { nodes: builtNodes, edges: builtEdges } = useMemo(() => buildGraph(def), [def]);

    const [liveNodes, setLiveNodes] = useState(builtNodes);
    const [liveEdges, setLiveEdges] = useState(builtEdges);

    useEffect(() => {
        const { nodes: n, edges: e } = buildGraph(def);
        setLiveNodes(n);
        setLiveEdges(e);
    }, [def]);

    const handleSave = (updated: WorkflowDefinition) => {
        setDef(updated);
        setEditing(false);
    };

    const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        const step = def.steps.find(s => s.id === node.id);
        setSelectedStep(step ?? null);
    }, [def]);

    const statusColor = {
        production: "text-emerald-600 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700",
        demo: "text-amber-600 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700",
        planned: "text-slate-500 bg-slate-50 border-slate-300 dark:bg-slate-900/40 dark:border-slate-700",
    }[def.status];

    return (
        <div className="flex h-full">
            {/* Canvas */}
            <div className="flex-1 relative">
                <ReactFlow
                    key={def.id}
                    nodes={liveNodes}
                    edges={liveEdges}
                    nodeTypes={nodeTypes}
                    onNodeClick={handleNodeClick}
                    fitView
                    fitViewOptions={{ padding: 0.35 }}
                    minZoom={0.25}
                    maxZoom={2}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-30" />
                    <Controls showInteractive={false} className="rounded-lg shadow-sm" />
                    <MiniMap
                        nodeColor={(n) => {
                            const step = def.steps.find(s => s.id === n.id);
                            if (!step) return "#cbd5e1";
                            const colorKey = step.color ?? PALETTE[def.mainPath.indexOf(n.id) % PALETTE.length];
                            const cfg = COLOR_MAP[colorKey];
                            if (!cfg) return "#cbd5e1";
                            // Return a hex approximation based on color name
                            const HEX: Record<string, string> = {
                                blue: "#3b82f6", emerald: "#10b981", violet: "#8b5cf6",
                                teal: "#14b8a6", red: "#ef4444", orange: "#f97316",
                                amber: "#f59e0b", rose: "#f43f5e", cyan: "#06b6d4", indigo: "#6366f1",
                            };
                            return HEX[colorKey] ?? "#94a3b8";
                        }}
                        className="rounded-lg shadow-sm !border-border"
                    />

                    {/* Workflow info panel */}
                    <Panel position="top-left" className="m-3 max-w-xs">
                        <div className="bg-background/95 backdrop-blur rounded-xl border border-border shadow-sm p-3 space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                                    <Zap className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="text-sm font-bold truncate">{def.name}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{def.description}</p>
                            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                                <Badge variant="secondary" className="text-[10px] font-mono">{def.taskQueue}</Badge>
                                <Badge variant="outline" className="text-[10px]">v{def.version}</Badge>
                                <Badge variant="outline" className={cn("text-[10px] capitalize border", statusColor)}>
                                    {def.status}
                                </Badge>
                            </div>
                        </div>
                    </Panel>

                    {/* Edit button */}
                    <Panel position="top-right" className="m-3">
                        <Button
                            size="sm"
                            variant={editing ? "secondary" : "outline"}
                            className="gap-1.5 h-8 shadow-sm"
                            onClick={() => { setEditing(e => !e); setSelectedStep(null); }}
                        >
                            <Edit2 className="h-3.5 w-3.5" />
                            {editing ? "Close Editor" : "Edit Workflow"}
                        </Button>
                    </Panel>

                    {/* Legend */}
                    <Panel position="bottom-left" className="m-3">
                        <div className="bg-background/90 backdrop-blur-sm border border-border rounded-xl p-3 shadow-sm space-y-1.5 text-[11px]">
                            <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mb-2">Legend</p>
                            {[
                                { color: "bg-emerald-500", label: "Success path (animated)" },
                                { color: "bg-red-400", label: "Reject / timeout path" },
                                { color: "bg-amber-400", label: "Temporal signal" },
                                { color: "bg-orange-400", label: "Auto-timeout" },
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

            {/* Right panel: editor or step detail */}
            {(editing || selectedStep) && (
                <div className="w-[340px] border-l border-border bg-background flex-shrink-0 overflow-hidden flex flex-col">
                    {editing ? (
                        <EditPanel def={def} onSave={handleSave} onCancel={() => setEditing(false)} />
                    ) : selectedStep ? (
                        <div className="px-6 py-5 space-y-4 overflow-y-auto">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold">{selectedStep.label}</h3>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedStep(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { label: "Step ID", value: selectedStep.id, mono: true },
                                    { label: "Type", value: selectedStep.type, mono: true },
                                    { label: "Signal", value: selectedStep.signal ?? "—", mono: true },
                                    { label: "Timeout", value: selectedStep.timeout ?? "None" },
                                    { label: "On Success", value: selectedStep.nextOnSuccess ?? "—" },
                                    { label: "On Reject", value: selectedStep.nextOnReject ?? "—" },
                                    { label: "On Timeout", value: selectedStep.nextOnTimeout ?? "—" },
                                    { label: "Rejects To", value: selectedStep.rejectsTo?.join(", ") ?? "—" },
                                ].map(({ label, value, mono }) => (
                                    <div key={label}>
                                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                                        <p className={cn("text-sm mt-0.5", mono && "font-mono")}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {selectedStep.notifications.length > 0 && (
                                <div>
                                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-2">Notifications</p>
                                    <div className="space-y-1.5">
                                        {selectedStep.notifications.map((n, i) => (
                                            <div key={i} className="flex items-start gap-2 bg-muted/30 rounded-lg px-3 py-2">
                                                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                <span className="text-sm">{n}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-muted/30 rounded-xl px-3 py-2.5 text-xs text-muted-foreground">
                                Click another node to inspect it, or press X to close.
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

// ── Workflow definitions ───────────────────────────────────────────────────────

export const PAYMENT_REQUEST_WORKFLOW: WorkflowDefinition = {
    id: "payment-request-workflow",
    name: "Payment Request Workflow",
    description: "Manages the full lifecycle of a payment request: submission → approval → authorization → payment, with automatic timeout rejection and email notifications at each step.",
    taskQueue: "payment-requests",
    version: "1.0.0",
    status: "production",
    mainPath: ["pending", "approved", "authorized", "paid"],
    branchPath: ["rejected"],
    timeoutSummary: [
        { label: "Approval", value: "7 days" },
        { label: "Authorization", value: "5 days" },
        { label: "Payment", value: "3 days" },
    ],
    steps: [
        {
            id: "pending",
            label: "Submitted",
            type: "start",
            color: "blue",
            notifications: [
                "→ Creator: submission confirmation",
                "→ Project Owner: action required (approve)",
            ],
            nextOnSuccess: "approved",
            rejectsTo: ["rejected"],
        },
        {
            id: "approved",
            label: "Approved",
            type: "action",
            color: "emerald",
            signal: "aprobar",
            timeout: "7 days",
            notifications: [
                "→ Creator: approved notification",
                "→ Project Owner: confirmation + action required (authorize)",
            ],
            nextOnSuccess: "authorized",
            nextOnReject: "rejected",
            nextOnTimeout: "rejected",
            rejectsTo: ["rejected"],
        },
        {
            id: "authorized",
            label: "Authorized",
            type: "action",
            color: "violet",
            signal: "autorizar",
            timeout: "5 days",
            notifications: [
                "→ Creator: authorized notification",
                "→ Project Owner: action required (pay)",
            ],
            nextOnSuccess: "paid",
            nextOnReject: "rejected",
            nextOnTimeout: "rejected",
            rejectsTo: ["rejected"],
        },
        {
            id: "paid",
            label: "Paid",
            type: "terminal",
            color: "teal",
            signal: "pagar",
            timeout: "3 days",
            notifications: [
                "→ Creator: payment complete",
                "→ Project Owner: payment confirmation",
            ],
        },
        {
            id: "rejected",
            label: "Rejected",
            type: "branch-terminal",
            color: "red",
            signal: "rechazar",
            notifications: ["→ Creator: rejection reason + details"],
        },
    ],
};

export const REFUND_REQUEST_WORKFLOW: WorkflowDefinition = {
    id: "refund-request-workflow",
    name: "Refund Request Workflow",
    description: "Handles employee or client refund requests: initial submission with reason & evidence → finance validation → approval → reimbursement processing → confirmation. Auto-rejects on timeout at each stage.",
    taskQueue: "refund-requests",
    version: "1.0.0",
    status: "demo",
    mainPath: ["submitted", "under_review", "approved", "reimbursed"],
    branchPath: ["rejected"],
    timeoutSummary: [
        { label: "Review", value: "5 days" },
        { label: "Approval", value: "3 days" },
        { label: "Payment", value: "2 days" },
    ],
    steps: [
        {
            id: "submitted",
            label: "Submitted",
            type: "start",
            color: "indigo",
            notifications: [
                "→ Requester: submission confirmation",
                "→ Finance team: new refund request received",
            ],
            nextOnSuccess: "under_review",
            rejectsTo: ["rejected"],
        },
        {
            id: "under_review",
            label: "Under Review",
            type: "action",
            color: "cyan",
            signal: "iniciar_revision",
            timeout: "5 days",
            notifications: [
                "→ Requester: your request is being reviewed",
                "→ Finance: action required (validate evidence & amount)",
            ],
            nextOnSuccess: "approved",
            nextOnReject: "rejected",
            nextOnTimeout: "rejected",
            rejectsTo: ["rejected"],
        },
        {
            id: "approved",
            label: "Approved",
            type: "action",
            color: "emerald",
            signal: "aprobar_devolucion",
            timeout: "3 days",
            notifications: [
                "→ Requester: refund approved — processing soon",
                "→ Finance: confirmation + action required (process reimbursement)",
            ],
            nextOnSuccess: "reimbursed",
            nextOnReject: "rejected",
            nextOnTimeout: "rejected",
            rejectsTo: ["rejected"],
        },
        {
            id: "reimbursed",
            label: "Reimbursed",
            type: "terminal",
            color: "teal",
            signal: "procesar_reembolso",
            timeout: "2 days",
            notifications: [
                "→ Requester: reimbursement completed — check your account",
                "→ Finance: reimbursement confirmed",
            ],
        },
        {
            id: "rejected",
            label: "Rejected / Denied",
            type: "branch-terminal",
            color: "red",
            signal: "rechazar_devolucion",
            notifications: [
                "→ Requester: rejection with reason & escalation options",
            ],
        },
    ],
};

// ── Cash Request Workflow ─────────────────────────────────────────────────────
// Full lifecycle: request → supervisor approval → superadmin authorization
// → treasurer payment → expense report (with OCR) → admin review → close
// Handles balance cases: exact match, reimbursement (gastado > autorizado),
// and refund (gastado < autorizado).

export const CASH_REQUEST_WORKFLOW: WorkflowDefinition = {
    id: "cash-request-workflow",
    name: "Cash Request Workflow",
    description: "Full cash advance lifecycle for employees. Covers supervisor approval, superadmin authorization with amount & time window, treasurer disbursement, expense reporting with AI document analysis, and final settlement — with reimbursement or refund handling when the balance is non-zero.",
    taskQueue: "cash-requests",
    version: "1.0.0",
    status: "production",
    mainPath: [
        "created",
        "approved",
        "authorized",
        "paid",
        "expense_draft",
        "submitted",
        "under_review",
        "closed",
    ],
    branchPath: ["rejected", "reimbursement", "refund"],
    timeoutSummary: [
        { label: "Supervisor approval",       value: "5 days" },
        { label: "Admin authorization",       value: "3 days" },
        { label: "Treasurer payment",         value: "2 days" },
        { label: "Expense report window",     value: "Defined by admin" },
        { label: "Admin review",              value: "5 days" },
        { label: "Reimbursement / Refund",    value: "3 days" },
    ],
    steps: [
        // ── Main path ──────────────────────────────────────────────────────
        {
            id: "created",
            label: "Created",
            type: "start",
            color: "blue",
            notifications: [
                "→ Employee: submission confirmation",
                "→ Supervisor (Project Owner): action required (approve)",
            ],
            nextOnSuccess: "approved",
            rejectsTo: ["rejected"],
        },
        {
            id: "approved",
            label: "Approved",
            type: "action",
            color: "emerald",
            signal: "aprobar",
            timeout: "5 days",
            notifications: [
                "→ Employee: request approved by supervisor",
                "→ SuperAdmin: action required (authorize amount & time window)",
            ],
            nextOnSuccess: "authorized",
            nextOnReject: "rejected",
            nextOnTimeout: "rejected",
            rejectsTo: ["rejected"],
        },
        {
            id: "authorized",
            label: "Authorized",
            type: "action",
            color: "violet",
            signal: "autorizar",
            timeout: "3 days",
            notifications: [
                "→ Employee: authorized — amount & period set",
                "→ SuperAdmin (Treasurer): action required (disburse cash)",
            ],
            nextOnSuccess: "paid",
            nextOnReject: "rejected",
            nextOnTimeout: "rejected",
            rejectsTo: ["rejected"],
        },
        {
            id: "paid",
            label: "Paid / Disbursed",
            type: "action",
            color: "teal",
            signal: "pagar",
            timeout: "2 days",
            notifications: [
                "→ Employee: cash disbursed — expense period started",
                "→ SuperAdmin: disbursement confirmed",
            ],
            nextOnSuccess: "expense_draft",
            rejectsTo: ["rejected"],
        },
        {
            id: "expense_draft",
            label: "Expense Report Draft",
            type: "action",
            color: "cyan",
            notifications: [
                "→ Employee: expense report opened — upload receipts/invoices",
            ],
            nextOnSuccess: "submitted",
        },
        {
            id: "submitted",
            label: "Expense Submitted",
            type: "action",
            color: "indigo",
            signal: "submit_expense",
            notifications: [
                "→ Employee: expense report submitted & locked",
                "→ SuperAdmin: expense report ready for review",
            ],
            nextOnSuccess: "under_review",
        },
        {
            id: "under_review",
            label: "Under Review",
            type: "action",
            color: "amber",
            signal: "iniciar_revision",
            timeout: "5 days",
            notifications: [
                "→ Employee: admin is reviewing your expense report",
                "→ SuperAdmin: action required (compare receipts vs authorized amount)",
            ],
            nextOnSuccess: "closed",
            rejectsTo: ["reimbursement", "refund"],
        },
        {
            id: "closed",
            label: "Closed",
            type: "terminal",
            color: "teal",
            signal: "cerrar",
            notifications: [
                "→ Employee: cash request fully closed",
                "→ SuperAdmin: process complete",
            ],
        },
        // ── Branch terminals ───────────────────────────────────────────────
        {
            id: "rejected",
            label: "Rejected",
            type: "branch-terminal",
            color: "red",
            signal: "rechazar",
            notifications: [
                "→ Employee: rejection with reason",
            ],
        },
        {
            id: "reimbursement",
            label: "Reimbursement",
            type: "branch-terminal",
            color: "orange",
            signal: "solicitar_reembolso",
            timeout: "3 days",
            notifications: [
                "→ Employee: gastado > autorizado — company owes you the difference",
                "→ SuperAdmin (Treasurer): process reimbursement & attach voucher",
            ],
            nextOnSuccess: "closed",
        },
        {
            id: "refund",
            label: "Refund to Company",
            type: "branch-terminal",
            color: "rose",
            signal: "solicitar_devolucion",
            timeout: "3 days",
            notifications: [
                "→ Employee: gastado < autorizado — return the difference to company",
                "→ SuperAdmin (Treasurer): validate returned amount & attach receipt",
            ],
            nextOnSuccess: "closed",
        },
    ],
};

// Export all registered workflows
export const ALL_WORKFLOWS: WorkflowDefinition[] = [
    PAYMENT_REQUEST_WORKFLOW,
    REFUND_REQUEST_WORKFLOW,
    CASH_REQUEST_WORKFLOW,
];

// Legacy export for backward compat
export { PAYMENT_REQUEST_WORKFLOW as DEFAULT_PR_WORKFLOW };
