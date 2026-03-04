
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Search } from "lucide-react";
import Cookies from "js-cookie";
import { useI18n } from "@/i18n/I18nProvider";

interface BusinessUnit {
    _id: string; // Changed from id to _id
    name: string;
    admin_id?: { // Changed from adminId?
        _id: string;
        name: string;
        email: string;
    } | string | null;
    createdAt?: string;
    // Helper property manually added after fetch if needed, 
    // but better to just use the nested object in render
}

export default function BusinessUnitsPage() {
    const { t } = useI18n();
    const [units, setUnits] = useState<BusinessUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentUnit, setCurrentUnit] = useState<BusinessUnit | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState<{ name: string; adminEmail: string }>({
        name: "",
        adminEmail: "",
    });

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    const fetchUnits = async () => {
        try {
            setLoading(true);
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            const response = await fetch(`${API_BASE}/business-units`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "x-tenant-detail-id": tenantDetailId || "",
                },
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setUnits(data);
                } else {
                    setUnits([]);
                    console.error("API returned non-array:", data);
                }
            } else {
                toast.error(t("BusinessUnits.messages.loadError"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("BusinessUnits.messages.loadError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOpenDialog = (unit?: BusinessUnit) => {
        if (unit) {
            setCurrentUnit(unit);
            setFormData({
                name: unit.name,
                adminEmail: typeof unit.admin_id === 'object' && unit.admin_id !== null ? (unit.admin_id as any).email : "",
            });
        } else {
            setCurrentUnit(null);
            setFormData({
                name: "",
                adminEmail: "",
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

            const url = currentUnit
                ? `${API_BASE}/business-units/${currentUnit._id}`
                : `${API_BASE}/business-units`;

            const method = currentUnit ? "PUT" : "POST";

            const payload = { ...formData };
            if (!payload.adminEmail) delete (payload as any).adminEmail;

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
                const errorData = await response.json();
                throw new Error(errorData.error || t("BusinessUnits.messages.saveError"));
            }

            toast.success(currentUnit ? t("BusinessUnits.messages.updated") : t("BusinessUnits.messages.created"));
            setIsDialogOpen(false);
            fetchUnits();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || t("BusinessUnits.messages.saveError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("BusinessUnits.messages.confirmDelete"))) return;

        try {
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            const response = await fetch(`${API_BASE}/business-units/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "x-tenant-detail-id": tenantDetailId || "",
                },
                credentials: "include",
            });

            if (response.ok) {
                toast.success(t("BusinessUnits.messages.deleted"));
                fetchUnits();
            } else {
                toast.error(t("BusinessUnits.messages.deleteError"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("BusinessUnits.messages.deleteError"));
        }
    };

    const filteredUnits = units.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("BusinessUnits.title")}</h1>
                    <p className="text-muted-foreground">{t("BusinessUnits.description")}</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> {t("BusinessUnits.add")}
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("BusinessUnits.searchPlaceholder")}
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>{t("BusinessUnits.table.name")}</TableHead>
                            <TableHead>{t("BusinessUnits.table.adminEmail")}</TableHead>
                            <TableHead>{t("BusinessUnits.table.createdAt")}</TableHead>
                            <TableHead className="text-right">{t("BusinessUnits.table.actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredUnits.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    {t("BusinessUnits.table.noUnits")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUnits.map((unit) => (
                                <TableRow
                                    key={unit._id}
                                    className={`cursor-pointer ${currentUnit?._id === unit._id ? "bg-muted/50" : ""}`}
                                    onClick={() => {
                                        if (currentUnit?._id === unit._id) {
                                            setCurrentUnit(null);
                                            setFormData({ name: "", adminEmail: "" });
                                        } else {
                                            setCurrentUnit(unit);
                                            setFormData({
                                                name: unit.name,
                                                adminEmail: typeof unit.admin_id === 'object' && unit.admin_id !== null ? (unit.admin_id as any).email : "",
                                            });
                                        }
                                    }}
                                >
                                    <TableCell>
                                        <div className={`w-4 h-4 rounded-full border border-primary flex items-center justify-center ${currentUnit?._id === unit._id ? "bg-primary" : "bg-transparent"}`}>
                                            {currentUnit?._id === unit._id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{unit.name}</TableCell>
                                    <TableCell>
                                        {typeof unit.admin_id === 'object' && unit.admin_id !== null ? (unit.admin_id as any).email : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {unit.createdAt ? new Date(unit.createdAt).toLocaleDateString() : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={currentUnit?._id !== unit._id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenDialog(unit);
                                                }}
                                                className={currentUnit?._id !== unit._id ? "opacity-50" : ""}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`text-destructive hover:text-destructive ${currentUnit?._id !== unit._id ? "opacity-50" : ""}`}
                                                disabled={currentUnit?._id !== unit._id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(unit._id);
                                                }}
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
                        <DialogTitle>{currentUnit ? t("BusinessUnits.dialog.editTitle") : t("BusinessUnits.dialog.createTitle")}</DialogTitle>
                        <DialogDescription>
                            {currentUnit ? t("BusinessUnits.dialog.editDesc") : t("BusinessUnits.dialog.createDesc")}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t("BusinessUnits.dialog.name")}</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminEmail">{t("BusinessUnits.dialog.adminEmail")}</Label>
                            <Input
                                id="adminEmail"
                                type="email"
                                value={formData.adminEmail}
                                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                {t("BusinessUnits.dialog.cancel")}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("BusinessUnits.dialog.save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
