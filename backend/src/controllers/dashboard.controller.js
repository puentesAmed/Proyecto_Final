import Account from '../models/Account.js';
import Cashflow from '../models/Cashflow.js';

// Construye el $match en función de los query params
function buildMatch(q = {}) {
  const and = [];

  const acc = q.accountId || q.account;
  if (acc) and.push({ $or: [{ account: acc }, { accountId: acc }, { 'account._id': acc }] });

  const cat = q.categoryId || q.category;
  if (cat) and.push({ $or: [{ category: cat }, { categoryId: cat }, { 'category._id': cat }] });

  // Rango temporal por year/month o start/end
  let start = q.start ? new Date(q.start) : null;
  let end   = q.end   ? new Date(q.end)   : null;
  if (!start && (q.year || q.yyyy)) {
    const y = Number(q.year || q.yyyy);
    if (q.month || q.mm) {
      const m = Number(q.month || q.mm) - 1; // 0..11
      start = new Date(Date.UTC(y, m, 1));
      end   = new Date(Date.UTC(y, m + 1, 1));
    } else {
      start = new Date(Date.UTC(y, 0, 1));
      end   = new Date(Date.UTC(y + 1, 0, 1));
    }
  }
  if (start && end) and.push({ date: { $gte: start, $lt: end } });

  return and.length ? { $and: and } : {};
}

// KPI + balances por cuenta (filtrados)
export const accountsBalance = async (req, res, next) => {
  try {
    const match = buildMatch(req.query);
    const matchStage = Object.keys(match).length ? [{ $match: match }] : [];

    // KPIs filtrados
    const [agg = {}] = await Cashflow.aggregate([
      ...matchStage,
      {
        $group: {
          _id: null,
          ingresos: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, { $abs: '$amount' }, 0] } },
          gastos:   { $sum: { $cond: [{ $eq: ['$type', 'out'] }, { $abs: '$amount' }, 0] } },
        }
      },
      { $project: { _id: 0, ingresos: 1, gastos: 1 } }
    ]);

    const kpi = {
      ingresos: agg.ingresos ?? 0,
      gastos:   agg.gastos ?? 0,
      balance: (agg.ingresos ?? 0) - (agg.gastos ?? 0),
    };

    // Netos por cuenta (filtrados)
    const perAcc = await Cashflow.aggregate([
      ...matchStage,
      { $addFields: { acc: { $ifNull: ['$account', '$accountId'] } } },
      { $match: { acc: { $ne: null } } },
      { $group: { _id: '$acc', net: { $sum: '$amount' } } },
    ]);
    const movMap = new Map(perAcc.map(r => [String(r._id), r.net]));

    // Si viene una cuenta concreta, solo esa
    const onlyAcc = req.query.accountId || req.query.account;
    const accQuery = onlyAcc ? { _id: onlyAcc } : {};
    const accounts = await Account.find(accQuery, { alias: 1, initialBalance: 1 }).lean();

    const out = accounts.map(a => ({
      id: String(a._id),
      name: a.alias ?? String(a._id),
      // Para filtros temporales el "balance" refleja initialBalance + neto filtrado
      balance: (a.initialBalance ?? 0) + (movMap.get(String(a._id)) ?? 0),
    }));

    res.json({ kpi, accounts: out });
  } catch (e) { next(e); }
};

// Serie mensual (filtrada) ingresos/gastos
export const monthly = async (req, res, next) => {
  try {
    const match = buildMatch(req.query);
    const matchStage = Object.keys(match).length ? [{ $match: match }] : [];

    const rows = await Cashflow.aggregate([
      ...matchStage,
      {
        $group: {
          _id: { m: { $month: '$date' } },
          ingresos: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, { $abs: '$amount' }, 0] } },
          gastos:   { $sum: { $cond: [{ $eq: ['$type', 'out'] }, { $abs: '$amount' }, 0] } },
        }
      },
      { $project: { _id: 0, month: '$_id.m', ingresos: 1, gastos: 1 } },
      { $sort: { month: 1 } }
    ]);

    res.json(rows); // [{month:1..12, ingresos, gastos}]
  } catch (e) { next(e); }
};

// Resumen simple (filtrado)
export const summary = async (req, res, next) => {
  try {
    const match = buildMatch(req.query);
    const matchStage = Object.keys(match).length ? [{ $match: match }] : [];

    const [agg = {}] = await Cashflow.aggregate([
      ...matchStage,
      {
        $group: {
          _id: null,
          ingresos: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, { $abs: '$amount' }, 0] } },
          gastos:   { $sum: { $cond: [{ $eq: ['$type', 'out'] }, { $abs: '$amount' }, 0] } },
        }
      },
      { $project: { _id: 0, ingresos: 1, gastos: 1 } }
    ]);

    res.json({ ingresos: agg.ingresos ?? 0, gastos: agg.gastos ?? 0 });
  } catch (e) { next(e); }
};

// Para los selects del front
export const accountsDistinct = async (_req, res, next) => {
  try {
    const rows = await Account.find({}, { alias: 1 }).lean();
    res.json(rows.map(a => ({ _id: String(a._id), alias: a.alias || String(a._id) })));
  } catch (e) { next(e); }
};

export const categoriesDistinct = async (_req, res, next) => {
  try {
    const rows = await Cashflow.aggregate([
      { $project: {
          catId:   { $ifNull: ['$categoryId', '$category'] },
          catName: { $ifNull: ['$category.name', '$categoryName'] }
      }},
      { $match: { catId: { $ne: null } } },
      { $group: { _id: '$catId', name: { $first: { $ifNull: ['$catName', '—'] } } } },
      { $project: { _id: 1, name: 1 } },
      { $sort: { name: 1 } }
    ]);
    res.json(rows.map(r => ({ _id: String(r._id), name: r.name })));
  } catch (e) { next(e); }
};
