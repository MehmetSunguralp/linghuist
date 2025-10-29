import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { client } from '@/lib/apolloClient';
import { SIGNUP_MUTATION } from '@/lib/authQueries';
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
      });
  },
});

export const { setAuthUser, clearAuthUser } = authSlice.actions;
export default authSlice.reducer;
