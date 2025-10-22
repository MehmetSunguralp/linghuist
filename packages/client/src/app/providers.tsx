'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ColorModeProvider } from '@/components/ui/color-mode';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store/store';
import { Header } from '@/components/Header';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <ColorModeProvider>
        <ChakraProvider value={defaultSystem}>
          <Header />
          {children}
        </ChakraProvider>
      </ColorModeProvider>
    </ReduxProvider>
  );
}
