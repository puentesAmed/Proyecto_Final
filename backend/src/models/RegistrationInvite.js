import { Schema, model } from 'mongoose'

const schema = new Schema({
  email: { type: String, required: true, index: true },
  codeHash: { type: String, required: true, index: true },
  role: { type: String, enum: ['admin', 'fin', 'viewer'], default: 'fin' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  expiresAt: { type: Date, default: null },
  usedAt: { type: Date, default: null },
}, { timestamps: true })

schema.index({ email: 1, codeHash: 1 }, { unique: true })

export default model('RegistrationInvite', schema)
