import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LoadingState {
  isNavigating: boolean;
}

const initialState: LoadingState = {
  isNavigating: false,
};

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    setNavigating: (state, action: PayloadAction<boolean>) => {
      state.isNavigating = action.payload;
    },
    startNavigation: (state) => {
      state.isNavigating = true;
    },
    stopNavigation: (state) => {
      state.isNavigating = false;
    },
  },
});

export const { setNavigating, startNavigation, stopNavigation } =
  loadingSlice.actions;
export default loadingSlice.reducer;
