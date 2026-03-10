import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_BASE =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://localhost:4000/api";

/**
 * GET /api/payment-requests/[id]/workflow-timeline
 * Proxy to GoDigitalBack → GET /payment-requests/:id/workflow-status
 * This endpoint returns the Temporal PRWorkflowState (status, history, aprobacion, autorizacion, pago, rechazo)
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value ?? "";
    const tenantDetailId = cookieStore.get("tenantDetailId")?.value ?? "";

    try {
        const res = await fetch(`${BACKEND_BASE}/payment-requests/${id}/workflow-status`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "x-tenant-detail-id": tenantDetailId,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
        console.error("[workflow-timeline proxy] Error:", err?.message);
        return NextResponse.json(
            { error: "Failed to fetch workflow timeline" },
            { status: 500 }
        );
    }
}
