import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ToastAndroid, Platform, Alert } from "react-native";
import { Eye, EyeOff, Plus, History, Copy, Wallet } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";

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
  const copyToClipboard = async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", "Account number copied to clipboard");
    }
  };

  return (
    <View className="px-1">
      <LinearGradient
        colors={["#166534", "#15803d", "#16a34a"]} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Top Row: Label & Toggle */}
        <View className="flex-row justify-between items-center mb-1">
          <View className="flex-row items-center gap-2">
            <View className="bg-white/20 p-1.5 rounded-full">
              <Wallet size={16} color="white" />
            </View>
            <Text className="text-sm font-medium text-white/90">
              Total Balance
            </Text>
          </View>
          <TouchableOpacity 
            onPress={toggleBalance} 
            className="bg-white/20 p-2 rounded-full active:bg-white/30"
          >
            {showBalance ? (
              <EyeOff size={16} color="white" />
            ) : (
              <Eye size={16} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View className="mb-6">
          <Text className="text-4xl font-bold text-white">
            {showBalance
              ? `₦${Number(user?.balance ?? 0).toLocaleString()}`
              : "•••••"}
          </Text>
        </View>

        {/* Account Info & Actions Row */}
        <View className="flex-row justify-between items-end">
          {/* Account Details */}
          <View>
            <View className="bg-black/20 px-3 py-1.5 rounded-lg flex-row items-center gap-2 self-start mb-2">
               <Text className="text-white/90 text-xs font-medium uppercase tracking-wider">
                {user?.account?.bankName || "Bank"}
              </Text>
            </View>
            
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => copyToClipboard(user?.account?.accountNumber)}
              className="flex-row items-center gap-2"
            >
              <Text className="text-white font-bold text-xl tracking-widest">
                {user?.account?.accountNumber || "Wait..."}
              </Text>
              <Copy size={16} color="white" className="opacity-80" />
            </TouchableOpacity>
            <Text className="text-white/70 text-xs mt-1">
              {user?.account?.accountName || "Loading Name..."}
            </Text>
          </View>

          {/* Action Buttons */}
          {/* <View className="flex-row gap-3">
             <TouchableOpacity className="items-center justify-center">
                <View className="bg-white w-10 h-10 rounded-full items-center justify-center shadow-sm mb-1">
                   <Plus size={20} color="#166534" />
                </View>
                <Text className="text-[10px] text-white font-medium">Add Money</Text>
             </TouchableOpacity>
          </View> */}
        </View>

        {/* Decorative Circles */}
        <View
          pointerEvents="none"
          className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"
        />
        <View
          pointerEvents="none"
          className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/5 rounded-full blur-xl"
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#166534",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden'
  },
});
