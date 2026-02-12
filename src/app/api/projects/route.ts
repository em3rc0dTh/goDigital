
import { NextResponse } from "next/server";

export async function GET() {
    const projects = [
        { id: "proj_1", name: "Project Alpha", code: "PA-001" },
        { id: "proj_2", name: "Project Beta", code: "PB-002" },
        { id: "proj_3", name: "Project Gamma", code: "PG-003" },
    ];

    return NextResponse.json(projects);
}
