"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { odooService } from "@/services/odooService";
import { OdooCompany, OdooPartner, OdooProduct } from "@/types/odoo";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface CreateOrderDialogProps {
    onOrderCreated: () => void;
}

export function CreateOrderDialog({ onOrderCreated }: CreateOrderDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<OdooCompany[]>([]);
    const [partners, setPartners] = useState<OdooPartner[]>([]);
    const [products, setProducts] = useState<OdooProduct[]>([]);

    const [formData, setFormData] = useState({
        company_id: "",
        partner_id: "",
        product_id: "",
        qty: "1",
        price: "",
    });

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        try {
            const data = await odooService.getCreateData();
            setCompanies(data.companies);
            setPartners(data.partners);
            setProducts(data.products || []);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar datos de configuración");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await odooService.createOrder({
                company_id: parseInt(formData.company_id),
                partner_id: parseInt(formData.partner_id),
                product_id: parseInt(formData.product_id),
                qty: parseFloat(formData.qty),
                price: formData.price ? parseFloat(formData.price) : undefined,
            });
            toast.success("Orden creada exitosamente");
            setOpen(false);
            onOrderCreated(); // Refresh list
            // Reset form
            setFormData({
                company_id: "",
                partner_id: "",
                product_id: "",
                qty: "1",
                price: "",
            });
        } catch (error) {
            console.error(error);
            toast.error("Error al crear la orden");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Odoo Order
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Nueva Orden de Compra (Odoo)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="company">Compañía (Comprador)</Label>
                        <Select
                            value={formData.company_id}
                            onValueChange={(val) => setFormData({ ...formData, company_id: val })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione compañía" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="partner">Proveedor (Vendor)</Label>
                        <Select
                            value={formData.partner_id}
                            onValueChange={(val) => setFormData({ ...formData, partner_id: val })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione proveedor" />
                            </SelectTrigger>
                            <SelectContent>
                                {partners.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="product">Producto</Label>
                        <Select
                            value={formData.product_id}
                            onValueChange={(val) => setFormData({ ...formData, product_id: val })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione producto" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="qty">Cantidad</Label>
                            <Input
                                id="qty"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={formData.qty}
                                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="price">Precio Unitario (Opcional)</Label>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Auto"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creando..." : "Crear Orden"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
