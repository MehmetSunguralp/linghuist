import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { tokenStorage } from '@/utils/tokenStorage';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:3000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = tokenStorage.get();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Create client first so we can reference it in errorLink
let apolloClientInstance: ApolloClient<any> | null = null;

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      // Check for unauthorized errors
      const isUnauthorized =
        message.toLowerCase().includes('unauthorized') ||
        message.toLowerCase().includes('unauthenticated') ||
        extensions?.code === 'UNAUTHENTICATED' ||
        extensions?.code === 'UNAUTHORIZED' ||
        (extensions?.response as any)?.statusCode === 401;

      if (isUnauthorized) {
        // Clear token storage
        tokenStorage.remove();
        
        // Clear Apollo cache
        if (apolloClientInstance) {
          apolloClientInstance.clearStore();
        }
        
        // Dispatch a custom event that components can listen to
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    });
  }

  if (networkError) {
    // Check for 401 status in network errors
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      // Clear token storage
      tokenStorage.remove();
      
      // Clear Apollo cache
      if (apolloClientInstance) {
        apolloClientInstance.clearStore();
      }
      
      // Dispatch a custom event that components can listen to
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
  }
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

// Store reference for error link
apolloClientInstance = client;

export default client;

