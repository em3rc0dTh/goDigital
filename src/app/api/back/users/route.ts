import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/back/db";
import User from "@/app/api/back/users/userModel";
import bcrypt from "bcryptjs";

function createSessionToken(email: string, fullName: string) {
  return Buffer.from(`${email}:${fullName}`).toString("base64");
}

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, fullName } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (action === "signup" && !fullName) {
      return NextResponse.json(
        { error: "Full name is required for signup" },
        { status: 400 }
      );
    }

    await connectDB();

    if (action === "login") {
      const user = await User.findOne({ email });

      if (!user) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const passwordMatch = await verifyPassword(password, user.passwordHash);

      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const token = createSessionToken(user.email, user.fullName);
      const res = NextResponse.json({
        success: true,
        user: { email: user.email, fullName: user.fullName },
      });

      res.cookies.set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    if (action === "signup") {
      const exists = await User.findOne({ email });

      if (exists) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(password);

      const user = await User.create({
        email,
        passwordHash,
        fullName,
      });

      const token = createSessionToken(email, fullName);
      const res = NextResponse.json({
        success: true,
        user: { email: user.email, fullName: user.fullName },
      });

      res.cookies.set("session_token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "An error occurred during authentication" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST method" }, { status: 405 });
}
