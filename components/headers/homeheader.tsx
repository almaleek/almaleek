import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Sun, Moon, CloudSun, Bell, Settings } from "lucide-react-native";
import { useRouter } from "expo-router";

const ApHomeHeader = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [greeting, setGreeting] = useState<{
    text: string;
    icon: React.ReactNode;
  } | null>(null);

  const router = useRouter();
  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12)
        return {
          text: "Good Morning",
          icon: <Sun color="#facc15" size={24} />, // yellow-500
        };
      if (hour < 18)
        return {
          text: "Good Afternoon",
          icon: <CloudSun color="#f97316" size={24} />, // orange-500
        };
      return {
        text: "Good Evening",
        icon: <Moon color="#3b82f6" size={24} />, // blue-500
      };
    };

    setGreeting(getGreeting());
    const interval = setInterval(() => setGreeting(getGreeting()), 60000);

    return () => clearInterval(interval);
  }, []);

  const hasNewNotification = true;

  return (
    <View className="flex-row items-center justify-between bg-white rounded-xl shadow-sm px-4 py-2 mb-2">
      {/* Left - Greeting and Name */}
      <View className="flex-row items-center gap-3">
        <View className="p-2 rounded-full bg-emerald-100">
          {greeting?.icon}
        </View>
        <View>
          <Text className="text-md text-gray-700 font-medium">
            {greeting?.text}
          </Text>
          <Text className="text-sm text-gray-500">
            {user?.firstName
              ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
              : "User"}
          </Text>
        </View>
      </View>

      {/* Right - Settings & Notifications */}
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={() => router.push("/(protected)/(tabs)/profile")}
          className="bg-gray-100 p-2 rounded-full"
        >
          <Settings color="#374151" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(protected)/notification")}
          className="bg-gray-100 p-2 rounded-full relative"
        >
          <Bell color="#374151" size={20} />
          {hasNewNotification && (
            <View className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ApHomeHeader;
