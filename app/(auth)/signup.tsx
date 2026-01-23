import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { Mail, Lock, User } from "lucide-react-native";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { signUpUser } from "@/redux/features/user/userThunk";
import { useToast } from "@/components/toast/toastProvider";
import ApKeyboardWrapper from "@/components/keypardWrapper/keypardWrapper";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";

const validationSchema = Yup.object({
  firstName: Yup.string()
    .matches(/^[A-Za-z]+$/, "First name must contain only letters")
    .min(2, "First name must be at least 2 characters")
    .max(30, "First name must be at most 30 characters")
    .required("First name is required"),
  lastName: Yup.string()
    .matches(/^[A-Za-z]+$/, "Last name must contain only letters")
    .min(2, "Last name must be at least 2 characters")
    .max(30, "Last name must be at most 30 characters")
    .required("Last name is required"),
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
  referralCode: Yup.string()
    // .matches(/^[a-zA-Z0-9]*$/, "Referral code must be alphanumeric")
    .optional(),
  pinCode: Yup.string()
    .matches(/^\d{4}$/, "PIN code must be exactly 4 digits")
    .required("PIN code is required"),
});

export default function SignupForm() {
  const [step, setStep] = useState(1);
  const { showToast } = useToast();

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (values: any) => {
    const resultAction = await dispatch(signUpUser(values));
    if (signUpUser.fulfilled.match(resultAction)) {
      showToast("🎉 Sign-up successful! Redirecting...", "success");
      router.push("/(auth)/signin");
    } else {
      showToast(resultAction.payload || "Signup failed", "error");
    }
  };

  return (
    <ApSafeAreaView>
      <ApKeyboardWrapper>
        <Formik
          initialValues={{
            firstName: "",
            lastName: "",
            email: "",
            state: "",
            phone: "",
            password: "",
            confirmPassword: "",
            referralCode: "",
            pinCode: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleSubmit, isSubmitting }) => (
            <View className="flex-1 justify-center ">
              {/* Logo + Title */}
              <View className="items-center mb-10 ">
                <Image
                  source={require("@/assets/images/logo.png")} // replace with your logo
                  className="w-24 h-24"
                  resizeMode="contain"
                />
                <Text className="mt-4 text-2xl font-bold text-gray-800">
                  Create Account
                </Text>
                <Text className="text-gray-500 mt-1 text-center">
                  Fill in the details to get started
                </Text>
              </View>

              {/* Step 1: Personal Info */}
              {step === 1 && (
                <>
                  <ApTextInput
                    name="firstName"
                    label="First Name"
                    placeholder="Enter your first name"
                    icon={<User size={20} />}
                  />
                  <ApTextInput
                    name="lastName"
                    label="Last Name"
                    placeholder="Enter your last name"
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
                  <ApTextInput
                    name="phone"
                    label="Phone Number"
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                  />
                  <ApButton
                    variant="primary"
                    title="Next"
                    onPress={() => setStep(2)}
                    // className="mt-4"
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
                      <Text className="text-blue-600 font-medium">Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 2: Security Info */}
              {step === 2 && (
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
                  <ApTextInput
                    name="pinCode"
                    label="PIN Code"
                    placeholder="Enter 4-digit PIN"
                    keyboardType="numeric"
                  />
                  <View className="flex-row justify-between mt-4">
                    <ApButton
                      title="Back"
                      variant="secondary"
                      onPress={() => setStep(1)}
                    />
                    <ApButton
                      title="Sign Up"
                      loading={isSubmitting}
                      onPress={handleSubmit as any}
                    />
                  </View>
                </>
              )}
            </View>
          )}
        </Formik>
      </ApKeyboardWrapper>
    </ApSafeAreaView>
  );
}
