import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { currentUser, loginUser, signUpUser, getReferralStats, withdrawBonus, updateTransactionMessagePreference } from "./userThunk";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { User } from "./type";

interface ReferralStats {
  totalEarnings: number;
  totalReferrals: number;
  referrals: any[];
  agentTotalTransactionValue?: number;
  totalReferralTransactionCount?: number;
  claimBonusCount?: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  referralStats: ReferralStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  referralStats: null,
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
        if (action.payload.accessToken && action.payload.refreshToken) {
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          AsyncStorage.setItem("accessToken", action.payload.accessToken);
          AsyncStorage.setItem("refreshToken", action.payload.refreshToken);
        }
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
      })

      // REFERRAL STATS
      .addCase(getReferralStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReferralStats.fulfilled, (state, action: PayloadAction<any>) => {
        state.referralStats = action.payload;
        state.loading = false;
      })
      .addCase(getReferralStats.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })

      // WITHDRAW BONUS
      .addCase(withdrawBonus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(withdrawBonus.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        if (state.user) {
          // Update user balance and bonus from response data
          if (action.payload.data) {
            state.user.balance = action.payload.data.balance;
            state.user.bonus = action.payload.data.bonus;
          }
        }
        // Also update referralStats earnings if needed, though usually bonus field in user object is what matters for display
        if (state.referralStats && action.payload.data) {
           state.referralStats.totalEarnings = action.payload.data.bonus;
        }
      })
      .addCase(withdrawBonus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateTransactionMessagePreference.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransactionMessagePreference.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        if (state.user) {
          state.user.transactionMessageEnabled = Boolean(
            action.payload?.transactionMessageEnabled
          );
        }
      })
      .addCase(updateTransactionMessagePreference.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, setTokens, setUser } = authSlice.actions;
export default authSlice.reducer;
