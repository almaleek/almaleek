import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { useRouter } from "expo-router";
import ApHomeHeader from "@/components/headers/homeheader"; // adjust if needed
import { logout } from "@/redux/features/user/userSlice";
import AppSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import { useToast } from "@/components/toast/toastProvider";

export default function Profile() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      dispatch(logout());
      router.push("/(auth)/signin");
    } catch (err) {
      showToast("Logout Failed", "Please try again.", "error");
      console.log("Logout failed", err);
    }
  };

  const menuItems = [
    {
      id: "1",
      icon: "🔒",
      label: "Password Update",
      href: "/(protected)/updatepassword",
    },
    {
      id: "2",
      icon: "🔢",
      label: "Pin Update",
      href: "/(protected)/updatepin",
    },
    {
      id: "3",
      icon: "📇",
      label: "Contacts",
      href: "/(protected)/contact",
    },
    {
      id: "4",
      icon: "🚪",
      label: "Logout",
      action: handleLogout,
    },
  ];

  return (
    <ApSafeAreaView>
      <View className="pt-4">
        <ApHomeHeader />
      </View>

      <View className="bg-white shadow-lg rounded-xl  px-4 mt-2">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              if (item.action) return item.action();
              router.push(item.href as any);
            }}
            className={`flex-row items-center py-4 border-b border-gray-200 ${
              index === menuItems.length - 1 ? "border-b-0" : ""
            }`}
          >
            <Text className="text-2xl">{item.icon}</Text>
            <Text className="ml-4 text-lg text-gray-800">{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ApSafeAreaView>
  );
}
