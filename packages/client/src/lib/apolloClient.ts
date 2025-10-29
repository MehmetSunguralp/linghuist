import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from '@apollo/client';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/graphql';

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
