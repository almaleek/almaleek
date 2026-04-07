import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import { resetPassword } from "@/redux/features/user/userThunk";
import { useToast } from "@/components/toast/toastProvider";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApKeyboardWrapper from "@/components/keypardWrapper/keypardWrapper";

const validationSchema = Yup.object({
  code: Yup.string()
    .matches(/^\d{6}$/, "OTP must be 6 digits")
    .required("OTP is required"),
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm Password is required"),
});

export default function ResetPasswordScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const params = useLocalSearchParams();
  const identifier = String(params?.identifier || "").trim();

  return (
    <ApSafeAreaView>
      <ApKeyboardWrapper contentContainerStyle={{ backgroundColor: "#f9fafb" }}>
        <View className="flex-1 justify-center p-6">
          <View className="flex justify-center items-center mb-4">
            <Image
              source={require("@/assets/images/logo.png")}
              className="w-24 h-24"
              resizeMode="contain"
            />
          </View>
          <Text className="text-2xl font-bold mb-2 text-center">
            Reset Password
          </Text>
          <Text className="text-gray-600 text-sm mb-6 text-center">
            Enter the 6-digit code sent to {identifier || "your email/phone"}.
          </Text>

          <Formik
            initialValues={{
              identifier,
              code: "",
              newPassword: "",
              confirmPassword: "",
            }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                if (!values.identifier) {
                  showToast(
                    "Missing email/phone. Go back and request a reset code.",
                    "error"
                  );
                  return;
                }
                const action = await dispatch(
                  resetPassword({
                    identifier: values.identifier,
                    code: values.code,
                    newPassword: values.newPassword,
                  })
                );
                if (resetPassword.fulfilled.match(action)) {
                  showToast("Password reset successful", "success");
                  router.replace("/(auth)/signin");
                } else {
                  showToast(
                    (action.payload as any) || "Password reset failed",
                    "error"
                  );
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ handleSubmit, isSubmitting }) => (
              <View className="bg-white rounded-2xl p-6 shadow-xl">
                <ApTextInput
                  name="code"
                  label="OTP Code"
                  placeholder="Enter 6-digit code"
                  keyboardType="numeric"
                />
                <ApTextInput
                  name="newPassword"
                  label="New Password"
                  placeholder="Enter new password"
                  isPassword
                />
                <ApTextInput
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  isPassword
                />

                <ApButton
                  title="Reset Password"
                  loading={isSubmitting}
                  onPress={handleSubmit as any}
                />

                <Text className="text-center mt-4 text-sm">
                  Back to{" "}
                  <Pressable onPress={() => router.replace("/(auth)/signin")}>
                    <Text className="text-blue-600 underline">Sign In</Text>
                  </Pressable>
                </Text>
              </View>
            )}
          </Formik>
        </View>
      </ApKeyboardWrapper>
    </ApSafeAreaView>
  );
}
