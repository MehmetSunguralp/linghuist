import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { gql } from '@apollo/client/core';
import { client } from '@/lib/apolloClient';

interface SignupInput {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = { user: null, loading: false, error: null };

export const signupUser = createAsyncThunk<User, SignupInput>(
  'auth/signup',
  async ({ email, password }) => {
    const SIGNUP_MUTATION = gql`
      mutation Signup($email: String!, $password: String!) {
        signup(email: $email, password: $password) {
          id
          email
        }
      }
    `;

    const { data } = await client.mutate<{ signup: User }>({
      mutation: SIGNUP_MUTATION,
      variables: { email, password },
    });
    return data!.signup;
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Signup failed';
      });
  },
});

export default authSlice.reducer;
