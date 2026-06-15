import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  IconButton,
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
  Portal,
  useToast,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, SunIcon, MoonIcon, BellIcon } from '@chakra-ui/icons';
import { useAuth } from '@/state/auth.js';
import { useNotifications } from '@/state/notifications.js';

const PAGES = Object.freeze([
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Calendario', path: '/calendar' },
  { name: 'Resumen financiero', path: '/totals' },
  { name: 'Cuentas', path: '/accounts', roles: ['admin'] },
  { name: 'Importar', path: '/import', roles: ['admin'] },
  { name: 'Configuración', path: '/settings', roles: ['admin'] },
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
      borderRadius="md"
      color={linkCol}
      fontSize="sm"
      whiteSpace="nowrap"
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
  const { ownerId, items, markAllAsRead, clearAll } = useNotifications();
  const visibleNotifications = items.filter((item) => item.userId === ownerId);
  const unreadCount = visibleNotifications.filter((item) => !item.read).length;

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
  const visiblePages = PAGES.filter((page) => !page.roles || page.roles.includes(user?.role));

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

  React.useEffect(() => {
    if (loc.state?.reason === 'forbidden') {
      toast({
        title: 'Acceso restringido',
        description: 'No tienes permisos para abrir esa sección.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      nav(loc.pathname, { replace: true, state: null });
    }
  }, [loc.pathname, loc.state, nav, toast]);

  const handleLogout = () => {
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
        maxW="100%"
        overflowX="hidden"
      >
        <Flex align="center" px={{ base: 3, md: 4, xl: 6 }} py={2} gap={{ base: 2, md: 3 }} minW={0}>
          <IconButton
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
            icon={isOpen ? <CloseIcon boxSize={3} /> : <HamburgerIcon boxSize={5} />}
            display={{ base: 'inline-flex', lg: 'none' }}
            onClick={isOpen ? onClose : onOpen}
            variant="ghost"
            flexShrink={0}
          />

          <HStack
            as={NavLink}
            to="/calendar"
            spacing={{ base: 2, md: 3 }}
            minW={0}
            flexShrink={1}
            cursor="pointer"
            textDecoration="none"
            _hover={{ textDecoration: 'none' }}
            aria-label="Ir al calendario"
          >
            <Box w="9" h="9" borderRadius="xl" bg={brandDot} boxShadow="md" aria-hidden flexShrink={0} />
            <Box lineHeight="short" minW={0}>
              <Text fontWeight="bold" noOfLines={1} fontSize={{ base: 'sm', md: 'md' }}>
                Previsión de Tesorería
              </Text>
            </Box>
          </HStack>

          <HStack
            spacing={{ lg: 0, xl: 1 }}
            ml={{ lg: 2, xl: 6 }}
            display={{ base: 'none', lg: 'flex' }}
            minW={0}
            overflow="hidden"
          >
            {visiblePages.map((p) => (
              <NavItem key={p.path} to={p.path}>
                {p.name}
              </NavItem>
            ))}
          </HStack>

          <Spacer />

          <HStack spacing={{ base: 1, md: 2 }} flexShrink={0}>
            <Box position="relative" flexShrink={0}>
              <Menu placement="bottom-end">
                <MenuButton
                  as={IconButton}
                  aria-label="Notificaciones"
                  icon={<BellIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                />
                <Portal>
                  <MenuList maxW="380px" zIndex={2000}>
                    <Text px={3} py={2} fontSize="sm" fontWeight="bold">
                      Notificaciones recientes
                    </Text>
                    <MenuDivider />
                    {visibleNotifications.length === 0 ? (
                      <MenuItem isDisabled>No hay notificaciones</MenuItem>
                    ) : (
                      visibleNotifications.slice(0, 6).map((item) => (
                        <MenuItem key={item.id} display="block" whiteSpace="normal">
                          <Text fontWeight="semibold">{item.title}</Text>
                          {item.message ? <Text fontSize="sm">{item.message}</Text> : null}
                        </MenuItem>
                      ))
                    )}
                    <MenuDivider />
                    <MenuItem onClick={clearAll}>Limpiar notificaciones</MenuItem>
                  </MenuList>
                </Portal>
              </Menu>
              {unreadCount > 0 && (
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  px={2}
                  position="absolute"
                  top="0"
                  right="0"
                  transform="translate(35%, -35%)"
                  pointerEvents="none"
                >
                  {unreadCount}
                </Badge>
              )}
            </Box>

            <IconButton
              aria-label="Cambiar tema"
              onClick={toggleColorMode}
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              size="sm"
              variant="ghost"
              flexShrink={0}
            />

            <Menu placement="bottom-end">
              <MenuButton
                as={IconButton}
                aria-label="Menú de usuario"
                icon={<Avatar size="sm" name={user?.name || 'Usuario'} />}
                variant="ghost"
                size="sm"
                flexShrink={0}
              />
              <Portal>
                <MenuList zIndex={2000} minW="220px" maxW="280px" overflow="visible">
                  <Box px={3} py={2}>
                    <Text fontWeight="semibold" noOfLines={1}>{user?.name || 'Usuario'}</Text>
                    <Text fontSize="sm" color="gray.500" noOfLines={1}>{user?.email}</Text>
                  </Box>
                  <MenuDivider />
                  <MenuItem onClick={() => nav('/profile')}>Mi cuenta</MenuItem>
                  <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
                </MenuList>
              </Portal>
            </Menu>
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
              {visiblePages.map((p) => (
                <NavItem key={p.path} to={p.path} onClick={onClose}>
                  {p.name}
                </NavItem>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box as="main" flex="1" px={{ base: 4, md: 6 }} py={6} minW={0} maxW="100%" overflowX="hidden">
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
