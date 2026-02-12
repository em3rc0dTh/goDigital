"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Search } from "lucide-react";
import Cookies from "js-cookie";
import { useI18n } from "@/i18n/I18nProvider";

interface Project {
    _id?: string;
    id?: string;
    name: string;
    code?: string;
    description?: string;
    projectOwner?: string; // ID string
    business_unit_id?: string; // ID string
    status: 'active' | 'completed' | 'on_hold' | 'cancelled' | 'planned';
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    isActive: boolean;
}

export default function ProjectsPage() {
    const { t } = useI18n();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentStatus, setCurrentStatus] = useState("active");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Project>({
        name: "",
        code: "",
        description: "",
        projectOwner: "",
        business_unit_id: "",
        status: "active",
        isActive: true,
        startDate: "",
        endDate: "",
    });

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            const response = await fetch(`${API_BASE}/projects`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "x-tenant-detail-id": tenantDetailId || "",
                },
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            } else {
                toast.error(t("Projects.messages.loadError"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("Projects.messages.loadError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOpenDialog = (project?: Project) => {
        if (project) {
            setCurrentProject(project);
            setFormData({
                name: project.name,
                code: project.code || "",
                description: project.description || "",
                projectOwner: project.projectOwner || "",
                business_unit_id: project.business_unit_id || "",
                status: project.status || "active",
                isActive: project.isActive ?? true,
                startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
                endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
            });
        } else {
            setCurrentProject(null);
            setFormData({
                name: "",
                code: "",
                description: "",
                projectOwner: "",
                business_unit_id: "",
                status: "active",
                isActive: true,
                startDate: "",
                endDate: "",
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            const url = currentProject
                ? `${API_BASE}/projects/${currentProject._id || currentProject.id}`
                : `${API_BASE}/projects`;

            const method = currentProject ? "PUT" : "POST";

            // Clean up empty dates
            const payload = { ...formData };
            if (!payload.startDate) delete payload.startDate;
            if (!payload.endDate) delete payload.endDate;
            if (!payload.projectOwner) delete payload.projectOwner;
            if (!payload.business_unit_id) delete payload.business_unit_id;


            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "x-tenant-detail-id": tenantDetailId || "",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(t("Projects.messages.saveError"));
            }

            toast.success(currentProject ? t("Projects.messages.updated") : t("Projects.messages.created"));
            setIsDialogOpen(false);
            fetchProjects();
        } catch (error) {
            console.error(error);
            toast.error(t("Projects.messages.saveError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("Projects.messages.confirmDelete"))) return;

        try {
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            const response = await fetch(`${API_BASE}/projects/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "x-tenant-detail-id": tenantDetailId || "",
                },
                credentials: "include",
            });

            if (response.ok) {
                toast.success(t("Projects.messages.deleted"));
                fetchProjects();
            } else {
                toast.error(t("Projects.messages.deleteError"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("Projects.messages.deleteError"));
        }
    };

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = currentStatus === "all" || p.status === currentStatus;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("Projects.title")}</h1>
                    <p className="text-muted-foreground">{t("Projects.description")}</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> {t("Projects.add")}
                </Button>
            </div>

            <Tabs defaultValue="active" className="w-full mb-6" onValueChange={setCurrentStatus}>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <TabsList>
                        <TabsTrigger value="active">{t("Projects.status.active")}</TabsTrigger>
                        <TabsTrigger value="planned">{t("Projects.status.planned")}</TabsTrigger>
                        <TabsTrigger value="on_hold">{t("Projects.status.onHold")}</TabsTrigger>
                        <TabsTrigger value="completed">{t("Projects.status.completed")}</TabsTrigger>
                        <TabsTrigger value="cancelled">{t("Projects.status.cancelled")}</TabsTrigger>
                        <TabsTrigger value="all">{t("Projects.status.all")}</TabsTrigger>
                    </TabsList>

                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("Projects.searchPlaceholder")}
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </Tabs>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("Projects.table.name")}</TableHead>
                            <TableHead>{t("Projects.table.code")}</TableHead>
                            <TableHead>{t("Projects.table.status")}</TableHead>
                            <TableHead>{t("Projects.table.description")}</TableHead>
                            <TableHead className="text-right">{t("Projects.table.actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredProjects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    {t("Projects.table.noProjects")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProjects.map((project) => (
                                <TableRow key={project._id || project.id}>
                                    <TableCell className="font-medium">{project.name}</TableCell>
                                    <TableCell>{project.code}</TableCell>
                                    <TableCell>
                                        <div className={`capitalize px-2 py-1 rounded-full text-xs font-medium w-fit border ${project.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                                            project.status === 'completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                project.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                                    'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}>
                                            {project.status?.replace('_', ' ') || 'Unknown'}
                                        </div>
                                    </TableCell>
                                    <TableCell>{project.description}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(project)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(project._id || project.id!)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentProject ? t("Projects.dialog.editTitle") : t("Projects.dialog.createTitle")}</DialogTitle>
                        <DialogDescription>
                            {currentProject ? t("Projects.dialog.editDesc") : t("Projects.dialog.createDesc")}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t("Projects.dialog.name")}</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">{t("Projects.dialog.code")}</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">{t("Projects.dialog.status")}</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val: 'active' | 'completed' | 'on_hold' | 'cancelled' | 'planned') => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("Projects.dialog.status")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t("Projects.status.active")}</SelectItem>
                                        <SelectItem value="planned">{t("Projects.status.planned")}</SelectItem>
                                        <SelectItem value="on_hold">{t("Projects.status.onHold")}</SelectItem>
                                        <SelectItem value="completed">{t("Projects.status.completed")}</SelectItem>
                                        <SelectItem value="cancelled">{t("Projects.status.cancelled")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">{t("Projects.dialog.startDate")}</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">{t("Projects.dialog.endDate")}</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="projectOwner">{t("Projects.dialog.owner")}</Label>
                                <Input
                                    id="projectOwner"
                                    value={formData.projectOwner}
                                    onChange={(e) => setFormData({ ...formData, projectOwner: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="businessUnitId">{t("Projects.dialog.businessUnit")}</Label>
                                <Input
                                    id="businessUnitId"
                                    value={formData.business_unit_id}
                                    onChange={(e) => setFormData({ ...formData, business_unit_id: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">{t("Projects.dialog.description")}</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                {t("Projects.dialog.cancel")}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("Projects.dialog.save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
