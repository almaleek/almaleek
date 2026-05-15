import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/redux/apis/common/aixosInstance";

interface GlobalSettings {
  mobileAppVersion: string;
  androidVersion: string;
  iosVersion: string;
  forceUpdate: boolean;
  androidAppUrl: string;
  iosAppUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

interface SettingState {
  settings: GlobalSettings | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingState = {
  settings: null,
  loading: false,
  error: null,
};

export const fetchGlobalSettings = createAsyncThunk(
  "setting/fetchGlobalSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/auth/settings");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch settings");
    }
  }
);

const settingSlice = createSlice({
  name: "setting",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlobalSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGlobalSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchGlobalSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default settingSlice.reducer;
