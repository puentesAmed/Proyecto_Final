import Cashflow from '../models/Cashflow.js'
import mongoose from 'mongoose'
import dayjs from 'dayjs';

const toUTCStart = (ymdStr) => {
  if (!ymdStr) return null;
  const [y, m, d] = ymdStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
};
const toUTCEnd = (ymdStr) => {
  if (!ymdStr) return null;
  const [y, m, d] = ymdStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
};


// GET /api/reports/totals
export const totals = async (req, res) => {
  try {
    const {
      from,
      to,
      groupBy = 'date',     
      granularity = 'day',  
      account,
      status,               
      type,                 
    } = req.query;

    const match = {};

    // Fecha inclusiva
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = toUTCStart(from);
      if (to)   match.date.$lte = toUTCEnd(to);
    }

    // Cuenta
    if (account && mongoose.isValidObjectId(account)) {
      match.account = new mongoose.Types.ObjectId(account);
    }

    // Estado
    if (status && ['pending','paid','cancelled'].includes(status)) {
      match.status = status;
    }

    // Tipo (muy útil para "pendientes" = pagos)
    if (type && ['in','out'].includes(type)) {
      match.type = type;
    }

    // Eje temporal
    const dateExpr = (granularity === 'month')
      ? { $dateToString: { format: '%Y-%m', date: '$date' } }
      : { $dateToString: { format: '%Y-%m-%d', date: '$date' } };

    const _id = {};
    if (groupBy === 'date')       _id.date = dateExpr;
    else if (groupBy === 'account'){ _id.account = '$account'; _id.date = dateExpr; }
    else if (groupBy === 'category'){ _id.category = '$category'; _id.date = dateExpr; }

    const data = await Cashflow.aggregate([
      { $match: match },
      { $group: { _id, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// VENCIDOS: status 'pending' y fecha <= fin de día seleccionado
export const overdue = async (req, res) => {
  try {
    const toParam = req.query.to || new Date().toISOString().slice(0,10);
    const toEnd = toUTCEnd(toParam);

    const match = { status: 'pending', date: { $lte: toEnd } };
    if (req.query.account && mongoose.isValidObjectId(req.query.account)) {
      match.account = new mongoose.Types.ObjectId(req.query.account);
    }

    // LOG DE DEPURACIÓN
    console.log('[overdue] params:', { toParam, toEnd, account: req.query.account });
    const countAll = await Cashflow.countDocuments({});
    const countPending = await Cashflow.countDocuments({ status: 'pending' });
    console.log('[overdue] count all:', countAll, 'count pending:', countPending);

    const rows = await Cashflow.find(
      match,
      { date:1, amount:1, status:1, concept:1, account:1, counterparty:1, category:1, type:1 }
    )
    .sort({ date:1 })
    .populate({ path:'account', select:'alias' })
    .populate({ path:'counterparty', select:'name' })
    .populate({ path:'category', select:'name' })
    .lean();

    console.log('[overdue] matched rows:', rows.length);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


export const pendingPerAccountMonth = async (req, res) => {
  try {
    // Rango solicitado por el usuario
    const fromParam = req.query.from ? new Date(req.query.from) : dayjs().startOf('year').toDate();
    const toParam   = req.query.to   ? new Date(req.query.to)   : dayjs().endOf('year').toDate();

    // Normalizamos a 00:00:00 para comparaciones seguras
    const norm = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const from = norm(fromParam);
    const to   = norm(toParam);

    // Hoy (00:00:00). Queremos excluir vencidos, así que empezamos en max(from, today)
    const today = norm(new Date());
    const start = new Date(Math.max(from.getTime(), today.getTime())); // ← evita incluir vencidos
    const end   = to;

    const rows = await Cashflow.aggregate([
      {
        $match: {
          status: 'pending',
          date: { $gte: start, $lte: end }, // ← solo pendientes futuros (no vencidos)
        }
      },
      {
        $addFields: {
          y: { $year: '$date' },
          m: { $month: '$date' },
        }
      },
      {
        $group: {
          _id: { account: '$account', y: '$y', m: '$m' },
          // si prefieres sumar siempre como valor positivo (por si hay signos mixtos), usa:
          // total: { $sum: { $abs: '$amount' } }
          total: { $sum: '$amount' },
        }
      },
      {
        $lookup: {
          from: 'accounts',
          localField: '_id.account',
          foreignField: '_id',
          as: 'acc',
        }
      },
      { $unwind: { path: '$acc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          accountId: '$_id.account',
          accountAlias: '$acc.alias',
          y: '$_id.y',
          m: '$_id.m',
          total: 1,
          _id: 0,
        }
      },
      { $sort: { accountAlias: 1, y: 1, m: 1 } }
    ]);

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};