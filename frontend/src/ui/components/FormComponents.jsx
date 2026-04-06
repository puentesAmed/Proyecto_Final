import React from 'react';
import {
  Box,
  Input,
  FormLabel,
  Button,
  useColorModeValue,
  Textarea,
  Select,
} from '@chakra-ui/react';

// Card
export const Card = ({ children }) => {
  const bgCard = useColorModeValue('neutral.100', 'neutral.800');
  const colorCard = useColorModeValue('neutral.800', 'neutral.100');

  return (
    <Box
      bg={bgCard}
      color={colorCard}
      borderRadius="14px"
      p={6}
      shadow="sm"
    >
      {children}
    </Box>
  );
};

// Form Input
export const FormInput = ({ label, placeholder, ...props }) => {
  const labelColor = useColorModeValue('gray.800', 'gray.200');
  const inputBg = useColorModeValue('neutral.50', 'neutral.700');
  const inputColor = useColorModeValue('neutral.800', 'neutral.100');
  const borderColor = useColorModeValue('neutral.200', 'neutral.600');
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');

  return (
    <Box>
      {label && <FormLabel color={labelColor}>{label}</FormLabel>}
      <Input
        bg={inputBg}
        color={inputColor}
        borderColor={borderColor}
        placeholder={placeholder}
        _placeholder={{ color: placeholderColor }}
        borderRadius="10px"
        {...props}
      />
    </Box>
  );
};

// Form Textarea
export const FormTextarea = ({ label, placeholder, ...props }) => {
  const labelColor = useColorModeValue('gray.800', 'gray.200');
  const bg = useColorModeValue('neutral.50', 'neutral.700');
  const color = useColorModeValue('neutral.800', 'neutral.100');
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');

  return (
    <Box>
      {label && <FormLabel color={labelColor}>{label}</FormLabel>}
      <Textarea
        bg={bg}
        color={color}
        placeholder={placeholder}
        _placeholder={{ color: placeholderColor }}
        borderRadius="10px"
        {...props}
      />
    </Box>
  );
};

// Form Select
export const FormSelect = ({ label, placeholder, ...props }) => {
  const labelColor = useColorModeValue('gray.800', 'gray.200');
  const bg = useColorModeValue('neutral.50', 'neutral.700');
  const color = useColorModeValue('neutral.800', 'neutral.100');

  return (
    <Box>
      {label && <FormLabel color={labelColor}>{label}</FormLabel>}
      <Select
        bg={bg}
        color={color}
        placeholder={placeholder}
        borderRadius="10px"
        {...props}
      />
    </Box>
  );
};

// Form Button
export const FormButton = ({ children, ...props }) => {
  const bg = useColorModeValue('brand.500', 'accent.500');
  const color = useColorModeValue('white', 'black');
  const hoverBg = useColorModeValue('brand.600', 'accent.600');

  return (
    <Button
      bg={bg}
      color={color}
      _hover={{ bg: hoverBg }}
      {...props}
    >
      {children}
    </Button>
  );
};
