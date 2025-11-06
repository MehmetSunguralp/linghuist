import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from '@apollo/client';

// Dynamically determine the API URL based on current hostname
const getApiUrl = () => {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // If running in browser, use current hostname (works for both localhost and network IP)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = process.env.NEXT_PUBLIC_SERVER_PORT || '3000';
    return `http://${hostname}:${port}/graphql`;
  }

  // Fallback for SSR
  return 'http://localhost:3000/graphql';
};

const API_URL = getApiUrl();

// Middleware to add auth token to requests
const authLink = new ApolloLink((operation, forward) => {
  // Get token from sessionStorage
  const token =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('access_token')
      : null;

  // Add authorization header if token exists
  if (token) {
    operation.setContext({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
  }

  return forward(operation);
});

const httpLink = new HttpLink({
  uri: API_URL,
  credentials: 'include',
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Cache users list
          users: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          // Cache friends list
          friends: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          // Cache user by ID
          user: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          // Cache current user
          me: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      User: {
        keyFields: ['id'],
        merge(existing, incoming) {
          // Properly merge user objects, ensuring language arrays are replaced (not merged)
          return {
            ...existing,
            ...incoming,
            // Explicitly replace language arrays if they exist in incoming data
            languagesKnown: incoming.languagesKnown !== undefined 
              ? incoming.languagesKnown 
              : existing?.languagesKnown,
            languagesLearn: incoming.languagesLearn !== undefined 
              ? incoming.languagesLearn 
              : existing?.languagesLearn,
          };
        },
      },
    },
    // Enable result caching for better performance
    resultCaching: true,
  }),
  // Default fetch policy for all queries
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
});
