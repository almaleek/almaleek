import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
  createVirtualAccount,
  getVirtualAccounts,
  initiateIdentityVerification,
  validateIdentityVerification,
  // resetIdentityVerification,
} from "@/redux/features/wallet/walletSlice";
import { AppDispatch, RootState } from "@/redux/store";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import { useToast } from "@/components/toast/toastProvider";
import { User, Shield, Banknote, ArrowLeft, Send } from "lucide-react-native";
import { currentUser } from "@/redux/features/user/userThunk";

export default function AccountScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    accounts,
    loading,
    identityVerification,
  } = useSelector((state: RootState) => state.wallets);

  const hasAccounts =
    (Array.isArray(accounts) && accounts.length > 0) ||
    (Array.isArray(user?.account) && user.account.length > 0);

  useEffect(() => {
    if (hasAccounts) {
      router.replace("/(protected)/(tabs)");
    }
  }, [hasAccounts, router]);

  // Identity verification form
  const [identityType, setIdentityType] = useState("BVN");
  const [identityNumber, setIdentityNumber] = useState("");
  const [otp, setOtp] = useState("");

  // Account creation form
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [reference, setReference] = useState(`ALM-${Date.now()}`);
  const [autoSweep, setAutoSweep] = useState(false);

  useEffect(() => {
    if (user?._id) {
      dispatch(getVirtualAccounts(user._id));
    }
  }, [dispatch, user?._id]);

  const handleInitiateVerification = async () => {
    if (!identityNumber) {
      showToast("Please enter your BVN/NIN", "error");
      return;
    }

    try {
      await dispatch(
      initiateIdentityVerification({
        identityType,
        identityNumber,
        debitAccountNumber: process.env.EXPO_PUBLIC_SAFEHAVEN_DEBIT_ACCOUNT,
      })
    ).unwrap();
    showToast("Verification initiated! Please check your phone for OTP", "success");
    } catch (error: any) {
      showToast(error || "Failed to initiate verification", "error");
    }
  };

  const handleValidateVerification = async () => {
    if (!otp) {
      showToast("Please enter the OTP", "error");
      return;
    }
  

    try {
      await dispatch(
        validateIdentityVerification({
          identityId: identityVerification.identityId!,
          otp,
          identityType,
        })
      ).unwrap();
      showToast("Identity verified successfully!", "success");
    } catch (error: any) {
      showToast(error || "Failed to validate verification", "error");
    }
  };

  const handleCreateAccount = async () => {
    if (!firstName || !lastName || !email || !phone) {
      showToast("Please fill in all fields", "error");
      return;
    }

    try {
      await dispatch(
        createVirtualAccount({
          userId: user!._id,
          email,
          reference,
          firstName,
          lastName,
          phone,
          identityType,
          identityNumber,
          identityId: identityVerification.identityId!,
          bvn: identityType === "BVN" ? identityNumber : undefined,
          autoSweep:false,
        })
      ).unwrap();
      showToast("Account created successfully!", "success");
      if (user?._id) {
        await dispatch(getVirtualAccounts(user._id)).unwrap();
        await dispatch(currentUser()).unwrap();
      }
      // dispatch(resetIdentityVerification());
      router.replace("/(protected)/(tabs)");
    } catch (error: any) {
      showToast(error || "Failed to create account", "error");
    }
  };

  return (
    <ApSafeAreaView>
      <View className="flex-row items-center py-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Create Virtual Account</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        {/* Identity Verification */}
        <View className="mb-8">
          <Text className="text-lg text-center font-bold text-gray-900 mb-4">
            Identity Verification
          </Text>

          {identityVerification.step === "idle" && (
            <View className="bg-white py-4 rounded-xl border border-gray-100">
              <Text className="text-gray-700 mb-2">Identity Type</Text>
              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity
                  onPress={() => setIdentityType("BVN")}
                  className={`flex-1 p-3 rounded-lg border-2 ${identityType === "BVN" ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                >
                  <Text className={`text-center ${identityType === "BVN" ? "text-green-700 font-bold" : "text-gray-600"}`}>
                    BVN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIdentityType("NIN")}
                  className={`flex-1 p-3 rounded-lg border-2 ${identityType === "NIN" ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                >
                  <Text className={`text-center ${identityType === "NIN" ? "text-green-700 font-bold" : "text-gray-600"}`}>
                    NIN
                  </Text>
                </TouchableOpacity>
              </View>

              <Text className="text-gray-700 mb-2">
                {identityType} Number
              </Text>
              <TextInput
                value={identityNumber}
                onChangeText={setIdentityNumber}
                placeholder={`Enter your ${identityType}`}
                keyboardType="numeric"
                className="border border-gray-200 rounded-lg p-3 mb-4"
              />

              <TouchableOpacity
                onPress={handleInitiateVerification}
                disabled={identityVerification.loading}
                className="bg-green-600 rounded-lg p-4 items-center"
              >
                {identityVerification.loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold">
                    Initiate Verification
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {identityVerification.step === "initiated" && (
            <View className="bg-white p-4 rounded-xl border border-gray-100">
              <Text className="text-gray-700 mb-2">Enter OTP</Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter the OTP sent to your phone"
                keyboardType="numeric"
                className="border border-gray-200 rounded-lg p-3 mb-4"
              />

              <TouchableOpacity
                onPress={handleValidateVerification}
                disabled={identityVerification.loading}
                className="bg-green-600 rounded-lg p-4 items-center mb-3"
              >
                {identityVerification.loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold">Validate OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                // onPress={() => dispatch(resetIdentityVerification())}
                className="border border-gray-300 rounded-lg p-4 items-center"
              >
                <Text className="text-gray-700 font-medium">Start Over</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Create Account */}
        {identityVerification.step === "validated" && (
          <View>
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Create Virtual Account
            </Text>

            <View className="bg-white p-4 rounded-xl border border-gray-100">
              <View className="mb-4">
                <Text className="text-gray-700 mb-2">First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  className="border border-gray-200 rounded-lg p-3"
                />
              </View>
              <View className="mb-4">
                <Text className="text-gray-700 mb-2">Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  className="border border-gray-200 rounded-lg p-3"
                />
              </View>
              <View className="mb-4">
                <Text className="text-gray-700 mb-2">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email Address"
                  keyboardType="email-address"
                  className="border border-gray-200 rounded-lg p-3"
                />
              </View>
              <View className="mb-4">
                <Text className="text-gray-700 mb-2">Phone Number</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  className="border border-gray-200 rounded-lg p-3"
                />
              </View>

              {/* <TouchableOpacity
                onPress={() => setAutoSweep(!autoSweep)}
                className="flex-row items-center mb-4"
              >
                <View
                  className={`w-6 h-6 rounded border-2 mr-3 ${autoSweep ? "bg-green-600 border-green-600" : "border-gray-300"}`}
                >
                  {autoSweep && <View className="flex-1 items-center justify-center">
                    <Text className="text-white text-xs">✓</Text>
                  </View>}
                </View>
                <Text className="text-gray-700">Enable Auto Sweep</Text>
              </TouchableOpacity> */}

              <TouchableOpacity
                onPress={handleCreateAccount}
                disabled={loading}
                className="bg-green-600 rounded-lg p-4 items-center"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold">
                    Create Virtual Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </ApSafeAreaView>
  );
}
