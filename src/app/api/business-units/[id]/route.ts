
import { NextResponse } from "next/server";
import { db } from "@/db";
import { businessUnits, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const [unit] = await db
            .select({
                id: businessUnits.id,
                name: businessUnits.name,
                adminId: businessUnits.adminId,
                createdAt: businessUnits.createdAt,
                adminEmail: users.email,
            })
            .from(businessUnits)
            .leftJoin(users, eq(businessUnits.adminId, users.id))
            .where(eq(businessUnits.id, params.id));

        if (!unit) {
            return NextResponse.json(
                { error: "Business unit not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(unit);
    } catch (error) {
        console.error("Error fetching business unit:", error);
        return NextResponse.json(
            { error: "Failed to fetch business unit" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const { name, adminEmail } = body;

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

        const [updatedUnit] = await db
            .update(businessUnits)
            .set({
                name,
                adminId: adminId,
            })
            .where(eq(businessUnits.id, params.id))
            .returning();

        if (!updatedUnit) {
            return NextResponse.json(
                { error: "Business unit not found" },
                { status: 404 }
            );
        }

        const result = {
            ...updatedUnit,
            adminEmail: adminEmail || null
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating business unit:", error);
        return NextResponse.json(
            { error: "Failed to update business unit" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const [deletedUnit] = await db
            .delete(businessUnits)
            .where(eq(businessUnits.id, params.id))
            .returning();

        if (!deletedUnit) {
            return NextResponse.json(
                { error: "Business unit not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Business unit deleted successfully" });
    } catch (error) {
        console.error("Error deleting business unit:", error);
        return NextResponse.json(
            { error: "Failed to delete business unit" },
            { status: 500 }
        );
    }
}
