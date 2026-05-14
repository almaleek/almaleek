import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ToastAndroid, Platform, Alert, ActivityIndicator } from "react-native";
import { Eye, EyeOff, Plus, Copy, Wallet, Gift } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { useDispatch } from "react-redux";
import axiosInstance from "@/redux/apis/common/aixosInstance";
import { currentUser } from "@/redux/features/user/userThunk";
import { AppDispatch } from "@/redux/store";
import { useToast } from "@/components/toast/toastProvider";

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
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const [generating, setGenerating] = useState(false);

  const hasAccount = useMemo(() => {
    return Boolean(user?.account?.accountNumber);
  }, [user?.account?.accountNumber]);

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", "Account number copied to clipboard");
    }
  };

  const generateAccount = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      await axiosInstance.post("/auth/generate-account");
      await dispatch(currentUser()).unwrap();
      showToast("Account generated successfully", "success");
    } catch (e: any) {
      const msg =
        e?.response?.data?.msg ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to generate account";
      showToast(String(msg), "error");
    } finally {
      setGenerating(false);
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

        {/* Balance Row */}
        <View className="mb-4">
          <Text className="text-4xl font-bold text-white">
            {showBalance
              ? `₦${Number(user?.balance ?? 0).toLocaleString()}`
              : "•••••"}
          </Text>
        </View>

        {/* Account Info & Cashback Row */}
        <View className="flex-row justify-between items-end">
          {/* Account Details */}
          <View className="flex-1">
            <View className="bg-black/20 px-3 py-1.5 rounded-lg flex-row items-center gap-2 self-start mb-2">
               <Text className="text-white/90 text-xs font-medium uppercase tracking-wider">
                {user?.account?.bankName || "Bank"}
              </Text>
            </View>

            {hasAccount ? (
              <>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => copyToClipboard(user?.account?.accountNumber)}
                  className="flex-row items-center gap-2"
                >
                  <Text className="text-white font-bold text-xl tracking-widest">
                    {user?.account?.accountNumber}
                  </Text>
                  <Copy size={16} color="white" className="opacity-80" />
                </TouchableOpacity>
                <Text className="text-white/70 text-xs mt-1">
                  {user?.account?.accountName || " "}
                </Text>
              </>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={generating}
                onPress={generateAccount}
                className="bg-white/20 px-4 py-3 rounded-2xl self-start flex-row items-center gap-2"
              >
                {generating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Plus size={16} color="white" />
                )}
                <Text className="text-white font-semibold">
                  {generating ? "Generating..." : "Generate Account"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cashback Details */}
          <View className="items-end pb-1">
            <View className="bg-white/20 px-3 py-2 rounded-2xl flex-row items-center gap-2">
              <View className="flex-row items-center gap-1.5">
                <Gift size={12} color="white" />
                <Text className="text-white/90 text-[10px] font-bold uppercase tracking-wider">Cashback</Text>
              </View>
              <View className="w-[1px] h-3 bg-white/30" />
              <Text className="text-white font-bold text-base">
                {showBalance ? `₦${Number(user?.cashbackBalance ?? 0).toLocaleString()}` : "••••"}
              </Text>
            </View>
          </View>
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
