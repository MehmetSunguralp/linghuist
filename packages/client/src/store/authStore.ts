import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../types';
import { tokenStorage } from '../utils/tokenStorage';

const initialState: AuthState = {
  accessToken: tokenStorage.get(),
  user: null,
  isAuthenticated: tokenStorage.exists(),
  signedAvatarUrl: null,
  signedAvatarUrlExpiry: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ token: string; user?: User }>) => {
      const { token, user } = action.payload;
      tokenStorage.set(token);
      state.accessToken = token;
      state.user = user || null;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      tokenStorage.remove();
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.signedAvatarUrl = null;
      state.signedAvatarUrlExpiry = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      // Clear cached avatar URL if user changed
      if (state.user?.avatarUrl !== action.payload.avatarUrl) {
        state.signedAvatarUrl = null;
        state.signedAvatarUrlExpiry = null;
      }
    },
    setSignedAvatarUrl: (state, action: PayloadAction<{ url: string; expiryTime: number }>) => {
      state.signedAvatarUrl = action.payload.url;
      state.signedAvatarUrlExpiry = action.payload.expiryTime;
    },
    clearSignedAvatarUrl: (state) => {
      state.signedAvatarUrl = null;
      state.signedAvatarUrlExpiry = null;
    },
  },
});

export const { setAuth, logout, setUser, setSignedAvatarUrl, clearSignedAvatarUrl } = authSlice.actions;
export default authSlice.reducer;

