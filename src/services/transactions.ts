import { getActiveTenantDetail } from "./tenantService";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

export interface RawTransaction {
    _id: string;
    source: 'GMAIL' | 'PDF' | 'WEB' | 'API';
    externalId?: string;
    receivedAt: string;
    processed: boolean;
    transactionVariables: {
        amount: number | null;
        currency: string | null;
        originAccount: string | null;
        destinationAccount: string | null;
        operationDate: string | null;
    };
    // Gmail fields (optional)
    linkedSources?: {
        source: 'GMAIL' | 'Statement' | 'WEB' | 'API';
        sourceId: string;
        externalId?: string;
        rawData: any;
        extractedAt: string;
    }[];
    subject?: string;
    from?: string;
    // PDF/Web specific fields might be in transactionVariables or mapped differently
}

export async function fetchRawTransactions(tenantDetailId?: string): Promise<{ total: number; transactions: RawTransaction[] }> {
    const detailId = tenantDetailId || getActiveTenantDetail();
    if (!detailId) throw new Error("No active database selected");

    const res = await fetch(`${API_BASE}/transactions/raw/${detailId}`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch raw transactions");

    return res.json();
}
