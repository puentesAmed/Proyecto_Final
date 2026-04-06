import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  useColorModeValue,
  VStack,
  InputGroup,
  InputRightElement,
  IconButton,
  Text,
  Link,
  useToast,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

import { useAuth } from '../../state/auth.js';
import { useNotifications } from '../../state/notifications.js';
import { api } from '../../lib/api.js';

const schema = z.object({
  email: z.string().email('Formato de email no válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export function LoginPage() {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
  });
  const { errors, isSubmitting } = formState;

  const toast = useToast();
  const { login } = useAuth();
  const pushNotification = useNotifications((state) => state.push);
  const nav = useNavigate();
  const loc = useLocation();

  const [showPwd, setShowPwd] = React.useState(false);

  const cardBg = useColorModeValue('white', 'neutral.800');
  const border = useColorModeValue('neutral.200', 'neutral.700');
  const btnBg = useColorModeValue('brand.500', 'accent.500');
  const btnHover = useColorModeValue('brand.600', 'accent.600');
  const btnColor = useColorModeValue('white', 'black');

  const onSubmit = async (values) => {
    try {
      const { data } = await api.post('/auth/login', values);
      login(data.user, data.token);
      pushNotification({
        type: 'success',
        title: 'Inicio de sesión exitoso',
        message: `Accediste como ${data.user?.email}`,
      });
      toast({
        title: `Bienvenido, ${data.user?.name || 'usuario'}`,
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
      nav(loc.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      const message = err?.response?.status === 401
        ? 'Credenciales incorrectas'
        : 'No se pudo iniciar sesión';

      toast({
        title: 'Error de acceso',
        description: message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      maxW="420px"
      mx="auto"
      mt={12}
      p={6}
      bg={cardBg}
      border="1px solid"
      borderColor={border}
      rounded="lg"
      boxShadow={useColorModeValue('sm', 'none')}
    >
      <Heading as="h2" size="lg" mb={6} textAlign="center">
        Iniciar sesión
      </Heading>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              placeholder="tucorreo@dominio.com"
              autoComplete="email"
              autoFocus
              {...register('email')}
            />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Contraseña</FormLabel>
            <InputGroup>
              <Input
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              <InputRightElement width="3rem">
                <IconButton
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  size="sm"
                  variant="ghost"
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPwd((s) => !s)}
                  icon={showPwd ? <ViewOffIcon /> : <ViewIcon />}
                />
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
          </FormControl>

          <Button
            type="submit"
            bg={btnBg}
            color={btnColor}
            _hover={{ bg: btnHover }}
            isLoading={isSubmitting}
            loadingText="Accediendo"
            width="full"
          >
            Entrar
          </Button>

          <Text textAlign="center" fontSize="sm">
            ¿No tienes cuenta?{' '}
            <Link as={RouterLink} to="/register" color="brand.500" fontWeight="semibold">
              Crear cuenta
            </Link>
          </Text>
        </VStack>
      </form>
    </Box>
  );
}
