import mongoose from "mongoose";

const S = new mongoose.Schema({
    alias: { type: String, required: false },
    bank: {type: String, default: ''},
    nummber: { type: String, default: '' },
    color: { type: String, default: '#4f46e5' },
    currency:{ type: String, enum: ['EUR','USD','GBP','JPY','CHF'], default: 'EUR' },
    initialBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },

}, { timestamps: true })
export default mongoose.model('Account', S)