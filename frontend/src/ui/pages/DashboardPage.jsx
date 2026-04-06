import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  SimpleGrid,
  Box,
  Text,
  useColorModeValue,
  HStack,
  Icon,
  Spinner,
  Select,
  Button,
  Flex,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { api } from '@/lib/api.js';

/* ================= Helpers ================= */
const mapFilters = (f = {}) => {
  const out = {};
  if (f.accountId) out.accountId = f.accountId;
  if (f.categoryId) out.categoryId = f.categoryId;
  if (f.month) out.month = Number(f.month);
  if (f.year) out.year = Number(f.year);
  return out;
};

const buildRange = (f = {}) => {
  const y = Number(f.year);
  const m = Number(f.month);
  if (y && m) {
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    return { start: start.toISOString(), end: end.toISOString() };
    // Usamos UTC para evitar desfases de zona horaria
  }
  if (y) {
    const start = new Date(Date.UTC(y, 0, 1));
    const end = new Date(Date.UTC(y + 1, 0, 1));
    return { start: start.toISOString(), end: end.toISOString() };
  }
  return {};
};

const monthlyFromCashflows = (rows = []) => {
  const map = new Map();
  for (const r of rows) {
    if (!r?.date) continue;
    const d = new Date(r.date);
    if (isNaN(d)) continue;
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const cur = map.get(ym) || { month: ym, ingresos: 0, gastos: 0 };
    const amt = Number(r.amount || 0);
    if (amt > 0) cur.ingresos += amt; else cur.gastos += Math.abs(amt);
    map.set(ym, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
};

const summaryFromCashflows = (rows = []) => {
  let ingresos = 0, gastos = 0;
  for (const r of rows) {
    const amt = Number(r.amount || 0);
    if (amt > 0) ingresos += amt; else gastos += Math.abs(amt);
  }
  return { ingresos, gastos };
};

const eur = (n) => Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 });

/* ================= Componente ================= */
export function DashboardPage() {
  // Theme tokens
  const cardBg = useColorModeValue('white', 'neutral.800');
  const pageBg = useColorModeValue('neutral.50', 'neutral.900');
  const border = useColorModeValue('neutral.200', 'neutral.700');
  const muted  = useColorModeValue('neutral.600', 'neutral.400');

  // Colores gráficos (respetando light/dark)
  const incomeHex = useColorModeValue('#779400', '#06b6d4');
  const expenseHex = useColorModeValue('#0e7490', '#a5f3fc');
  const barHex = useColorModeValue('#90a72e', '#22d3ee');
  const PIE_COLORS = [incomeHex, expenseHex];

  // Estado UI/Datos
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [kpi, setKpi] = useState({ ingresos: 0, gastos: 0, balance: 0 });
  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [renderKey, setRenderKey] = useState(0);

  // Filtros
  const [filters, setFilters] = useState({
    accountId: '',
    categoryId: '',
    month: '',
    year: '',
  });

  // Opciones selects
  const [accountOptions, setAccountOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const selectBg = useColorModeValue('white', 'neutral.700');

  // Mes/Año
  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => {
      const label = new Date(0, i).toLocaleString('es-ES', { month: 'long' });
      return { value: String(i + 1), label: label[0].toUpperCase() + label.slice(1) };
    }),
    []
  );

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, k) => String(y - 3 + k)).map(v => ({ value: v, label: v }));
  }, []);

  /* ===== Cargar opciones globales (cuentas/categorías) ===== */
  useEffect(() => {
    (async () => {
      try {
        const [{ data: accs }, { data: cats }] = await Promise.all([
          api.get('/accounts'),
          api.get('/categories'),
        ]);

        setAccountOptions(
          (accs || [])
            .map(a => ({
              value: String(a._id ?? a.id),
              label: a.alias || a.name || `Cuenta ${a._id || a.id}`
            }))
            .sort((a, b) => a.label.localeCompare(b.label, 'es'))
        );

        setCategoryOptions(
          (cats || [])
            .map(c => ({
              value: String(c._id ?? c.id),
              label: c.name || `Categoría ${c._id || c.id}`
            }))
            .sort((a, b) => a.label.localeCompare(b.label, 'es'))
        );
      } catch (e) {
        console.error('Error cargando cuentas o categorías:', e);
        setErrorMsg('No se pudieron cargar cuentas o categorías.');
      }
    })();
  }, []);

  /* ===== Cargar datos dashboard ===== */
  const loadData = useCallback(async (f) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const paramsBalance = mapFilters(f);
      const range = buildRange(f);
      const paramsCash = { ...mapFilters(f), ...range };

      const [accBalRes, cashRes] = await Promise.allSettled([
        api.get('/accounts/balance', { params: paramsBalance }),
        api.get('/cashflows', { params: paramsCash }),
      ]);

      // Balances por cuenta + KPI (si el backend lo trae)
      let accountsRows = [];
      let kpiRaw = { ingresos: 0, gastos: 0, balance: 0 };

      if (accBalRes.status === 'fulfilled') {
        const accBal = accBalRes.value?.data ?? {};
        kpiRaw = accBal.kpi ?? kpiRaw;
        accountsRows = Array.isArray(accBal.accounts) ? accBal.accounts : [];
      }

      // Opcionalmente filtrar por cuenta si se selecciona
      if (f.accountId) {
        accountsRows = accountsRows.filter(a => String(a.id) === String(f.accountId));
      }

      setBarData(
        accountsRows.map(a => ({
          name: a.name || a.alias || `Cuenta ${a.id}`,
          balance: Number(a.balance ?? 0)
        }))
      );

      // Cashflows
      let cashflows = [];
      if (cashRes.status === 'fulfilled') {
        const payload = cashRes.value?.data;
        cashflows = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
      }

      // Si el backend no trae KPI en /accounts/balance, calcular desde cashflows
      const monthly = monthlyFromCashflows(cashflows);
      const sum = summaryFromCashflows(cashflows);
      const k = {
        ingresos: kpiRaw.ingresos || sum.ingresos,
        gastos: kpiRaw.gastos || sum.gastos,
        balance: (kpiRaw.balance ?? (sum.ingresos - sum.gastos)),
      };

      setKpi(k);
      setLineData(monthly);
      setPieData([
        { name: 'Ingresos', value: k.ingresos },
        { name: 'Gastos', value: k.gastos }
      ]);
      setRenderKey(v => v + 1);
    } catch (e) {
      console.error('Dashboard error:', e);
      setErrorMsg('No se pudieron cargar los datos del dashboard.');
      setKpi({ ingresos: 0, gastos: 0, balance: 0 });
      setLineData([]);
      setBarData([]);
      setPieData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(filters); }, [filters, loadData]);

  /* ================= Render ================= */
  return (
    <Box bg={pageBg} p={1}>
      {/* Filtros */}
      <Box mb={4} p={4} bg={cardBg} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="sm">
        <Flex gap={4} wrap="wrap" align="center">
          {/* Cuenta */}
          <HStack spacing={2}>
            <Text minW="70px" color={muted}>Cuenta:</Text>
            <Select
              placeholder="Todas"
              value={filters.accountId}
              onChange={e => setFilters(f => ({ ...f, accountId: e.target.value }))}
              maxW="260px"
              bg={selectBg}
              borderColor={border}
            >
              {accountOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </HStack>

          {/* Categoría */}
          <HStack spacing={2}>
            <Text minW="80px" color={muted}>Categoría:</Text>
            <Select
              placeholder="Todas"
              value={filters.categoryId}
              onChange={e => setFilters(f => ({ ...f, categoryId: e.target.value }))}
              maxW="260px"
              bg={selectBg}
              borderColor={border}
            >
              {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </HStack>

          {/* Mes */}
          <HStack spacing={2}>
            <Text minW="45px" color={muted}>Mes:</Text>
            <Select
              placeholder="Todos"
              value={filters.month}
              onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
              maxW="180px"
              bg={selectBg}
              borderColor={border}
            >
              {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
          </HStack>

          {/* Año */}
          <HStack spacing={2}>
            <Text minW="45px" color={muted}>Año:</Text>
            <Select
              placeholder="Todos"
              value={filters.year}
              onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
              maxW="140px"
              bg={selectBg}
              borderColor={border}
            >
              {yearOptions.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
            </Select>
          </HStack>

          <Button
            onClick={() => setFilters({ accountId: '', categoryId: '', month: '', year: '' })}
            bg={useColorModeValue('brand.500', 'accent.500')}
            color={useColorModeValue('white', 'black')}
            _hover={{ bg: useColorModeValue('brand.600', 'accent.600') }}
          >
            Limpiar filtros
          </Button>
        </Flex>
      </Box>

      {errorMsg && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {errorMsg}
        </Alert>
      )}

      {loading ? (
        <Box py={10} display="grid" placeItems="center">
          <Spinner size="xl" />
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {/* KPI Ingresos */}
          <Box bg={cardBg} p={6} borderRadius="2xl" boxShadow="md" border="1px solid" borderColor={border}>
            <HStack spacing={4}>
              <Icon as={FiDollarSign} w={8} h={8} color={incomeHex} />
              <Box>
                <Text fontSize="sm" fontWeight="bold" color={muted}>Ingresos</Text>
                <Text fontSize="2xl" fontWeight="bold">{eur(kpi.ingresos)} €</Text>
              </Box>
            </HStack>
          </Box>

          {/* KPI Gastos */}
          <Box bg={cardBg} p={6} borderRadius="2xl" boxShadow="md" border="1px solid" borderColor={border}>
            <HStack spacing={4}>
              <Icon as={FiTrendingDown} w={8} h={8} color={expenseHex} />
              <Box>
                <Text fontSize="sm" fontWeight="bold" color={muted}>Gastos</Text>
                <Text fontSize="2xl" fontWeight="bold">{eur(kpi.gastos)} €</Text>
              </Box>
            </HStack>
          </Box>

          {/* KPI Balance */}
          <Box bg={cardBg} p={6} borderRadius="2xl" boxShadow="md" border="1px solid" borderColor={border}>
            <HStack spacing={4}>
              <Icon as={FiTrendingUp} w={8} h={8} color={useColorModeValue('blue.500','blue.300')} />
              <Box>
                <Text fontSize="sm" fontWeight="bold" color={muted}>Balance</Text>
                <Text fontSize="2xl" fontWeight="bold">{eur(kpi.balance)} €</Text>
              </Box>
            </HStack>
          </Box>

          {/* Línea: Ingresos vs Gastos */}
          <Box
            bg={cardBg}
            p={6}
            borderRadius="2xl"
            boxShadow="md"
            border="1px solid"
            borderColor={border}
            gridColumn={{ lg: '1 / span 3' }}
          >
            <Text fontSize="xl" fontWeight="bold" mb={2}>Ingresos vs Gastos</Text>
            <Text fontSize="sm" color={muted} mb={4}>Evolución mensual</Text>
            <ResponsiveContainer width="100%" height={300} key={`lc-${renderKey}`}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="ingresos" stroke={incomeHex} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gastos" stroke={expenseHex} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            {lineData.length === 0 && (
              <Text mt={3} color={muted}>Sin datos para el rango seleccionado.</Text>
            )}
          </Box>

          {/* Barras: saldos por cuenta */}
          <Box bg={cardBg} p={6} borderRadius="2xl" boxShadow="md" border="1px solid" borderColor={border}>
            <Text fontSize="xl" fontWeight="bold" mb={2}>Balances por cuenta</Text>
            <Text fontSize="sm" color={muted} mb={4}>Saldo actual por cuenta</Text>
            <ResponsiveContainer width="100%" height={250} key={`bc-${renderKey}`}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="balance" fill={barHex} />
              </BarChart>
            </ResponsiveContainer>
            {barData.length === 0 && (
              <Text mt={3} color={muted}>No hay cuentas con saldo para mostrar.</Text>
            )}
          </Box>

          {/* Pie: distribución ingresos/gastos */}
          <Box bg={cardBg} p={6} borderRadius="2xl" boxShadow="md" border="1px solid" borderColor={border}>
            <Text fontSize="xl" fontWeight="bold" mb={2}>Distribución</Text>
            <Text fontSize="sm" color={muted} mb={4}>Ingresos vs Gastos</Text>
            <ResponsiveContainer width="100%" height={250} key={`pc-${renderKey}`}>
              <RePieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </RePieChart>
            </ResponsiveContainer>
            {pieData.every(p => !p.value) && (
              <Text mt={3} color={muted}>No hay valores para la tarta.</Text>
            )}
          </Box>
        </SimpleGrid>
      )}
    </Box>
  );
}
