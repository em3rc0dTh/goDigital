
import { NextResponse } from "next/server";
import { db } from "@/db";
import { businessUnits, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const data = await db
            .select({
                id: businessUnits.id,
                name: businessUnits.name,
                adminId: businessUnits.adminId,
                createdAt: businessUnits.createdAt,
                adminEmail: users.email,
            })
            .from(businessUnits)
            .leftJoin(users, eq(businessUnits.adminId, users.id));

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching business units:", error);
        return NextResponse.json(
            { error: "Failed to fetch business units" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, adminEmail } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        let adminId = null;

        if (adminEmail) {
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, adminEmail));

            if (user) {
                adminId = user.id;
            } else {
                return NextResponse.json(
                    { error: `User with email ${adminEmail} not found` },
                    { status: 400 }
                );
            }
        }

        const [newUnit] = await db.insert(businessUnits).values({
            name,
            adminId,
        }).returning();

        // Return the unit with the adminEmail populated for consistency with GET
        const result = {
            ...newUnit,
            adminEmail: adminEmail || null
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error creating business unit:", error);
        return NextResponse.json(
            { error: "Failed to create business unit" },
            { status: 500 }
        );
    }
}
