// components/ApButton.tsx
"use client";

import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from "react-native";

type ApButtonProps = TouchableOpacityProps & {
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
};

const ApButton: React.FC<ApButtonProps> = ({
  title,
  loading = false,
  variant = "primary",
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary: "bg-green-600",
    secondary: "bg-gray-600",
    danger: "bg-red-600",
  };

  return (
    <TouchableOpacity
      className={`${
        variantClasses[variant]
      } flex-row items-center justify-center px-4 py-4 rounded-lg mt-4 ${
        disabled || loading ? "opacity-50" : "opacity-100"
      }`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <ActivityIndicator size="small" color="#fff" className="mr-2" />
      )}
      <Text className="text-white font-semibold text-base">{title}</Text>
    </TouchableOpacity>
  );
};

export default ApButton;
