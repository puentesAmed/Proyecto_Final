import React, { useState } from 'react';
import { api } from '@/lib/api.js';
import {
  Box, Heading, Text, Button, Input, Code, Stack,
  useColorModeValue, Alert, AlertIcon, Table, Thead, Tbody, Tr, Th, Td, Divider
} from '@chakra-ui/react';


const norm = (s) => (s ?? '').toString().trim();
const canon = (s) =>
  (s ?? '')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-_()\.,"']/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

const parseDateLoose = (v) => {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v)) return v;
  const s = String(v).trim().split(/[ T]/)[0];
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
  if (m) {
    const yy = m[3].length === 2 ? (+m[3] >= 70 ? 1900 + +m[3] : 2000 + +m[3]) : +m[3];
    return new Date(yy, +m[2] - 1, +m[1]);
  }
  return null;
};

const parseAmount = (v) => {
  if (v == null || v === '') return NaN;
  if (typeof v === 'number') return v;
  let s = String(v).trim().replace(/[€$]/g, '').replace(/\s+/g, '');
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (/-$/.test(s)) { neg = true; s = s.slice(0, -1); }
  const c = s.lastIndexOf(','), d = s.lastIndexOf('.');
  s = c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  let n = parseFloat(s); if (neg) n = -n;
  return isNaN(n) ? NaN : n;
};

const typeMap = (v) => {
  const t = (v ?? '').toString().trim().toLowerCase();
  if (['in', 'cobro', 'entrada', 'abono'].includes(t)) return 'in';
  if (['out', 'pago', 'salida', 'cargo', 'gasto'].includes(t)) return 'out';
  return 'out';
};

const normalizeAmountByType = (amount, type) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  const abs = Math.abs(n);
  return type === 'out' ? -abs : abs;
};

const resolveImportType = (amount, rawType) => {
  const n = Number(amount);
  const hasExplicitType = !!norm(rawType);
  const mappedType = hasExplicitType ? typeMap(rawType) : null;

  if (mappedType === 'out') {
    return Number.isFinite(n) && n < 0 ? 'in' : 'out';
  }

  if (mappedType === 'in') {
    return 'in';
  }

  return Number.isFinite(n) && n < 0 ? 'out' : 'in';
};

const headerMap = (h) => {
  const k = (h ?? '')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[\s._-]+/g, '');
  if (['date','fecha','fechavencimiento','fechavto','vencimiento'].includes(k)) return 'date';
  if (['amount','importe','valor','importevto','importeoperacion'].includes(k)) return 'amount';
  if (['type','tipo'].includes(k)) return 'type';
  if (['account','cuenta','accountalias','cuentaalias','banco'].includes(k)) return 'account';
  if (['counterparty','proveedor','cliente','tercero','beneficiario','pagador'].includes(k)) return 'counterparty';
  if (['category','categoria'].includes(k)) return 'category';
  if (['concept','concepto','descripcion','detalle','title'].includes(k)) return 'concept';
  if (['status','estado'].includes(k)) return 'status';
  return null;
};


const amtKey = (amt) => Number(Math.abs(amt)).toFixed(2);
const dirBySign = (amt) => (amt < 0 ? 'out' : 'in');
const ymdVariants = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  const to = (dt) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  return [to(base), to(new Date(base.getFullYear(), base.getMonth(), base.getDate() - 1)), to(new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1))];
};


const rowKeyStrict = (r) => [
  r.dateYMD,
  dirBySign(r.amount),
  amtKey(r.amount),
  canon(r.account),
  canon(r.category),
  canon(r.counterparty),
  canon(r.concept),
].join('|');

const rowKeyRelax = (r) => [
  r.dateYMD,
  dirBySign(r.amount),
  amtKey(r.amount),
  canon(r.concept),
].join('|');


const splitCSV = (line) => {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else { q = !q; } }
    else if (c === ',' && !q) { out.push(cur); cur = ''; }
    else { cur += c; }
  }
  out.push(cur);
  return out;
};
const parseCsv = (text) => {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (!lines.length) return [];
  const headers = splitCSV(lines[0]).map(h => h.trim());
  const mapped = headers.map(headerMap);
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSV(lines[i]); if (!cols.length || cols.every(c => !c.trim())) continue;
    const tmp = {}; mapped.forEach((k, idx) => { if (k) tmp[k] = cols[idx]; });
    const d = parseDateLoose(tmp.date); const amt = parseAmount(tmp.amount); const acc = norm(tmp.account);
    if (!d || isNaN(amt) || !acc) continue;
    const type = resolveImportType(amt, tmp.type);
    out.push({
      dateYMD: toYMD(d),
      amount: normalizeAmountByType(amt, type),
      type,
      account: acc,
      counterparty: norm(tmp.counterparty),
      category: norm(tmp.category),
      concept: norm(tmp.concept),
      status: ['pending','paid','cancelled'].includes((tmp.status||'').toString().toLowerCase()) ? (tmp.status||'').toString().toLowerCase() : 'pending'
    });
  }
  return out;
};


async function parseXlsx(file) {
  const { read, utils } = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = read(buf, { type: 'array', cellDates: true });
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const rows = utils.sheet_to_json(ws, { defval: '', raw: true });
    if (!rows.length) continue;
    const mappedRows = rows.map(row => {
      const rec = {};
      for (const [h, v] of Object.entries(row)) { const k = headerMap(h) || null; if (k) rec[k] = v; }
      return rec;
    });
    const out = [];
    for (const r of mappedRows) {
      const d = parseDateLoose(r.date); const amt = parseAmount(r.amount); const acc = norm(r.account);
      if (!d || isNaN(amt) || !acc) continue;
      const type = resolveImportType(amt, r.type);
      out.push({
        dateYMD: toYMD(d),
        amount: normalizeAmountByType(amt, type),
        type,
        account: acc,
        counterparty: norm(r.counterparty),
        category: norm(r.category),
        concept: norm(r.concept),
        status: ['pending','paid','cancelled'].includes((r.status||'').toString().toLowerCase()) ? (r.status||'').toString().toLowerCase() : 'pending'
      });
    }
    if (out.length) return out;
  }
  return [];
}


export function ImportPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const pageBg = useColorModeValue('neutral.50','neutral.900');
  const cardBg = useColorModeValue('white','neutral.800');
  const border = useColorModeValue('neutral.200','neutral.700');
  const subtle = useColorModeValue('neutral.600','neutral.300');

  const dedupeAndUpload = async (records) => {
    if (!records.length) return { created: 0, skipped: 0, errorsCount: 0, errors: [] };

    const minYMD = records.reduce((m, r) => (r.dateYMD < m ? r.dateYMD : m), records[0].dateYMD);
    const maxYMD = records.reduce((m, r) => (r.dateYMD > m ? r.dateYMD : m), records[0].dateYMD);

    const { data: existing } = await api.get('/cashflows', { params: { from: minYMD, to: maxYMD } });
    const ymdLocal = (d) => (typeof d === 'string' ? d.slice(0, 10) : toYMD(new Date(d)));

    const existingStrict = new Set();
    const existingRelax = new Set();
    for (const doc of existing) {
      const ymd = ymdLocal(doc.date);
      const amk = amtKey(doc.amount);
      const dir = dirBySign(doc.amount);
      const acc = canon(doc.account?.alias);
      const cat = canon(doc.category?.name);
      const cpty = canon(doc.counterparty?.name);
      const cpt = canon(doc.concept);
      const cptNorm = canon(doc.concept);
      for (const v of ymdVariants(ymd)) {
        existingStrict.add([v, dir, amk, acc, cat, cpty, cpt].join('|'));
        existingRelax.add([v, dir, amk, cptNorm].join('|'));
      }
    }

    const unique = [];
    let skipped = 0;
    for (const r of records) {
      let dup = false;
      for (const v of ymdVariants(r.dateYMD)) {
        const kS = rowKeyStrict({ ...r, dateYMD: v });
        const kR = rowKeyRelax({ ...r, dateYMD: v });
        if (existingStrict.has(kS) || existingRelax.has(kR)) { dup = true; break; }
      }
      if (dup) skipped++;
      else unique.push(r);
    }

    if (!unique.length) return { created: 0, skipped, errorsCount: 0, errors: [] };

    // subir solo no duplicados en CSV
    const headers = ['date','amount','type','account','counterparty','category','concept','status'];
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(',')];
    for (const r of unique) {
      lines.push([r.dateYMD, r.amount, r.type, r.account, r.counterparty, r.category, r.concept, r.status].map(esc).join(','));
    }
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const fd = new FormData();
    fd.append('file', blob, 'filtered.csv');
    const { data } = await api.post('/cashflows/import', fd);
    return { ...data, skipped: (data.skipped || 0) + skipped };
  };

  const onUpload = async () => {
    if (!file) return;
    setLoading(true); setErrMsg(''); setResult(null);
    try {
      let records = [];
      if (/\.csv$/i.test(file.name)) {
        const text = await file.text();
        records = parseCsv(text);
      } else if (/\.(xlsx|xls)$/i.test(file.name)) {
        records = await parseXlsx(file);
      } else {
        const fd = new FormData(); fd.append('file', file);
        const { data } = await api.post('/cashflows/import', fd);
        setResult(data); return;
      }

      const data = await dedupeAndUpload(records);
      setResult(data);
    } catch (e) {
      try {
        const fd = new FormData(); fd.append('file', file);
        const { data } = await api.post('/cashflows/import', fd);
        setResult(data);
      } catch (err) {
        setErrMsg(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onChangeFile = (e) => {
    setFile(e.target.files?.[0] || null);
    setResult(null);
    setErrMsg('');
  };

  return (
    <Box bg={pageBg} minH="calc(100vh - 120px)" p={6}>
      <Box bg={cardBg} border="1px solid" borderColor={border} rounded="lg" p={6} maxW="720px">
        <Heading size="md" mb={4}>Importar vencimientos</Heading>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={3} align="center" mb={2}>
          <Input type="file" accept=".csv,.xlsx,.xls" onChange={onChangeFile} />
          <Button onClick={onUpload} isLoading={loading} loadingText="Importando…" isDisabled={!file}>
            Importar
          </Button>
        </Stack>

        <Text fontSize="sm" color={subtle} mb={4}>
          Columnas: <Code>date</Code>, <Code>amount</Code>, <Code>type</Code> (<Code>in/out</Code>),
          <Code>account</Code>, <Code>counterparty</Code>, <Code>category</Code>, <Code>concept</Code>, <Code>status</Code>.
          Se evita duplicar contra lo ya existente.
        </Text>

        {errMsg && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            {errMsg}
          </Alert>
        )}

        {result && (
          <Box bg={useColorModeValue('neutral.100','neutral.700')} rounded="md" p={4} border="1px solid" borderColor={border}>
            <Heading size="sm" mb={2}>Importación completada</Heading>
            <Text>Nuevo(s): <b>{result.created}</b></Text>
            {'skipped' in result ? <Text>Omitidos por duplicado: <b>{result.skipped}</b></Text> : null}
            <Text>Errores: <b>{result.errorsCount}</b></Text>

            {Array.isArray(result.errors) && result.errors.length > 0 && (
              <>
                <Divider my={3} />
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Fila</Th>
                      <Th>Error</Th>
                      <Th>Valor</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {result.errors.map((e, idx) => (
                      <Tr key={idx}>
                        <Td>{e.row ?? '-'}</Td>
                        <Td>{e.error}</Td>
                        <Td>{e.value ?? '-'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
