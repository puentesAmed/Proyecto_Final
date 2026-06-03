import Cashflow from '../models/Cashflow.js';
import Category from '../models/Category.js';
import Account from '../models/Account.js';
import Counterparty from '../models/Counterparty.js';
import dayjs from 'dayjs';
import mongoose from 'mongoose';
import xlsx from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import crypto from 'crypto';


const isId = v => typeof v === 'string' && mongoose.isValidObjectId(v);

// category: ObjectId → ok; texto → busca por nombre; vacío → null
const asCategoryId = async (val) => {
  if (!val) return null;
  if (mongoose.isValidObjectId(val)) return val;
  const byName = await Category.findOne({ name: new RegExp('^' + val + '$', 'i') }, { _id: 1 }).lean();
  if (!byName) throw new Error('CATEGORY_NOT_FOUND');
  return byName._id;
};

// GET /api/cashflows
export const list = async (req, res) => {
  try {
    const { from, to, account, type, category, counterparty, status } = req.query;
    const q = {};
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = new Date(from);
      if (to) q.date.$lte = new Date(to);
    }
    if (account) {
      if (!isId(account)) return res.status(400).json({ error: 'INVALID_ACCOUNT_ID' });
      q.account = account;
    }
    if (type) q.type = type;

    if (category) {
      if (isId(category)) q.category = category;
      else {
        const found = await Category.findOne({ name: new RegExp('^' + category + '$', 'i') }, { _id: 1 }).lean();
        if (!found) return res.status(400).json({ error: 'CATEGORY_NOT_FOUND' });
        q.category = found._id;
      }
    }

    if (counterparty) {
      if (!isId(counterparty)) return res.status(400).json({ error: 'INVALID_COUNTERPARTY_ID' });
      q.counterparty = counterparty;
    }
    if (status) q.status = status;

    const docs = await Cashflow.find(q)
      .populate('account counterparty category')
      .sort({ date: 1 })
      .lean();

    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


export const monthly = async (req, res, next) => {
  try {
    const from = dayjs().subtract(11, 'month').startOf('month').toDate();

    const rows = await Cashflow.aggregate([
      { $match: { date: { $gte: from } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          ingresos: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, { $abs: '$amount' }, 0] } },
          gastos:   { $sum: { $cond: [{ $eq: ['$type', 'out'] }, { $abs: '$amount' }, 0] } }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]);

    const map = new Map(rows.map(r => [`${r._id.y}-${r._id.m}`, r]));
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = dayjs().subtract(i, 'month');
      const k = `${d.year()}-${d.month()+1}`;
      const r = map.get(k);
      out.push({
        month: d.format('MMM'),
        ingresos: r?.ingresos ?? 0,
        gastos: r?.gastos ?? 0
      });
    }
    res.json(out);
  } catch (e) { next(e); }
};

// POST /api/cashflows
export const createCashflow = async (req, res) => {
  try {
    const { date, account, amount, type } = req.body;
    if (!date || !account || amount == null || !type) {
      return res.status(400).json({ error: 'date, account, amount, type required' });
    }

    const { category: catRaw, ...rest } = req.body;
    const categoryId = await asCategoryId(catRaw);

    const normalizedAmount = normalizeAmountByType(amount, type);

    const doc = await Cashflow.create({ ...rest, user: req.user.sub, date, account, amount: normalizedAmount, type, category: categoryId });
    const populated = await doc.populate('account counterparty category');
    res.status(201).json(populated);
  } catch (e) {
    if (e.message === 'CATEGORY_NOT_FOUND') return res.status(400).json({ error: 'CATEGORY_NOT_FOUND' });
    res.status(500).json({ error: e.message });
  }
};

// PUT /api/cashflows/:id
export const updateCashflow = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ error: 'INVALID_ID' });

    const update = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(req.body, 'category')) {
      update.category = await asCategoryId(req.body.category); // ''|null|undefined => null
    }

    const hasAmount = Object.prototype.hasOwnProperty.call(update, 'amount');
    const hasType = Object.prototype.hasOwnProperty.call(update, 'type');

    if (hasType && !['in', 'out'].includes(update.type)) {
      return res.status(400).json({ error: 'INVALID_TYPE' });
    }

    if (hasAmount || hasType) {
      const existing = await Cashflow.findOne({ _id: id }, { amount: 1, type: 1 }).lean();
      if (!existing) return res.status(404).json({ error: 'not_found' });

      const normalizedType = hasType ? update.type : existing.type;
      const amountToNormalize = hasAmount ? update.amount : existing.amount;
      update.amount = normalizeAmountByType(amountToNormalize, normalizedType);
      update.type = normalizedType;
    }

    const updated = await Cashflow.findOneAndUpdate({ _id: id }, update, { new: true })
      .populate('account counterparty category');

    if (!updated) return res.status(404).json({ error: 'not_found' });
    res.json(updated);
  } catch (e) {
    if (e.message === 'CATEGORY_NOT_FOUND') return res.status(400).json({ error: 'CATEGORY_NOT_FOUND' });
    res.status(500).json({ error: e.message });
  }
};

// DELETE /api/cashflows/:id
export const removeCashflow = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ error: 'INVALID_ID' });
    const deleted = await Cashflow.findOneAndDelete({ _id: id });
    if (!deleted) return res.status(404).json({ error: 'not_found' });
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const clearAll = async (_req, res) => {
  try {
    const result = await Cashflow.deleteMany({});
    res.json({ ok: true, deleted: result.deletedCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

//HANDLER PARA ACTUALIZAR EL STATUS DE UN CASHFLOW
// === Estado UI derivado (pendiente | vencido | pagado) ===
const computeUiStatus = (doc) => {
  if (doc.status === 'paid') return 'paid';
  if (doc.status === 'unpaid')  return 'unpaid';
  // compara solo por Y-M-D local
  const todayYMD = toYMD(new Date());
  const docYMD   = toYMD(new Date(doc.date));
  if (doc.status === 'pending' && docYMD < todayYMD) return 'overdue'; // "Vencido"
  return 'pending';
};


// ==== Utilidades de fecha para el calendario (evita “día anterior”) ====
const toUTCStart = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
};
const toUTCEnd = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
};

const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// GET /api/cashflows/calendar
export const calendar = async (req, res) => {
  try {
    const { start, end, account } = req.query;

    // Filtros seguros por fecha (FullCalendar manda YYYY-MM-DD)
    const q = {};
    if (start || end) {
      q.date = {};
      if (start) q.date.$gte = toUTCStart(start);
      if (end)   q.date.$lte = toUTCEnd(end);
    }
    if (account) q.account = account;

    const items = await Cashflow.find(
      q,
      { date: 1, amount: 1, type: 1, account: 1, counterparty: 1, category: 1, status: 1, concept: 1 }
    )
      .sort({ date: 1 })
      .limit(1000)
      .populate({ path: 'counterparty', select: 'name' })
      .populate({ path: 'account', select: 'alias color' })
      .populate({ path: 'category', select: 'name' })
      .lean();

    

    const events = items.map((i) => {
      const ymd = toYMD(new Date(i.date));
      const amountTxt = Number(i.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 });
      const title = `${i.counterparty?.name ?? '—'} · ${amountTxt}€${i.category?.name ? ` · ${i.category.name}` : ''}`;

      // estado UI derivado
      const uiStatus = computeUiStatus(i); // 'paid' | 'overdue' | 'pending'

      // color:
      // - paid: gris
      // - overdue: ámbar
      // - pending: color de cuenta o fallback por tipo
      const fallback = i.type === 'out' ? '#ef4444' : '#10b981';
      const base     = i.account?.color || fallback;
      let color      = base;
      if (uiStatus === 'paid')    color = '#9ca3af';
      if (uiStatus === 'overdue') color = '#f59e0b';

      return {
        id: String(i._id),
        title,
        start: ymd,
        allDay: true,
        color,
        extendedProps: {
          cashflowId: String(i._id),
          amount: i.amount,
          type: i.type,
          status: i.status,   // persistido: pending|paid|cancelled
          uiStatus,           // derivado: pending|overdue|paid
          account: i.account,
          category: i.category,
          counterparty: i.counterparty,
          concept: i.concept || '',
          dateYMD: ymd,
        },
      };
    });


    res.json(events);
  } catch (e) {
    console.error('calendar error:', e);
    res.status(500).json({ error: e.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const allowed = ['pending','paid','cancelled', 'unpaid']
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'INVALID_STATUS' })
    }
    const doc = await Cashflow.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('account counterparty category')

    if (!doc) return res.status(404).json({ error: 'not_found' })
    res.json(doc)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}


// GET /api/cashflows/upcoming
export const upcoming = async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7', 10);
    const now = new Date();
    const to = new Date();
    to.setDate(now.getDate() + days);

    const q = { status: 'pending', date: { $gte: now, $lte: to } };
    if (req.query.account) q.account = req.query.account;

    const items = await Cashflow.find(q)
      .populate('account counterparty category')
      .sort({ date: 1 })
      .limit(50)
      .lean();

    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ===== Importación =====
const norm = s => (s ?? '').toString().trim();
const lc = s => norm(s).toLowerCase();

// Normalización para evitar desfase de día al guardar
// Convierte un Date (local) a 12:00 UTC del mismo Y/M/D local
const fromLocalDateToUTCNoon = (d) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0));

const validLocalDate = (year, month, day) => {
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }

  return d;
};

//  YYYY-MM-DD desde un Date, tomando el Y/M/D LOCAL (el que ve el usuario)

const parseDate = (v) => {
  if (!v) return null;

  // Excel ya lo dio como Date
  if (v instanceof Date && !isNaN(v)) return fromLocalDateToUTCNoon(v);

  // Excel serial (días desde 1899-12-30)
  if (typeof v === 'number') {
    const d = new Date(Math.round((v - 25569) * 86400000)); // crea Date en local
    return isNaN(d) ? null : fromLocalDateToUTCNoon(d);
  }

  let s = String(v).trim();
  s = s.split(/[ T]/)[0]; // nos quedamos con la parte de fecha

  // yyyy-mm-dd | yyyy/mm/dd
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    const d = validLocalDate(+m[1], +m[2], +m[3]);
    return d ? fromLocalDateToUTCNoon(d) : null;
  }

  // dd/mm/yyyy | dd-mm-yyyy | dd.mm.yyyy
  m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if (m) {
    const d = validLocalDate(+m[3], +m[2], +m[1]);
    return d ? fromLocalDateToUTCNoon(d) : null;
  }

  // dd/mm/yy | dd-mm-yy
  m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2})$/);
  if (m) {
    const y2 = +m[3];
    const y = y2 >= 70 ? 1900 + y2 : 2000 + y2;
    const d = validLocalDate(y, +m[2], +m[1]);
    return d ? fromLocalDateToUTCNoon(d) : null;
  }

  return null;
};




const headerMap = (h) => {
  const k = (h ?? '')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s._-]+/g, '');
  if (['date','fecha','fechavencimiento','fechavto','fvencimiento','fvto','vencimiento'].includes(k)) return 'date';
  if (['amount','importe','valor','importeoperacion','importevto'].includes(k)) return 'amount';
  if (['type','tipo'].includes(k)) return 'type';
  if (['account','cuenta','accountalias','cuentaalias', 'banco'].includes(k)) return 'accountAlias';
  if (['counterpartynif','nif','cif','nifproveedor','nifcliente'].includes(k)) return 'counterpartyNif';
  if (['counterparty','proveedor','cliente','tercero','beneficiario','pagador'].includes(k)) return 'counterpartyName';
  if (['category','categoria','categoryname','categorianame','nombrecategoria'].includes(k)) return 'categoryName';
  if (['concept','concepto','descripcion','detalle'].includes(k)) return 'concept';
  if (['status','estado'].includes(k)) return 'status';
  return null;
};

const normalizeAmountByType = (amount, type) => {
  const n = Number(amount)
  if (!Number.isFinite(n)) return amount
  const abs = Math.abs(n)
  return type === 'out' ? -abs : abs
}

const parseAmount = (v) => {
  if (v === null || v === undefined || v === '') return NaN;
  if (typeof v === 'number') return v;
  let s = (v + '').trim();
  s = s.replace(/[€$]/g, '').replace(/\s+/g, '');
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (/-$/.test(s))        { neg = true; s = s.slice(0, -1); }
  const lastComma = s.lastIndexOf(',');
  const lastDot   = s.lastIndexOf('.');
  if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  let n = parseFloat(s);
  if (neg) n = -n;
  return isNaN(n) ? NaN : n;
};

// ==== helpers idempotencia ====
const canon = s => (s??'').toString()
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[\s\-_()\.,"']/g,' ').replace(/\s+/g,' ')
  .toLowerCase().trim();
const toUTCYMD = d => {
  const y=d.getUTCFullYear(), m=String(d.getUTCMonth()+1).padStart(2,'0'), day=String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
const amtKey = n => Number(Math.abs(n)).toFixed(2);
const dirBySign = n => (n < 0 ? 'out' : 'in');
const buildExternalId = ({ dateUTC, amount, accountAlias, categoryName, counterpartyNif, concept }) => {
  const base = [
    toUTCYMD(dateUTC),
    dirBySign(amount),
    amtKey(amount),
    canon(accountAlias),
    canon(categoryName),
    canon(counterpartyNif),
    canon(concept)
  ].join('|');
  return crypto.createHash('sha1').update(base).digest('hex');
};

const validImportTypes = new Set(['in', 'out']);
const validImportStatuses = new Set(['pending', 'paid', 'cancelled']);
const importError = (row, error, value, message) => ({ row, error, value, message });

const hasImportValues = (row) =>
  Object.entries(row).some(([key, value]) => key !== '__rowNumber' && norm(value) !== '');

const readRowsFromExcelSheet = (ws) => {
  const matrix = xlsx.utils.sheet_to_json(ws, { header: 1, raw: true, blankrows: false });
  for (let i = 0; i < Math.min(20, matrix.length); i++) {
    const hdrMapped = (matrix[i] || []).map(headerMap);
    const knownHeaders = hdrMapped.filter(Boolean);
    if (knownHeaders.includes('date') && knownHeaders.includes('amount') && knownHeaders.includes('accountAlias')) {
      return matrix.slice(i + 1).map((r, rowIndex) => {
        const obj = {};
        hdrMapped.forEach((k, idx) => {
          if (k) obj[k] = r[idx] ?? '';
        });
        obj.__rowNumber = i + rowIndex + 2;
        return obj;
      });
    }
  }

  return [];
};


// POST /api/cashflows/import
export const importCashflows = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'FILE_REQUIRED' });

    const name = req.file.originalname.toLowerCase();
    let rows = []; // <- única declaración

    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const wb = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
      const firstSheetName = wb.SheetNames[0];
      if (!firstSheetName) return res.status(400).json({ error: 'EMPTY_FILE' });
      rows = readRowsFromExcelSheet(wb.Sheets[firstSheetName]);
    } else if (name.endsWith('.csv')) {
      rows = parseCsv(req.file.buffer.toString('utf8'), {
        columns: true, skip_empty_lines: true, bom: true, trim: true
      });
    } else {
      return res.status(400).json({ error: 'UNSUPPORTED_FORMAT' });
    }

    rows = rows.filter(hasImportValues);

    if (!rows.length) return res.status(400).json({ error: 'EMPTY_FILE' });

    const map = {};
    Object.keys(rows[0]).forEach(h => { map[h] = headerMap(h) || h; });

    const errors = [];
    let inserted = 0, skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const rowNumber = Number(raw.__rowNumber) || i + 2;
      const rec = {};
      for (const [h, v] of Object.entries(raw)) {
        if (h === '__rowNumber') continue;
        const k = map[h];
        if (k) rec[k] = v;
      }

      const date = parseDate(rec.date);
      if (!date) {
        errors.push(importError(rowNumber, 'INVALID_DATE', rec.date, 'La fecha no es válida'));
        continue;
      }

      let amount = parseAmount(rec.amount);
      if (Number.isNaN(amount)) {
        errors.push(importError(rowNumber, 'INVALID_AMOUNT', rec.amount, 'El importe debe ser numérico'));
        continue;
      }

      const type = lc(rec.type);
      if (!validImportTypes.has(type)) {
        errors.push(importError(rowNumber, 'INVALID_TYPE', rec.type, 'El tipo debe ser in u out'));
        continue;
      }

      const status = lc(rec.status);
      if (!validImportStatuses.has(status)) {
        errors.push(importError(rowNumber, 'INVALID_STATUS', rec.status, 'El estado debe ser pending, paid o cancelled'));
        continue;
      }

      const accountAlias = norm(rec.accountAlias);
      if (!accountAlias) {
        errors.push(importError(rowNumber, 'ACCOUNT_REQUIRED', rec.accountAlias, 'La columna accountAlias es obligatoria'));
        continue;
      }

      const acc = await Account.findOne({ alias: new RegExp('^' + accountAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }, { _id: 1, alias: 1 }).lean();
      if (!acc) {
        errors.push(importError(rowNumber, 'ACCOUNT_NOT_FOUND', rec.accountAlias, 'No existe una cuenta con ese alias'));
        continue;
      }

      let counterpartyId = null;
      const counterpartyNif = norm(rec.counterpartyNif);
      if (counterpartyNif) {
        let cp = await Counterparty.findOne({ nif: counterpartyNif }, { _id: 1 }).lean();
        if (!cp) {
          const createdCp = await Counterparty.create({
            name: counterpartyNif,
            nif: counterpartyNif,
          });
          counterpartyId = createdCp._id;
        } else {
          counterpartyId = cp._id;
        }
      }

      let categoryId = null;
      const categoryName = norm(rec.categoryName);
      if (categoryName) {
        const cat = await Category.findOne(
          { name: new RegExp('^' + categoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
          { _id: 1 }
        ).lean();
        if (!cat) {
          errors.push(importError(rowNumber, 'CATEGORY_NOT_FOUND', rec.categoryName, 'No existe una categoría con ese nombre'));
          continue;
        }
        categoryId = cat._id;
      }

      amount = normalizeAmountByType(amount, type);

      const concept = norm(rec.concept);

       // === clave única canónica para idempotencia ===
      const externalId = buildExternalId({
        dateUTC: date,
        amount,
        accountAlias: acc.alias,
        categoryName,
        counterpartyNif,
        concept
      });

      const payload = {
        user: req.user.sub,
        date,
        account: acc._id,
        counterparty: counterpartyId,
        amount,
        type,
        category: categoryId,
        concept,
        status,
        source: 'upload',
        externalId
      };

      const ret = await Cashflow.updateOne(
        { externalId },
        { $setOnInsert: payload },
        { upsert: true, runValidators: true }
      );
      if (ret.upsertedCount === 1) inserted++; else skipped++;

    }

    res.json({
      totalRows: rows.length,
      inserted,
      skipped,
      errors,
      errorsCount: errors.length,
      created: inserted,
    });   
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


// ==== REPORTES ====

/**
 * GET /api/cashflows/reports/overdue
 * Lista de vencimientos con status 'pending' y fecha < hoy (UTC midnight)
 * Query: ?account=ACCOUNT_ID (opcional)
 */
export const overdueReport = async (req, res) => {
  try {
    const now = new Date();
    const todayUtcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    const q = { status: 'pending', date: { $lt: todayUtcMidnight } };
    if (req.query.account) q.account = req.query.account;

    const items = await Cashflow.find(q)
      .populate({ path: 'account', select: 'alias color' })
      .populate({ path: 'counterparty', select: 'name' })
      .populate({ path: 'category', select: 'name' })
      .sort({ date: 1 })
      .lean();

    const total = items.reduce((acc, i) => acc + (typeof i.amount === 'number' ? Math.abs(i.amount) : 0), 0);

    res.json({ rows: items, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * GET /api/cashflows/reports/pending-totals-by-account-month
 * Totales 'pending' por cuenta y mes del año indicado.
 * Query: ?year=2025 (opcional; por defecto, año actual)
 */
export const pendingTotalsByAccountMonth = async (req, res) => {
  try {
    const year = Number(req.query.year) || (new Date()).getFullYear();

    const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const to   = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));

    const rows = await Cashflow.aggregate([
      { $match: { status: 'pending', date: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: {
            acc: '$account',
            y: { $year: '$date' },
            m: { $month: '$date' }
          },
          total: {
            $sum: {
              $cond: [
                { $lt: ['$amount', 0] },
                { $abs: '$amount' },
                '$amount'
              ]
            }
          }
        }
      },
      { $sort: { '_id.acc': 1, '_id.y': 1, '_id.m': 1 } },
      {
        $lookup: {
          from: 'accounts',
          localField: '_id.acc',
          foreignField: '_id',
          as: 'account'
        }
      },
      { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          accountId: '$_id.acc',
          year: '$_id.y',
          month: '$_id.m',
          total: 1,
          accountAlias: '$account.alias',
          accountColor: '$account.color'
        }
      }
    ]);

    res.json({ year, rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
