import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    user_id: string;
    type: string;
    amount_crypto: number;
    amount_fiat: number;
    currency: string;
    status: string;
    memo: string;
    tx_hash?: string;
    created_at: Date;
}

const TransactionSchema: Schema = new Schema({
    user_id: { type: String, required: true },
    type: { type: String, required: true },
    amount_crypto: { type: Number, required: true },
    amount_fiat: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true, default: 'PENDING' },
    memo: { type: String, required: true },
    tx_hash: { type: String },
    created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
