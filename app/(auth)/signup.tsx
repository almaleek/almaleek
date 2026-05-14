import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { Mail, Lock, User, Phone } from "lucide-react-native";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import {
  requestPhoneOtp,
  signUpUser,
  verifyPhoneOtp,
} from "@/redux/features/user/userThunk";
import { useToast } from "@/components/toast/toastProvider";
import ApKeyboardWrapper from "@/components/keypardWrapper/keypardWrapper";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const phoneSchema = Yup.object({
  phone: Yup.string()
    .matches(/^(?:\+234|0)[789][01]\d{8}$/, "Invalid Nigerian phone number")
    .required("Phone number is required"),
});

const otpSchema = Yup.object({
  otpCode: Yup.string()
    .matches(/^\d{6}$/, "OTP must be 6 digits")
    .required("OTP is required"),
});

const profileSchema = Yup.object({
  fullName: Yup.string()
    .matches(/^\s*\S+\s+\S+/, "Enter your first and last name")
    .max(60, "Full name must be at most 60 characters")
    .required("Full name is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  state: Yup.string()
    .matches(/^[A-Za-z\s]+$/, "State must contain only letters")
    .required("State is required"),
});

const fullSignupSchema = Yup.object({
  fullName: Yup.string()
    .matches(/^\s*\S+\s+\S+/, "Enter your first and last name")
    .max(60, "Full name must be at most 60 characters")
    .required("Full name is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  state: Yup.string()
    .matches(/^[A-Za-z\s]+$/, "State must contain only letters")
    .required("State is required"),
  phone: Yup.string()
    .matches(/^(?:\+234|0)[789][01]\d{8}$/, "Invalid Nigerian phone number")
    .required("Phone number is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
  referralCode: Yup.string().optional(),
});

function splitFullName(fullName: string) {
  const cleaned = String(fullName || "").trim().replace(/\s+/g, " ");
  const parts = cleaned.split(" ").filter(Boolean);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

export default function SignupForm() {
  const [step, setStep] = useState(0);
  const { showToast } = useToast();
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (values: any) => {
    const { firstName, lastName } = splitFullName(values.fullName);
    if (!firstName || !lastName) {
      showToast("Enter your first and last name", "error");
      setStep(2);
      return;
    }

    const payload = {
      ...values,
      firstName,
      lastName,
    };

    const resultAction = await dispatch(signUpUser(payload));
    if (signUpUser.fulfilled.match(resultAction)) {
      showToast("🎉 Sign-up successful!", "success");
      router.replace("/(protected)/(tabs)");
    } else {
      showToast(resultAction.payload || "Signup failed", "error");
    }
  };

  return (
    <ApSafeAreaView>
      <ApKeyboardWrapper contentContainerStyle={{ backgroundColor: "#f9fafb" }}>
        <Formik
          initialValues={{
            fullName: "",
            firstName: "",
            lastName: "",
            email: "",
            state: "",
            phone: "",
            otpCode: "",
            phoneOtpToken: "",
            password: "",
            confirmPassword: "",
            referralCode: "",
          }}
          validationSchema={
            step === 0
              ? phoneSchema
              : step === 1
                ? otpSchema
                : step === 2
                  ? profileSchema
                  : fullSignupSchema
          }
          onSubmit={handleSubmit}
        >
          {({ handleSubmit, isSubmitting, values, setFieldValue }) => (
            <View className="flex-1 bg-gray-50 justify-center">
              <View className="mx-4 mb-8 rounded-3xl overflow-hidden shadow-xl">
                <LinearGradient
                  colors={["#16a34a", "#166534"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 20 }}
                >
                  <View className="items-center">
                    <Image
                      source={require("@/assets/images/logo.png")}
                      className="w-16 h-16"
                      resizeMode="contain"
                    />
                    <Text className="mt-3 text-2xl font-extrabold text-white">
                      Create Account
                    </Text>
                    <Text className="mt-1 text-center text-white opacity-90">
                      {step === 0
                        ? "Verify your phone number"
                        : step === 1
                          ? "Enter OTP to continue"
                          : step === 2
                            ? "Your details"
                            : "Set your password"}
                    </Text>
                    <View className="flex-row justify-center mt-4">
                      {[0, 1, 2, 3].map((i) => (
                        <View
                          key={i}
                          className={`h-2 w-2 rounded-full mx-1 ${
                            i === step ? "bg-white" : "bg-white opacity-40"
                          }`}
                        />
                      ))}
                    </View>
                  </View>
                </LinearGradient>

                <View className="bg-white p-6">

              {step === 0 && (
                <>
                  <ApTextInput
                    name="phone"
                    label="Phone Number"
                    placeholder="e.g. 08012345678"
                    icon={<Phone size={20} />}
                    keyboardType="phone-pad"
                  />
                  <Text className="text-gray-500 text-sm -mt-2 mb-2">
                    We’ll send an OTP to confirm your number.
                  </Text>
                  <ApButton
                    variant="primary"
                    title="Send OTP"
                    loading={sendingOtp}
                    onPress={async () => {
                      const phone = String(values.phone || "").trim();
                      if (!/^(?:\+234|0)[789][01]\d{8}$/.test(phone)) {
                        showToast("Enter a valid Nigerian phone number", "error");
                        return;
                      }

                      try {
                        setSendingOtp(true);
                        const action = await dispatch(
                          requestPhoneOtp({ phone })
                        );
                        if (requestPhoneOtp.fulfilled.match(action)) {
                          setFieldValue("otpCode", "");
                          setFieldValue("phoneOtpToken", "");
                          showToast("OTP sent to your phone", "success");
                          setStep(1);
                        } else {
                          showToast(
                            (action.payload as any) || "Failed to send OTP",
                            "error"
                          );
                        }
                      } finally {
                        setSendingOtp(false);
                      }
                    }}
                  />

                  <View className="mt-6 flex-row justify-center">
                    <Text className="text-gray-500">
                      You already have an account?{" "}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        router.push("/(auth)/signin");
                      }}
                    >
                      <Text className="text-gray-600 font-semibold">Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {step === 1 && (
                <>
                  <View className="mb-4">
                    <Text className="text-gray-700 text-center">
                      {values.phone ? `OTP sent to ${values.phone}` : "Enter OTP"}
                    </Text>
                  </View>

                  <ApTextInput
                    name="otpCode"
                    label="OTP Code"
                    placeholder="Enter 6-digit OTP"
                    keyboardType="numeric"
                  />

                  <ApButton
                    variant="primary"
                    title="Verify OTP"
                    loading={verifyingOtp}
                    onPress={async () => {
                      const phone = String(values.phone || "").trim();
                      const code = String(values.otpCode || "").trim();
                      if (!phone) {
                        showToast("Enter your phone number first", "error");
                        setStep(0);
                        return;
                      }
                      if (!/^\d{6}$/.test(code)) {
                        showToast("Enter a valid 6-digit OTP", "error");
                        return;
                      }

                      try {
                        setVerifyingOtp(true);
                        const action = await dispatch(
                          verifyPhoneOtp({ phone, code })
                        );
                        if (verifyPhoneOtp.fulfilled.match(action)) {
                          const token = (action.payload as any)?.phoneOtpToken;
                          if (!token) {
                            showToast("OTP verified but no token returned", "error");
                            return;
                          }
                          setFieldValue("phoneOtpToken", token);
                          showToast("Phone verified", "success");
                          setStep(2);
                        } else {
                          showToast(
                            (action.payload as any) || "OTP verification failed",
                            "error"
                          );
                        }
                      } finally {
                        setVerifyingOtp(false);
                      }
                    }}
                  />

                  {/* <ApButton
                    variant="secondary"
                    title="Resend OTP"
                    loading={sendingOtp}
                    onPress={async () => {
                      const phone = String(values.phone || "").trim();
                      if (!/^(?:\+234|0)[789][01]\d{8}$/.test(phone)) {
                        showToast("Enter a valid Nigerian phone number", "error");
                        setStep(0);
                        return;
                      }

                      try {
                        setSendingOtp(true);
                        const action = await dispatch(requestPhoneOtp({ phone }));
                        if (requestPhoneOtp.fulfilled.match(action)) {
                          setFieldValue("otpCode", "");
                          setFieldValue("phoneOtpToken", "");
                          showToast("OTP sent to your phone", "success");
                        } else {
                          showToast(
                            (action.payload as any) || "Failed to send OTP",
                            "error"
                          );
                        }
                      } finally {
                        setSendingOtp(false);
                      }
                    }}
                  /> */}

                  <ApButton
                    title="Back"
                    variant="secondary"
                    onPress={() => {
                      setStep(0);
                    }}
                  />

                  <View className="mt-6 flex-row justify-center">
                    <Text className="text-gray-500">
                      You already have an account?{" "}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        router.push("/(auth)/signin");
                      }}
                    >
                      <Text className="text-gray-600 font-semibold">Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {step === 2 && (
                <>
                  <ApTextInput
                    name="fullName"
                    label="Full Name"
                    placeholder="First name Last name"
                    icon={<User size={20} />}
                  />
                  <ApTextInput
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                    icon={<Mail size={20} />}
                    keyboardType="email-address"
                  />
                  <ApTextInput
                    name="state"
                    label="State"
                    placeholder="Enter your state"
                  />
                  <View className="flex-row justify-between mt-4">
                    <ApButton
                      title="Back"
                      variant="secondary"
                      onPress={() => setStep(1)}
                    />
                    <ApButton
                      title="Next"
                      onPress={() => {
                        if (!values.phoneOtpToken) {
                          showToast("Verify phone OTP to continue", "error");
                          setStep(1);
                          return;
                        }
                        const { firstName, lastName } = splitFullName(values.fullName);
                        if (!firstName || !lastName) {
                          showToast("Enter your first and last name", "error");
                          return;
                        }
                        setStep(3);
                      }}
                    />
                  </View>
                </>
              )}

              {step === 3 && (
                <>
                  <ApTextInput
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    isPassword
                    icon={<Lock size={20} />}
                  />
                  <ApTextInput
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    isPassword
                    icon={<Lock size={20} />}
                  />
                  <ApTextInput
                    name="referralCode"
                    label="Referral Code (Optional)"
                    placeholder="Enter referral code"
                  />
                  <View className="flex-row justify-between mt-4">
                    <ApButton
                      title="Back"
                      variant="secondary"
                      onPress={() => setStep(2)}
                    />
                    <ApButton
                      title="Sign Up"
                      loading={isSubmitting}
                      onPress={() => {
                        if (!values.phoneOtpToken) {
                          showToast("Verify phone OTP to continue", "error");
                          setStep(1);
                          return;
                        }
                        handleSubmit();
                      }}
                    />
                  </View>
                </>
              )}
                </View>
              </View>
            </View>
          )}
        </Formik>
      </ApKeyboardWrapper>
    </ApSafeAreaView>
  );
}
