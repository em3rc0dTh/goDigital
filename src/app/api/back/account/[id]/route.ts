// archivo: /app/api/back/account/[id]/route.ts

import Account from "@/app/api/back/account/account";
import mongoose from "mongoose";
import { connectDB } from "../../db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const data = await req.json();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid account ID" }, { status: 400 });
    }

    const updated = await Account.findByIdAndUpdate(
      id,
      { $set: data }, // ← obligatorio
      {
        new: true,
        runValidators: true,
        strict: false, // ← obligatorio
      }
    );

    if (!updated) {
      return Response.json({ error: "Account not found" }, { status: 404 });
    }

    // devolver todos los campos, incluidos los nuevos
    return Response.json({
      id: updated._id.toString(),
      alias: updated.alias,
      bank_name: updated.bank_name,
      account_holder: updated.account_holder,
      account_number: updated.account_number,
      bank_account_type: updated.bank_account_type,
      currency: updated.currency,
      account_type: updated.account_type,
      tx_count: updated.tx_count ?? 0,
      oldest: updated.oldest ?? null,
      newest: updated.newest ?? null,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    console.error("PUT error:", err);
    return Response.json({ error: "Error updating account" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params; // ✅ AWAIT params

    // Validar que es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid account ID" }, { status: 400 });
    }

    const deleted = await Account.findByIdAndDelete(id);

    if (!deleted) {
      return Response.json({ error: "Account not found" }, { status: 404 });
    }

    return Response.json({ ok: true, message: "Account deleted successfully" });
  } catch (err) {
    console.error("DELETE error:", err);
    return Response.json({ error: "Error deleting account" }, { status: 500 });
  }
}
