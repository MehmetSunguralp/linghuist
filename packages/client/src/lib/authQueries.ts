import { gql } from '@apollo/client';

export const SIGNUP_MUTATION = gql`
  mutation Signup($email: String!, $password: String!) {
    signup(email: $email, password: $password)
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`;

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      id
      email
      name
      username
    }
  }
`;
