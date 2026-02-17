
import { NextResponse } from "next/server";
import { PaymentRequestService } from "@/services/paymentRequestService";
import { getUserIdFromRequest } from "@/lib/session";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const userId = await getUserIdFromRequest();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        await PaymentRequestService.reject(id, userId, { reason: body.reason });
        const { request: r } = await PaymentRequestService.getDetails(id);
        return NextResponse.json(r);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to reject request" },
            { status: 400 }
        );
    }
}
