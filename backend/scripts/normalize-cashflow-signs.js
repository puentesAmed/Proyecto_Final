import mongoose from 'mongoose'
import env from '../src/config/env.js'
import Cashflow from '../src/models/Cashflow.js'

const normalizeAmount = (amount, type) => {
  const abs = Math.abs(Number(amount) || 0)
  return type === 'out' ? -abs : abs
}

async function run() {
  await mongoose.connect(env.MONGO_URI)

  const rows = await Cashflow.find({}, { _id: 1, amount: 1, type: 1 }).lean()
  const ops = []

  for (const row of rows) {
    if (!['in', 'out'].includes(row.type)) continue
    const normalized = normalizeAmount(row.amount, row.type)
    if (normalized !== row.amount) {
      ops.push({
        updateOne: {
          filter: { _id: row._id },
          update: { $set: { amount: normalized } },
        },
      })
    }
  }

  if (ops.length > 0) {
    await Cashflow.bulkWrite(ops, { ordered: false })
  }

  console.log(`Cashflows revisados: ${rows.length}. Corregidos: ${ops.length}.`)
  await mongoose.disconnect()
}

run().catch(async (error) => {
  console.error('Error normalizando importes:', error)
  await mongoose.disconnect()
  process.exit(1)
})
