import { configureStore } from '@reduxjs/toolkit';
import { userSlice } from './reducers/userSlice';
import authReducer from './reducers/authSlice';
import loadingReducer from './reducers/loadingSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      user: userSlice.reducer,
      auth: authReducer,
      loading: loadingReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
