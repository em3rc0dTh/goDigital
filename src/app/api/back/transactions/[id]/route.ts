// Archivo: /app/api/back/transactions/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "../../db";
import Transaction from "../transaction-model";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const docs = await Transaction.find({ accountId: id }).sort({
      createdAt: -1,
    });

    return NextResponse.json(docs);
  } catch (err) {
    console.error("GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    if (!body.transactions || !Array.isArray(body.transactions)) {
      return NextResponse.json(
        { error: "transactions array required" },
        { status: 400 }
      );
    }

    await Transaction.deleteMany({ accountId: id });

    const inserted = await Transaction.insertMany(
      body.transactions.map((x: any) => ({ ...x, accountId: id }))
    );

    return NextResponse.json({ ok: true, inserted: inserted.length });
  } catch (err) {
    console.error("POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}