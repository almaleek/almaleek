import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Constants from "expo-constants";
import UpdateModal from "@/components/modals/updateModal";
import { fetchGlobalSettings } from "@/redux/features/setting/settingSlice";

const mtnLogo = require("@/assets/images/mtn.png");
const airtelLogo = require("@/assets/images/airtel.png");
const gloLogo = require("@/assets/images/glo.jpg");
const mobile9Logo = require("@/assets/images/9mobile.jpeg");

const networkLogos: Record<string, any> = {
  mtn: mtnLogo,
  airtel: airtelLogo,
  glo: gloLogo,
  "9mobile": mobile9Logo,
};
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
  Wallet,
  Receipt,
  Smartphone,
  Gift,
  LayoutGrid,
  ShoppingBag,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  LogOut
} from "lucide-react-native";

const { width } = Dimensions.get('window');

const STATUS_COLORS: Record<string, string> = {
  success: "text-green-600 bg-green-100",
  failed: "text-red-600 bg-red-100",
  pending: "text-yellow-600 bg-yellow-100",
  refunded: "text-green-600 bg-green-100",
};

const getStatusColor = (status: string) =>
  STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.pending;
const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const getTxnDate = (t: any) =>
  t?.transaction_date ? new Date(t.transaction_date) : new Date(t?.createdAt);

const getWalletTypeLabel = (tx: any) => {
  const rawType = String(tx?.transaction_type || "").toLowerCase();
  if (rawType === "credit_note") return "credit";
  if (rawType === "debit_note") return "debit";
  return rawType;
};

const formatServiceLabel = (raw: string) => {
  const key = String(raw || "").toLowerCase().trim();
  if (!key) return "";
  if (key === "cable_tv" || key === "cable") return "Cable TV";
  if (key === "exam_pin" || key === "exam") return "Exam";
  if (key === "data_card") return "Data Card";
  return key.replace(/_/g, " ");
};

const parseRefundNote = (note: any) => {
  const text = String(note || "").trim();
  if (!text) return null;
  const serviceMatch = text.match(/refund for\s+(.+?)(?:\s+txid:|\s+ref:|$)/i);
  const txIdMatch = text.match(/txid:\s*([a-f0-9]{24})/i);
  const refMatch = text.match(/ref:\s*([a-z0-9_-]+)/i);
  if (!serviceMatch && !txIdMatch && !refMatch) return null;
  return {
    service: serviceMatch?.[1]?.trim() || "",
    txId: txIdMatch?.[1] || "",
    ref: refMatch?.[1] || "",
  };
};

const iconColors: Record<string, string> = {
  airtime: "#3b82f6",
  data: "#10b981",
  cable: "#f97316",
  electricity: "#eab308",
  wallet: "#8b5cf6",
  transfer: "#ef4444",
  exam: "#6366f1",
  default: "#6b7280",
};

const serviceIcons: Record<string, any> = {
  airtime: Phone,
  data: Wifi,
  cable: Tv2,
  electricity: Bolt,
  wallet: Wallet,
  transfer: Receipt,
  exam: GraduationCap,
};

const getServiceIcon = (service: any) => {
  const key = (service || "").toLowerCase();
  const normalizedKey = key.includes("exam")
    ? "exam"
    : key.includes("cable")
      ? "cable"
      : key;

  return {
    Icon: serviceIcons[normalizedKey] || Smartphone,
    color: iconColors[normalizedKey] || iconColors.default,
  };
};

const QuickActionButton = ({ icon, label, link, bg }: any) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  return (
    <TouchableOpacity
      onPress={() => {
        if (link === "logout") {
          dispatch(logout());
          router.push("/(auth)/signin");
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

const TransactionItem = ({ tx }: { tx: any }) => {
  const router = useRouter();
  const service = String(tx?.service || "").toLowerCase();
  const networkRaw = (tx?.network || "").toLowerCase();
  const networkKey = networkRaw.includes("mtn") ? "mtn" : 
                     networkRaw.includes("airtel") ? "airtel" : 
                     networkRaw.includes("glo") ? "glo" : 
                     networkRaw.includes("9mobile") || networkRaw.includes("etisalat") ? "9mobile" : "";
                     
  const isAirtimeOrData = service.includes("airtime") || service.includes("data");
  const logoSource = isAirtimeOrData ? networkLogos[networkKey] : null;

  const typeLabel = getWalletTypeLabel(tx);
  const { Icon, color } = getServiceIcon(service);
  const refundMeta =
    service === "wallet" && typeLabel === "refund" ? parseRefundNote(tx?.note) : null;
  const titleText =
    service === "wallet"
      ? refundMeta?.service
        ? `Refund (${formatServiceLabel(refundMeta.service)})`
        : (tx?.note ? String(tx.note) : typeLabel || "wallet")
      : String(tx?.service || "Transaction").replace("_", " ");

  const isWalletCredit =
    service === "wallet" && (typeLabel === "credit" || typeLabel === "refund");
  const amountPrefix = isWalletCredit ? "+" : "-";
  const dt = getTxnDate(tx);
  const statusLower = String(tx?.status || "").toLowerCase();
  const messageLower = String(tx?.message || "").toLowerCase();
  const isFailedRefunded =
    statusLower === "failed" &&
    (messageLower.includes("refunded") ||
      messageLower.includes("refund ref") ||
      messageLower.includes("refund exists"));

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/(protected)/history/[id]",
          params: { id: tx?._id || tx?.id },
        } as never)
      }
      activeOpacity={0.7}
      className="flex-row justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 mb-3 shadow-sm mx-0.5"
    >
      <View className="flex flex-row items-center gap-3 flex-1 pr-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center bg-opacity-10 overflow-hidden"
          style={{ backgroundColor: logoSource ? "transparent" : `${color}20` }}
        >
          {logoSource ? (
            <Image
              source={logoSource}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Icon size={20} color={color} strokeWidth={2.5} />
          )}
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 text-base capitalize">
            {titleText}
          </Text>
          <Text className="text-xs text-gray-500">
            {dt.toLocaleDateString()} •{" "}
            {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
          {!!refundMeta?.ref && (
            <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
              Ref: {refundMeta.ref}
            </Text>
          )}
          {!!tx?.note && service !== "wallet" && (
            <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
              {String(tx.note)}
            </Text>
          )}
        </View>
      </View>
      <View className="items-end">
        <Text
          className={`font-bold text-base ${
            isWalletCredit ? "text-green-700" : "text-gray-900"
          }`}
        >
          {amountPrefix}₦{Number(tx.amount || 0).toLocaleString()}
        </Text>
        {isFailedRefunded ? (
          <View className="flex-row gap-1 mt-1">
            <Text
              className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${getStatusColor(
                "failed"
              )}`}
            >
              failed
            </Text>
            <Text
              className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${getStatusColor(
                "refunded"
              )}`}
            >
              refunded
            </Text>
          </View>
        ) : (
          <Text
            className={`mt-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase ${getStatusColor(
              statusLower
            )}`}
          >
            {statusLower}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { settings } = useSelector((state: RootState) => state.setting);
  const { transactions, loading } = useSelector(
    (state: RootState) => state.transactions
  );

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toggleBalance = () => setShowBalance((prev) => !prev);

  const actions = [
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
      icon: <ShoppingBag size={22} color="#fff" />,
      bg: "bg-slate-600",
      label: "Market",
      link: "(protected)/marketplace",
    },
    {
      id: 9,
      icon: <LogOut size={22} color="#fff" />,
      bg: "bg-red-500",
      label: "Logout",
      link: "logout",
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

  useEffect(() => {
    dispatch(fetchGlobalSettings());
  }, [dispatch]);

  useEffect(() => {
    if (!settings) return;
    const currentVersion = Constants.expoConfig?.version || "1.0.0";
    const latestVersion =
      Platform.OS === "android" ? settings.androidVersion : settings.iosVersion;

    const compareVersions = (v1: string, v2: string) => {
      const parts1 = String(v1 || "").split(".").map(Number);
      const parts2 = String(v2 || "").split(".").map(Number);
      for (let i = 0; i < 3; i++) {
        const a = parts1[i] || 0;
        const b = parts2[i] || 0;
        if (a > b) return 1;
        if (a < b) return -1;
      }
      return 0;
    };

    if (latestVersion && compareVersions(currentVersion, latestVersion) < 0) {
      setShowUpdateModal(true);
    }
  }, [settings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(currentUser());
    await dispatch(fetchUserTransactions());
    setRefreshing(false);
  };

  return (
    <ApSafeAreaView>
      {settings && (
        <UpdateModal
          visible={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          latestVersion={
            Platform.OS === "android"
              ? settings.androidVersion
              : settings.iosVersion
          }
          forceUpdate={settings.forceUpdate}
          androidUrl={settings.androidAppUrl}
          iosUrl={settings.iosAppUrl}
        />
      )}
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
                        {"You haven't made any transactions yet."}
                    </Text>
                    </View>
                )}
            </View>
        </View>
      </AppScrollView>
    </ApSafeAreaView>
  );
}
