import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { Mail, Lock } from "lucide-react-native";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import { useRouter } from "expo-router";
import { loginUser } from "@/redux/features/user/userThunk";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { useToast } from "@/components/toast/toastProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApKeyboardWrapper from "@/components/keypardWrapper/keypardWrapper";

export default function SignInScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const handleSubmit = async (values: any, { setSubmitting }) => {
    try {
      const resultAction = await dispatch(
        loginUser({ email: values.email, password: values.password })
      );

      if (loginUser.fulfilled.match(resultAction)) {
        const savedPasscode = await AsyncStorage.getItem("app_passcode");

        const biometricEnabled = await AsyncStorage.getItem(
          "biometric_enabled"
        );
        console.log(savedPasscode, biometricEnabled);

        if (!savedPasscode) {
          router.replace("/passcode-setup");
          return;
        }

        router.replace("/(protected)/(tabs)");
      } else {
        showToast(resultAction.payload || "Login failed", "error");
      }
    } catch (err) {
      console.log(err);
      showToast("Login failed");
    } finally {
      setSubmitting(false); // ✅ Important!
    }
  };

  return (
    <ApSafeAreaView>
      <ApKeyboardWrapper>
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={Yup.object({
            email: Yup.string().email("Invalid email").required("Required"),
            password: Yup.string().min(6, "Too short").required("Required"),
          })}
          onSubmit={handleSubmit}
        >
          {({ handleSubmit, isSubmitting }) => (
            <View className="flex-1 justify-center ">
              {/* Logo */}
              <View className="items-center mb-6">
                <Image
                  source={require("@/assets/images/logo.png")} // <-- replace with your logo path
                  className="w-24 h-24"
                  resizeMode="contain"
                />
                <Text className="mt-4 text-2xl font-bold text-gray-800">
                  Welcome Back!
                </Text>
                <Text className="text-gray-500 mt-1 text-center">
                  Sign in to your account to continue
                </Text>
              </View>

              {/* Email Input */}
              <ApTextInput
                name="email"
                label="Email"
                placeholder="Enter your email"
                icon={<Mail size={20} />}
                keyboardType="email-address"
              />

              {/* Password Input */}
              <ApTextInput
                name="password"
                label="Password"
                placeholder="Enter your password"
                isPassword
                icon={<Lock size={20} />}
              />

              {/* Forgotten Password */}
              <TouchableOpacity
                className="mb-4 mt-1 self-end"
                onPress={() => {
                  router.push("/(auth)/forgottenpassword");
                }}
              >
                <Text className="text-blue-600 font-medium">
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <ApButton
                title="Login"
                loading={isSubmitting}
                onPress={handleSubmit as any}
              />

              {/* Optional Signup Link */}
              <View className="mt-6 flex-row justify-center">
                <Text className="text-gray-500">Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => {
                    router.push("/(auth)/signup");
                  }}
                >
                  <Text className="text-blue-600 font-medium">Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </ApKeyboardWrapper>
    </ApSafeAreaView>
  );
}
