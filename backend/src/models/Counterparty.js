import mongoose from 'mongoose'

const S = new mongoose.Schema({
  name: { type:String, unique:true, required:true },
  contact: String,
  nif: { type:String, unique:true, sparse:true },
  kind: { type:String, enum:['client','supplier','bank'], default:'client' }
}, { timestamps: true })
export default mongoose.model('Counterparty', S)
