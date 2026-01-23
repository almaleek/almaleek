import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Share } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import ApHomeHeader from "@/components/headers/homeheader"; // adjust if needed
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";

export default function Profile() {
  const { user } = useSelector((state: RootState) => state.auth);

  const [referralCode] = useState(user?.referralCode || "YOUR_REFERRAL_CODE");
  const referralLink = `https://www.almaleek.com.ng/auth/signup?ref=${referralCode}`;

  const router = useRouter();

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(referralLink);
    Alert.alert("Copied!", "Referral link copied to clipboard.");
  };

  const shareLink = async () => {
    try {
      await Share.share({
        message: `Join using my referral link: ${referralLink}`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share link.");
    }
  };

  return (
    <ApSafeAreaView>
      <View className="pt-4">
        <ApHomeHeader />
      </View>

      <View className="bg-white shadow-lg rounded-xl mt-3  p-4">
        <Text className="text-lg font-bold text-gray-800">Refer & Earn</Text>
        <Text className="text-gray-600 mt-1 ">
          Invite friends & earn rewards.
        </Text>

        {/* Referral Code */}
        <View className="flex-row items-center justify-between bg-gray-100 p-3 rounded-lg mt-4">
          <Text className="text-gray-800 font-semibold">{referralCode}</Text>

          <TouchableOpacity
            onPress={copyToClipboard}
            className="bg-blue-500 px-3 py-1 rounded-lg"
          >
            <Text className="text-white text-sm">Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Invite Link */}
        <View className="mt-4">
          <Text className="text-sm text-gray-500">Your Invite Link:</Text>

          <View className="flex-row items-center justify-between bg-gray-100 p-3 rounded-lg mt-1">
            <Text
              className="text-sm text-gray-700 flex-1 mr-2"
              numberOfLines={1}
            >
              {referralLink}
            </Text>

            <TouchableOpacity
              onPress={copyToClipboard}
              className="bg-blue-500 px-3 py-1 rounded-lg"
            >
              <Text className="text-white text-sm">Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings */}
        <View className="mt-4 p-3 bg-green-100 rounded-lg">
          <Text className="text-green-700 text-center">
            Earn up to <Text className="font-bold">₦500</Text> per referral!
          </Text>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          className="mt-4 bg-blue-600 w-full py-2 rounded-lg"
          onPress={shareLink}
        >
          <Text className="text-white text-center font-semibold">
            Share Invite
          </Text>
        </TouchableOpacity>
      </View>
    </ApSafeAreaView>
  );
}
