
import { NextResponse } from "next/server";

// Mock data store (in-memory for demo purposes)
// In a real app, this would be a database query
const paymentRequests: any = {
    "698e11a4c525a089fc58ab56": {
        _id: "698e11a4c525a089fc58ab56",
        project_id: { _id: "proj_1", name: "Despliegue FO Nodo Piura EFI" },
        provider_id: { _id: "prov_1", name: "COMERCIAL DE PRODUCTOS INTEGRAL YAJOMAR SAC" },
        subtotal: 1000,
        tax: 180,
        total: 1180,
        currency: "USD",
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        userIdCreator: "eduardo@thradex.com",
        notes: "Payment for fiber optic deployment materials.",
        status: "pending",
        createdAt: new Date().toISOString()
    }
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const data = paymentRequests[id];

    if (!data) {
        return NextResponse.json(
            { error: "Payment request not found" },
            { status: 404 }
        );
    }

    return NextResponse.json(data);
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const body = await request.json();
    const { status } = body;

    // Simulate database update
    if (paymentRequests[id]) {
        paymentRequests[id].status = status;
        return NextResponse.json(paymentRequests[id]);
    }

    return NextResponse.json(
        { error: "Payment request not found" },
        { status: 404 }
    );
}
