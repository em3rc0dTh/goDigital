import { NextResponse } from "next/server";
import { PaymentRequestService } from "@/services/paymentRequestService";
import { getUserIdFromRequest } from "@/lib/session";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;

    try {
        const { request: r, project, provider, creator } = await PaymentRequestService.getDetails(id);

        const data = {
            ...r,
            project_id: project ? { _id: project.id, name: project.name } : r.projectId,
            provider_id: provider ? { _id: provider.id, name: provider.name } : r.providerId,
            userIdCreator: creator?.email || r.creatorId,
            created_by: creator ? { email: creator.email, _id: creator.id, name: creator.name } : { email: r.creatorId },
        };

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: error.message === "Payment request not found" ? 404 : 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const userId = await getUserIdFromRequest();

    if (!userId) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { status, payment_proof } = body;

        if (status === "approved") {
            await PaymentRequestService.approve(id, userId);
        } else if (status === "rejected") {
            await PaymentRequestService.reject(id, userId);
        } else if (status === "authorized") {
            await PaymentRequestService.authorize(id, userId);
        } else if (status === "paid") {
            if (!payment_proof) {
                return NextResponse.json({ error: "Payment proof is required" }, { status: 400 });
            }
            await PaymentRequestService.pay(id, userId, payment_proof);
        } else {
            // For generic updates (notes, etc) - implement if needed or throw
            // For now, assume status update is the primary goal of PATCH in this flow
        }

        // Return updated data
        const { request: r } = await PaymentRequestService.getDetails(id);
        return NextResponse.json(r);

    } catch (error: any) {
        console.error("PATCH error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update request" },
            { status: 400 }
        );
    }
}
