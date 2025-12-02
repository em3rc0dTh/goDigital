import { connectDB } from "@/app/api/back/db";
import Account from "@/app/api/back/account/account";

export async function saveAccount(req: any, res: any) {
  try {
    const { account } = req.body;

    await connectDB();

    const doc = await Account.create({ account });

    return res.json({ ok: true, saved: doc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Error al guardar" });
  }
}

export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  const doc = await Account.create(data);
  return Response.json(doc);
}

export async function GET() {
  await connectDB();
  const docs = await Account.find().sort({ createdAt: -1 });

  const normalized = docs.map((d: any) => ({
    id: d._id.toString(),
    alias: d.alias,
    bank_name: d.bank_name,
    account_holder: d.account_holder,
    account_number: d.account_number,
    bank_account_type: d.bank_account_type,
    currency: d.currency,
    account_type: d.account_type,
    createdAt: d.createdAt,
    tx_count: d.tx_count,
    oldest: d.oldest,
    newest: d.newest,
  }));

  return Response.json(normalized);
}

export async function PUT(req: Request, { params }: any) {
  await connectDB();
  const data = await req.json();

  const updated = await Account.findByIdAndUpdate(params.id, data, {
    new: true,
  });

  return Response.json(updated);
}

export async function DELETE(_: Request, { params }: any) {
  await connectDB();
  await Account.findByIdAndDelete(params.id);
  return Response.json({ ok: true });
}
