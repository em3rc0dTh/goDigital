import { NextResponse } from "next/server";
import { db } from "@/db";
import { bankAccounts } from "@/db/schema";
import { getUserIdFromRequest } from "@/lib/session";

export async function GET(_request: Request) {
    const userId = await getUserIdFromRequest();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const accounts = await db.select().from(bankAccounts);
        return NextResponse.json(accounts);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to fetch accounts" },
            { status: 500 }
        );
    }
}
