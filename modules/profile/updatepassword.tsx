import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { updatePassword } from "@/redux/features/user/userThunk";
import ApHeader from "@/components/headers/header";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import { Lock } from "lucide-react-native";
import { useToast } from "@/components/toast/toastProvider";

export default function UpdatePassword() {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const initialValues = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  const validationSchema = Yup.object({
    currentPassword: Yup.string().required("Current password is required"),
    newPassword: Yup.string()
      .min(6, "New password must be at least 6 characters")
      .required("New password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword")], "Passwords must match")
      .required("Confirm password is required"),
  });

  const handleSubmit = async (values: any, { resetForm }: any) => {
    try {
      const resultAction = await dispatch(updatePassword(values));
      if (updatePassword.fulfilled.match(resultAction)) {
        showToast("Password updated successfully", "success");
        resetForm();
      } else {
        showToast(resultAction.payload as string, "error");
      }
    } catch (err) {
      showToast("Unexpected error. Try again.", "error");
    }
  };

  return (
    <View>
      <View>
        <ApHeader title="Update Password" link="/(protected)/(tabs)/profile" />
      </View>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, isSubmitting }) => (
          <View className=" px-4 mt-6 space-y-4 bg-white rounded-lg shadow-md p-4">
            {/* Current Password */}
            <ApTextInput
              label="Current Password"
              name="currentPassword"
              isPassword
              icon={<Lock size={20} />}
              placeholder="Enter current password"
            />

            {/* New Password */}
            <ApTextInput
              label="New Password"
              name="newPassword"
              isPassword
              icon={<Lock size={20} />}
              placeholder="Enter new password"
            />

            {/* Confirm Password */}
            <ApTextInput
              label="Confirm Password"
              name="confirmPassword"
              isPassword
              icon={<Lock size={20} />}
              placeholder="Enter confirm password"
            />

            {/* Submit Button */}
            <ApButton
              // type="submit"
              title={isSubmitting ? "Updating..." : "Update PIN"}
              loading={isSubmitting}
              onPress={handleSubmit as any}
            />
          </View>
        )}
      </Formik>
    </View>
  );
}
