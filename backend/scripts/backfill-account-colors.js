import env from '../src/config/env.js';
import { connectMongo } from '../src/config/mongo.js';
import Account from '../src/models/Account.js';

const PALETTE = [
  '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
  '#06B6D4','#84CC16','#F97316','#EC4899','#14B8A6'
];

function pickColor(i) {
  return PALETTE[i % PALETTE.length];
}

await connectMongo(env.MONGO_URI);

const toFix = await Account.find({
  $or: [{ color: { $exists: false } }, { color: '' }, { color: null }]
}).sort({ createdAt: 1 }).lean();

let i = 0, updated = 0;
for (const acc of toFix) {
  const color = pickColor(i++);
  await Account.updateOne({ _id: acc._id }, { $set: { color } });
  console.log(`✔ ${acc.alias} -> ${color}`);
  updated++;
}

console.log(`Hecho. Cuentas actualizadas: ${updated}`);
process.exit(0);