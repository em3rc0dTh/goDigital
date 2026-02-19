export interface OdooPurchaseOrder {
    id: number;
    name: string;
    partner_id: [number, string]; // [id, name]
    company_id: [number, string];
    date_order: string; // "YYYY-MM-DD"
    amount_total: number;
    state: string; // "draft", "sent", "purchase", "done", "cancel"
    order_line: number[];
    lines?: OdooOrderLine[];
}

export interface OdooOrderLine {
    id: number;
    product_id: [number, string];
    name: string;
    product_qty: number;
    price_unit: number;
    price_subtotal: number;
}

export interface OdooCompany {
    id: number;
    name: string;
    currency_id: [number, string];
    email: string | boolean;
}

export interface OdooPartner {
    id: number;
    name: string;
    email: string | boolean;
    is_company: boolean;
}

export interface OdooProduct {
    id: number;
    name: string;
}

export interface OdooOrderFormData {
    companies: OdooCompany[];
    partners: OdooPartner[];
    products: OdooProduct[];
}

export interface CreateOrderPayload {
    partner_id: number;
    company_id: number;
    product_id: number;
    qty: number;
    price?: number;
}
