import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Eye, EyeOff, TrendingUp } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface WalletCardProps {
  user: any;
  showBalance: boolean;
  toggleBalance: () => void;
}

export default function WalletCard({
  user,
  showBalance,
  toggleBalance,
}: WalletCardProps) {
  return (
    <LinearGradient
      colors={["#16a34a", "#166534"]} // green-600 to green-800
      start={[0, 0]}
      end={[1, 1]}
      style={styles.gradient} // use style for borderRadius
    >
      {/* Wallet balance header */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-base font-medium text-white opacity-90">
          Wallet Balance
        </Text>
        <TouchableOpacity onPress={toggleBalance} className="p-1">
          {showBalance ? (
            <EyeOff size={18} color="white" />
          ) : (
            <Eye size={18} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Balance value */}
      <Text className="text-6xl font-extrabold tracking-wide text-white mt-2">
        {showBalance
          ? `₦${Number(user?.balance ?? 0).toLocaleString()}`
          : "••••••"}
      </Text>

      {/* Bonus / Claim section */}
      {/* <View className="flex flex-row justify-between gap-3 mt-2">
        <View className="bg-white/20 rounded-lg px-4 py-2 flex-row items-center gap-2">
          <TrendingUp size={14} color="white" />
          <Text className="text-white text-sm">
            Bonus: ₦{user?.bonus ?? "0.00"}
          </Text>
        </View>
        <View className="bg-white/20 rounded-lg px-4 py-2 flex-row items-center gap-2">
          <TrendingUp size={14} color="white" />
          <Text className="text-white text-sm">Claim: ₦0.00</Text>
        </View>
      </View> */}

      {/* PalmPay account details */}
      <View className="bg-white/10 rounded-lg p-3 mt-4">
        <Text className="font-semibold text-white text-lg">
          {user?.account?.bankName}
        </Text>
        <View className="mt-1">
          <Text className="text-white opacity-90">
            <Text className="font-bold text-lg">Acc No: </Text>
            {user?.account?.accountNumber}
          </Text>
          <Text className="text-white opacity-90">
            <Text className="font-bold text-lg">Acc Name: </Text>
            {user?.account?.accountName}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 24, // change this for more rounding
    padding: 24,
    // marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // for Android shadow
  },
});
