import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

interface HeaderProps {
  title: string;
  link?: string; // optional route to navigate to
}

export default function ApHeader({ title, link }: HeaderProps) {
  const router = useRouter();

  const handlePress = () => {
    if (link) {
      router.push(link as any); // navigate to specific link
    } else {
      router.back(); // default: go back
    }
  };

  return (
    <View className="flex-row items-center bg-white shadow p-3 rounded-lg">
      <TouchableOpacity
        onPress={handlePress}
        className="p-2 rounded-full bg-gray-100"
      >
        <ArrowLeft size={22} color="black" />
      </TouchableOpacity>

      <Text className="text-lg font-semibold ml-4">{title}</Text>
    </View>
  );
}
