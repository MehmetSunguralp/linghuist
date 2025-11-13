import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  avatarUrl?: string | null;
  username?: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('access_token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ token: string; user?: User }>) => {
      const { token, user } = action.payload;
      localStorage.setItem('access_token', token);
      state.accessToken = token;
      state.user = user || null;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      localStorage.removeItem('access_token');
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
});

export const { setAuth, logout, setUser } = authSlice.actions;
export default authSlice.reducer;

