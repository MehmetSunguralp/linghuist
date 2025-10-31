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
  cache: new InMemoryCache(),
});
