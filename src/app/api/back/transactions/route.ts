// archivo: /app/api/back/transactions/[id]/route.ts
import { NextResponse } from "next/server";
import Transaction from "@/app/api/back/transactions/transaction-model";
import mongoose from "mongoose";
import { connectDB } from "../db";

// GET -> obtener transacciones de una cuenta
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params; // ✅ AWAIT params

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Validar que sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id format" }, { status: 400 });
    }

    const docs = await Transaction.find({ accountId: id }).sort({
      fecha_hora: -1,
    });

    return NextResponse.json(docs);
  } catch (err) {
    console.error("GET transactions error:", err);
    return NextResponse.json(
      { error: "Error fetching transactions" },
      { status: 500 }
    );
  }
}

// POST -> reemplazar transacciones de una cuenta
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params; // ✅ AWAIT params
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Validar que sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id format" }, { status: 400 });
    }

    if (!body.transactions || !Array.isArray(body.transactions)) {
      return NextResponse.json(
        { error: "transactions array is required" },
        { status: 400 }
      );
    }

    // Borra las antiguas
    await Transaction.deleteMany({ accountId: id });

    // Guarda nuevas
    const inserted = await Transaction.insertMany(
      body.transactions.map((x: any) => ({ ...x, accountId: id }))
    );

    return NextResponse.json({
      ok: true,
      inserted: inserted.length,
      message: `${inserted.length} transactions saved`,
    });
  } catch (err) {
    console.error("POST transactions error:", err);
    return NextResponse.json(
      { error: "Error saving transactions" },
      { status: 500 }
    );
  }
}
