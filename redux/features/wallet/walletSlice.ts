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
  userId:string,
  email: string;
  reference: string;
  firstName: string;
  lastName: string;
  phone: string;
  bank: string;
}

interface WalletSliceState {
  accounts: VirtualAccount[];
  loading: boolean;
  error: string | null;
}


// ✅ Create virtual account thunk
export const createVirtualAccount = createAsyncThunk(
  "wallet/createVirtualAccount",
  async (data: CreateAccountPayload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/wallets/create-virtual-account", data);
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

const initialState: WalletSliceState = {
  accounts: [],
  loading: false,
  error: null,
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Create
    builder.addCase(createVirtualAccount.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createVirtualAccount.fulfilled, (state, action: PayloadAction<VirtualAccount>) => {
      state.loading = false;
      state.accounts.push(action.payload);
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
  },
});

export default walletSlice.reducer;
