/*import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { getTotals, getOverdue, getPendingPerAccountMonth } from '@/api/reportsService.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Box,
  Heading,
  Text,
  Stack,
  HStack,
  Button,
  Select,
  Input,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
  Spinner,
} from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function TotalsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [granularity, setGranularity] = useState('day');
  const [account, setAccount] = useState('');
  const [status, setStatus] = useState('');
  const [flowType, setFlowType] = useState('out');

  // Colores / fondos
  const pageBg   = useColorModeValue('neutral.50', 'neutral.900');
  const cardBg   = useColorModeValue('white', 'neutral.800');
  const border   = useColorModeValue('neutral.200', 'neutral.700');
  const subtle   = useColorModeValue('neutral.600', 'neutral.300');
  const btnBg    = useColorModeValue('brand.500', 'accent.500');
  const btnHover = useColorModeValue('brand.600', 'accent.600');
  const btnColor = useColorModeValue('white', 'black');

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then(r => r.data),
  });

  const { data: totals = [], isLoading } = useQuery({
    queryKey: ['totals', from, to, account, granularity, status, flowType],
    queryFn: () =>
      getTotals({
        from,
        to,
        account,
        groupBy: 'date',
        granularity,
        status: status || undefined,
        type: flowType || undefined,
      }),
    keepPreviousData: true,
  });

  const chartData = useMemo(
    () => (Array.isArray(totals) ? totals : []).map(t => ({ date: t._id?.date || t._id, total: t.total })),
    [totals]
  );

  // ====== PDF: Vencidos ======
  const handleExportOverduePdf = async () => {
    try {
      const res = await getOverdue({ to });
      const rows = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (!Array.isArray(rows)) return alert('La API de vencidos no devolvió array');

      const total = rows.reduce((acc, r) => acc + (r.amount || 0), 0);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'A4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 40;
      const tableMaxW = pageWidth - marginX * 2;

      const cw = { date: 60, account: 70, prov: 100, cat: 70, concept: 100, status: 60, amount: 70 };

      doc.setFontSize(16);
      doc.text('Plazos vencidos', marginX, 40);
      doc.setFontSize(10);
      doc.text(`Hasta: ${to}`, marginX, 58);
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, marginX, 72);

      const body = rows.map(r => ([
        (r.date ? new Date(r.date).toISOString().slice(0,10) : ''),
        (r.account?.alias || '—'),
        (r.counterparty?.name || '—'),
        (r.category?.name || '—'),
        (r.concept || '—'),
        (r.status === 'pending' ? 'Pendiente' : r.status === 'paid' ? 'Pagado' :
         r.status === 'cancelled' ? 'Cancelado' : r.status || '—'),
        (r.amount || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
      ]));

      autoTable(doc, {
        startY: 90,
        head: [['Fecha','Cuenta','Proveedor','Categoría','Concepto','Estado','Importe']],
        body,
        tableWidth: tableMaxW,
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak', halign: 'left', valign: 'middle' },
        headStyles: { fillColor: [33, 37, 41] },
        columnStyles: {
          0: { cellWidth: cw.date },
          1: { cellWidth: cw.account },
          2: { cellWidth: cw.prov, overflow: 'linebreak' },
          3: { cellWidth: cw.cat },
          4: { cellWidth: cw.concept, overflow: 'linebreak' },
          5: { cellWidth: cw.status },
          6: { cellWidth: cw.amount, halign: 'right' },
        },
        didParseCell: (data) => {
          if (data.section === 'body') data.cell.styles.fontSize = 8.5;
        },
      });

      const y = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.text(`TOTAL: ${total.toLocaleString('es-ES',{ style:'currency', currency:'EUR' })}`, marginX, y);

      doc.save(`vencidos_${to}.pdf`);
    } catch {
      alert('No se pudo generar el PDF de vencidos');
    }
  };

  // ====== PDF: Pendientes por cuenta y mes ======
  const handleExportPendingPerAccountMonthPdf = async () => {
    try {
      const res = await getPendingPerAccountMonth({ from, to });
      const rows = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      const data = Array.isArray(rows) ? rows : (Array.isArray(rows?.data) ? rows.data : []);
      if (!Array.isArray(data)) return alert('La API no devolvió array');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'A4' });
      doc.setFontSize(16);
      doc.text('Pendientes por cuenta y mes', 40, 40);
      doc.setFontSize(10);
      doc.text(`Desde: ${from}  Hasta: ${to}`, 40, 58);
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 40, 72);

      const body = rows.map(r => {
        const mm = String(r.m).padStart(2,'0');
        const ym = `${mm}/${r.y}`;
        return [ r.accountAlias || '—', ym, (r.total || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) ];
      });

      autoTable(doc, {
        startY: 90,
        head: [['Cuenta','Mes/Año','Pendiente (€)']],
        body,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [33, 37, 41] },
        columnStyles: {
          0: { cellWidth: 200 },
          1: { cellWidth: 100, halign: 'center' },
          2: { cellWidth: 120, halign: 'right' },
        },
      });

      doc.save(`pendientes_cuenta_mes_${from}_${to}.pdf`);
    } catch {
      alert('No se pudo generar el PDF de pendientes por cuenta/mes');
    }
  };

  return (
    <Box bg={pageBg} minH="calc(100vh - 120px)" p={6}>
      <Box bg={cardBg} border="1px solid" borderColor={border} rounded="lg" p={6} mb={6}>
        <Heading size="md" mb={2}>Totales</Heading>
        <Text fontSize="sm" color={subtle} mb={4}>
          Filtra por fechas, cuenta, estado y tipo para visualizar y exportar.
        </Text>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={3} mb={3}>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          <Select value={granularity} onChange={e => setGranularity(e.target.value)}>
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </Select>
          <Select value={account} onChange={e => setAccount(e.target.value)} isDisabled={loadingAccounts}>
            <option value="">Todas</option>
            {accounts.map(a => (
              <option key={a._id} value={a._id}>{a.alias}</option>
            ))}
          </Select>
          <Select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="cancelled">Cancelado</option>
          </Select>
          <Select value={flowType} onChange={e => setFlowType(e.target.value)}>
            <option value="out">Pagos (out)</option>
            <option value="in">Cobros (in)</option>
            <option value="">Todos</option>
          </Select>
        </Stack>

        <HStack spacing={3}>
          <Button bg={btnBg} color={btnColor} _hover={{ bg: btnHover }} onClick={handleExportOverduePdf}>
            PDF vencidos
          </Button>
          <Button bg={btnBg} color={btnColor} _hover={{ bg: btnHover }} onClick={handleExportPendingPerAccountMonthPdf}>
            PDF pendientes (cuenta/mes)
          </Button>
        </HStack>
      </Box>

      <Box bg={cardBg} border="1px solid" borderColor={border} rounded="lg" p={4} mb={6} height="360px">
        {isLoading ? (
          <HStack h="100%" justify="center"><Spinner /></HStack>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="total" type="monotone" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>

      <Box bg={cardBg} border="1px solid" borderColor={border} rounded="lg" p={6}>
        <Heading size="sm" mb={3}>Detalle</Heading>
        <Divider mb={3} />
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Fecha</Th>
              <Th isNumeric>Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {(chartData || []).map((r, i) => (
              <Tr key={i}>
                <Td>{r.date}</Td>
                <Td isNumeric>
                  {(r.total || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}
*/

// src/ui/pages/TotalsPage.jsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { getTotals, getOverdue, getPendingPerAccountMonth } from '@/api/reportsService.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Box,
  Heading,
  Text,
  Stack,
  HStack,
  Button,
  Select,
  Input,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
  Spinner,
} from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function TotalsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [granularity, setGranularity] = useState('day');
  const [account, setAccount] = useState('');
  const [status, setStatus] = useState('');
  const [flowType, setFlowType] = useState('out');

  // Tokens de tema
  const pageBg   = useColorModeValue('neutral.50', 'neutral.900');
  const cardBg   = useColorModeValue('white', 'neutral.800');
  const border   = useColorModeValue('neutral.200', 'neutral.700');
  const subtle   = useColorModeValue('neutral.600', 'neutral.300');
  const btnBg    = useColorModeValue('brand.500', 'accent.500');
  const btnHover = useColorModeValue('brand.600', 'accent.600');
  const btnColor = useColorModeValue('white', 'black');
  const lineIncome = useColorModeValue('#779400', '#06b6d4');

  // --- Datos auxiliares
  const { data: accountsResp, isLoading: loadingAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then(r => r.data),
    staleTime: 60_000,
  });

  const accounts = useMemo(() => Array.isArray(accountsResp) ? accountsResp : [], [accountsResp]);

  const { data: totalsResp, isLoading } = useQuery({
    queryKey: ['totals', from, to, account, granularity, status, flowType],
    queryFn: () =>
      getTotals({
        from,
        to,
        account,
        groupBy: 'date',
        granularity,
        status: status || undefined,
        type: flowType || undefined,
      }),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const totals = useMemo(() => {
    // Soporta tanto array directo como {items:[]}
    if (Array.isArray(totalsResp)) return totalsResp;
    if (Array.isArray(totalsResp?.items)) return totalsResp.items;
    return [];
  }, [totalsResp]);

  const chartData = useMemo(
    () =>
      totals.map(t => ({
        date: t._id?.date || t._id || t.date || '',
        total: Number(t.total || 0),
      })),
    [totals]
  );

  // ====== PDF: Vencidos ======
  const handleExportOverduePdf = async () => {
    try {
      const res = await getOverdue({ to });
      const rows = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (!Array.isArray(rows)) return alert('La API de vencidos no devolvió array');

      const total = rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'A4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 40;
      const tableMaxW = pageWidth - marginX * 2;

      const cw = { date: 70, account: 90, prov: 120, cat: 90, concept: 120, status: 70, amount: 80 };

      doc.setFontSize(16);
      doc.text('Plazos vencidos', marginX, 40);
      doc.setFontSize(10);
      doc.text(`Hasta: ${to}`, marginX, 58);
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, marginX, 72);

      const body = rows.map(r => ([
        (r.date ? new Date(r.date).toISOString().slice(0,10) : ''),
        (r.account?.alias || '—'),
        (r.counterparty?.name || '—'),
        (r.category?.name || '—'),
        (r.concept || '—'),
        (r.status === 'pending' ? 'Pendiente'
          : r.status === 'paid' ? 'Pagado'
          : r.status === 'cancelled' ? 'Cancelado'
          : r.status || '—'),
        (Number(r.amount) || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
      ]));

      autoTable(doc, {
        startY: 90,
        head: [['Fecha','Cuenta','Proveedor','Categoría','Concepto','Estado','Importe']],
        body,
        tableWidth: tableMaxW,
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak', halign: 'left', valign: 'middle' },
        headStyles: { fillColor: [33, 37, 41] },
        columnStyles: {
          0: { cellWidth: cw.date },
          1: { cellWidth: cw.account },
          2: { cellWidth: cw.prov, overflow: 'linebreak' },
          3: { cellWidth: cw.cat },
          4: { cellWidth: cw.concept, overflow: 'linebreak' },
          5: { cellWidth: cw.status },
          6: { cellWidth: cw.amount, halign: 'right' },
        },
        didParseCell: (data) => {
          if (data.section === 'body') data.cell.styles.fontSize = 8.5;
        },
      });

      const y = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.text(`TOTAL: ${total.toLocaleString('es-ES',{ style:'currency', currency:'EUR' })}`, marginX, y);

      doc.save(`vencidos_${to}.pdf`);
    } catch {
      alert('No se pudo generar el PDF de vencidos');
    }
  };

  // ====== PDF: Pendientes por cuenta y mes ======
  const handleExportPendingPerAccountMonthPdf = async () => {
    try {
      const res = await getPendingPerAccountMonth({ from, to });
      const rows = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (!Array.isArray(rows)) return alert('La API no devolvió array');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'A4' });
      doc.setFontSize(16);
      doc.text('Pendientes por cuenta y mes', 40, 40);
      doc.setFontSize(10);
      doc.text(`Desde: ${from}  Hasta: ${to}`, 40, 58);
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 40, 72);

      const body = rows.map(r => {
        const mm = String(r.m).padStart(2, '0');
        const ym = `${mm}/${r.y}`;
        return [
          r.accountAlias || r.account || '—',
          ym,
          (Number(r.total) || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
        ];
      });

      autoTable(doc, {
        startY: 90,
        head: [['Cuenta','Mes/Año','Pendiente (€)']],
        body,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [33, 37, 41] },
        columnStyles: {
          0: { cellWidth: 220 },
          1: { cellWidth: 110, halign: 'center' },
          2: { cellWidth: 130, halign: 'right' },
        },
        margin: { left: 40, right: 40 },
      });

      doc.save(`pendientes_cuenta_mes_${from}_${to}.pdf`);
    } catch {
      alert('No se pudo generar el PDF de pendientes por cuenta/mes');
    }
  };

  return (
    <Box bg={pageBg} minH="calc(100vh - 120px)" p={6}>
      <Box bg={cardBg} border="1px solid" borderColor={border} rounded="lg" p={6} mb={6}>
        <Heading size="md" mb={2}>Totales</Heading>
        <Text fontSize="sm" color={subtle} mb={4}>
          Filtra por fechas, cuenta, estado y tipo para visualizar y exportar.
        </Text>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={3} mb={3}>
          <Input aria-label="Desde" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <Input aria-label="Hasta" type="date" value={to} onChange={e => setTo(e.target.value)} />
          <Select aria-label="Granularidad" value={granularity} onChange={e => setGranularity(e.target.value)}>
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </Select>
          <Select
            aria-label="Cuenta"
            value={account}
            onChange={e => setAccount(e.target.value)}
            isDisabled={loadingAccounts}
          >
            <option value="">Todas</option>
            {accounts.map(a => (
              <option key={a._id || a.id} value={a._id || a.id}>
                {a.alias || a.name || 'Cuenta'}
              </option>
            ))}
          </Select>
          <Select aria-label="Estado" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="cancelled">Cancelado</option>
          </Select>
          <Select aria-label="Tipo de flujo" value={flowType} onChange={e => setFlowType(e.target.value)}>
            <option value="out">Pagos (out)</option>
            <option value="in">Cobros (in)</option>
            <option value="">Todos</option>
          </Select>
        </Stack>

        <HStack spacing={3}>
          <Button bg={btnBg} color={btnColor} _hover={{ bg: btnHover }} onClick={handleExportOverduePdf}>
            PDF vencidos
          </Button>
          <Button bg={btnBg} color={btnColor} _hover={{ bg: btnHover }} onClick={handleExportPendingPerAccountMonthPdf}>
            PDF pendientes (cuenta/mes)
          </Button>
        </HStack>
      </Box>

      <Box bg={cardBg} border="1px solid" borderColor={border} rounded="lg" p={4} mb={6} height="360px">
        {isLoading ? (
          <HStack h="100%" justify="center"><Spinner /></HStack>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="total" type="monotone" dot={false} stroke={lineIncome} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>

      <Box bg={cardBg} border="1px solid" borderColor={border} rounded="lg" p={6}>
        <Heading size="sm" mb={3}>Detalle</Heading>
        <Divider mb={3} />
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Fecha</Th>
              <Th isNumeric>Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {(chartData || []).map((r, i) => (
              <Tr key={i}>
                <Td>{r.date}</Td>
                <Td isNumeric>
                  {(r.total || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}
