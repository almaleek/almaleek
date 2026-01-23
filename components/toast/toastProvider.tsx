import React, { createContext, useContext, useRef, useState } from "react";
import { Animated, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ToastContext = createContext<any>(null);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });

  const slideAnim = useRef(new Animated.Value(-100)).current; // slide from top

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToast({ message, type, visible: true });

    // slide IN
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // auto hide
    setTimeout(() => hideToast(), 2200);
  };

  const hideToast = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    });
  };

  const bg = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  }[toast.type];

  const icon = {
    success: "checkmark-circle",
    error: "alert-circle",
    info: "information-circle",
  }[toast.type];

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast.visible && (
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            position: "absolute",
            top: 40,
            alignSelf: "center",
            zIndex: 1000, // ensure it's above modals
          }}
          className={`w-[90%] ${bg} px-4 py-3 rounded-xl shadow-lg flex-row items-center`}
        >
          <Ionicons name={icon as any} size={22} color="white" />
          <Text className="text-white ml-2 flex-1">{toast.message}</Text>
          <TouchableOpacity onPress={hideToast}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
