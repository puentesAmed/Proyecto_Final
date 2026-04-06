import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import Category from '../src/models/Category.js';
import Cashflow from '../src/models/Cashflow.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });  // <- carga backend/.env

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGODB_URI no definido en backend/.env');
  process.exit(1);
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

// limpia refs y siembra
await Cashflow.updateMany({ category: { $ne: null } }, { $set: { category: null } });
await Category.deleteMany({});
await Category.insertMany([
  { name: 'Transferencias', kind: 'operating' },
  { name: 'Recibo',         kind: 'operating' },
  { name: 'Pagaré',        kind: 'operating' },
  { name: 'Producto Bancario',        kind: 'operating' },
  { name: 'Varios',        kind: 'operating' },
]);

console.log('Reset OK');
await mongoose.disconnect();
