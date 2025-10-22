import { useColorModeValue } from '@/components/ui/color-mode';

export const useColors = () => ({
  bg: useColorModeValue('gray.100', 'gray.900'),
  color: useColorModeValue('black', 'white'),
});
