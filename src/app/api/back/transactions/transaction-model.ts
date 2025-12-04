import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    accountId: { type: String, required: true },

    // --------- PERSONAL ---------
    descripcion: String,
    fecha_hora: String,
    fecha_hora_raw: String,
    monto: Number,
    currency: String,
    currency_raw: String,
    uuid: String,

    // --------- BUSINESS ---------
    operation_date: String,      // fecha de operación
    process_date: String,        // fecha de proceso
    operation_number: String,    // nro operación
    movement: String,            // movimiento
    channel: String,             // canal
    amount: Number,              // importe
    balance: Number,             // saldo contable
  },
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
