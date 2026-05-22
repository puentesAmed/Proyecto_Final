import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    alias: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },

    bankName: {
      type: String,
      required: true,
      trim: true,
    },

    balance: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: 'EUR',
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default model('BankAccount', schema)