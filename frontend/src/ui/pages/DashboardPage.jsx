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
  Input,
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
const toYMD = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;

const getAccountId = (cashflow) =>
  String(cashflow?.account?._id ?? cashflow?.accountId ?? cashflow?.account ?? '');

const getAccountName = (cashflow, fallbackId = '') =>
  cashflow?.account?.alias || cashflow?.accountName || (fallbackId ? `Cuenta ${fallbackId}` : 'Sin cuenta');

const getCategoryId = (cashflow) =>
  String(cashflow?.category?._id ?? cashflow?.categoryId ?? cashflow?.category ?? '');

const getSignedAmount = (cashflow) => {
  const amount = Math.abs(Number(cashflow?.amount || 0));
  if (cashflow?.type === 'in') return amount;
  if (cashflow?.type === 'out') return -amount;
  return Number(cashflow?.amount || 0);
};

const getUiStatus = (cashflow) => {
  const status = cashflow?.status || 'pending';
  if (status !== 'pending') return status;
  if (!cashflow?.date) return 'pending';

  const date = new Date(cashflow.date);
  if (isNaN(date)) return 'pending';

  return toYMD(date) < toYMD(new Date()) ? 'overdue' : 'pending';
};

const dateFromYMD = (ymd, endOfDay = false) => {
  if (!ymd) return null;
  const [year, month, day] = ymd.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0));
};

const filterCashflows = (rows = [], filters = {}) => {
  const from = dateFromYMD(filters.dateFrom);
  const to = dateFromYMD(filters.dateTo, true);
  const month = Number(filters.month);
  const year = Number(filters.year);

  return rows.filter((cashflow) => {
    const date = cashflow?.date ? new Date(cashflow.date) : null;
    if (!date || isNaN(date)) return false;

    if (from && date < from) return false;
    if (to && date > to) return false;
    if (year && date.getUTCFullYear() !== year) return false;
    if (month && date.getUTCMonth() + 1 !== month) return false;
    if (filters.accountId && getAccountId(cashflow) !== filters.accountId) return false;
    if (filters.categoryId && getCategoryId(cashflow) !== filters.categoryId) return false;
    if (filters.status && getUiStatus(cashflow) !== filters.status) return false;

    return true;
  });
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
    if (r.type === 'in') cur.ingresos += Math.abs(amt);
    if (r.type === 'out') cur.gastos += Math.abs(amt);
    map.set(ym, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
};

const summaryFromCashflows = (rows = []) => {
  let ingresos = 0, gastos = 0;
  for (const r of rows) {
    const amt = Number(r.amount || 0);
    if (r.type === 'in') ingresos += Math.abs(amt);
    if (r.type === 'out') gastos += Math.abs(amt);
  }
  return { ingresos, gastos };
};

const balancesFromCashflows = (rows = []) => {
  const map = new Map();
  for (const cashflow of rows) {
    const accountId = getAccountId(cashflow) || 'sin-cuenta';
    const current = map.get(accountId) || {
      id: accountId,
      name: getAccountName(cashflow, accountId),
      balance: 0,
    };
    current.balance += getSignedAmount(cashflow);
    map.set(accountId, current);
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
};

const distributionFromSummary = ({ ingresos = 0, gastos = 0 }) => {
  const totalIncome = Number(ingresos || 0);
  const totalExpenses = Number(gastos || 0);
  const available = totalIncome - totalExpenses;
  const expensePercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const availablePercentage = totalIncome > 0 ? (available / totalIncome) * 100 : 0;

  return totalIncome > 0 ? [
    {
      name: 'Gastos',
      value: Math.min(Math.max(expensePercentage, 0), 100),
      amount: totalExpenses,
      percentage: expensePercentage,
    },
    {
      name: 'Disponible',
      value: Math.min(Math.max(availablePercentage, 0), 100),
      amount: available,
      percentage: availablePercentage,
    },
  ] : [];
};

const eur = (n) => Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 });
const pct = (n) => `${Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

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
  const availableHex = useColorModeValue('#65a30d', '#34d399');
  const barHex = useColorModeValue('#90a72e', '#22d3ee');
  const PIE_COLORS = [expenseHex, availableHex];

  // Estado UI/Datos
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [allCashflows, setAllCashflows] = useState([]);

  // Filtros
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    accountId: '',
    categoryId: '',
    status: '',
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

  const filteredCashflows = useMemo(
    () => filterCashflows(allCashflows, filters),
    [allCashflows, filters]
  );

  const kpi = useMemo(() => {
    const summary = summaryFromCashflows(filteredCashflows);
    return {
      ingresos: summary.ingresos,
      gastos: summary.gastos,
      balance: summary.ingresos - summary.gastos,
    };
  }, [filteredCashflows]);

  const lineData = useMemo(() => monthlyFromCashflows(filteredCashflows), [filteredCashflows]);
  const barData = useMemo(() => balancesFromCashflows(filteredCashflows), [filteredCashflows]);
  const pieData = useMemo(() => distributionFromSummary(kpi), [kpi]);
  const hasResults = filteredCashflows.length > 0;

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
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data } = await api.get('/cashflows');
      setAllCashflows(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));
    } catch (e) {
      console.error('Dashboard error:', e);
      setErrorMsg('No se pudieron cargar los datos del dashboard.');
      setAllCashflows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const refreshDashboard = () => loadData();
    window.addEventListener('cashflows:imported', refreshDashboard);
    return () => window.removeEventListener('cashflows:imported', refreshDashboard);
  }, [loadData]);

  /* ================= Render ================= */
  return (
    <Box bg={pageBg} p={1}>
      {/* Filtros */}
      <Box mb={4} p={4} bg={cardBg} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="sm">
        <Flex gap={4} wrap="wrap" align="center">
          {/* Fecha desde */}
          <HStack spacing={2}>
            <Text minW="55px" color={muted}>Desde:</Text>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              maxW="170px"
              bg={selectBg}
              borderColor={border}
            />
          </HStack>

          {/* Fecha hasta */}
          <HStack spacing={2}>
            <Text minW="55px" color={muted}>Hasta:</Text>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              maxW="170px"
              bg={selectBg}
              borderColor={border}
            />
          </HStack>

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

          {/* Estado */}
          <HStack spacing={2}>
            <Text minW="55px" color={muted}>Estado:</Text>
            <Select
              placeholder="Todos"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              maxW="190px"
              bg={selectBg}
              borderColor={border}
            >
              <option value="pending">Pendiente</option>
              <option value="overdue">Vencido</option>
              <option value="unpaid">Impagado</option>
              <option value="paid">Pagado</option>
              <option value="cancelled">Cancelado</option>
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
            onClick={() => setFilters({ dateFrom: '', dateTo: '', accountId: '', categoryId: '', status: '', month: '', year: '' })}
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

      {!loading && !errorMsg && !hasResults && (
        <Alert status="info" mb={4} borderRadius="md">
          <AlertIcon />
          No hay cashflows para los filtros seleccionados.
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
            <ResponsiveContainer width="100%" height={300}>
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
            <ResponsiveContainer width="100%" height={250}>
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

          {/* Pie: distribución financiera */}
          <Box bg={cardBg} p={6} borderRadius="2xl" boxShadow="md" border="1px solid" borderColor={border}>
            <Text fontSize="xl" fontWeight="bold" mb={2}>Distribución</Text>
            <Text fontSize="sm" color={muted} mb={4}>Gastos y disponible sobre ingresos del periodo</Text>
            {kpi.ingresos > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Tooltip
                      formatter={(_, name, entry) => [
                        `${eur(entry?.payload?.amount)} € (${pct(entry?.payload?.percentage)})`,
                        name,
                      ]}
                    />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percentage }) => `${name}: ${pct(percentage)}`}
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
                {kpi.gastos > kpi.ingresos && (
                  <Text mt={3} color={muted}>
                    Los gastos superan los ingresos del periodo; el disponible es negativo.
                  </Text>
                )}
              </>
            ) : (
              <Text mt={3} color={muted}>
                No hay ingresos en el periodo filtrado para calcular la distribución.
              </Text>
            )}
          </Box>
        </SimpleGrid>
      )}
    </Box>
  );
}
