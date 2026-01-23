import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";

import { AppDispatch, RootState } from "@/redux/store";
import { fetchUserTransactions } from "@/redux/features/transaction/transactionSlice";
import { currentUser } from "@/redux/features/user/userThunk";

import AppScrollView from "@/components/scrollview/scrollview";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import WalletCard from "@/components/wallet/walletCard";
import ApHomeHeader from "@/components/headers/homeheader";

import {
  Send,
  Phone,
  Wifi,
  Bolt,
  GraduationCap,
  Tv2,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react-native";
import { LogOut } from "lucide-react-native";
import { logout } from "@/redux/features/user/userSlice";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

const actions = [
  {
    id: 6,
    icon: <Send size={24} color="#ef4444" />,
    label: "Send",
    link: "(protected)/(services)/transfer",
  },
  {
    
    id: 1,
    icon: <Phone size={24} color="#3b82f6" />,
    label: "Airtime",
    link: "(protected)/(services)/airtime",
  },
  {
    id: 2,
    icon: <Wifi size={24} color="#10b981" />,
    label: "Data",
    link: "(protected)/(services)/data",
  },
  {
    id: 3,
    icon: <Bolt size={24} color="#facc15" />,
    label: "Electricity",
    link: "(protected)/(services)/electricity",
  },
  {
    id: 4,
    icon: <GraduationCap size={24} color="#3b82f6" />,
    label: "Exam",
    link: "(protected)/(services)/exam",
  },
  {
    id: 5,
    icon: <Tv2 size={24} color="#3b82f6" />,
    label: "TV",
    link: "(protected)/(services)/cable",
  },
  
];

const STATUS_ICONS: Record<string, any> = {
  success: <CheckCircle className="text-green-500 w-5 h-5" />,
  failed: <XCircle className="text-red-500 w-5 h-5" />,
  pending: <Clock className="text-yellow-500 w-5 h-5" />,
};

const STATUS_COLORS: Record<string, string> = {
  success: "text-green-500 bg-green-100",
  failed: "text-red-500 bg-red-100",
  pending: "text-yellow-500 bg-yellow-100",
};

const getStatusIcon = (status: string) =>
  STATUS_ICONS[status?.toLowerCase()] || STATUS_ICONS.pending;
const getStatusColor = (status: string) =>
  STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.pending;
const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const QuickActionButton = ({ icon, label, link }: any) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  return (
    <TouchableOpacity
      onPress={() => {
        if (link === "logout") {
          dispatch(logout());
          router.push("/signin");
        } else {
          router.push(link as never);
        }
      }}
      className="bg-green-50 p-4 rounded-lg shadow-md items-center justify-center mb-3 w-[29%]"
    >
      {icon}
      <Text className="mt-2 text-sm text-gray-700 font-medium text-center">
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const TransactionItem = ({ tx }: { tx: any }) => (
  <View className="flex-row justify-between items-center">
    <View className="flex flex-row items-center gap-2">
      <View className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
        {getStatusIcon(tx.status)}
      </View>
      <View className="mb-4">
        <Text>{tx.product_name}</Text>
        <Text className="font-bold text-lg">{capitalize(tx.service)}</Text>
        <Text className="text-md text-gray-400">
          {new Date(tx.transaction_date).toLocaleString()}
        </Text>
      </View>
    </View>
    <View className="items-end ml-4">
      <Text className="font-bold text-[1.3rem] text-gray-800">
        ₦{tx.amount}
      </Text>
      <Text
        className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
          tx.status
        )}`}
      >
        {capitalize(tx.status)}
      </Text>
    </View>
  </View>
);

// =========================
// Main Page
// =========================
export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { transactions, loading } = useSelector(
    (state: RootState) => state.transactions
  );

  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toggleBalance = () => setShowBalance(!showBalance);

  useFocusEffect(
    useCallback(() => {
      dispatch(currentUser());
      dispatch(fetchUserTransactions());
    }, [dispatch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(currentUser());
    await dispatch(fetchUserTransactions());
    setRefreshing(false);
  };

  return (
    <ApSafeAreaView>
      <AppScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ApHomeHeader />
        <WalletCard
          user={user}
          showBalance={showBalance}
          toggleBalance={toggleBalance}
        />

        {/* Quick Actions */}
        <View className="flex-row flex-wrap justify-between mt-6 mb-6">
          {actions.map((action) => (
            <QuickActionButton
              key={action.id}
              icon={action.icon}
              label={action.label}
              link={action.link}
            />
          ))}
        </View>

        {/* Recent Transactions */}
        <View className="bg-green-50 shadow-md rounded-lg p-6 mb-10">
          <Text className="text-lg font-semibold text-gray-700 mb-4">
            Transactions
          </Text>

          {loading ? (
            <View className="flex justify-center items-center py-4">
              <ActivityIndicator size="small" color="#6b7280" />
            </View>
          ) : transactions?.length > 0 ? (
            <View className="space-y-4">
              {[...transactions]
                .slice(-2)
                .reverse()
                .map((tx) => (
                  <TransactionItem
                    key={tx._id || tx.id || tx.transaction_date}
                    tx={tx}
                  />
                ))}
              <TouchableOpacity
                onPress={() => router.push("/(protected)/(tabs)/history")}
              >
                <Text className="text-md text-white mt-1 text-center bg-green-600 p-2 rounded-full flex">
                  See all
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="text-center py-4">
              <View className="w-16 h-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt width={32} height={32} color="#9ca3af" />
              </View>
              <Text className="text-sm text-center">No Transactions Found</Text>
              <Text className="text-xs mt-1 text-center">
                Your transaction history will appear here
              </Text>
            </View>
          )}
        </View>
      </AppScrollView>
    </ApSafeAreaView>
  );
}
