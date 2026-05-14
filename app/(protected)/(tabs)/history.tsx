import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchUserTransactions } from "@/redux/features/transaction/transactionSlice";
import { Filter, X, Receipt, Search, ChevronDown, Check, Calendar, ArrowUpRight, ArrowDownLeft } from "lucide-react-native";
import ApHomeHeader from "@/components/headers/homeheader";
import { useRouter } from "expo-router";
import { Phone, Wifi, Tv, Wallet, Bolt, Smartphone, GraduationCap } from "lucide-react-native";
import debounce from "lodash.debounce";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import { Image } from "react-native";

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

const iconColors: Record<string, string> = {
  airtime: "#3b82f6", // blue-500
  data: "#10b981", // emerald-500
  cable: "#f97316", // orange-500
  electricity: "#eab308", // yellow-500
  wallet: "#8b5cf6", // violet-500
  transfer: "#ef4444", // red-500
  exam: "#6366f1", // indigo-500
  default: "#6b7280", // gray-500
};

const serviceIcons: Record<string, any> = {
  airtime: Phone,
  data: Wifi,
  cable: Tv,
  electricity: Bolt,
  wallet: Wallet,
  transfer: Receipt,
  exam: GraduationCap,
};

const TYPE_TO_SERVICES: Record<string, string[]> = {
  "": [],
  airtime: ["airtime"],
  data: ["data"],
  electricity: ["electricity"],
  cable: ["cable_tv"],
  exam: ["exam_pin"],
  wallet: ["wallet"],
  other: ["other"],
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

export default function HistoryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { transactions } = useSelector(
    (state: RootState) => state.transactions
  );

  const [statusFilter, setStatusFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchUserTransactions());
  }, [dispatch]);

  // Debounced product filter
  const [debouncedProductFilter, setDebouncedProductFilter] = useState("");
  const handleProductFilter = useCallback(
    debounce((text: string) => setDebouncedProductFilter(text), 300),
    []
  );

  const getTxnDate = (t: any) =>
    t?.transaction_date ? new Date(t.transaction_date) : new Date(t?.createdAt);

  const withinRange = (d: Date, window: "7days" | "30days" | "") => {
    if (!window) return true;
    const now = Date.now();
    const diffDays = window === "7days" ? 7 : 30;
    const after = new Date(now - diffDays * 24 * 60 * 60 * 1000);
    return d >= after;
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success":
      case "refund":
        return { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" };
      case "failed":
        return { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" };
      default:
        return { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" };
    }
  };

  const getServiceIcon = (service: any) => {
    const key = (service || "").toLowerCase();
    // Handle special case for exam which might be exam_pin
    const normalizedKey = key.includes('exam') ? 'exam' : key.includes('cable') ? 'cable' : key;
    
    return {
      Icon: serviceIcons[normalizedKey] || Smartphone,
      color: iconColors[normalizedKey] || iconColors.default,
    };
  };

  const reversedTransactions = useMemo(
    () => (transactions || []).slice().reverse(),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    return reversedTransactions.filter((trans: any) => {
      const statusMatch =
        !statusFilter ||
        trans?.status?.toLowerCase() === statusFilter.toLowerCase();

      const haystack =
        [
          trans?.network,
          trans?.service,
          trans?.note,
          trans?.reference_no,
          trans?.mobile_no,
          trans?.company,
          trans?.package,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase() || "";

      const productMatch =
        !debouncedProductFilter ||
        haystack.includes(debouncedProductFilter.toLowerCase());

      const dt = getTxnDate(trans);
      const dateMatch = withinRange(dt, dateFilter as any);

      const service = (trans?.service || "").toLowerCase();
      let typeMatch = true;

      if (transactionTypeFilter && transactionTypeFilter !== "other") {
        const allowed = TYPE_TO_SERVICES[transactionTypeFilter] || [];
        typeMatch = allowed.includes(service);
      } else if (transactionTypeFilter === "other") {
        const known = [
          "airtime",
          "data",
          "electricity",
          "cable_tv",
          "exam_pin",
          "wallet",
        ];
        typeMatch = !known.includes(service);
      }

      return statusMatch && productMatch && dateMatch && typeMatch;
    });
  }, [
    reversedTransactions,
    statusFilter,
    debouncedProductFilter,
    dateFilter,
    transactionTypeFilter,
  ]);

  const activeFiltersCount =
    (statusFilter ? 1 : 0) +
    (productFilter ? 1 : 0) +
    (dateFilter ? 1 : 0) +
    (transactionTypeFilter ? 1 : 0);

  const renderItem = ({ item }: { item: any }) => {
    const { Icon, color } = getServiceIcon(item?.service);
    const serviceKey = (item?.service || "").toLowerCase();
    const networkRaw = (item?.network || "").toLowerCase();
    const networkKey = networkRaw.includes("mtn") ? "mtn" : 
                       networkRaw.includes("airtel") ? "airtel" : 
                       networkRaw.includes("glo") ? "glo" : 
                       networkRaw.includes("9mobile") || networkRaw.includes("etisalat") ? "9mobile" : "";
                       
    const isAirtimeOrData = serviceKey.includes("airtime") || serviceKey.includes("data");
    const logoSource = isAirtimeOrData ? networkLogos[networkKey] : null;

    const statusLower = String(item?.status || "").toLowerCase();
    const messageLower = String(item?.message || "").toLowerCase();
    const isFailedRefunded =
      statusLower === "failed" &&
      (messageLower.includes("refunded") ||
        messageLower.includes("refund ref") ||
        messageLower.includes("refund exists"));
    const failedStyle = getStatusStyle("failed");
    const refundedStyle = getStatusStyle("refund");
    const statusStyle = getStatusStyle(item.status);

    const rawType = String(item?.transaction_type || "").toLowerCase();
    const typeLabel =
      rawType === "credit_note"
        ? "credit"
        : rawType === "debit_note"
          ? "debit"
          : rawType;

    const refundMeta =
      String(item?.service || "").toLowerCase() === "wallet" && typeLabel === "refund"
        ? parseRefundNote(item?.note)
        : null;

    const titleText =
      String(item?.service || "").toLowerCase() === "wallet"
        ? refundMeta?.service
          ? `Refund (${formatServiceLabel(refundMeta.service)})`
          : (item?.note ? String(item.note) : typeLabel || "wallet")
        : String(item?.service || "Transaction").replace("_", " ");

    const isWalletCredit =
      String(item?.service || "").toLowerCase() === "wallet" &&
      (typeLabel === "credit" || typeLabel === "refund");

    const amountPrefix = isWalletCredit ? "+" : "-";
    
    return (
      <TouchableOpacity
        key={item?._id}
        onPress={() =>
          router.push({
            pathname: "/(protected)/history/[id]",
            params: { id: item?._id },
          } as never)
        }
        activeOpacity={0.7}
        className="bg-white p-4 mb-3 rounded-2xl border border-gray-100 shadow-sm mx-1"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-3">
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
            <View>
                <Text className="text-base text-gray-900 font-semibold capitalize">
                {titleText}
                </Text>
                <Text className="text-xs text-gray-500">
                    {getTxnDate(item).toLocaleDateString()} • {getTxnDate(item).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
                {!!refundMeta?.ref && (
                  <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                    Ref: {refundMeta.ref}
                  </Text>
                )}
              
            </View>
          </View>

          <View className="items-end">
            <Text
              className={`text-base font-bold ${
                isWalletCredit ? "text-green-700" : "text-gray-900"
              }`}
            >
                {amountPrefix}₦{Number(item?.amount || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-50">
            {isFailedRefunded ? (
              <View className="flex-row items-center gap-2">
                <View className={`flex-row items-center gap-1.5 px-2 py-1 rounded-full ${failedStyle.bg}`}>
                  <View className={`w-1.5 h-1.5 rounded-full ${failedStyle.dot}`} />
                  <Text className={`text-xs font-medium capitalize ${failedStyle.text}`}>
                    failed
                  </Text>
                </View>
                <View className={`flex-row items-center gap-1.5 px-2 py-1 rounded-full ${refundedStyle.bg}`}>
                  <View className={`w-1.5 h-1.5 rounded-full ${refundedStyle.dot}`} />
                  <Text className={`text-xs font-medium capitalize ${refundedStyle.text}`}>
                    refunded
                  </Text>
                </View>
              </View>
            ) : (
              <View className={`flex-row items-center gap-1.5 px-2 py-1 rounded-full ${statusStyle.bg}`}>
                  <View className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                  <Text className={`text-xs font-medium capitalize ${statusStyle.text}`}>
                      {String(item?.status || "")}
                  </Text>
              </View>
            )}

            <View className="flex-row items-center gap-1">
                <Text className="text-xs text-gray-400">Bal:</Text>
                <Text className="text-xs text-gray-600 font-medium">₦{Number(item?.new_balance || 0).toLocaleString()}</Text>
            </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ApSafeAreaView>
      <View className="pt-2 pb-2 bg-white">
        <ApHomeHeader />
      </View>

      <View className="flex-1 bg-gray-50">
        {/* Search & Filter Bar */}
        <View className="px-4 py-3 bg-white flex-row items-center gap-3 shadow-sm z-10">
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 h-11 border border-gray-200">
            <Search size={18} color="#9ca3af" />
            <TextInput
                placeholder="Search transactions..."
                placeholderTextColor="#9ca3af"
                onChangeText={(text) => {
                setProductFilter(text);
                handleProductFilter(text);
                }}
                className="flex-1 ml-2 text-sm text-gray-800 font-medium h-full"
            />
            {productFilter.length > 0 && (
                <TouchableOpacity onPress={() => {
                    setProductFilter("");
                    handleProductFilter("");
                }}>
                    <X size={16} color="#9ca3af" />
                </TouchableOpacity>
            )}
            </View>

            <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className={`w-11 h-11 items-center justify-center rounded-xl border ${activeFiltersCount > 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
            >
            <Filter size={20} color={activeFiltersCount > 0 ? "#16a34a" : "#374151"} />
            {activeFiltersCount > 0 && (
                <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center border border-white">
                    <Text className="text-[9px] font-bold text-white">{activeFiltersCount}</Text>
                </View>
            )}
            </TouchableOpacity>
        </View>

        {/* Transaction List */}
        <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
            <View className="items-center justify-center py-20 px-10">
                <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Receipt size={40} color="#9ca3af" />
                </View>
                <Text className="text-lg font-bold text-gray-800 mb-2">No Transactions Found</Text>
                <Text className="text-sm text-gray-500 text-center leading-5">
                    {
                      "We couldn't find any transactions matching your criteria. Try adjusting your filters."
                    }
                </Text>
                {(activeFiltersCount > 0 || productFilter) && (
                    <TouchableOpacity 
                        onPress={() => {
                            setStatusFilter("");
                            setProductFilter("");
                            handleProductFilter("");
                            setDateFilter("");
                            setTransactionTypeFilter("");
                        }}
                        className="mt-6 px-6 py-2.5 bg-gray-900 rounded-full"
                    >
                        <Text className="text-white font-semibold text-sm">Clear All Filters</Text>
                    </TouchableOpacity>
                )}
            </View>
            }
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
        />
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl h-[70%] w-full overflow-hidden">
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                    <Text className="text-lg font-bold text-gray-900">Filter Transactions</Text>
                    <TouchableOpacity 
                        onPress={() => setShowFilters(false)}
                        className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full"
                    >
                        <X size={18} color="#374151" />
                    </TouchableOpacity>
                </View>
                
                <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
                    {/* Status Filter */}
                    <View className="mb-6 mt-4">
                        <Text className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Status</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {["", "success", "failed", "pending"].map((status) => (
                                <TouchableOpacity
                                    key={status || "all"}
                                    onPress={() => setStatusFilter(status)}
                                    className={`px-4 py-2.5 rounded-xl border ${
                                        statusFilter === status 
                                        ? "bg-green-50 border-green-500" 
                                        : "bg-white border-gray-200"
                                    }`}
                                >
                                    <Text className={`text-sm font-medium capitalize ${
                                        statusFilter === status ? "text-green-700" : "text-gray-600"
                                    }`}>
                                        {status || "All Status"}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Time Range */}
                    <View className="mb-6">
                        <Text className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Time Range</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {[
                                { label: "All Time", value: "" },
                                { label: "Last 7 Days", value: "7days" },
                                { label: "Last 30 Days", value: "30days" }
                            ].map((range) => (
                                <TouchableOpacity
                                    key={range.value}
                                    onPress={() => setDateFilter(range.value)}
                                    className={`px-4 py-2.5 rounded-xl border ${
                                        dateFilter === range.value 
                                        ? "bg-green-50 border-green-500" 
                                        : "bg-white border-gray-200"
                                    }`}
                                >
                                    <Text className={`text-sm font-medium ${
                                        dateFilter === range.value ? "text-green-700" : "text-gray-600"
                                    }`}>
                                        {range.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Service Type */}
                    <View className="mb-10">
                        <Text className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Service Type</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {[
                                { label: "All Services", value: "" },
                                { label: "Airtime", value: "airtime" },
                                { label: "Data", value: "data" },
                                { label: "Electricity", value: "electricity" },
                                { label: "Cable TV", value: "cable" },
                                { label: "Wallet", value: "wallet" },
                                { label: "Exam", value: "exam" },
                            ].map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    onPress={() => setTransactionTypeFilter(type.value)}
                                    className={`px-4 py-2.5 rounded-xl border ${
                                        transactionTypeFilter === type.value 
                                        ? "bg-green-50 border-green-500" 
                                        : "bg-white border-gray-200"
                                    }`}
                                >
                                    <Text className={`text-sm font-medium ${
                                        transactionTypeFilter === type.value ? "text-green-700" : "text-gray-600"
                                    }`}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                <View className="p-5 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <View className="flex-row gap-3">
                        <TouchableOpacity 
                            onPress={() => {
                                setStatusFilter("");
                                setDateFilter("");
                                setTransactionTypeFilter("");
                            }}
                            className="flex-1 py-3.5 rounded-xl bg-gray-100 items-center"
                        >
                            <Text className="text-gray-700 font-semibold">Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setShowFilters(false)}
                            className="flex-[2] py-3.5 rounded-xl bg-green-600 items-center shadow-sm shadow-green-200"
                        >
                            <Text className="text-white font-bold">Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
      </Modal>
    </ApSafeAreaView>
  );
}
