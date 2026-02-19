import axios from "axios";
import { OdooPurchaseOrder, OdooOrderFormData, CreateOrderPayload } from "@/types/odoo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const odooApi = axios.create({
    baseURL: `${API_URL}/api/odoo`,
});

export const odooService = {
    getOrders: async (): Promise<OdooPurchaseOrder[]> => {
        const response = await odooApi.get<OdooPurchaseOrder[]>("/orders");
        return response.data;
    },

    getOrder: async (id: number): Promise<OdooPurchaseOrder> => {
        const response = await odooApi.get<OdooPurchaseOrder>(`/orders/${id}`);
        return response.data;
    },

    getCreateData: async (): Promise<OdooOrderFormData> => {
        const response = await odooApi.get<OdooOrderFormData>("/orders/create-data");
        return response.data;
    },

    createOrder: async (data: CreateOrderPayload): Promise<{ success: boolean; id: number }> => {
        const response = await odooApi.post<{ success: boolean; id: number }>("/orders", data);
        return response.data;
    },

    confirmOrder: async (id: number): Promise<{ success: boolean; message: string }> => {
        const response = await odooApi.put<{ success: boolean; message: string }>(`/orders/${id}/confirm`);
        return response.data;
    },

    downloadPdf: async (id: number): Promise<void> => {
        const response = await odooApi.get(`/orders/${id}/pdf`, {
            responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `PO_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};
