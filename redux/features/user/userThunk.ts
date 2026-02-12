import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "./type";
import axiosInstance from "@/redux/apis/common/aixosInstance";

// 🟢 SIGN UP USER
export const signUpUser = createAsyncThunk(
  "auth/signUpUser",
  async (userData: User, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/signup", userData);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Sign up failed");
    }
  }
);

// 🟢 LOGIN USER
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/auth/login", credentials);

      // ✅ Store tokens using AsyncStorage
      await AsyncStorage.setItem("accessToken", response.data.accessToken);
      await AsyncStorage.setItem("refreshToken", response.data.refreshToken);
      console.log(response.data);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);

// 🟢 VERIFY EMAIL
export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (
    data: { email: string; verificationCode: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/auth/verify", data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.msg || "Email verification failed"
      );
    }
  }
);

// 🟢 UPDATE PROFILE
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put("/auth/profile", profileData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.msg || "Profile update failed"
      );
    }
  }
);

// 🟢 GET CURRENT USER
export const currentUser = createAsyncThunk(
  "auth/currentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/auth/user");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.msg || "Failed to fetch user"
      );
    }
  }
);

// 🟢 RESEND VERIFICATION
export const resendVerificationCode = createAsyncThunk(
  "auth/resendVerificationCode",
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/resend-verification", {
        email,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.msg || "Resending verification failed"
      );
    }
  }
);

// 🟢 WITHDRAW REFERRAL BONUS
export const withdrawBonus = createAsyncThunk(
  "auth/withdrawBonus",
  async (amount: number | undefined, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/withdraw-bonus", { amount });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Bonus withdrawal failed"
      );
    }
  }
);

// 🟢 GET REFERRAL STATS
export const getReferralStats = createAsyncThunk(
  "auth/getReferralStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/auth/referrals");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch referral stats"
      );
    }
  }
);

// 🟢 PASSWORD RESET REQUEST
export const requestPasswordReset = createAsyncThunk(
  "auth/requestPasswordReset",
  async (data: { email: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/auth/request-password-reset",
        data
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.msg || "Password reset failed"
      );
    }
  }
);

// 🟢 VERIFY RESET CODE
export const verifyResetCode = createAsyncThunk(
  "auth/verifyResetCode",
  async (data: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/auth/verify-reset-code",
        data
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.msg || "Code verification failed"
      );
    }
  }
);

// 🟢 RESET PASSWORD
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (data: { email: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/reset-password", data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.msg || "Password reset failed"
      );
    }
  }
);

// 🟢 UPDATE PASSWORD
export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async (
    data: { currentPassword: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/auth/update-password", data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Update password failed"
      );
    }
  }
);

// 🟢 UPDATE PIN
export const updatePin = createAsyncThunk(
  "auth/updatePin",
  async (data: { oldpin: string; newpin: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/update-pin", data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Update PIN failed"
      );
    }
  }
);

// 🟢 ADD PIN
export const addPin = createAsyncThunk(
  "auth/addPin",
  async (data: { pin: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/add-pin", data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Add PIN failed");
    }
  }
);

// 🟢 UPDATE USER TYPE (role)
export const updateUserType = createAsyncThunk(
  "auth/updateUserType",
  async (
    data: { userId: string; role: "user" | "reseller" },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put("/auth/update-type", data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update user type"
      );
    }
  }
);
