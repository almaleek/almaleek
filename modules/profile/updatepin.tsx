import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { requestUpdatePinOtp, updatePin } from "@/redux/features/user/userThunk";
import { Lock } from "lucide-react-native";

import ApHeader from "@/components/headers/header";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import { useToast } from "@/components/toast/toastProvider";

export default function UpdatePinForm() {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const [otpSent, setOtpSent] = React.useState(false);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);

  const initialValues = { code: "", newpin: "" };

  const validationSchema = Yup.object().shape({
    code: Yup.string()
      .required("Verification code is required")
      .matches(/^\d{6}$/, "Code must be exactly 6 digits"),
    newpin: Yup.string()
      .required("New PIN is required")
      .matches(/^\d{4}$/, "PIN must be exactly 4 digits"),
  });

  const handleSendCode = async () => {
    try {
      setSendingOtp(true);
      const resultAction = await dispatch(requestUpdatePinOtp());
      if (requestUpdatePinOtp.fulfilled.match(resultAction)) {
        setOtpSent(true);
        setCooldownSeconds(60);
        showToast("Verification code sent to your registered phone number");
      } else {
        showToast(resultAction.payload as string, "error");
      }
    } catch {
      showToast("Unexpected error. Please try again.", "error");
    } finally {
      setSendingOtp(false);
    }
  };

  React.useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const t = setInterval(() => {
      setCooldownSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownSeconds]);

  const handleSubmit = async (
    values: typeof initialValues,
    { resetForm }: any
  ) => {
    try {
      const resultAction = await dispatch(updatePin(values));
      if (updatePin.fulfilled.match(resultAction)) {
        showToast("PIN updated successfully");
        resetForm();
        setOtpSent(false);
        setCooldownSeconds(0);
      } else {
        showToast(resultAction.payload as string, "error");
      }
    } catch (err) {
      showToast("Unexpected error. Please try again.", "error");
    }
  };

  return (
    <View>
      <View className="mt-4">
        <ApHeader
          title="Update Transaction PIN"
          link="/(protected)/(tabs)/profile"
        />
      </View>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, isSubmitting }) => (
          <View className="mt-6 space-y-4">
            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <Text className="text-base font-semibold text-gray-900">
                Step 1: Verify it’s you
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                We’ll send a 6-digit code to the phone number on your account.
              </Text>

              {!otpSent ? (
                <ApButton
                  title="Send Code"
                  onPress={handleSendCode as any}
                  disabled={sendingOtp}
                  loading={sendingOtp}
                />
              ) : (
                <View className="mt-4 flex-row items-center justify-between">
                  <Text className="text-xs text-green-700 font-medium">
                    Code sent
                  </Text>
                  <TouchableOpacity
                    disabled={cooldownSeconds > 0 || sendingOtp}
                    onPress={handleSendCode}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        cooldownSeconds > 0 || sendingOtp
                          ? "text-gray-400"
                          : "text-green-700"
                      }`}
                    >
                      {cooldownSeconds > 0
                        ? `Resend in ${cooldownSeconds}s`
                        : "Resend Code"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <Text className="text-base font-semibold text-gray-900">
                Step 2: Set new PIN
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                Enter the code and your new 4-digit transaction PIN.
              </Text>

              <View className="mt-4">
                <ApTextInput
                  label="Verification Code"
                  name="code"
                  placeholder="Enter 6-digit code"
                  icon={<Lock size={20} />}
                  keyboardType="number-pad"
                  disabled={!otpSent}
                />

                <ApTextInput
                  label="New PIN"
                  name="newpin"
                  placeholder="Enter new PIN"
                  isPassword
                  icon={<Lock size={20} />}
                  keyboardType="number-pad"
                  disabled={!otpSent}
                />

                <ApButton
                  title={isSubmitting ? "Updating..." : "Update PIN"}
                  onPress={handleSubmit as any}
                  disabled={isSubmitting || !otpSent}
                  loading={isSubmitting}
                />
              </View>
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
}
