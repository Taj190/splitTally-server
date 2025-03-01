import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  status: { type: String, enum: ["pending", "approved"], default: "pending" },
  transparencyMode: { type: Boolean, required: true },
  verifications: {
    type: Map,
    of: String, // "pending" | "approved"
  },
  date: { type: Date, default: Date.now }
},
{ timestamps: true }
);

 const Transaction  = mongoose.model("Transaction", transactionSchema);
  export default  Transaction;
