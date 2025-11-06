'use client';

import { Box, Spinner } from '@chakra-ui/react';
import { useAppSelector } from '@/store/hooks';

export const Loading = () => {
  const isNavigating = useAppSelector((state) => state.loading.isNavigating);

  if (!isNavigating) {
    return null;
  }

  return (
    <Box
      position='fixed'
      top='0'
      left='0'
      right='0'
      bottom='0'
      zIndex='9999'
      display='flex'
      alignItems='center'
      justifyContent='center'
      bg='rgba(0, 0, 0, 0.3)'
      backdropFilter='blur(8px)'
      WebkitBackdropFilter='blur(8px)'
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <Spinner
        size='xl'
        thickness='4px'
        speed='0.65s'
        color='blue.500'
        emptyColor='gray.200'
        _dark={{ emptyColor: 'gray.700' }}
      />
    </Box>
  );
};

