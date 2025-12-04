import Account from "@/app/api/back/account/account";
import mongoose from "mongoose";
import { connectDB } from "../../db";
import { NextRequest, NextResponse } from "next/server";
type RouteParams = {
  params: { id: string };
};

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const account: any = await Account.findById(id).lean();

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: account._id.toString(),
      alias: account.alias,
      bank_name: account.bank_name,
      account_holder: account.account_holder,
      account_number: account.account_number,
      bank_account_type: account.bank_account_type,
      currency: account.currency,
      account_type: account.account_type,
      createdAt: account.createdAt,
      tx_count: account.tx_count,
      oldest: account.oldest,
      newest: account.newest,
    });
  } catch (err) {
    console.error("GET /api/back/account/[id] error:", err);
    return NextResponse.json(
      { error: "Error fetching account" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const updated = await Account.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
      strict: false, // allow partial updates
    });

    if (!updated) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/back/account/[id] error:", err);
    return NextResponse.json(
      { error: "Error updating account" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const deleted = await Account.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(
      { ok: true, message: "Account deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE /api/back/account/[id] error:", err);
    return NextResponse.json(
      { error: "Error deleting account" },
      { status: 500 }
    );
  }
}