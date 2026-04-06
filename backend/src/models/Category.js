import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  kind: { 
    type: String, 
    enum: ['operating', 'financing', 'investing'], 
    default: 'operating' 
  }
}, { timestamps: true })

export default mongoose.model('Category', categorySchema)
