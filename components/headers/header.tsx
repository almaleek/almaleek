import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useRouter, useNavigation } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

interface HeaderProps {
  title: string;
  link?: string; // optional route to navigate to
}

export default function ApHeader({ title, link }: HeaderProps) {
  const router = useRouter();
  const navigation = useNavigation();

  const handlePress = () => {
    if (link) {
      if (navigation.canGoBack()) {
        router.back();
      } else {
        router.replace(link as any);
      }
    } else {
      if (navigation.canGoBack()) {
        router.back();
      }
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
