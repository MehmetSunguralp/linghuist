'use client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Toaster } from '@/components/ui/toaster';
import { ColorModeProvider } from '@/components/ui/color-mode';
import { Provider as ReduxProvider } from 'react-redux';
import { ApolloProvider } from '@apollo/client/react';
import { client } from '@/lib/apolloClient';
import { store } from '@/store/store';
import { Header } from '@/components/Header';
import NextTopLoader from 'nextjs-toploader';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <ApolloProvider client={client}>
        <ColorModeProvider>
          <ChakraProvider value={defaultSystem}>
            <NextTopLoader color='#ffffff' showSpinner={false} />
            <Header />
            {children}
            <Toaster />
          </ChakraProvider>
        </ColorModeProvider>
      </ApolloProvider>
    </ReduxProvider>
  );
}
