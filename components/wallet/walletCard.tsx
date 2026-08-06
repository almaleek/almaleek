import React, { useMemo, useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ToastAndroid, Platform, Alert, ActivityIndicator, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Eye, EyeOff, Plus, Copy, Wallet, Gift } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { useDispatch } from "react-redux";
import axiosInstance from "@/redux/apis/common/aixosInstance";
import { currentUser } from "@/redux/features/user/userThunk";
import { AppDispatch } from "@/redux/store";
import { useToast } from "@/components/toast/toastProvider";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.75;

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
  const [generatingBank, setGeneratingBank] = useState<string | null>(null);
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  

  


  const accounts = useMemo(() => {
    if (Array.isArray(user?.account)) return user.account;
    if (user?.account && typeof user.account === 'object' && user.account.accountNumber) return [user.account];
    return [];
  }, [user?.account]);

  const availableBanks = ["SAFEHAVEN"];

  const getMatchedAccount = (bankShortName: string) => {
    return accounts.find((acc: any) => {
      const savedName = acc.bankName?.toUpperCase() || "";
      const searchName = bankShortName.toUpperCase();
      // Match if exact, or if saved name contains search name (e.g. "9 Payment Service Bank" contains "9PSB" keywords)
      // or if search name is 9PSB and saved name has '9' and 'PSB'
      if (savedName === searchName) return true;
      if (savedName.includes(searchName)) return true;
      if (searchName === "9PSB" && savedName.includes("9") && (savedName.includes("PSB") || savedName.includes("PAYMENT"))) return true;
      if (searchName === "PALMPAY" && savedName.includes("PALM")) return true;
      return false;
    });
  };

  const displayBanks = useMemo(() => {
    return [...availableBanks].sort((a, b) => {
      const hasA = !!getMatchedAccount(a);
      const hasB = !!getMatchedAccount(b);
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;
      return 0;
    });
  }, [accounts]);

  // Auto-scroll logic
  useEffect(() => {
    if (displayBanks.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % displayBanks.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * (CARD_WIDTH + 12),
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 20000); // Scroll every 20 seconds

    return () => clearInterval(interval);
  }, [activeIndex, displayBanks.length]);




  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / (CARD_WIDTH + 12));
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", "Account number copied to clipboard");
    }
  };

  const generateAccount = async (bank: string) => {
    if (generatingBank) return;
    setGeneratingBank(bank);
    try {
      await axiosInstance.post("/auth/generate-account", { bank });
      await dispatch(currentUser()).unwrap();
      showToast(`${bank} account generated successfully`, "success");
    } catch (e: any) {
      const msg =
        e?.response?.data?.msg ||
        e?.response?.data?.error ||
        e?.message ||
        `Failed to generate ${bank} account`;
      showToast(String(msg), "error");
    } finally {
      setGeneratingBank(null);
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
        <View className="flex-row justify-between items-center mb-2">
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

        {/* Balance & Cashback Row */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-4xl font-bold text-white">
              {showBalance
                ? `₦${Number(user?.balance ?? 0).toLocaleString()}`
                : "•••••"}
            </Text>
          </View>

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

        {/* Accounts Section */}
        <View>
          <ScrollView 
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 12}
            decelerationRate="fast"
            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
          >
            {displayBanks.map((bank) => {
              const acc = getMatchedAccount(bank);
              
              return (
                <View 
                  key={bank} 
                  className="bg-black/10 p-4 rounded-2xl"
                  style={{ width: CARD_WIDTH }}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="bg-black/20 px-2 py-1 rounded-md">
                      <Text className="text-white/90 text-[10px] font-bold uppercase">
                        {bank}
                      </Text>
                    </View>
                    {acc && (
                      <TouchableOpacity 
                        onPress={() => copyToClipboard(acc.accountNumber)}
                        className="p-1"
                      >
                        <Copy size={14} color="white" className="opacity-70" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {acc ? (
                    <View>
                      <TouchableOpacity 
                        activeOpacity={0.7}
                        onPress={() => copyToClipboard(acc.accountNumber)}
                        className="flex-row items-center gap-2"
                      >
                        <Text className="text-white font-bold text-xl tracking-widest">
                          {acc.accountNumber}
                        </Text>
                        <Copy size={16} color="white" className="opacity-40" />
                      </TouchableOpacity>
                      <Text className="text-white/60 text-[12px] mt-1">
                        {acc.accountName || " "}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={generatingBank !== null}
                      onPress={() => {
                        if (availableBanks[0] === "SAFEHAVEN") {
                          router.push("/(protected)/account");
                          
                        } else {
                          generateAccount(bank);
                        }
                      }}
                      className="bg-white/10 border border-white/20 border-dashed h-[50px] rounded-xl flex-row items-center justify-center gap-2"
                    >
                      {generatingBank === bank ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Plus size={14} color="white" />
                          <Text className="text-white text-xs font-semibold">Generate {bank} Account</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
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
    overflow: 'hidden',
    // minHeight: 280
  },
});
