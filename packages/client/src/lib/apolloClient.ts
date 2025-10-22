import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/graphql';

export const client = new ApolloClient({
  link: new HttpLink({
    uri: API_URL,
    credentials: 'include', // if you use cookies
  }),
  cache: new InMemoryCache(),
});
