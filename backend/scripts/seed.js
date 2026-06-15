import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import Account from '../src/models/Account.js';
import Cashflow from '../src/models/Cashflow.js';
import Category from '../src/models/Category.js';
import Counterparty from '../src/models/Counterparty.js';
import User from '../src/models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
const validStatuses = new Set(['pending', 'paid', 'cancelled']);
const validTypes = new Set(['in', 'out']);

const readCsv = (filename) =>
  parse(fs.readFileSync(path.join(dataDir, filename), 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });

const normalizeAmountByType = (amount, type) => {
  const n = Math.abs(Number(amount || 0));
  return type === 'out' ? -n : n;
};

console.log('Conectando a MongoDB...');
await mongoose.connect(env.MONGO_URI);

try {
  console.log('Limpiando datos demo...');
  await Promise.all([
    Cashflow.deleteMany({}),
    Account.deleteMany({}),
    Category.deleteMany({}),
    Counterparty.deleteMany({}),
    User.deleteMany({ email: { $in: ['admin@demo.com', 'fin@demo.com', 'viewer@demo.com'] } }),
  ]);

  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const [adminUser] = await User.insertMany([
    { name: 'Admin Demo', email: 'admin@demo.com', passwordHash, role: 'admin' },
    { name: 'Finanzas Demo', email: 'fin@demo.com', passwordHash, role: 'fin' },
    { name: 'Viewer Demo', email: 'viewer@demo.com', passwordHash, role: 'viewer' },
  ]);
  console.log('Usuarios demo creados: admin@demo.com, fin@demo.com, viewer@demo.com / Admin123!');

  const accountRows = readCsv('accounts.csv');
  const accounts = await Account.insertMany(accountRows.map((row) => ({
    alias: row.alias,
    bank: row.bank || '',
    number: row.number || row.nummber || '',
    color: row.color || undefined,
    currency: row.currency || 'EUR',
    initialBalance: Number(row.initialBalance || 0),
    currentBalance: Number(row.currentBalance || row.initialBalance || 0),
  })));
  const accountByAlias = new Map(accounts.map((account) => [account.alias, account]));
  console.log(`Cuentas creadas: ${accounts.length}`);

  const categoryRows = readCsv('categories.csv');
  const categories = await Category.insertMany(categoryRows.map((row) => ({
    name: row.name,
    kind: 'operating',
  })));
  const categoryByName = new Map(categories.map((category) => [category.name, category]));
  console.log(`Categorías creadas: ${categories.length}`);

  const counterpartyRows = readCsv('counterparties.csv');
  const counterparties = await Counterparty.insertMany(counterpartyRows.map((row) => ({
    name: row.name,
    nif: row.nif || undefined,
    contact: row.email || row.phone || '',
  })));
  const counterpartyByNif = new Map(counterparties.filter((item) => item.nif).map((item) => [item.nif, item]));
  console.log(`Contrapartes creadas: ${counterparties.length}`);

  const cashflowRows = readCsv('cashflows.csv');
  const cashflows = [];
  const skipped = [];

  for (const [index, row] of cashflowRows.entries()) {
    const rowNumber = index + 2;
    const type = String(row.type || '').trim();
    const status = String(row.status || '').trim();
    const account = accountByAlias.get(row.accountAlias);
    const category = categoryByName.get(row.categoryName);
    const counterparty = counterpartyByNif.get(row.counterpartyNif);

    if (!account || !validTypes.has(type) || !validStatuses.has(status)) {
      skipped.push({ row: rowNumber, reason: 'account/type/status inválido' });
      continue;
    }

    cashflows.push({
      user: adminUser._id,
      account: account._id,
      category: category?._id || null,
      counterparty: counterparty?._id || null,
      date: new Date(`${row.date}T12:00:00.000Z`),
      amount: normalizeAmountByType(row.amount, type),
      type,
      concept: row.concept || '',
      status,
      source: 'seed',
    });
  }

  if (cashflows.length) {
    await Cashflow.insertMany(cashflows);
  }

  console.log(`Cashflows creados: ${cashflows.length}`);
  if (skipped.length) {
    console.warn('Filas omitidas:', skipped);
  }

  console.log('Seed principal completado correctamente.');
} finally {
  await mongoose.disconnect();
}
