import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { currentUser, loginUser, signUpUser } from "./userThunk";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { User } from "./type";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      AsyncStorage.removeItem("accessToken");
      AsyncStorage.removeItem("refreshToken");
    },
  },
  extraReducers: (builder) => {
    builder
      // SIGN UP
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.user = action.payload.user;
        state.loading = false;
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.loading = false;
        AsyncStorage.setItem("accessToken", action.payload.accessToken);
        AsyncStorage.setItem("refreshToken", action.payload.refreshToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })

      // CURRENT USER
      .addCase(currentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(currentUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.user = action.payload.user;
        state.loading = false;
      })
      .addCase(currentUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      });
  },
});

export const { logout, setTokens, setUser } = authSlice.actions;
export default authSlice.reducer;
