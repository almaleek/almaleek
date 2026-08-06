import axiosInstance from "@/redux/apis/common/aixosInstance";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface VirtualAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  userId: string;
}

interface CreateAccountPayload {
  userId: string,
  email: string;
  reference: string;
  firstName: string;
  lastName: string;
  phone: string;
  bank?: string;
  identityType?: string;
  identityNumber?: string;
  identityId?: string;
  bvn?: string;
  autoSweep?: boolean;
  autoSweepDetails?: any;
  callbackUrl?: string;
}

interface WalletSliceState {
  accounts: VirtualAccount[];
  loading: boolean;
  error: string | null;
  identityVerification: {
    loading: boolean;
    error: string | null;
    identityId: string | null;
    step: 'idle' | 'initiated' | 'validated';
  };
}


// ✅ Create virtual account thunk
export const createVirtualAccount = createAsyncThunk(
  "wallet/createVirtualAccount",
  async (data: CreateAccountPayload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/wallets/create-virtual-account",
        data,
        {
          headers: {
            "x-idempotency-key": `wallet-create-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          },
        }
      );
      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Failed to create virtual account");
      }
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create virtual account"
      );
    }
  }
);

// ✅ Get virtual account(s) thunk
export const getVirtualAccounts = createAsyncThunk(
  "wallet/getVirtualAccounts",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/wallets/virtual-account/${userId}`);
      return response.data.accounts;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch virtual accounts"
      );
    }
  }
);

// ✅ Initiate identity verification thunk
export const initiateIdentityVerification = createAsyncThunk(
  "wallet/initiateIdentityVerification",
  async (data: { identityType: string; identityNumber: string; debitAccountNumber?: string; async?: boolean }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/wallets/initiate-identity-verification", data);
      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Failed to initiate verification");
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to initiate verification");
    }
  }
);

// ✅ Validate identity verification thunk
export const validateIdentityVerification = createAsyncThunk(
  "wallet/validateIdentityVerification",
  async (data: { identityId: string; otp: string; identityType: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/wallets/validate-identity-verification", data);
      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Failed to validate verification");
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to validate verification");
    }
  }
);

const initialState: WalletSliceState = {
  accounts: [],
  loading: false,
  error: null,
  identityVerification: {
    loading: false,
    error: null,
    identityId: null,
    step: 'idle',
  },
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    resetIdentityVerification: (state) => {
      state.identityVerification = {
        loading: false,
        error: null,
        identityId: null,
        step: 'idle',
      };
    },
  },
  extraReducers: (builder) => {
    // Create
    builder.addCase(createVirtualAccount.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createVirtualAccount.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      if (action.payload?.account) {
        state.accounts.push(action.payload.account);
      }
    });
    builder.addCase(createVirtualAccount.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get
    builder.addCase(getVirtualAccounts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getVirtualAccounts.fulfilled, (state, action: PayloadAction<VirtualAccount[]>) => {
      state.loading = false;
      state.accounts = action.payload;
    });
    builder.addCase(getVirtualAccounts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Initiate identity verification
    builder.addCase(initiateIdentityVerification.pending, (state) => {
      state.identityVerification.loading = true;
      state.identityVerification.error = null;
    });
    builder.addCase(initiateIdentityVerification.fulfilled, (state, action: PayloadAction<any>) => {
      state.identityVerification.loading = false;
      state.identityVerification.identityId = action.payload?.data?.data._id || action.payload?.data?.identityId;
      state.identityVerification.step = 'initiated';
    });
    builder.addCase(initiateIdentityVerification.rejected, (state, action) => {
      state.identityVerification.loading = false;
      state.identityVerification.error = action.payload as string;
    });

    // Validate identity verification
    builder.addCase(validateIdentityVerification.pending, (state) => {
      state.identityVerification.loading = true;
      state.identityVerification.error = null;
    });
    builder.addCase(validateIdentityVerification.fulfilled, (state) => {
      state.identityVerification.loading = false;
      state.identityVerification.step = 'validated';
    });
    builder.addCase(validateIdentityVerification.rejected, (state, action) => {
      state.identityVerification.loading = false;
      state.identityVerification.error = action.payload as string;
    });
  },
});

export default walletSlice.reducer;
