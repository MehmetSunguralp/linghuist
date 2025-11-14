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

export const LOGOUT_MUTATION = gql`
  mutation Logout($token: String!) {
    logout(token: $token)
  }
`;

export const RESEND_VERIFICATION_MUTATION = gql`
  mutation ResendVerification($email: String!) {
    resendVerification(email: $email)
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($email: String!) {
    resetPassword(email: $email)
  }
`;

export const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($userId: String!) {
    verifyEmail(userId: $userId)
  }
`;

export const DELETE_ACCOUNT_MUTATION = gql`
  mutation DeleteAccount($password: String!) {
    deleteAccount(password: $password)
  }
`;
