import { NextResponse } from "next/server";
import { FormSchemaService } from "@/services/system/FormSchemaService";

const formSchemaService = new FormSchemaService();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filter: any = {};
        // Add basic filtering if needed, e.g. ?isActive=true
        if (searchParams.has('isActive')) {
            filter.isActive = searchParams.get('isActive') === 'true';
        }

        const schemas = await formSchemaService.listSchemas(filter);
        return NextResponse.json(schemas);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const schema = await formSchemaService.createSchema(body);
        return NextResponse.json(schema, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
