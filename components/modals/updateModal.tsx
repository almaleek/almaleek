import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { Smartphone, Download, X } from "lucide-react-native";

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  latestVersion: string;
  forceUpdate: boolean;
  androidUrl: string;
  iosUrl: string;
}

export default function UpdateModal({
  visible,
  onClose,
  latestVersion,
  forceUpdate,
  androidUrl,
  iosUrl,
}: UpdateModalProps) {
  const handleUpdate = () => {
    const url = Platform.OS === "android" ? androidUrl : iosUrl;
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View className="flex-1 justify-center items-center bg-black/60 px-6">
        <View className="bg-white w-full rounded-3xl p-6 shadow-2xl">
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
              <Download size={32} color="#16a34a" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center">
              New Update Available!
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              Version {latestVersion} is now available on the{" "}
              {Platform.OS === "android" ? "Play Store" : "App Store"}.
            </Text>
          </View>

          {/* Features / Info */}
          <View className="bg-gray-50 rounded-2xl p-4 mb-8">
            <View className="flex-row items-center gap-3 mb-2">
              <View className="w-2 h-2 bg-green-500 rounded-full" />
              <Text className="text-gray-700 font-medium">Bug fixes and performance improvements</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="w-2 h-2 bg-green-500 rounded-full" />
              <Text className="text-gray-700 font-medium">New features and enhanced security</Text>
            </View>
          </View>

          {/* Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={handleUpdate}
              className="bg-green-600 py-4 rounded-xl items-center shadow-sm"
            >
              <Text className="text-white font-bold text-lg">Update Now</Text>
            </TouchableOpacity>

            {!forceUpdate && (
              <TouchableOpacity
                onPress={onClose}
                className="py-3 items-center"
              >
                <Text className="text-gray-500 font-medium">Maybe Later</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Force update warning */}
          {forceUpdate && (
            <Text className="text-red-500 text-xs text-center mt-4 font-medium">
              * This update is required to continue using the app.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
