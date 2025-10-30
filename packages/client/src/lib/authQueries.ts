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
      bio
      avatarUrl
      country
      age
      role
      isVerified
      languagesKnown {
        name
        level
        code
      }
      languagesLearn {
        name
        level
        code
      }
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($data: UpdateUserInput!) {
    updateMe(data: $data) {
      id
      email
      name
      username
      bio
      avatarUrl
      country
      age
      languagesKnown {
        name
        level
        code
      }
      languagesLearn {
        name
        level
        code
      }
    }
  }
`;

export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($userId: String!) {
    verifyEmail(userId: $userId)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($email: String!) {
    resetPassword(email: $email)
  }
`;

export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($password: String!) {
    deleteAccount(password: $password)
  }
`;

export const RESEND_VERIFICATION = gql`
  mutation ResendVerification($email: String!) {
    resendVerification(email: $email)
  }
`;
