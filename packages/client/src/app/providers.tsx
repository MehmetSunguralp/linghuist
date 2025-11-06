'use client';
import { useRef } from 'react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Toaster } from '@/components/ui/toaster';
import { ColorModeProvider } from '@/components/ui/color-mode';
import { Provider as ReduxProvider } from 'react-redux';
import { ApolloProvider } from '@apollo/client/react';
import { client } from '@/lib/apolloClient';
import { makeStore, AppStore } from '@/store/store';
import { Header } from '@/components/Header';
import { Loading } from '@/components/Loading';
import { useAuthInit } from '@/hooks/useAuthInit';
import { NavigationListener } from '@/components/NavigationListener';

function AuthInitializer() {
  useAuthInit();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  return (
    <ReduxProvider store={storeRef.current}>
      <ApolloProvider client={client}>
        <ColorModeProvider>
          <ChakraProvider value={defaultSystem}>
            <NavigationListener />
            <AuthInitializer />
            <Header />
            {children}
            <Toaster />
            <Loading />
          </ChakraProvider>
        </ColorModeProvider>
      </ApolloProvider>
    </ReduxProvider>
  );
}
