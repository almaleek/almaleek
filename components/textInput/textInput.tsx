import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
  ActivityIndicator,
} from "react-native";
import { useField } from "formik";
import { Eye, EyeOff } from "lucide-react-native";

type ApTextInputProps = TextInputProps & {
  name: string;
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
  multiline?: boolean;
  disabled?: boolean;
  valueOverride?: string;
  onChange?: (text: string) => void;
  loading?: boolean; // <-- NEW
};

const ApTextInput: React.FC<ApTextInputProps> = ({
  name,
  label,
  placeholder,
  icon,
  isPassword = false,
  multiline = false,
  disabled = false,
  valueOverride,
  onChange,
  loading = false, // <-- NEW
  ...props
}) => {
  const [field, meta, helpers] = useField(name);
  const [showPassword, setShowPassword] = useState(false);

  const finalValue = valueOverride !== undefined ? valueOverride : field.value;

  const handleChange = (text: string) => {
    if (!disabled) {
      helpers.setValue(text);
      if (onChange) onChange(text);
    }
  };

  return (
    <View className="mb-4">
      {label && (
        <Text className="mb-1 text-gray-700 font-semibold">{label}</Text>
      )}

      <View
        className={`flex-row items-center border rounded-lg px-3 py-2 
          ${meta.touched && meta.error ? "border-red-500" : "border-gray-300"}
          ${disabled ? "bg-gray-100" : ""}`}
      >
        {icon && <View className="mr-2">{icon}</View>}

        <TextInput
          value={finalValue}
          editable={!disabled}
          onChangeText={handleChange}
          onBlur={() => helpers.setTouched(true)}
          placeholder={placeholder}
          secureTextEntry={isPassword && !showPassword}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          className={`flex-1 text-gray-900 ${multiline ? "h-24" : "h-10"}`}
          {...props}
        />

        {loading && (
          <ActivityIndicator size="small" color="#22c55e" className="ml-2" />
        )}

        {isPassword && !disabled && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="ml-2"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </TouchableOpacity>
        )}
      </View>

      {meta.touched && meta.error && !disabled && (
        <Text className="text-red-500 mt-1 text-sm">{meta.error}</Text>
      )}
    </View>
  );
};

export default ApTextInput;
