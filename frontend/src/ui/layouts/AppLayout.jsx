import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Link as ChakraLink,
  useColorMode,
  useDisclosure,
  useColorModeValue,
  Text,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  VStack,
  Spacer,
  Divider,
  Avatar,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useToast,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, SunIcon, MoonIcon, BellIcon } from '@chakra-ui/icons';
import { useAuth } from '@/state/auth.js';
import { useNotifications } from '@/state/notifications.js';

const PAGES = Object.freeze([
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Calendario', path: '/calendar' },
  { name: 'Totales', path: '/totals' },
  { name: 'Cuentas', path: '/accounts' },
  { name: 'Importar', path: '/import' },
  { name: 'Ajustes', path: '/settings' },
]);

function NavItem({ to, children, onClick }) {
  const activeBg = useColorModeValue('brand.100', 'neutral.700');
  const activeCol = useColorModeValue('brand.700', 'neutral.100');
  const hoverBg = useColorModeValue('neutral.100', 'neutral.700');
  const linkCol = useColorModeValue('neutral.800', 'neutral.100');

  return (
    <ChakraLink
      as={NavLink}
      to={to}
      onClick={onClick}
      px={3}
      py={2}
      borderRadius="lg"
      color={linkCol}
      _hover={{ textDecoration: 'none', bg: hoverBg }}
      style={({ isActive }) => ({
        background: isActive ? activeBg : 'transparent',
        color: isActive ? activeCol : undefined,
        fontWeight: isActive ? 700 : 500,
      })}
      aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
    >
      {children}
    </ChakraLink>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const { items, markAllAsRead, clearAll, push } = useNotifications();
  const unreadCount = items.filter((item) => !item.read).length;

  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [scrolled, setScrolled] = React.useState(false);

  const headerBg = useColorModeValue('rgba(255,255,255,0.9)', 'rgba(17,17,17,0.7)');
  const border = useColorModeValue('neutral.200', 'neutral.700');
  const brandDot = useColorModeValue('brand.500', 'accent.500');
  const contentBg = useColorModeValue('neutral.50', 'neutral.900');
  const contentColor = useColorModeValue('neutral.800', 'neutral.100');
  const footerBg = useColorModeValue('brand.100', 'neutral.800');
  const footerColor = useColorModeValue('neutral.900', 'neutral.100');
  const hoverLogoutBg = useColorModeValue('neutral.100', 'neutral.700');

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    if (isOpen) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname]);

  const handleLogout = () => {
    push({ type: 'info', title: 'Sesión cerrada', message: 'Has salido correctamente de la aplicación' });
    logout();
    toast({
      title: 'Sesión cerrada',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    nav('/login', { replace: true });
  };

  return (
    <Flex direction="column" minH="100vh" bg={contentBg} color={contentColor}>
      <Box
        as="header"
        position="sticky"
        top="0"
        zIndex="sticky"
        bg={headerBg}
        backdropFilter="saturate(180%) blur(8px)"
        borderBottom="1px solid"
        borderColor={border}
        boxShadow={scrolled ? 'sm' : 'none'}
      >
        <Flex align="center" px={{ base: 4, md: 6 }} py={2} gap={3}>
          <IconButton
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
            icon={isOpen ? <CloseIcon boxSize={3} /> : <HamburgerIcon boxSize={5} />}
            display={{ base: 'inline-flex', md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
            variant="ghost"
          />

          <HStack spacing={3}>
            <Box w="9" h="9" borderRadius="xl" bg={brandDot} boxShadow="md" aria-hidden />
            <Box lineHeight="short">
              <Text fontWeight="bold">Previsión de Tesorería</Text>
            </Box>
          </HStack>

          <HStack spacing={1} ml={6} display={{ base: 'none', md: 'flex' }}>
            {PAGES.map((p) => (
              <NavItem key={p.path} to={p.path}>
                {p.name}
              </NavItem>
            ))}
          </HStack>

          <Spacer />

          <HStack spacing={2}>
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Notificaciones"
                icon={<BellIcon />}
                variant="ghost"
                size="sm"
                position="relative"
                onClick={markAllAsRead}
              />
              {unreadCount > 0 && (
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  px={2}
                  position="absolute"
                  transform="translate(10px, -8px)"
                  pointerEvents="none"
                >
                  {unreadCount}
                </Badge>
              )}
              <MenuList maxW="380px">
                <Text px={3} py={2} fontSize="sm" fontWeight="bold">
                  Notificaciones recientes
                </Text>
                <MenuDivider />
                {items.length === 0 ? (
                  <MenuItem isDisabled>No hay notificaciones</MenuItem>
                ) : (
                  items.slice(0, 6).map((item) => (
                    <MenuItem key={item.id} display="block" whiteSpace="normal">
                      <Text fontWeight="semibold">{item.title}</Text>
                      {item.message ? <Text fontSize="sm">{item.message}</Text> : null}
                    </MenuItem>
                  ))
                )}
                <MenuDivider />
                <MenuItem onClick={clearAll}>Limpiar notificaciones</MenuItem>
              </MenuList>
            </Menu>

            <IconButton
              aria-label="Cambiar tema"
              onClick={toggleColorMode}
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              size="sm"
              variant="ghost"
            />

            <HStack
              as="button"
              type="button"
              px={2}
              py={1}
              borderRadius="lg"
              border="1px solid"
              borderColor={border}
              onClick={handleLogout}
              _hover={{ bg: hoverLogoutBg }}
            >
              <Avatar size="sm" name={user?.name || 'Usuario'} />
              <Text display={{ base: 'none', md: 'inline' }} fontSize="sm">
                Salir
              </Text>
            </HStack>
          </HStack>
        </Flex>
        {scrolled && <Divider opacity={0.25} />}
      </Box>

      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent pt="env(safe-area-inset-top)">
          <DrawerHeader borderBottomWidth="1px">Navegación</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={1}>
              {PAGES.map((p) => (
                <NavItem key={p.path} to={p.path} onClick={onClose}>
                  {p.name}
                </NavItem>
              ))}
              <Button mt={3} size="sm" onClick={toggleColorMode} variant="ghost">
                {colorMode === 'light' ? 'Oscuro' : 'Claro'}
              </Button>
              <Button mt={1} size="sm" onClick={handleLogout}>
                Salir
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box as="main" flex="1" px={{ base: 4, md: 6 }} py={6}>
        <Outlet />
      </Box>

      <Box
        as="footer"
        bg={footerBg}
        color={footerColor}
        py={4}
        textAlign="center"
        borderTop="1px solid"
        borderColor={border}
      >
        © {new Date().getFullYear()} Milugui
      </Box>
    </Flex>
  );
}
