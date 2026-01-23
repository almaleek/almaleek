import React from "react";
import { View, Text } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { updatePin } from "@/redux/features/user/userThunk";
import { Lock } from "lucide-react-native";

import ApHeader from "@/components/headers/header";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import { useToast } from "@/components/toast/toastProvider";

export default function UpdatePinForm() {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const initialValues = { oldpin: "", newpin: "" };

  const validationSchema = Yup.object().shape({
    oldpin: Yup.string()
      .required("Old PIN is required")
      .matches(/^\d{4}$/, "PIN must be exactly 4 digits"),
    newpin: Yup.string()
      .required("New PIN is required")
      .matches(/^\d{4}$/, "PIN must be exactly 4 digits"),
  });

  const handleSubmit = async (
    values: typeof initialValues,
    { resetForm }: any
  ) => {
    try {
      const resultAction = await dispatch(updatePin(values));
      if (updatePin.fulfilled.match(resultAction)) {
        showToast("PIN updated successfully");
        resetForm();
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
          <View className="flex mt-6 space-y-4 bg-white rounded-lg shadow-md p-4">
            {/* <Text className="text-center text-sm text-gray-500 mb-4">
              Please enter your old PIN and the new PIN you want to set. The new
              PIN must be exactly 4 digits.
            </Text> */}

            {/* Old PIN */}
            <ApTextInput
              label="Old PIN"
              name="oldpin"
              placeholder="Enter old PIN"
              isPassword
              icon={<Lock size={20} />}
            />

            {/* New PIN */}
            <ApTextInput
              label="New PIN"
              name="newpin"
              placeholder="Enter new PIN"
              isPassword
              icon={<Lock size={20} />}
              // secureTextEntry
            />

            {/* Submit */}
            <ApButton
              title={isSubmitting ? "Updating..." : "Update PIN"}
              onPress={handleSubmit as any}
              disabled={isSubmitting}
            />
          </View>
        )}
      </Formik>
    </View>
  );
}
