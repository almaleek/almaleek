import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchUserTransactions } from "@/redux/features/transaction/transactionSlice";
import { Filter, X, Receipt } from "lucide-react-native";
import ApHomeHeader from "@/components/headers/homeheader";
import { useRouter } from "expo-router";
import { Phone, Wifi, Tv, Wallet, Bolt, Smartphone } from "lucide-react-native";
import debounce from "lodash.debounce";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";

const iconColors: Record<string, string> = {
  airtime: "#1E90FF",
  data: "#00C851",
  cable: "#FF8800",
  electricity: "#FFC107",
  wallet: "#6A5ACD",
  transfer: "#FF4444",
  default: "#444444",
};

const serviceIcons: Record<string, any> = {
  airtime: Phone,
  data: Wifi,
  cable: Tv,
  electricity: Bolt,
  wallet: Wallet,
  transfer: Receipt,
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success":
      case "refund":
        return "text-green-700 bg-green-200";
      case "failed":
        return "text-red-700 bg-red-200";
      default:
        return "text-yellow-700 bg-yellow-200";
    }
  };

  const getServiceIcon = (service: any) => {
    const key = (service || "").toLowerCase();
    return {
      Icon: serviceIcons[key] || Smartphone,
      color: iconColors[key] || iconColors.default,
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
    return (
      <TouchableOpacity
        key={item?._id}
        onPress={() =>
          router.push({
            pathname: "/(protected)/history/[id]",
            params: { id: item?._id },
          } as never)
        }
        className="bg-green-50 p-4 mb-3 rounded-xl border border-gray-100 shadow-sm"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-4">
            <View
              className="rounded-full p-2"
              style={{ backgroundColor: color, borderRadius: 50 }}
            >
              <Icon size={22} color="white" strokeWidth={2} />
            </View>
            <Text className="text-md text-gray-600 font-semibold capitalize">
              {item?.service || "Transaction"}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Text
              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                item.status
              )}`}
            >
              {item.status}
            </Text>

            {item.status === "failed" && (
              <Text
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                  "success"
                )}`}
              >
                refunded
              </Text>
            )}
          </View>
        </View>

        <Text className="text-[1.5rem] font-bold text-gray-900">
          ₦{Number(item?.amount || 0).toLocaleString()}
        </Text>

        <View className="flex-row justify-between mt-3">
          <Text className="text-gray-700 text-md">
            <Text className="font-semibold text-md">Prev: </Text>₦
            {Number(item?.previous_balance || 0).toLocaleString()}
          </Text>

          <Text className="text-gray-700 text-md">
            <Text className="font-semibold text-md">New: </Text>₦
            {Number(item?.new_balance || 0).toLocaleString()}
          </Text>
        </View>

        <Text className="text-gray-500 text-[11px] mt-3">
          {getTxnDate(item).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ApSafeAreaView>
      <View className="pt-4">
        <ApHomeHeader />
      </View>

      {/* Search & Filter */}
      <View className="px-2 py-3 bg-white flex-row items-center gap-2 border-b border-gray-200">
        <TextInput
          placeholder="Search (service, ref, note...)"
          onChangeText={(text) => {
            setProductFilter(text);
            handleProductFilter(text);
          }}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />

        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          className="flex-row items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg"
        >
          <Filter size={18} color="#555" />
          <Text className="text-sm text-gray-700">
            Filters {activeFiltersCount ? `• ${activeFiltersCount}` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <View className="flex-row justify-between mb-2">
            <Text className="font-semibold text-gray-700">Filter</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={20} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Status */}
          <FlatList
            horizontal
            data={["", "success", "failed", "pending"]}
            keyExtractor={(item) => item || "all"}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setStatusFilter(item)}
                className={`px-4 py-1 rounded-full mr-2 ${
                  statusFilter === item ? "bg-blue-500" : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-sm ${
                    statusFilter === item ? "text-white" : "text-gray-700"
                  }`}
                >
                  {item ? item[0].toUpperCase() + item.slice(1) : "All"}
                </Text>
              </TouchableOpacity>
            )}
          />
          {/* Add other filter scrolls similarly if needed */}
        </View>
      )}

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 16 }}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Receipt size={50} color="#bbb" />
            <Text className="text-gray-400 mt-3">No Transactions Found</Text>
          </View>
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </ApSafeAreaView>
  );
}
