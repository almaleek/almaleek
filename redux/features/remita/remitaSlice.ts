import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/redux/apis/common/aixosInstance";

// Async Thunks

export const fetchBanks = createAsyncThunk(
  "remita/fetchBanks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/remita/banks");
      return response.data?.data?.banks || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch banks");
    }
  }
);

export const performNameEnquiry = createAsyncThunk(
  "remita/nameEnquiry",
  async (
    payload: { destinationBankCode: string; destinationAccountNumber: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post(
        "/remita/name-enquiry",
        payload
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Name enquiry failed");
    }
  }
);

export const initiateTransfer = createAsyncThunk(
  "remita/initiateTransfer",
  async (
    payload: {
      destinationBankCode: string;
      destinationAccountNumber: string;
      destinationAccountName: string;
      amount: number;
      transactionDescription: string;
      paymentIdentifier: string;
      userId?: string;
      pinCode?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/remita/send", payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Transfer failed");
    }
  }
);


// Slice

interface RemitaState {
  banks: any[];
  banksLoading: boolean;
  banksError: any;

  enquiryResult: any;
  enquiryLoading: boolean;
  enquiryError: any;

  transferResult: any;
  transferLoading: boolean;
  transferError: any;

}

const initialState: RemitaState = {
  banks: [],
  banksLoading: false,
  banksError: null,

  enquiryResult: null,
  enquiryLoading: false,
  enquiryError: null,

  transferResult: null,
  transferLoading: false,
  transferError: null,
};

const remitaSlice = createSlice({
  name: "remita",
  initialState,
  reducers: {
    clearEnquiry: (state) => {
      state.enquiryResult = null;
      state.enquiryError = null;
    },
    clearTransfer: (state) => {
      state.transferResult = null;
      state.transferError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Banks
    builder.addCase(fetchBanks.pending, (state) => {
      state.banksLoading = true;
      state.banksError = null;
    });
    builder.addCase(fetchBanks.fulfilled, (state, action) => {
      state.banksLoading = false;
      state.banks = action.payload;
    });
    builder.addCase(fetchBanks.rejected, (state, action) => {
      state.banksLoading = false;
      state.banksError = action.payload;
    });

    // Name Enquiry
    builder.addCase(performNameEnquiry.pending, (state) => {
      state.enquiryLoading = true;
      state.enquiryError = null;
      state.enquiryResult = null;
    });
    builder.addCase(performNameEnquiry.fulfilled, (state, action) => {
      state.enquiryLoading = false;
      state.enquiryResult = action.payload.data;
    });
    builder.addCase(performNameEnquiry.rejected, (state, action) => {
      state.enquiryLoading = false;
      state.enquiryError = action.payload;
    });

    // Initiate Transfer
    builder.addCase(initiateTransfer.pending, (state) => {
      state.transferLoading = true;
      state.transferError = null;
      state.transferResult = null;
    });
    builder.addCase(initiateTransfer.fulfilled, (state, action) => {
      state.transferLoading = false;
      state.transferResult = action.payload;
    });
    builder.addCase(initiateTransfer.rejected, (state, action) => {
      state.transferLoading = false;
      state.transferError = action.payload;
    });
   
  },
});

export const { clearEnquiry, clearTransfer } = remitaSlice.actions;
export default remitaSlice.reducer;
