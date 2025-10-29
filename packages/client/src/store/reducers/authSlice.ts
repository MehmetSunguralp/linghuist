import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { client } from '@/lib/apolloClient';
import {
  SIGNUP_MUTATION,
  LOGIN_MUTATION,
  GET_CURRENT_USER,
} from '@/lib/authQueries';
import { AuthState, SignupInput } from '@/types/AuthTypes';

const initialState: AuthState = { user: null, loading: false, error: null };

export const signupUser = createAsyncThunk<{ email: string }, SignupInput>(
  'auth/signup',
  async ({ email, password }) => {
    const { data } = await client.mutate<{ signup: boolean }>({
      mutation: SIGNUP_MUTATION,
      variables: { email, password },
    });

    if (data?.signup) {
      return { email };
    }
    throw new Error('Signup failed');
  },
);

export const loginUser = createAsyncThunk<
  { id: string; email: string },
  { email: string; password: string }
>('auth/login', async ({ email, password }) => {
  const { data } = await client.mutate<{ login: string }>({
    mutation: LOGIN_MUTATION,
    variables: { email, password },
  });

  if (data?.login) {
    // Store access token in sessionStorage
    sessionStorage.setItem('access_token', data.login);

    // Fetch user data
    const userData = await client.query<{
      me: { id: string; email: string; name?: string; username?: string };
    }>({
      query: GET_CURRENT_USER,
      context: {
        headers: {
          Authorization: `Bearer ${data.login}`,
        },
      },
    });

    if (userData.data?.me) {
      return { id: userData.data.me.id, email: userData.data.me.email };
    }
  }

  throw new Error('Login failed');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser: (
      state,
      action: PayloadAction<{ id: string; email: string }>,
    ) => {
      state.user = action.payload;
    },
    clearAuthUser: (state) => {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        signupUser.fulfilled,
        (state, action: PayloadAction<{ email: string }>) => {
          state.loading = false;
          // Store minimal user info after signup - full profile can be fetched after login/verification
          state.user = { id: '', email: action.payload.email };
        },
      )
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Signup failed';
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        loginUser.fulfilled,
        (state, action: PayloadAction<{ id: string; email: string }>) => {
          state.loading = false;
          state.user = action.payload;
        },
      )
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      });
  },
});

export const { setAuthUser, clearAuthUser } = authSlice.actions;
export default authSlice.reducer;
