import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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

import { useAuth } from '@/state/auth.js';
import { useNotifications } from '@/state/notifications.js';
import { api } from '@/lib/api.js';

const schema = z
  .object({
    name: z.string().min(2, 'Ingresa tu nombre'),
    email: z.string().email('Formato de email no válido'),
    inviteCode: z.string().min(6, 'Introduce tu código de invitación'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export function RegisterPage() {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
  });

  const toast = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();
  const pushNotification = useNotifications((state) => state.push);

  const [showPwd, setShowPwd] = React.useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = React.useState(false);

  const { errors, isSubmitting } = formState;

  const cardBg = useColorModeValue('white', 'neutral.800');
  const border = useColorModeValue('neutral.200', 'neutral.700');
  const btnBg = useColorModeValue('brand.500', 'accent.500');
  const btnHover = useColorModeValue('brand.600', 'accent.600');
  const btnColor = useColorModeValue('white', 'black');

  const onSubmit = async (formValues) => {
    const payload = { ...formValues };
    delete payload.confirmPassword;
    try {
      const { data } = await api.post('/auth/register', payload);
      login(data.user, data.token);
      pushNotification({
        type: 'success',
        title: 'Cuenta creada',
        message: `Bienvenido/a ${data.user?.name}`,
      });
      toast({
        title: 'Cuenta creada correctamente',
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = error?.response?.data?.error || 'No se pudo crear la cuenta';
      toast({
        title: 'Error en el registro',
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
        Crear cuenta
      </Heading>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={!!errors.name}>
            <FormLabel>Nombre</FormLabel>
            <Input type="text" placeholder="Tu nombre" autoComplete="name" {...register('name')} />
            <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input type="email" placeholder="tucorreo@dominio.com" autoComplete="email" {...register('email')} />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.inviteCode}>
            <FormLabel>Código de invitación</FormLabel>
            <Input
              type="text"
              placeholder="Código facilitado por el administrador"
              autoComplete="one-time-code"
              textTransform="uppercase"
              {...register('inviteCode')}
            />
            <FormErrorMessage>{errors.inviteCode?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Contraseña</FormLabel>
            <InputGroup>
              <Input
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
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

          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel>Confirmar contraseña</FormLabel>
            <InputGroup>
              <Input
                type={showConfirmPwd ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              <InputRightElement width="3rem">
                <IconButton
                  aria-label={showConfirmPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  size="sm"
                  variant="ghost"
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowConfirmPwd((s) => !s)}
                  icon={showConfirmPwd ? <ViewOffIcon /> : <ViewIcon />}
                />
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
          </FormControl>

          <Button
            type="submit"
            bg={btnBg}
            color={btnColor}
            _hover={{ bg: btnHover }}
            isLoading={isSubmitting}
            loadingText="Creando cuenta"
            width="full"
          >
            Registrarme
          </Button>

          <Text textAlign="center" fontSize="sm">
            El administrador debe autorizar tu email y facilitarte un código válido.
          </Text>

          <Text textAlign="center" fontSize="sm">
            ¿Ya tienes cuenta?{' '}
            <Link as={RouterLink} to="/login" color="brand.500" fontWeight="semibold">
              Iniciar sesión
            </Link>
          </Text>
        </VStack>
      </form>
    </Box>
  );
}
