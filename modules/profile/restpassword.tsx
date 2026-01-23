import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";

// Optional: if you handle navigation in RN
import ApButton from "@/components/button/button";
import ApTextInput from "@/components/textInput/textInput";
import { useRouter } from "expo-router";
import {
  requestPasswordReset,
  resetPassword,
} from "@/redux/features/user/userThunk";
import { AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";

export default function ResetPasswordScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  //   const email = route.params?.email || "";
  //   const code = route.params?.code || "";

  const email = "abdulalazeezsodiq@gmail.com";
  const code = "i4i43i";

  const validationSchema = Yup.object({
    newPassword: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("New password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword")], "Passwords must match")
      .required("Please confirm your password"),
  });

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    const resultAction = await dispatch(resetPassword(values));
    setIsSubmitting(false);

    if (resetPassword.fulfilled.match(resultAction)) {
      // toast.success("✅ Password reset successfully");
      router.push("/(auth)/signin");
    } else {
      // toast.error(`❌ ${resultAction.payload || "Password reset failed"}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-gray-50">
      <View className="flex-1 justify-center items-center px-4">
        <View className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
          <Text className="text-2xl font-semibold text-center mb-4">
            Reset Password
          </Text>

          <Formik
            initialValues={{
              email,
              code,
              newPassword: "",
              confirmPassword: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit }) => (
              <View>
                <ApTextInput
                  label="New Password"
                  name="newPassword"
                  placeholder="Enter new password"
                  isPassword
                />
                <ApTextInput
                  label="Confirm Password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  isPassword
                />

                <ApButton
                  title={isSubmitting ? "Resetting..." : "Reset Password"}
                  onPress={handleSubmit as any}
                  className="w-full mt-4"
                  disabled={isSubmitting}
                />
              </View>
            )}
          </Formik>

          <Text className="text-center mt-4 text-sm">
            Remember your password?{" "}
            <Pressable onPress={() => router.push("/(auth)/signin")}>
              <Text className="text-blue-500 underline">Sign In</Text>
            </Pressable>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
