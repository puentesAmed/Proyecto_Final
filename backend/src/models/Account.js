import mongoose from "mongoose";

const S = new mongoose.Schema({
    alias: { type: String, required: true, trim: true },
    aliasNormalized: { type: String, required: true, unique: true, sparse: true },
    bank: {type: String, default: ''},
    number: { type: String, default: '' },
    color: { type: String, default: '#4f46e5' },
    currency:{ type: String, enum: ['EUR','USD','GBP','JPY','CHF'], default: 'EUR' },
    initialBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },

}, { timestamps: true })

S.pre('validate', function normalizeAlias(next) {
    this.alias = String(this.alias || '').trim();
    this.aliasNormalized = this.alias.toLocaleLowerCase('es-ES');
    next();
});

export default mongoose.model('Account', S)
