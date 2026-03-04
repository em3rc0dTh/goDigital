
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function getUserIdFromRequest(): Promise<string | null> {
    const headersList = await headers();
    let token = headersList.get("Authorization")?.replace("Bearer ", "");

    if (!token || token === "undefined" || token === "null") {
        token = headersList.get("cookie")?.match(/session_token=([^;]+)/)?.[1];
    }

    if (!token) return null;

    const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, token))
        .then((res) => res[0]);

    if (!session || session.expires < new Date()) return null;

    return session.userId;
}
