import mongoose from 'mongoose';

const S = new mongoose.Schema({
  date:         { type: Date, required: true },
  account:      { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: false, default: null },
  counterparty: { type: mongoose.Schema.Types.ObjectId, ref: 'Counterparty', required: false, default: null },
  amount:       { type: Number, required: true },
  type:         { type: String, enum: ['in','out'], default: 'out' },

  category:     { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false, default: null },

  concept:      { type: String, trim: true, maxlength: 200, default: '' },
  status:       { type: String, enum: ['pending','paid','cancelled'], default: 'pending' },
  // idempotencia de importación
  source:       { type: String, default: 'upload' },
  externalId:   { type: String, index: true, unique: true, sparse: true }
}, { timestamps: true });

// Índices útiles
S.index({ date: 1 });
S.index({ status: 1, date: 1 });
S.index({ account: 1 });
S.index({ counterparty: 1 });
S.index({ category: 1 });
S.index({ source: 1, externalId: 1 });

export default mongoose.model('Cashflow', S);
