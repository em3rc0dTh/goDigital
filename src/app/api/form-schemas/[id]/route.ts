import { NextResponse } from "next/server";
import { FormSchemaService } from "@/services/system/FormSchemaService";

const formSchemaService = new FormSchemaService();

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const schema = await formSchemaService.getSchemaById(id);
        if (!schema) return NextResponse.json({ error: "Schema not found" }, { status: 404 });
        return NextResponse.json(schema);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const schema = await formSchemaService.updateSchema(id, body);
        if (!schema) return NextResponse.json({ error: "Schema not found" }, { status: 404 });
        return NextResponse.json(schema);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
