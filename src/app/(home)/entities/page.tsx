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
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Search, Building2, User } from "lucide-react";
import Cookies from "js-cookie";
import { useI18n } from "@/i18n/I18nProvider";

interface Entity {
    _id?: string;
    id?: string;
    company_id?: string;
    name: string;
    entity_classes: string[];
    legal_class: 'legal-entity' | 'natural-entity';
    business_type?: string;
    vendor_type?: string;
    identifiers: {
        tax_id?: string;
        national_id?: string;
        registration_number?: string;
    };
    contact: {
        email?: string;
        phone?: string;
        address?: string;
    };
    is_active: boolean;
}

export default function EntitiesPage() {
    const { t } = useI18n();
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentTab, setCurrentTab] = useState("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentEntity, setCurrentEntity] = useState<Entity | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Entity>({
        name: "",
        entity_classes: [],
        legal_class: "legal-entity",
        business_type: "",
        vendor_type: "Proveedor",
        identifiers: { tax_id: "", national_id: "", registration_number: "" },
        contact: { email: "", phone: "", address: "" },
        is_active: true,
    });

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    const fetchEntities = async () => {
        try {
            setLoading(true);
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            // Fetch all entities
            const response = await fetch(`${API_BASE}/entities`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "x-tenant-detail-id": tenantDetailId || "",
                },
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setEntities(data);
            } else {
                toast.error(t("Entities.messages.loadError"));
            }
        } catch (error) {
            console.error(error);
            toast.error("Error loading entities");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOpenDialog = (entity?: Entity) => {
        if (entity) {
            setCurrentEntity(entity);
            setFormData({
                ...entity,
                identifiers: { ...entity.identifiers },
                contact: { ...entity.contact }
            });
        } else {
            setCurrentEntity(null);
            setFormData({
                name: "",
                entity_classes: [],
                legal_class: "legal-entity",
                business_type: "",
                vendor_type: mapTabToType(currentTab) || "Proveedor",
                identifiers: { tax_id: "", national_id: "", registration_number: "" },
                contact: { email: "", phone: "", address: "" },
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    // Helper to map tab value to backend type value
    // Assuming backend uses: "Proveedor", "Cliente", "Vendedor"? 
    // Let's assume standard ones based on user request: Vendor, Supplier, Provider.
    // However, in payment-request we saw "Proveedor".
    // I'll stick to a mapping.
    const mapTabToType = (tab: string) => {
        if (tab === "provider") return "Proveedor";
        if (tab === "supplier") return "Supplier";
        if (tab === "vendor") return "Vendor";
        return "";
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            // Ensure company_id is set if creating
            const payload = {
                ...formData,
                company_id: formData.company_id || tenantDetailId || "default_company_id",
            };

            const url = currentEntity
                ? `${API_BASE}/entities/${currentEntity._id || currentEntity.id}`
                : `${API_BASE}/entities`;

            const method = currentEntity ? "PUT" : "POST";

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
                throw new Error(t("Entities.messages.saveError"));
            }

            toast.success(currentEntity ? t("Entities.messages.updated") : t("Entities.messages.created"));
            setIsDialogOpen(false);
            fetchEntities();
        } catch (error) {
            console.error(error);
            toast.error(t("Entities.messages.saveError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("Entities.messages.confirmDelete"))) return;

        try {
            const token = Cookies.get("session_token");
            const tenantDetailId = Cookies.get("tenantDetailId");

            const response = await fetch(`${API_BASE}/entities/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "x-tenant-detail-id": tenantDetailId || "",
                },
                credentials: "include",
            });

            if (response.ok) {
                toast.success(t("Entities.messages.deleted"));
                fetchEntities();
            } else {
                toast.error(t("Entities.messages.deleteError"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("Entities.messages.deleteError"));
        }
    };

    const filteredEntities = entities.filter(e => {
        const matchesSearch =
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.identifiers?.tax_id?.includes(searchTerm);

        const matchesTab =
            currentTab === "all" ||
            (currentTab === "provider" && (e.vendor_type?.toLowerCase() === "provider" || e.vendor_type?.toLowerCase() === "proveedor")) ||
            (currentTab === "supplier" && e.vendor_type?.toLowerCase() === "supplier") ||
            (currentTab === "vendor" && e.vendor_type?.toLowerCase() === "vendor");

        return matchesSearch && matchesTab;
    });

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("Entities.title")}</h1>
                    <p className="text-muted-foreground">{t("Entities.description")}</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> {t("Entities.add")}
                </Button>
            </div>

            <Tabs defaultValue="all" className="w-full mb-6" onValueChange={setCurrentTab}>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <TabsList>
                        <TabsTrigger value="all">{t("Entities.tabs.all")}</TabsTrigger>
                        <TabsTrigger value="provider">{t("Entities.tabs.providers")}</TabsTrigger>
                        <TabsTrigger value="vendor">{t("Entities.tabs.vendors")}</TabsTrigger>
                        <TabsTrigger value="supplier">{t("Entities.tabs.suppliers")}</TabsTrigger>
                    </TabsList>

                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("Entities.searchPlaceholder")}
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
                                <TableHead>{t("Entities.table.name")}</TableHead>
                                <TableHead>{t("Entities.table.taxId")}</TableHead>
                                <TableHead>{t("Entities.table.type")}</TableHead>
                                <TableHead>{t("Entities.table.email")}</TableHead>
                                <TableHead className="text-right">{t("Entities.table.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredEntities.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        {t("Entities.table.noEntities")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEntities.map((entity) => (
                                    <TableRow key={entity._id || entity.id}>
                                        <TableCell className="font-medium">
                                            {entity.name}
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {entity.legal_class.replace('-', ' ')}
                                            </div>
                                        </TableCell>
                                        <TableCell>{entity.identifiers?.tax_id || "-"}</TableCell>
                                        <TableCell>
                                            <span className="capitalize px-2 py-1 rounded-full text-xs font-medium bg-muted">
                                                {entity.vendor_type || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell>{entity.contact?.email || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(entity)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(entity._id || entity.id!)}
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
            </Tabs>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{currentEntity ? t("Entities.dialog.editTitle") : t("Entities.dialog.createTitle")}</DialogTitle>
                        <DialogDescription>
                            {currentEntity ? t("Entities.dialog.editDesc") : t("Entities.dialog.createDesc")}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t("Entities.dialog.name")}</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder={t("Entities.dialog.name")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vendor_type">{t("Entities.dialog.type")}</Label>
                                <Select
                                    value={formData.vendor_type}
                                    onValueChange={(val) => setFormData({ ...formData, vendor_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("Entities.dialog.type")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Proveedor">{t("Entities.dialog.options.provider")}</SelectItem>
                                        <SelectItem value="Vendor">{t("Entities.dialog.options.vendor")}</SelectItem>
                                        <SelectItem value="Supplier">{t("Entities.dialog.options.supplier")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="legal_class">{t("Entities.dialog.legalClass")}</Label>
                                <Select
                                    value={formData.legal_class}
                                    onValueChange={(val: any) => setFormData({ ...formData, legal_class: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("Entities.dialog.legalClass")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="legal-entity">{t("Entities.dialog.options.legalEntity")}</SelectItem>
                                        <SelectItem value="natural-entity">{t("Entities.dialog.options.naturalEntity")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="business_type">{t("Entities.dialog.businessType")}</Label>
                                <Input
                                    id="business_type"
                                    value={formData.business_type}
                                    onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                                    placeholder="e.g. Technology, Health"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 p-3 bg-muted/20 rounded-md border text-sm">
                            <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> {t("Entities.dialog.identifiers")}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="taxId" className="text-xs">{t("Entities.dialog.taxId")}</Label>
                                    <Input
                                        id="taxId"
                                        className="h-8"
                                        value={formData.identifiers.tax_id}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            identifiers: { ...formData.identifiers, tax_id: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="national_id" className="text-xs">{t("Entities.dialog.nationalId")}</Label>
                                    <Input
                                        id="national_id"
                                        className="h-8"
                                        value={formData.identifiers.national_id}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            identifiers: { ...formData.identifiers, national_id: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 p-3 bg-muted/20 rounded-md border text-sm">
                            <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" /> {t("Entities.dialog.contact")}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="email" className="text-xs">{t("Entities.dialog.email")}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="h-8"
                                        value={formData.contact.email}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            contact: { ...formData.contact, email: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="phone" className="text-xs">{t("Entities.dialog.phone")}</Label>
                                    <Input
                                        id="phone"
                                        className="h-8"
                                        value={formData.contact.phone}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            contact: { ...formData.contact, phone: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label htmlFor="address" className="text-xs">{t("Entities.dialog.address")}</Label>
                                    <Input
                                        id="address"
                                        className="h-8"
                                        value={formData.contact.address}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            contact: { ...formData.contact, address: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                {t("Entities.dialog.cancel")}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("Entities.dialog.save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
