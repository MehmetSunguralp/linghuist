import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '@/types';
import { tokenStorage } from '@/utils/tokenStorage';

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
      const previousUserId = state.user?.id;
      const newUserId = user?.id;
      
      tokenStorage.set(token);
      state.accessToken = token;
      state.user = user || null;
      state.isAuthenticated = true;
      
      // Clear cached avatar URL if user changed (different user logged in)
      if (previousUserId !== newUserId) {
        state.signedAvatarUrl = null;
        state.signedAvatarUrlExpiry = null;
      }
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
      const previousUserId = state.user?.id;
      const previousAvatarUrl = state.user?.avatarUrl;
      const previousThumbnailUrl = state.user?.userThumbnailUrl;
      const newUserId = action.payload.id;
      const newAvatarUrl = action.payload.avatarUrl;
      const newThumbnailUrl = action.payload.userThumbnailUrl;
      
      state.user = action.payload;
      
      // Clear cached avatar URL if user changed (different user) or avatar/thumbnail URL changed
      if (
        previousUserId !== newUserId ||
        previousAvatarUrl !== newAvatarUrl ||
        previousThumbnailUrl !== newThumbnailUrl
      ) {
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

