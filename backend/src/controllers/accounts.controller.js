import Account from '../models/Account.js'
import Cashflow from '../models/Cashflow.js'

// ── Utilidades de color ─────────────────────────────────────────────────────────
const colorSafe = (c) => /^#[0-9a-f]{6}$/i.test(String(c || '')) ? c.toUpperCase() : null;

const colorFromAlias = (alias = '') => {
  let h = 0;
  for (let i = 0; i < alias.length; i++) h = (h * 31 + alias.charCodeAt(i)) >>> 0;
  const palette = ['#2563EB','#16A34A','#DC2626','#9333EA','#0891B2','#CA8A04','#EA580C','#0D9488'];
  return palette[h % palette.length];
};

// ── Listar cuentas ──────────────────────────────────────────────────────────────
export const list = async (_req, res) => {
  const rows = await Account.find({}, { alias:1, bank:1, number:1, initialBalance:1, color:1 })
    .sort({ alias: 1 })
    .lean();
  res.json(rows);
};

// ── Crear cuenta ────────────────────────────────────────────────────────────────
export const create = async (req, res) => {
  const { alias, bank, number, initialBalance, color } = req.body;
  if (!alias) return res.status(400).json({ error: 'ALIAS_REQUIRED' });

  // color explícito válido → úsalo; si no, uno derivado del alias
  const provided = colorSafe(color);
  const finalColor = provided || colorFromAlias(alias);

  const doc = await Account.create({
    alias,
    bank: bank || '',
    number: number || '',
    initialBalance: initialBalance ?? 0,
    color: finalColor,
  });

  const json = doc.toObject({ versionKey: false });
  res.status(201).json(json);
};

// ── Actualizar cuenta (PATCH) ───────────────────────────────────────────────────
export const update = async (req, res) => {
  const { id } = req.params;
  const patch = {};

  // Campos permitidos
  if (req.body.alias !== undefined) patch.alias = req.body.alias;
  if (req.body.bank !== undefined) patch.bank = req.body.bank;
  if (req.body.number !== undefined) patch.number = req.body.number;
  if (req.body.initialBalance !== undefined) patch.initialBalance = req.body.initialBalance;

  // Validar color si viene
  if (req.body.color !== undefined) {
    const safe = colorSafe(req.body.color);
    if (!safe) return res.status(400).json({ error: 'INVALID_COLOR_HEX' });
    patch.color = safe;
  }

  const updated = await Account.findByIdAndUpdate(id, patch, { new: true, fields: { __v: 0 } }).lean();
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json(updated);
};

// ── Eliminar cuenta ─────────────────────────────────────────────────────────────
export const remove = async (req, res) => {
  const { id } = req.params;
  await Account.findByIdAndDelete(id);
  res.status(204).end();
};

// ── KPIs / balance por cuentas (para dashboard) ─────────────────────────────────
export const balance = async (_req, res, next) => {
  try {
    const accounts = await Account.find({}, { alias:1, initialBalance:1 }).lean();

    const [agg = {}] = await Cashflow.aggregate([
      {
        $group: {
          _id: null,
          ingresos: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, { $abs: '$amount' }, 0] } },
          gastos:   { $sum: { $cond: [{ $eq: ['$type', 'out'] }, { $abs: '$amount' }, 0] } },
        }
      },
      { $project: { _id:0, ingresos:1, gastos:1 } }
    ]);

    const kpi = {
      ingresos: agg.ingresos ?? 0,
      gastos:   agg.gastos ?? 0,
      balance: (agg.ingresos ?? 0) - (agg.gastos ?? 0),
    };

    const perAcc = await Cashflow.aggregate([
      { $addFields: { acc: { $ifNull: ['$account', '$accountId'] } } },
      { $match: { acc: { $ne: null } } },
      { $group: { _id: '$acc', net: { $sum: '$amount' } } },
    ]);
    const movMap = new Map(perAcc.map(r => [String(r._id), r.net]));

    const out = accounts.map(a => ({
      id: String(a._id),
      name: a.alias ?? String(a._id),
      balance: (a.initialBalance ?? 0) + (movMap.get(String(a._id)) ?? 0),
    }));

    res.json({ kpi, accounts: out });
  } catch (e) { next(e); }
};
