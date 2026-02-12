import { NextResponse } from "next/server";
import { FormSchemaService } from "@/services/system/FormSchemaService";

const formSchemaService = new FormSchemaService();

export async function GET(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;
        const schema = await formSchemaService.getSchemaByName(name);
        if (!schema) return NextResponse.json({ error: "Schema not found" }, { status: 404 });
        return NextResponse.json(schema);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
