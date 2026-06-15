import React from 'react';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { api } from '@/lib/api.js';
import { useAuth } from '@/state/auth.js';

export function ProfilePage() {
  const toast = useToast();
  const { user, updateSession } = useAuth();
  const [name, setName] = React.useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [savingName, setSavingName] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);

  const pageBg = useColorModeValue('neutral.50', 'neutral.900');
  const cardBg = useColorModeValue('white', 'neutral.800');
  const border = useColorModeValue('neutral.200', 'neutral.700');
  const subtle = useColorModeValue('neutral.600', 'neutral.300');

  React.useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  const saveName = async () => {
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      toast({
        title: 'Nombre demasiado corto',
        description: 'Escribe al menos 2 caracteres.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSavingName(true);
    try {
      const { data } = await api.patch('/auth/me', { name: cleanName });
      updateSession(data.user, data.token);
      toast({
        title: 'Perfil actualizado',
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'No se pudo actualizar el perfil',
        description: error?.response?.data?.error || 'Revisa los datos e inténtalo de nuevo.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || newPassword.length < 6) {
      toast({
        title: 'Contraseña no válida',
        description: 'Indica la contraseña actual y una nueva de al menos 6 caracteres.',
        status: 'warning',
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    setSavingPassword(true);
    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast({
        title: 'Contraseña actualizada',
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'No se pudo cambiar la contraseña',
        description: error?.response?.data?.error || 'Revisa la contraseña actual.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Box bg={pageBg} minH="calc(100vh - 120px)" p={6}>
      <Box bg={cardBg} border="1px solid" borderColor={border} rounded="lg" p={6} maxW="720px">
        <Heading size="md" mb={2}>Mi cuenta</Heading>
        <Text color={subtle} fontSize="sm" mb={6}>
          Gestiona tus datos personales de acceso. El rol lo asigna la administración.
        </Text>

        <Stack spacing={4}>
          <FormControl>
            <FormLabel>Nombre</FormLabel>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </FormControl>

          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input value={user?.email || ''} isReadOnly />
          </FormControl>

          <FormControl>
            <FormLabel>Rol</FormLabel>
            <Input value={user?.role || ''} isReadOnly />
          </FormControl>

          <Button alignSelf="flex-start" onClick={saveName} isLoading={savingName}>
            Guardar perfil
          </Button>
        </Stack>

        <Divider my={6} />

        <Heading size="sm" mb={4}>Cambiar contraseña</Heading>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>Contraseña actual</FormLabel>
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Nueva contraseña</FormLabel>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
          </FormControl>
          <Button alignSelf="flex-start" onClick={savePassword} isLoading={savingPassword}>
            Actualizar contraseña
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
