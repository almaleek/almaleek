import React from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import { router, useRouter } from "expo-router";
import { requestPasswordReset } from "@/redux/features/user/userThunk";
import { AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";
import { useToast } from "@/components/toast/toastProvider";

const validationSchema = Yup.object({
  identifier: Yup.string()
    .required("Email or phone number is required")
    .test("is-email-or-ng-phone", "Enter a valid email or phone number", (v) => {
      const value = String(v || "").trim();
      if (!value) return false;
      if (value.includes("@")) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toLowerCase());
      }
      return /^(?:\+234|0)[789][01]\d{8}$/.test(value);
    }),
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      const resultAction = await dispatch(requestPasswordReset(values));
      if (requestPasswordReset.fulfilled.match(resultAction)) {
        showToast("Reset code sent", "success");
        router.replace({
          pathname: "/(auth)/resetpassword",
                  params: { identifier: values.identifier },
        });
      } else {
        showToast(
          (resultAction.payload as any) || "Failed to send reset code",
          "error"
        );
      }
    } finally {
      setSubmitting(false); // stop Formik's loading
    }
  };
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-gray-50">
      <Formik
        initialValues={{ identifier: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, isSubmitting }) => (
          <View className="flex-1 justify-center p-6">
            <View className="flex justify-center items-center mb-4">
              <Image
                source={require("@/assets/images/logo.png")} // <-- replace with your logo path
                className="w-24 h-24"
                resizeMode="contain"
              />
            </View>

            <Text className="text-2xl font-bold mb-4 text-center">
              Forgot Password
            </Text>
            <Text className="text-gray-600 text-sm mb-6 text-center">
              Enter your registered email or phone number!
            </Text>

            <ApTextInput
              name="identifier"
              label="Email or Phone Number"
              placeholder="Enter your email or phone number"
              keyboardType="default"
            />

            <ApButton
              title="Send Reset Code"
              loading={isSubmitting}
              onPress={handleSubmit as any}
            />

            <Text className="text-center mt-2 text-sm">
              Wrong email?{" "}
              <Pressable onPress={() => router.push("/(auth)/signin")}>
                <Text className="text-blue-600 underline">Go to Sign In</Text>
              </Pressable>
            </Text>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
}
