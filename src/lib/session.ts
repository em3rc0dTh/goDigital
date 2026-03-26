import { headers } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dev-key-123";

export interface SessionPayload {
    userId: string;
    tenantId?: string;
    email?: string;
    fullName?: string;
    role?: string;
}

/**
 * Extracts and verifies the session token from the request headers or cookies.
 * 
 * @returns {Promise<string | null>} The record ID of the user (userId).
 */
export async function getUserIdFromRequest(): Promise<string | null> {
    const headersList = await headers();
    let token = headersList.get("Authorization")?.replace("Bearer ", "");

    if (!token || token === "undefined" || token === "null") {
        token = headersList.get("cookie")?.match(/session_token=([^;]+)/)?.[1];
    }

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
        return decoded.userId;
    } catch (error) {
        console.error("JWT Verification failed:", error);
        return null;
    }
}

/**
 * Returns the full decoded payload of the session.
 */
export async function getSessionPayload(): Promise<SessionPayload | null> {
    const headersList = await headers();
    let token = headersList.get("Authorization")?.replace("Bearer ", "");

    if (!token || token === "undefined" || token === "null") {
        token = headersList.get("cookie")?.match(/session_token=([^;]+)/)?.[1];
    }

    if (!token) return null;

    try {
        return jwt.verify(token, JWT_SECRET) as SessionPayload;
    } catch (error) {
        return null;
    }
}
