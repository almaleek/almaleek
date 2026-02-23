import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { AppDispatch, RootState } from "@/redux/store";
import { fetchUserTransactions } from "@/redux/features/transaction/transactionSlice";
import { currentUser } from "@/redux/features/user/userThunk";
import { logout } from "@/redux/features/user/userSlice";

import AppScrollView from "@/components/scrollview/scrollview";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import WalletCard from "@/components/wallet/walletCard";
import ApHomeHeader from "@/components/headers/homeheader";
import BannerCarousel from "@/components/carousel/banner";

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
  Gift,
  LayoutGrid,
  ChevronRight,
  ArrowRight,
  ShieldCheck
} from "lucide-react-native";

const { width } = Dimensions.get('window');

const STATUS_ICONS: Record<string, any> = {
  success: <CheckCircle className="text-green-500 w-5 h-5" />,
  failed: <XCircle className="text-red-500 w-5 h-5" />,
  pending: <Clock className="text-yellow-500 w-5 h-5" />,
};

const STATUS_COLORS: Record<string, string> = {
  success: "text-green-600 bg-green-100",
  failed: "text-red-600 bg-red-100",
  pending: "text-yellow-600 bg-yellow-100",
};

const getStatusIcon = (status: string) =>
  STATUS_ICONS[status?.toLowerCase()] || STATUS_ICONS.pending;
const getStatusColor = (status: string) =>
  STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.pending;
const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const QuickActionButton = ({ icon, label, link, bg }: any) => {
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
      className="items-center justify-center mb-6 w-[22%]"
    >
      <View className={`w-12 h-12 rounded-2xl ${bg} items-center justify-center shadow-sm mb-2`}>
        {icon}
      </View>
      <Text className="text-xs text-gray-700 font-medium text-center" numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const TransactionItem = ({ tx }: { tx: any }) => (
  <View className="flex-row justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 mb-3 shadow-sm">
    <View className="flex flex-row items-center gap-3">
      <View className={`w-10 h-10 rounded-full flex items-center justify-center ${
        tx.status === 'success' ? 'bg-green-50' : 
        tx.status === 'failed' ? 'bg-red-50' : 'bg-yellow-50'
      }`}>
        {getStatusIcon(tx.status)}
      </View>
      <View>
        <Text className="font-semibold text-gray-900 text-base">{capitalize(tx.service)}</Text>
        <Text className="text-xs text-gray-500">
          {new Date(tx.transaction_date).toLocaleDateString()} • {new Date(tx.transaction_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Text>
      </View>
    </View>
    <View className="items-end">
      <Text className="font-bold text-base text-gray-900">
        -₦{Number(tx.amount).toLocaleString()}
      </Text>
      <Text
        className={`mt-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase ${getStatusColor(
          tx.status
        )}`}
      >
        {tx.status}
      </Text>
    </View>
  </View>
);

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { transactions, loading } = useSelector(
    (state: RootState) => state.transactions
  );

  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toggleBalance = () => setShowBalance((prev) => !prev);

  const actions = [
    {
      id: 6,
      icon: <Send size={22} color="#fff" />,
      bg: "bg-red-500",
      label: "Send",
      link: "(protected)/(services)/transfer",
    },
    {
      id: 1,
      icon: <Phone size={22} color="#fff" />,
      bg: "bg-blue-500",
      label: "Airtime",
      link: "(protected)/(services)/airtime",
    },
    {
      id: 2,
      icon: <Wifi size={22} color="#fff" />,
      bg: "bg-emerald-500",
      label: "Data",
      link: "(protected)/(services)/data",
    },
    {
      id: 3,
      icon: <Bolt size={22} color="#fff" />,
      bg: "bg-yellow-500",
      label: "Electricity",
      link: "(protected)/(services)/electricity",
    },
    {
      id: 4,
      icon: <GraduationCap size={22} color="#fff" />,
      bg: "bg-indigo-500",
      label: "Exam",
      link: "(protected)/(services)/exam",
    },
    {
      id: 5,
      icon: <Tv2 size={22} color="#fff" />,
      bg: "bg-orange-500",
      label: "TV",
      link: "(protected)/(services)/cable",
    },
    {
      id: 7,
      icon: user?.role === "agent" ? <ShieldCheck size={22} color="#fff" /> : <Gift size={22} color="#fff" />,
      bg: "bg-purple-500",
      label: user?.role === "agent" ? "Admin" : "Reward",
      link: "(protected)/(tabs)/reward",
    },
    {
      id: 8,
      icon: <LayoutGrid size={22} color="#fff" />,
      bg: "bg-slate-600",
      label: "More",
      link: "(protected)/(tabs)/profile",
    },
  ];

  const bannerImages = [
    require("@/assets/images/banner1.png"),
    require("@/assets/images/banner2.png"),
    require("@/assets/images/banner3.png"),
  ];

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
        }
        className="bg-gray-50"
      >
        <View className="pt-2 pb-4">
            <ApHomeHeader />
            <View className="mt-4">
                <WalletCard
                user={user}
                showBalance={showBalance}
                toggleBalance={toggleBalance}
                />
            </View>


            {/* Quick Actions */}
            <View className="mt-8 px-1">
                <Text className="text-base font-bold text-gray-900 mb-4 px-1">Quick Actions</Text>
                <View className="flex-row flex-wrap justify-between">
                {actions.map((action) => (
                    <QuickActionButton
                    key={action.id}
                    icon={action.icon}
                    label={action.label}
                    link={action.link}
                    bg={action.bg}
                    />
                ))}
                </View>
            </View>
            
            {/* Promo Carousel */}
            <View className="mb-2">
              <BannerCarousel images={bannerImages} heightRatio={0.20} borderRadius={16} />
            </View>

            {/* Recent Transactions */}
            <View className="mt-2 mb-10 px-1">
                <View className="flex-row justify-between items-center mb-4 px-1">
                    <Text className="text-base font-bold text-gray-900">Recent Transactions</Text>
                    <TouchableOpacity 
                        className="flex-row items-center"
                        onPress={() => router.push("/(protected)/(tabs)/history")}
                    >
                        <Text className="text-green-600 text-sm font-medium mr-1">View All</Text>
                        <ArrowRight size={14} color="#16a34a" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View className="flex justify-center items-center py-10">
                    <ActivityIndicator size="small" color="#16a34a" />
                    </View>
                ) : transactions?.length > 0 ? (
                    <View>
                    {[...transactions]
                        .slice(-2)
                        .reverse()
                        .map((tx) => (
                        <TransactionItem
                            key={tx._id || tx.id || tx.transaction_date}
                            tx={tx}
                        />
                        ))}
                    </View>
                ) : (
                    <View className="bg-white rounded-2xl p-8 items-center justify-center shadow-sm border border-gray-100">
                    <View className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Receipt size={32} color="#9ca3af" />
                    </View>
                    <Text className="text-gray-900 font-semibold mb-1">No Transactions</Text>
                    <Text className="text-xs text-gray-500 text-center">
                        You haven't made any transactions yet.
                    </Text>
                    </View>
                )}
            </View>
        </View>
      </AppScrollView>
    </ApSafeAreaView>
  );
}
