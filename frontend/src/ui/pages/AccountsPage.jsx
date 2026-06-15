import React from 'react';
import {
  Box,
  Heading,
  Button,
  Input,
  useColorModeValue,
  Stack,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Spinner,
  Text,
  useToast,
  VisuallyHidden,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from '@/api/accountsService.js';

const toHexSafe = (c) => {
  const v = String(c || '').toUpperCase();
  return /^#[0-9A-F]{6}$/.test(v) ? v : null;
};

const normalizeAlias = (alias) => String(alias || '').trim().toLocaleLowerCase('es-ES');

export function AccountsPage() {
  const qc = useQueryClient();
  const toast = useToast();

  // tokens del tema
  const pageBg   = useColorModeValue('neutral.50','neutral.900');
  const cardBg   = useColorModeValue('white','neutral.800');
  const border   = useColorModeValue('neutral.200','neutral.700');
  const subtle   = useColorModeValue('neutral.600','neutral.300');

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { alias: '', bank: '', number: '', initialBalance: 0, color: '#2563EB' },
  });

  const createMut = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      toast({ status: 'success', title: 'Cuenta creada' });
    },
    onError: (error) => toast({
      status: 'error',
      title: 'No se pudo crear la cuenta',
      description: error?.response?.data?.message || 'Revisa los datos e inténtalo de nuevo.',
    }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => updateAccount(id, payload),
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: ['accounts'] });
      const prev = qc.getQueryData(['accounts']);
      qc.setQueryData(['accounts'], (old = []) =>
        old.map(a => (a._id === id ? { ...a, ...payload } : a))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['accounts'], ctx.prev);
      toast({
        status: 'error',
        title: 'No se pudo actualizar',
        description: _err?.response?.data?.message || 'Revisa los datos e inténtalo de nuevo.',
      });
    },
    onSuccess: () => toast({ status: 'success', title: 'Actualizado' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      toast({ status: 'success', title: 'Cuenta eliminada' });
    },
    onError: () => toast({ status: 'error', title: 'No se pudo eliminar' }),
  });

  const onSubmit = (vals) => {
    const alias = String(vals.alias || '').trim();
    if (!alias) {
      toast({
        status: 'warning',
        title: 'Alias obligatorio',
        description: 'Escribe un alias para identificar la cuenta.',
      });
      return;
    }

    const duplicate = accounts.some((account) => normalizeAlias(account.alias) === normalizeAlias(alias));
    if (duplicate) {
      toast({
        status: 'warning',
        title: 'Cuenta duplicada',
        description: 'Ya existe una cuenta con ese alias.',
      });
      return;
    }

    const color = toHexSafe(vals.color) || undefined;
    createMut.mutate(
      { ...vals, alias, color },
      {
        onSuccess: () => reset(),
      }
    );
  };

  // control de carga por fila
  const [rowBusy, setRowBusy] = React.useState({});
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const cancelDeleteRef = React.useRef(null);
  const setBusy = (id, v) => setRowBusy((m) => ({ ...m, [id]: v === true }));

  // debounce para cambios de color
  const colorTimers = React.useRef(new Map());
  const onColorChange = (a, color) => {
    const hex = toHexSafe(color);
    if (!hex) return;

    // Limpia timer anterior de la fila
    const prevT = colorTimers.current.get(a._id);
    if (prevT) clearTimeout(prevT);

    const t = setTimeout(() => {
      setBusy(a._id, true);
      updateMut.mutate(
        { id: a._id, payload: { color: hex } },
        { onSettled: () => setBusy(a._id, false) }
      );
    }, 250);

    colorTimers.current.set(a._id, t);
  };

  const updateAlias = (account, nextAlias) => {
    const alias = String(nextAlias || '').trim();
    if (!alias) {
      toast({
        status: 'warning',
        title: 'Alias obligatorio',
        description: 'Escribe un alias para identificar la cuenta.',
      });
      return;
    }

    const duplicate = accounts.some(
      (candidate) =>
        candidate._id !== account._id &&
        normalizeAlias(candidate.alias) === normalizeAlias(alias)
    );

    if (duplicate) {
      toast({
        status: 'warning',
        title: 'Cuenta duplicada',
        description: 'Ya existe una cuenta con ese alias.',
      });
      return;
    }

    updateMut.mutate({ id: account._id, payload: { alias } });
  };

  const handleDelete = (a) => {
    if (!a?._id) return;
    setDeleteTarget(a);
  };

  const confirmDelete = () => {
    if (!deleteTarget?._id) return;
    setBusy(deleteTarget._id, true);
    deleteMut.mutate(deleteTarget._id, {
      onSettled: () => {
        setBusy(deleteTarget._id, false);
        setDeleteTarget(null);
      },
    });
  };

  if (isLoading) {
    return (
      <Box bg={pageBg} minH="calc(100vh - 120px)" p={6} display="grid" placeItems="center">
        <HStack>
          <Spinner />
          <Text color={subtle}>Cargando…</Text>
        </HStack>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} minH="calc(100vh - 120px)" p={6}>
      {/* Nueva cuenta */}
      <Box bg={cardBg} border="1px solid" borderColor={border} rounded="lg" p={6} mb={6}>
        <Heading size="md" mb={4}>Nueva cuenta</Heading>
        <Box as="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
            <FormControl isRequired>
              <FormLabel>Alias</FormLabel>
              <Input placeholder="Alias" {...register('alias', { required: true })} />
            </FormControl>
            <FormControl>
              <FormLabel>Banco</FormLabel>
              <Input placeholder="Banco" {...register('bank')} />
            </FormControl>
            <FormControl>
              <FormLabel>Número</FormLabel>
              <Input placeholder="Número" {...register('number')} />
            </FormControl>
            <FormControl>
              <FormLabel>Saldo inicial</FormLabel>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register('initialBalance', { valueAsNumber: true })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Color</FormLabel>
              <HStack>
                <Input type="color" p={0} h="40px" w="44px" {...register('color')} />
                <Input
                  maxW="110px"
                  placeholder="#RRGGBB"
                  {...register('color')}
                />
              </HStack>
            </FormControl>
          </Stack>
          <Button type="submit" isLoading={createMut.isPending || isSubmitting}>
            Guardar
          </Button>
        </Box>
      </Box>

      {/* Listado */}
      <Box bg={cardBg} border="1px solid" borderColor={border} rounded="lg" p={6}>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Color</Th>
              <Th>Alias</Th>
              <Th>Banco</Th>
              <Th>Número</Th>
              <Th isNumeric>Saldo inicial</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {accounts.map((a) => {
              const busy = !!rowBusy[a._id];
              const colorValue = /^#[0-9a-fA-F]{6}$/.test(a.color || '')
                ? a.color
                : '#999999';
              return (
                <Tr key={a._id} opacity={busy ? 0.6 : 1}>
                  <Td>
                    <HStack>
                      <Box
                        title={a.color || '#999999'}
                        w="18px"
                        h="18px"
                        rounded="md"
                        border="1px solid"
                        borderColor={border}
                        bg={colorValue}
                        aria-hidden
                      />
                      <VisuallyHidden id={`color-label-${a._id}`}>Color</VisuallyHidden>
                      <Input
                        aria-labelledby={`color-label-${a._id}`}
                        type="color"
                        value={colorValue}
                        onChange={(e) => onColorChange(a, e.target.value)}
                        w="44px"
                        h="32px"
                        p={0}
                        border="none"
                        bg="transparent"
                        cursor="pointer"
                        isDisabled={busy}
                      />
                    </HStack>
                  </Td>
                  <Td>{a.alias}</Td>
                  <Td>{a.bank || '—'}</Td>
                  <Td>{a.number || '—'}</Td>
                  <Td isNumeric>
                    {(a.initialBalance || 0).toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </Td>
                  <Td>
                    <HStack justify="flex-end" spacing={2}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateAlias(a, `${a.alias}*`)}
                        isLoading={updateMut.isPending && busy}
                        isDisabled={busy}
                      >
                        Renombrar *
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(a)}
                        isLoading={deleteMut.isPending && busy}
                        isDisabled={busy}
                      >
                        Eliminar
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      <AlertDialog
        isOpen={!!deleteTarget}
        leastDestructiveRef={cancelDeleteRef}
        onClose={() => setDeleteTarget(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar cuenta
            </AlertDialogHeader>
            <AlertDialogBody>
              ¿Seguro que quieres eliminar la cuenta "{deleteTarget?.alias}"?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelDeleteRef} onClick={() => setDeleteTarget(null)}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
