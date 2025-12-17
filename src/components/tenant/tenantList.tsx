"use client";

import { useEffect, useState } from "react";
import { getTenants, Tenant } from "@/services/tenantService";

export default function TenantSelector() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTenants()
            .then(setTenants)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Cargando tenants...</p>;

    return (
        <div className="space-y-4">
            {tenants.map((t) => (
                <div key={t.tenantId} className="p-3 border rounded-xl">
                    <h3 className="font-semibold">{t.name}</h3>

                    <p className="text-sm text-gray-600">Bases disponibles:</p>
                    <ul className="ml-3 list-disc">
                        {t.details.map((d) => (
                            <li key={d.detailId}>{d.dbName}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
