"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { odooService } from "@/services/odooService";
import { OdooPurchaseOrder } from "@/types/odoo";
import { format } from "date-fns";
import { Download, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PurchaseOrderDetailsDialogProps {
    orderId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onOrderUpdated?: () => void;
}

export function PurchaseOrderDetailsDialog({
    orderId,
    open,
    onOpenChange,
    onOrderUpdated,
}: PurchaseOrderDetailsDialogProps) {
    const [order, setOrder] = useState<OdooPurchaseOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (open && orderId) {
            loadOrder(orderId);
        } else {
            setOrder(null);
        }
    }, [open, orderId]);

    const loadOrder = async (id: number) => {
        setLoading(true);
        try {
            const data = await odooService.getOrder(id);
            setOrder(data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar detalles de la orden");
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!order) return;
        setConfirming(true);
        try {
            await odooService.confirmOrder(order.id);
            toast.success("Orden confirmada");
            loadOrder(order.id);
            onOrderUpdated && onOrderUpdated();
        } catch (error) {
            console.error(error);
            toast.error("Error al confirmar la orden");
        } finally {
            setConfirming(false);
        }
    };

    const handleDownload = async () => {
        if (!order) return;
        setDownloading(true);
        try {
            await odooService.downloadPdf(order.id);
            toast.success("PDF descargado");
        } catch (error) {
            console.error(error);
            toast.error("Error al descargar PDF");
        } finally {
            setDownloading(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center pr-8">
                        <span>Orden de Compra {order?.name}</span>
                        {order && (
                            <Badge variant={order.state === "purchase" || order.state === "done" ? "default" : "secondary"}>
                                {order.state.toUpperCase()}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : order ? (
                    <div className="space-y-6">
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="border rounded-lg p-4 bg-muted/20">
                                <h3 className="font-semibold mb-2">Comprador (Compañía)</h3>
                                <p className="text-muted-foreground">{order.company_id[1]}</p>
                            </div>
                            <div className="border rounded-lg p-4 bg-muted/20">
                                <h3 className="font-semibold mb-2">Proveedor</h3>
                                <p className="text-muted-foreground">{order.partner_id[1]}</p>
                            </div>
                            <div className="border rounded-lg p-4 bg-muted/20">
                                <h3 className="font-semibold mb-2">Detalles Generales</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-muted-foreground">Fecha:</span>
                                    <span>{order.date_order}</span>
                                    <span className="text-muted-foreground">Total:</span>
                                    <span className="font-mono font-bold">${order.amount_total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Lines Table */}
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-center w-[100px]">Cant.</TableHead>
                                        <TableHead className="text-right w-[120px]">Precio Unit.</TableHead>
                                        <TableHead className="text-right w-[120px]">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.lines?.map((line) => (
                                        <TableRow key={line.id}>
                                            <TableCell className="font-medium">{line.product_id[1]}</TableCell>
                                            <TableCell className="text-center">{line.product_qty}</TableCell>
                                            <TableCell className="text-right">${line.price_unit.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">${line.price_subtotal.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!order.lines || order.lines.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                Sin líneas de orden
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6">
                            {(order.state === "draft" || order.state === "sent") && (
                                <Button onClick={handleConfirm} disabled={confirming} className="bg-green-600 hover:bg-green-700">
                                    {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                    Confirmar Orden
                                </Button>
                            )}
                            <Button onClick={handleDownload} disabled={downloading} variant="outline">
                                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                                Descargar PDF
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        No se pudo cargar la orden
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
