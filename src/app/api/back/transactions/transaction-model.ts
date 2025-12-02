import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    accountId: { type: String, required: true },
    descripcion: String,
    fecha_hora: String,
    fecha_hora_raw: String,
    monto: Number,
    currency: String,
    currency_raw: String,
    uuid: String,
  },
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
