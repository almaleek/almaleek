import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, Share, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import * as Clipboard from "expo-clipboard";
import ApHomeHeader from "@/components/headers/homeheader";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import { getReferralStats, withdrawBonus } from "@/redux/features/user/userThunk";
import { Phone } from "lucide-react-native";
import { useToast } from "@/components/toast/toastProvider";

export default function Reward() {
  const { user, referralStats, loading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  const referralCode = user?.referralCode || "N/A";
  const referralLink = `https://www.almaleek.com.ng/auth/signup?ref=${referralCode}`;

  const fetchStats = async () => {
    try {
      await dispatch(getReferralStats()).unwrap();
    } catch (error) {
      console.log("Failed to fetch stats", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

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

  const handleWithdraw = async () => {
    try {
      await dispatch(withdrawBonus()).unwrap();
      showToast(
        "Withdrawal request submitted.",
);
      fetchStats();
    } catch (error) {
      showToast(
        "Failed to submit withdrawal request.",
        "Error"

      );   
    }
  };

  const isAgent = user?.role === "agent";

  return (
    <ApSafeAreaView>
      <View className="pt-4">
        <ApHomeHeader />
      </View>

      <ScrollView 
        className="flex-1 px-4 mt-2 mb-10"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="bg-white shadow-sm rounded-xl p-5 mb-4 border border-gray-100">
          <Text className="text-xl font-bold text-gray-800">{isAgent ? "Agent Dashboard" : "Refer & Earn"}</Text>
          <Text className="text-gray-500 mt-1">
            {isAgent 
              ? "Overview of your performance and referrals." 
              : "Invite friends and earn a bonus when they sign up."}
          </Text>

          {/* Stats Cards */}
          <View className="flex-row gap-3 mt-6">
            <View className="flex-1 bg-blue-50 p-4 rounded-xl border border-blue-100 items-center">
              <Text className="text-gray-500 text-xs font-medium uppercase text-center">Total Referrals</Text>
              <Text className="text-2xl font-bold text-blue-700 mt-1">
                {referralStats?.totalReferrals || 0}
              </Text>
            </View>
            <View className="flex-1 bg-green-50 p-4 rounded-xl border border-green-100 items-center">
              <Text className="text-gray-500 text-xs font-medium uppercase text-center">
                {isAgent ? "Total Commission" : "Total Bonus"}
              </Text>
              <Text className="text-2xl font-bold text-green-700 mt-1">
                ₦{referralStats?.totalEarnings?.toLocaleString() || 0}
              </Text>
              {(referralStats?.totalEarnings || 0) > 0 && (
                <TouchableOpacity 
                  onPress={handleWithdraw}
                  className="mt-2 bg-green-100 px-3 py-1 rounded-full"
                >
                  <Text className="text-green-700 text-xs font-bold">Withdraw</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {isAgent && (
            <>
              <View className="flex-row gap-3 mt-3">
                <View className="flex-1 bg-orange-50 p-4 rounded-xl border border-orange-100 items-center">
                  <Text className="text-gray-500 text-xs font-medium uppercase text-center">
                    Ref Transactions
                  </Text>
                  <Text className="text-xl font-bold text-orange-700 mt-1">
                    {referralStats?.totalReferralTransactionCount || 0}
                  </Text>
                </View>

                <View className="flex-1 bg-indigo-50 p-4 rounded-xl border border-indigo-100 items-center">
                  <Text className="text-gray-500 text-xs font-medium uppercase text-center">
                    Claim Bonus
                  </Text>
                  <Text className="text-2xl font-bold text-indigo-700 mt-1">
                    {referralStats?.claimBonusCount || 0}
                  </Text>
                </View>
              </View>

            </>
          )}
        </View>

        {/* Referral Code Section */}
        <View className="bg-white shadow-sm rounded-xl p-5 mb-4 border border-gray-100">
          <Text className="text-sm font-medium text-gray-500 mb-3">Your Referral Code</Text>
          <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 border-dashed">
            <Text className="text-xl font-bold text-gray-800 tracking-wider">{referralCode}</Text>
            <TouchableOpacity onPress={copyToClipboard} className="bg-blue-600 px-4 py-2 rounded-lg">
              <Text className="text-white text-xs font-bold">COPY</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-sm font-medium text-gray-500 mt-5 mb-2">Share Link</Text>
          <TouchableOpacity 
            onPress={shareLink}
            className="flex-row items-center justify-center bg-gray-900 py-3.5 rounded-xl"
          >
            <Text className="text-white font-semibold">Share Referral Link</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Referrals List */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-800 mb-3">{isAgent ? "Referrals" : "Recent Referrals"}</Text>
          {referralStats?.referrals && referralStats.referrals.length > 0 ? (
            referralStats.referrals.map((ref: any, index: number) => (
              <View key={index} className="bg-white p-4 rounded-xl mb-2 shadow-sm border border-gray-50">
                <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                            <Text className="text-gray-600 font-bold text-sm">
                            {(ref.firstName || ref.email)?.charAt(0).toUpperCase() || "U"}
                            </Text>
                        </View>
                        <View>
                            <Text className="font-semibold text-gray-800">
                              {isAgent ? `${ref.firstName} ${ref.lastName}` : ref.email}
                            </Text>
                            <Text className="text-xs text-gray-400">
                              {isAgent ? ref.email : "Joined recently"}
                            </Text>
                        </View>
                    </View>
                    <View className="bg-green-100 px-2 py-1 rounded">
                        <Text className="text-green-700 text-xs font-bold">
                           {isAgent ? new Date(ref.createdAt).toLocaleDateString() : "Active"}
                        </Text>
                    </View>
                </View>
                
                {isAgent && (
                    <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
                        <View className="flex-row items-center gap-2">
                            <Phone size={14} color="#6b7280" />
                            <Text className="text-xs text-gray-500">{ref.phone || "No Phone"}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                            <Text className="text-xs text-gray-500">Trans:</Text>
                            <Text className="text-sm font-bold text-gray-800">₦{ref.totalSpent?.toLocaleString() || 0}</Text>
                        </View>
                    </View>
                )}
              </View>
            ))
          ) : (
            <View className="bg-white p-8 rounded-xl items-center justify-center border border-gray-100 border-dashed">
              <Text className="text-gray-400">No referrals yet. Start sharing!</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </ApSafeAreaView>
  );
}
