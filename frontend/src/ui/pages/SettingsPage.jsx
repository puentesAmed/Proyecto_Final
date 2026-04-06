import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Select,
  Button,
  Input,
  useColorMode,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Stack,
  Divider,
  HStack,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { clearAllCashflows } from '@/api/forecastsService.js';
import { api } from '@/lib/api.js';

export function SettingsPage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const cancelRef = useRef(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [invites, setInvites] = useState([]);
  const [lastInviteCode, setLastInviteCode] = useState('');
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'fin',
    expiresInDays: '7',
  });

  // Preferencias (placeholder para guardar en el futuro)
  const [currency, setCurrency] = useState('EUR');
  const [pendingTheme, setPendingTheme] = useState(colorMode); // 'light' | 'dark'

  // Theme tokens
  const pageBg   = useColorModeValue('neutral.50', 'neutral.900');
  const cardBg   = useColorModeValue('white', 'neutral.800');
  const border   = useColorModeValue('neutral.200', 'neutral.700');
  const subtle   = useColorModeValue('neutral.700', 'neutral.300');
  const muted    = useColorModeValue('neutral.500', 'neutral.400');
  const btnBg    = useColorModeValue('brand.500', 'accent.500');
  const btnHover = useColorModeValue('brand.600', 'accent.600');
  const btnText  = useColorModeValue('white', 'black');

  const loadInvites = async () => {
    try {
      const { data } = await api.get('/registration-invites');
      setInvites(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las invitaciones.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  // Cambiar selección de tema sin aplicar aún
  const handleThemeSelect = (e) => {
    const v = e.target.value; // 'light' | 'dark'
    setPendingTheme(v);
  };

  // Aplicar preferencias (tema + moneda)
  const handleSavePrefs = () => {
    // Aplica el tema solo si cambia
    if (pendingTheme !== colorMode) toggleColorMode();

    // Aquí podrías persistir la moneda en backend o localStorage
    // localStorage.setItem('currency', currency);

    toast({
      title: 'Preferencias guardadas',
      description: `Tema: ${pendingTheme === 'light' ? 'Claro' : 'Oscuro'} · Moneda: ${currency}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleClearAll = async () => {
    setBusy(true);
    try {
      const res = await clearAllCashflows();
      const deleted = Number(res?.deleted ?? 0);
      toast({
        title: 'Vencimientos eliminados',
        description: `Se eliminaron ${deleted} registro(s).`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'No se pudieron borrar los vencimientos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  const handleCreateInvite = async () => {
    setInviteBusy(true);
    try {
      const payload = {
        email: inviteForm.email,
        role: inviteForm.role,
        expiresInDays: Number(inviteForm.expiresInDays || 0),
      };
      const { data } = await api.post('/registration-invites', payload);
      setLastInviteCode(data.code || '');
      setInviteForm({ email: '', role: 'fin', expiresInDays: '7' });
      toast({
        title: 'Invitación creada',
        description: `Código generado para ${data.email}.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      await loadInvites();
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: e?.response?.data?.error || 'No se pudo crear la invitación.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setInviteBusy(false);
    }
  };

  const handleDeleteInvite = async (id) => {
    try {
      await api.delete(`/registration-invites/${id}`);
      toast({
        title: 'Invitación eliminada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await loadInvites();
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la invitación.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  return (
    <Box bg={pageBg} minH="calc(100vh - 120px)" p={6}>
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={border}
        rounded="lg"
        p={6}
        mb={6}
      >
        <Heading size="md" mb={1}>Configuración</Heading>
        <Text fontSize="sm" color={muted} mb={4}>
          Personaliza la aplicación a tus necesidades.
        </Text>

        <Stack spacing={6}>
          {/* Preferencias UI */}
          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={border}
            rounded="md"
            p={6}
          >
            <Heading size="sm" mb={4}>Preferencias de interfaz</Heading>

            <Text mb={2} color={subtle}>Tema de la interfaz</Text>
            <Select
              aria-label="Seleccionar tema"
              value={pendingTheme}
              onChange={handleThemeSelect}
              mb={4}
              maxW="280px"
              bg={useColorModeValue('white', 'neutral.700')}
              borderColor={border}
            >
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </Select>

            <Text mb={2} color={subtle}>Moneda base</Text>
            <Select
              aria-label="Seleccionar moneda"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              mb={6}
              maxW="280px"
              bg={useColorModeValue('white', 'neutral.700')}
              borderColor={border}
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </Select>

            <HStack>
              <Button
                bg={btnBg}
                color={btnText}
                _hover={{ bg: btnHover }}
                onClick={handleSavePrefs}
              >
                Guardar cambios
              </Button>
            </HStack>
          </Box>

          {/* Acciones */}
          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={border}
            rounded="md"
            p={6}
          >
            <Heading size="sm" mb={4}>Invitaciones de registro</Heading>
            <Text fontSize="sm" mb={4} color={muted}>
              Solo los emails autorizados con un código generado aquí podrán crear una cuenta.
            </Text>

            <Stack spacing={3} maxW="560px">
              <Input
                placeholder="Email autorizado"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                bg={useColorModeValue('white', 'neutral.700')}
                borderColor={border}
              />
              <HStack align="stretch">
                <Select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                  bg={useColorModeValue('white', 'neutral.700')}
                  borderColor={border}
                >
                  <option value="fin">Finanzas</option>
                  <option value="viewer">Solo lectura</option>
                  <option value="admin">Administrador</option>
                </Select>
                <Select
                  value={inviteForm.expiresInDays}
                  onChange={(e) => setInviteForm((f) => ({ ...f, expiresInDays: e.target.value }))}
                  bg={useColorModeValue('white', 'neutral.700')}
                  borderColor={border}
                >
                  <option value="1">Caduca en 1 día</option>
                  <option value="7">Caduca en 7 días</option>
                  <option value="30">Caduca en 30 días</option>
                  <option value="0">Sin caducidad</option>
                </Select>
              </HStack>

              <HStack>
                <Button
                  bg={btnBg}
                  color={btnText}
                  _hover={{ bg: btnHover }}
                  onClick={handleCreateInvite}
                  isLoading={inviteBusy}
                >
                  Generar código
                </Button>
              </HStack>

              {lastInviteCode && (
                <Box p={3} rounded="md" border="1px solid" borderColor={border}>
                  <Text fontSize="sm" color={muted} mb={1}>Último código generado</Text>
                  <HStack justify="space-between" wrap="wrap">
                    <Text fontWeight="bold" letterSpacing="0.08em">{lastInviteCode}</Text>
                    <Button
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(lastInviteCode);
                        toast({
                          title: 'Código copiado',
                          status: 'success',
                          duration: 2000,
                          isClosable: true,
                        });
                      }}
                    >
                      Copiar
                    </Button>
                  </HStack>
                </Box>
              )}

              <Divider />

              <VStack align="stretch" spacing={3}>
                {invites.map((invite) => (
                  <Box key={invite._id} p={3} rounded="md" border="1px solid" borderColor={border}>
                    <HStack justify="space-between" align="start">
                      <Box>
                        <Text fontWeight="semibold">{invite.email}</Text>
                        <Text fontSize="sm" color={muted}>
                          Rol: {invite.role} · {invite.usedAt ? 'Usada' : 'Pendiente'}
                        </Text>
                        <Text fontSize="sm" color={muted}>
                          {invite.expiresAt
                            ? `Caduca: ${new Date(invite.expiresAt).toLocaleString('es-ES')}`
                            : 'Sin caducidad'}
                        </Text>
                      </Box>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => handleDeleteInvite(invite._id)}
                      >
                        Eliminar
                      </Button>
                    </HStack>
                  </Box>
                ))}
                {!invites.length && (
                  <Text fontSize="sm" color={muted}>Todavía no hay invitaciones registradas.</Text>
                )}
              </VStack>
            </Stack>
          </Box>

          {/* Acciones */}
          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={border}
            rounded="md"
            p={6}
          >
            <Heading size="sm" mb={4}>Acciones</Heading>
            <Text mb={2} color={subtle}>Vencimientos</Text>
            <Text fontSize="sm" mb={4} color={muted}>
              Borra todos los vencimientos del calendario. Esta acción no se puede deshacer.
            </Text>

            <Divider mb={4} opacity={0.5} />

            <Button
              bg="red.600"
              _hover={{ bg: 'red.700' }}
              color="white"
              onClick={() => setConfirmOpen(true)}
              isLoading={busy}
            >
              Borrar TODOS los vencimientos
            </Button>
          </Box>
        </Stack>
      </Box>

      {/* Diálogo de confirmación */}
      <AlertDialog
        isOpen={confirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => !busy && setConfirmOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={cardBg} border="1px solid" borderColor={border}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar borrado masivo
            </AlertDialogHeader>

            <AlertDialogBody>
              Vas a eliminar <b>todos</b> los vencimientos. ¿Seguro que quieres continuar?
              Esta acción es irreversible.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setConfirmOpen(false)} disabled={busy} mr={3}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={handleClearAll} isLoading={busy}>
                Sí, borrar todo
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
