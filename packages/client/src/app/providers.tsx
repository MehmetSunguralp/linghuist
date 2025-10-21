'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store/store';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
    </ReduxProvider>
  );
}
