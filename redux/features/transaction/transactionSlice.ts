import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/redux/apis/common/aixosInstance";

// ✅ Fetch all transactions
export const fetchTransactions = createAsyncThunk(
  "transactions/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/transactions");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch");
    }
  }
);

// ✅ Fetch a single transaction by request ID
export const fetchTransactionById = createAsyncThunk(
  "transactions/fetchById",
  async ({ _id }: { _id: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/transactions/${_id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Transaction not found");
    }
  }
);

// ✅ Fetch transactions for a specific user by phone number
export const fetchUserTransactions = createAsyncThunk(
  "transactions/fetchByUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        "/transactions/user_transaction"
      );
      return response.data.transactions;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch user transactions"
      );
    }
  }
);

interface Transaction {
  _id: string;
  userId: string;
  service:
    | "airtime"
    | "data"
    | "data_card"
    | "cable_tv"
    | "electricity"
    | "exam_pin"
    | "wallet";
  message?: string;
  amount?: number;
  reference_no?: string;
  status?: string;
  transaction_date?: string;
  raw_response?: string;
  client_reference?: string;

  // Airtime & Data
  network?: string;
  mobile_no?: string;
  data_type?: string;

  // Data Card
  pin?: string;

  // Cable TV
  company?: string;
  package?: string;
  iucno?: string;

  // Electricity
  meter_type?: string;
  meter_no?: string;
  token?: string;
  customer_name?: string;
  customer_address?: string;

  // Exam PINs
  waec_pin?: string;
  neco_token?: string;
  nabteb_pin?: string;
  nbais_pin?: string;

  // Wallet Transactions
  transaction_type?: string;
  previous_balance?: number;
  new_balance?: number;
  note?: string;

  [key: string]: any; // Safety for future expansion
}

interface TransactionState {
  transactions: Transaction[];
  transaction: Transaction | null;
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  transactions: [],
  transaction: null,
  loading: false,
  error: null,
};

interface TransactionState {
  transactions: Transaction[];
  transaction: Transaction | null;
  loading: boolean;
  error: string | null;
}

const transactionSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTransactionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.loading = false;
        state.transaction = action.payload;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchUserTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default transactionSlice.reducer;
