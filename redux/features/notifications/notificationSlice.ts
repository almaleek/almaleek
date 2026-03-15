import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/redux/apis/common/aixosInstance";

export const getLatestNotification = createAsyncThunk(
  "notification/latest",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/notifications/latest");

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch latest notification"
      );
    }
  }
);

export const getUserNotifications = createAsyncThunk(
  "notification/my",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/notifications/my-notifications");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch notifications"
      );
    }
  }
);

interface NotificationState {
  loading: boolean;
  notification: any;
  error: string | null;
  notifications: any[];
}

const initialState: NotificationState = {
  loading: false,
  notification: null,
  error: null,
  notifications: [],
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Latest
      .addCase(getLatestNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLatestNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.notification = action.payload;
      })
      .addCase(getLatestNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // All
      .addCase(getUserNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(getUserNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default notificationSlice.reducer;
