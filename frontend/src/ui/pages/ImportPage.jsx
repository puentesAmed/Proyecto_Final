import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ExcelJS from 'exceljs';
import { api } from '@/lib/api.js';
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  Code,
  Stack,
  useColorModeValue,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
  HStack,
  useToast,
} from '@chakra-ui/react';

const TEMPLATE_COLUMNS = [
  'accountAlias',
  'categoryName',
  'counterpartyNif',
  'date',
  'amount',
  'type',
  'concept',
  'status',
];

const TEMPLATE_EXAMPLES = [
  {
    accountAlias: 'Cuenta 001',
    categoryName: 'Servicios',
    counterpartyNif: 'B12345678',
    date: '2026-01-31',
    amount: 1250.50,
    type: 'out',
    concept: 'Factura proveedor',
    status: 'pending',
  },
  {
    accountAlias: 'Cuenta 001',
    categoryName: 'Ventas',
    counterpartyNif: 'A87654321',
    date: '2026-02-05',
    amount: 3200,
    type: 'in',
    concept: 'Cobro cliente',
    status: 'paid',
  },
];

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const downloadExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Prevision Tesoreria';
  workbook.created = new Date();

  const cashflows = workbook.addWorksheet('Cashflows', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  cashflows.columns = TEMPLATE_COLUMNS.map((key) => ({
    header: key,
    key,
    width: key === 'concept' ? 28 : 18,
  }));

  TEMPLATE_EXAMPLES.forEach((example) => cashflows.addRow(example));

  const header = cashflows.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
  header.alignment = { vertical: 'middle' };

  cashflows.getColumn('date').numFmt = 'yyyy-mm-dd';
  cashflows.getColumn('amount').numFmt = '#,##0.00';

  for (let row = 2; row <= 500; row += 1) {
    cashflows.getCell(`F${row}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"in,out"'],
      showErrorMessage: true,
      errorTitle: 'Tipo no valido',
      error: 'Usa in u out.',
    };
    cashflows.getCell(`H${row}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"pending,paid,cancelled"'],
      showErrorMessage: true,
      errorTitle: 'Estado no valido',
      error: 'Usa pending, paid o cancelled.',
    };
  }

  cashflows.autoFilter = {
    from: 'A1',
    to: 'H1',
  };

  const instructions = workbook.addWorksheet('Instrucciones');
  instructions.columns = [
    { header: 'Campo', key: 'field', width: 22 },
    { header: 'Indicacion', key: 'hint', width: 72 },
  ];
  instructions.addRows([
    { field: 'accountAlias', hint: 'Debe coincidir con el alias de una cuenta existente.' },
    { field: 'categoryName', hint: 'Debe coincidir con una categoria existente. Puede dejarse vacio si no aplica.' },
    { field: 'counterpartyNif', hint: 'NIF/CIF de la contraparte. Si no existe, se creara automaticamente.' },
    { field: 'date', hint: 'Fecha en formato yyyy-mm-dd, por ejemplo 2026-01-31.' },
    { field: 'amount', hint: 'Importe numerico. El signo se normaliza segun type.' },
    { field: 'type', hint: 'Valores permitidos: in para ingresos, out para gastos.' },
    { field: 'concept', hint: 'Descripcion del vencimiento o movimiento.' },
    { field: 'status', hint: 'Valores permitidos: pending, paid, cancelled.' },
  ]);
  instructions.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'plantilla_importacion_cashflows.xlsx',
  );
};

const downloadCsvTemplate = () => {
  const csv = [
    TEMPLATE_COLUMNS.join(','),
    ...TEMPLATE_EXAMPLES.map((example) => (
      TEMPLATE_COLUMNS
        .map((column) => `"${String(example[column] ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, 'plantilla_importacion_cashflows.csv');
};

export function ImportPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const pageBg = useColorModeValue('neutral.50', 'neutral.900');
  const cardBg = useColorModeValue('white', 'neutral.800');
  const border = useColorModeValue('neutral.200', 'neutral.700');
  const subtle = useColorModeValue('neutral.600', 'neutral.300');
  const resultBg = useColorModeValue('neutral.100', 'neutral.700');

  const onUpload = async () => {
    if (!file) return;
    setLoading(true);
    setErrMsg('');
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/cashflows/import', fd);

      setResult(data);
      await queryClient.invalidateQueries();
      window.dispatchEvent(new CustomEvent('cashflows:imported', { detail: data }));

      const inserted = Number(data?.inserted ?? data?.created ?? 0);
      toast({
        title: inserted > 0 ? 'Importación completada' : 'No se importaron registros',
        description: inserted > 0
          ? `Se importaron ${inserted} vencimiento(s).`
          : 'Revisa el resumen para ver errores u omitidos.',
        status: inserted > 0 ? 'success' : 'warning',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message;
      setErrMsg(message);
      toast({
        title: 'No se pudo importar el archivo',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const onChangeFile = (e) => {
    setFile(e.target.files?.[0] || null);
    setResult(null);
    setErrMsg('');
  };

  const onDownloadExcelTemplate = async () => {
    try {
      await downloadExcelTemplate();
    } catch (err) {
      toast({
        title: 'No se pudo generar la plantilla',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const inserted = Number(result?.inserted ?? result?.created ?? 0);
  const skipped = Number(result?.skipped ?? 0);
  const totalRows = Number(result?.totalRows ?? 0);
  const errors = Array.isArray(result?.errors) ? result.errors : [];
  const noImportedRows = result && inserted === 0;

  return (
    <Box bg={pageBg} minH="calc(100vh - 120px)" p={6}>
      <Box bg={cardBg} border="1px solid" borderColor={border} rounded="lg" p={6} maxW="880px">
        <HStack justify="space-between" align="start" mb={4} gap={4} flexWrap="wrap">
          <Box>
            <Heading size="md" mb={2}>Importar vencimientos</Heading>
            <Text fontSize="sm" color={subtle}>
              Sube la plantilla Excel o un CSV compatible con las columnas indicadas.
            </Text>
          </Box>
          <HStack spacing={2} flexWrap="wrap">
            <Button onClick={onDownloadExcelTemplate}>
              Descargar plantilla Excel
            </Button>
            <Button variant="outline" onClick={downloadCsvTemplate}>
              CSV compatible
            </Button>
          </HStack>
        </HStack>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={3} align="center" mb={3}>
          <Input type="file" accept=".csv,.xlsx,.xls" onChange={onChangeFile} />
          <Button onClick={onUpload} isLoading={loading} loadingText="Importando..." isDisabled={!file}>
            Importar
          </Button>
        </Stack>

        <Text fontSize="sm" color={subtle} mb={4}>
          Columnas: {TEMPLATE_COLUMNS.map((column) => (
            <React.Fragment key={column}>
              <Code>{column}</Code>{' '}
            </React.Fragment>
          ))}
        </Text>

        {errMsg && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            {errMsg}
          </Alert>
        )}

        {noImportedRows && (
          <Alert status="warning" mb={4} borderRadius="md">
            <AlertIcon />
            No se importó ningún vencimiento. {errors.length > 0
              ? 'Hay filas con errores de validación.'
              : skipped > 0
                ? 'Todas las filas válidas ya estaban importadas.'
                : 'El archivo no contiene filas válidas.'}
          </Alert>
        )}

        {result && (
          <Box bg={resultBg} rounded="md" p={4} border="1px solid" borderColor={border}>
            <Heading size="sm" mb={3}>Resumen de importación</Heading>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={6} mb={3}>
              <Text>Filas leídas: <b>{totalRows}</b></Text>
              <Text>Insertadas: <b>{inserted}</b></Text>
              <Text>Omitidas: <b>{skipped}</b></Text>
              <Text>Errores: <b>{errors.length}</b></Text>
            </Stack>

            {errors.length > 0 && (
              <>
                <Divider my={3} />
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Fila</Th>
                      <Th>Error</Th>
                      <Th>Mensaje</Th>
                      <Th>Valor</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {errors.map((error, idx) => (
                      <Tr key={`${error.row || 'row'}-${idx}`}>
                        <Td>{error.row ?? '-'}</Td>
                        <Td>{error.error}</Td>
                        <Td>{error.message || '-'}</Td>
                        <Td>{error.value ?? '-'}</Td>
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
