import Cookies from "js-cookie";

export interface TenantDetail {
    detailId: string;
    dbName: string;
    createdAt: string;
    status: string;
    entityType: string;
    taxId: string;
}

export interface Tenant {
    tenantId: string;
    name: string;
    code: string;
    role: string;
    details: TenantDetail[];
}

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

export async function getTenants(): Promise<Tenant[]> {
    const res = await fetch(`${API_BASE}/tenants`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to load tenants");

    return res.json();
}

// Guardar el detail en cookies
export function setActiveTenantDetail(detailId: string) {
    Cookies.set("tenantDetailId", detailId, { expires: 7 });
}

// Leer el detail desde cookies
export function getActiveTenantDetail(): string | undefined {
    return Cookies.get("tenantDetailId");
}
