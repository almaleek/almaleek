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

// Electricity: Providers
export const fetchElectricityProviders = createAsyncThunk(
  "remita/fetchElectricityProviders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/remita/electricity/providers");
      const list = response.data?.data || response.data || [];
      return Array.isArray(list) ? list : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch discos");
    }
  }
);

// Electricity: Validate Meter
export const validateElectricityMeter = createAsyncThunk(
  "remita/validateElectricityMeter",
  async (
    payload: { discoCode: string; meterNumber: string; meterType: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post(
        "/remita/electricity/validate",
        payload
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Meter validation failed");
    }
  }
);

// Electricity: Vend
export const vendElectricity = createAsyncThunk(
  "remita/vendElectricity",
  async (
    payload: {
      discoCode: string;
      meterNumber: string;
      meterType: string;
      amount: number;
      phoneNumber?: string;
      paymentIdentifier: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const requestBody = {
        productCode: payload.discoCode,
        clientReference: payload.paymentIdentifier,
        amount: payload.amount,
        data: {
          accountNumber: payload.meterNumber,
          phoneNumber: payload.phoneNumber || "",
        },
      };

      const response = await axiosInstance.post(
        "/remita/electricity/vend",
        requestBody
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Electricity vend failed");
    }
  }
);

// Electricity: Query
export const queryElectricityTransaction = createAsyncThunk(
  "remita/queryElectricityTransaction",
  async (paymentIdentifier: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/remita/electricity/transaction/${paymentIdentifier}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Query failed");
    }
  }
);

// Cable TV: Providers
export const fetchCableProviders = createAsyncThunk(
  "remita/fetchCableProviders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/remita/cable/providers");
      const list = response.data?.data || response.data || [];
      return Array.isArray(list) ? list : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch cable providers");
    }
  }
);

// Cable TV: Packages
export const fetchCablePackages = createAsyncThunk(
  "remita/fetchCablePackages",
  async (providerCode: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/remita/cable/packages/${providerCode}`);
      const list = response.data?.data || response.data || [];
      return Array.isArray(list) ? list : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch cable packages");
    }
  }
);

// Cable TV: Validate Smartcard
export const validateSmartcard = createAsyncThunk(
  "remita/validateSmartcard",
  async (
    payload: { providerCode: string; smartcardNumber: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/remita/cable/validate", payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Smartcard validation failed");
    }
  }
);

// Cable TV: Subscribe
export const subscribeCable = createAsyncThunk(
  "remita/subscribeCable",
  async (
    payload: {
      providerCode: string;
      smartcardNumber: string;
      packageCode: string;
      amount: number;
      paymentIdentifier: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/remita/cable/subscribe", payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Cable subscription failed");
    }
  }
);

// Cable TV: Query
export const queryCableTransaction = createAsyncThunk(
  "remita/queryCableTransaction",
  async (paymentIdentifier: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/remita/cable/transaction/${paymentIdentifier}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Query failed");
    }
  }
);

// Exam: Products
export const fetchExamProducts = createAsyncThunk(
  "remita/fetchExamProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/remita/exam/products");
      const list = response.data?.data || response.data || [];
      return Array.isArray(list) ? list : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch exam products");
    }
  }
);

// Exam: Purchase PIN
export const purchaseExamPin = createAsyncThunk(
  "remita/purchaseExamPin",
  async (
    payload: { productCode: string; quantity: number; paymentIdentifier: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/remita/exam/purchase", payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Exam purchase failed");
    }
  }
);

// Exam: Query
export const queryExamTransaction = createAsyncThunk(
  "remita/queryExamTransaction",
  async (paymentIdentifier: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/remita/exam/transaction/${paymentIdentifier}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Query failed");
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

  electricityProviders: any[];
  electricityProvidersLoading: boolean;
  electricityProvidersError: any;

  meterValidationResult: any;
  meterValidationLoading: boolean;
  meterValidationError: any;

  vendResult: any;
  vendLoading: boolean;
  vendError: any;

  cableProviders: any[];
  cableProvidersLoading: boolean;
  cableProvidersError: any;

  cablePackages: any[];
  cablePackagesLoading: boolean;
  cablePackagesError: any;

  smartcardValidationResult: any;
  smartcardValidationLoading: boolean;
  smartcardValidationError: any;

  cableSubscribeResult: any;
  cableSubscribeLoading: boolean;
  cableSubscribeError: any;

  examProducts: any[];
  examProductsLoading: boolean;
  examProductsError: any;

  examPurchaseResult: any;
  examPurchaseLoading: boolean;
  examPurchaseError: any;
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

  electricityProviders: [],
  electricityProvidersLoading: false,
  electricityProvidersError: null,

  meterValidationResult: null,
  meterValidationLoading: false,
  meterValidationError: null,

  vendResult: null,
  vendLoading: false,
  vendError: null,

  cableProviders: [],
  cableProvidersLoading: false,
  cableProvidersError: null,

  cablePackages: [],
  cablePackagesLoading: false,
  cablePackagesError: null,

  smartcardValidationResult: null,
  smartcardValidationLoading: false,
  smartcardValidationError: null,

  cableSubscribeResult: null,
  cableSubscribeLoading: false,
  cableSubscribeError: null,

  examProducts: [],
  examProductsLoading: false,
  examProductsError: null,

  examPurchaseResult: null,
  examPurchaseLoading: false,
  examPurchaseError: null,
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
    clearMeterValidation: (state) => {
      state.meterValidationResult = null;
      state.meterValidationError = null;
    },
    clearVend: (state) => {
      state.vendResult = null;
      state.vendError = null;
    },
    clearSmartcardValidation: (state) => {
      state.smartcardValidationResult = null;
      state.smartcardValidationError = null;
    },
    clearCableSubscribe: (state) => {
      state.cableSubscribeResult = null;
      state.cableSubscribeError = null;
    },
    clearExamPurchase: (state) => {
      state.examPurchaseResult = null;
      state.examPurchaseError = null;
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

    // Electricity Providers
    builder.addCase(fetchElectricityProviders.pending, (state) => {
      state.electricityProvidersLoading = true;
      state.electricityProvidersError = null;
    });
    builder.addCase(fetchElectricityProviders.fulfilled, (state, action) => {
      state.electricityProvidersLoading = false;
      state.electricityProviders = action.payload;
    });
    builder.addCase(fetchElectricityProviders.rejected, (state, action) => {
      state.electricityProvidersLoading = false;
      state.electricityProvidersError = action.payload;
    });

    // Validate Meter
    builder.addCase(validateElectricityMeter.pending, (state) => {
      state.meterValidationLoading = true;
      state.meterValidationError = null;
      state.meterValidationResult = null;
    });
    builder.addCase(validateElectricityMeter.fulfilled, (state, action) => {
      state.meterValidationLoading = false;
      state.meterValidationResult = action.payload?.data || action.payload;
    });
    builder.addCase(validateElectricityMeter.rejected, (state, action) => {
      state.meterValidationLoading = false;
      state.meterValidationError = action.payload;
    });

    // Vend Electricity
    builder.addCase(vendElectricity.pending, (state) => {
      state.vendLoading = true;
      state.vendError = null;
      state.vendResult = null;
    });
    builder.addCase(vendElectricity.fulfilled, (state, action) => {
      state.vendLoading = false;
      state.vendResult = action.payload;
    });
    builder.addCase(vendElectricity.rejected, (state, action) => {
      state.vendLoading = false;
      state.vendError = action.payload;
    });

    // Cable Providers
    builder.addCase(fetchCableProviders.pending, (state) => {
      state.cableProvidersLoading = true;
      state.cableProvidersError = null;
    });
    builder.addCase(fetchCableProviders.fulfilled, (state, action) => {
      state.cableProvidersLoading = false;
      state.cableProviders = action.payload;
    });
    builder.addCase(fetchCableProviders.rejected, (state, action) => {
      state.cableProvidersLoading = false;
      state.cableProvidersError = action.payload;
    });

    // Cable Packages
    builder.addCase(fetchCablePackages.pending, (state) => {
      state.cablePackagesLoading = true;
      state.cablePackagesError = null;
    });
    builder.addCase(fetchCablePackages.fulfilled, (state, action) => {
      state.cablePackagesLoading = false;
      state.cablePackages = action.payload;
    });
    builder.addCase(fetchCablePackages.rejected, (state, action) => {
      state.cablePackagesLoading = false;
      state.cablePackagesError = action.payload;
    });

    // Validate Smartcard
    builder.addCase(validateSmartcard.pending, (state) => {
      state.smartcardValidationLoading = true;
      state.smartcardValidationError = null;
      state.smartcardValidationResult = null;
    });
    builder.addCase(validateSmartcard.fulfilled, (state, action) => {
      state.smartcardValidationLoading = false;
      state.smartcardValidationResult = action.payload?.data || action.payload;
    });
    builder.addCase(validateSmartcard.rejected, (state, action) => {
      state.smartcardValidationLoading = false;
      state.smartcardValidationError = action.payload;
    });

    // Subscribe Cable
    builder.addCase(subscribeCable.pending, (state) => {
      state.cableSubscribeLoading = true;
      state.cableSubscribeError = null;
      state.cableSubscribeResult = null;
    });
    builder.addCase(subscribeCable.fulfilled, (state, action) => {
      state.cableSubscribeLoading = false;
      state.cableSubscribeResult = action.payload;
    });
    builder.addCase(subscribeCable.rejected, (state, action) => {
      state.cableSubscribeLoading = false;
      state.cableSubscribeError = action.payload;
    });

    // Exam Products
    builder.addCase(fetchExamProducts.pending, (state) => {
      state.examProductsLoading = true;
      state.examProductsError = null;
    });
    builder.addCase(fetchExamProducts.fulfilled, (state, action) => {
      state.examProductsLoading = false;
      state.examProducts = action.payload;
    });
    builder.addCase(fetchExamProducts.rejected, (state, action) => {
      state.examProductsLoading = false;
      state.examProductsError = action.payload;
    });

    // Exam Purchase
    builder.addCase(purchaseExamPin.pending, (state) => {
      state.examPurchaseLoading = true;
      state.examPurchaseError = null;
      state.examPurchaseResult = null;
    });
    builder.addCase(purchaseExamPin.fulfilled, (state, action) => {
      state.examPurchaseLoading = false;
      state.examPurchaseResult = action.payload;
    });
    builder.addCase(purchaseExamPin.rejected, (state, action) => {
      state.examPurchaseLoading = false;
      state.examPurchaseError = action.payload;
    });
  },
});

export const { clearEnquiry, clearTransfer, clearMeterValidation, clearVend, clearSmartcardValidation, clearCableSubscribe, clearExamPurchase } = remitaSlice.actions;
export default remitaSlice.reducer;
