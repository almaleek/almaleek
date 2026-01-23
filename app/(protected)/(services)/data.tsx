import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import ApHeader from "@/components/headers/header";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApScrollView from "@/components/scrollview/scrollview";
import BannerCarousel from "@/components/carousel/banner";
import NetworkPhonePicker from "@/components/network/networkPicker";
import PinModal from "@/components/modals/pinModal";

import { useToast } from "@/components/toast/toastProvider";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";

import {
  getDataServices,
  fetchDataCategories,
  purchaseData,
  fetchDataPlans,
} from "@/redux/features/easyAccess/service";

import { RootState, AppDispatch } from "@/redux/store";
import { useFocusEffect } from "@react-navigation/native";

// Banner Images
const banners = [
  require("../../../assets/images/banner1.png"),
  require("../../../assets/images/banner2.png"),
  require("../../../assets/images/banner3.png"),
];

export default function DataPlanScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { showToast } = useToast();

  const [phone, setPhone] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<{
    name: string;
    logo: any;
  } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [pinVisible, setPinVisible] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);
  const { plans, dataServices } = useSelector(
    (state: RootState) => state.easyAccessdataPlans
  );

  // Load Data Services
  useFocusEffect(
    useCallback(() => {
      dispatch(getDataServices("data") as any);
    }, [dispatch])
  );

  // Initialize default network and categories
  useEffect(() => {
    if (dataServices.length) {
      const defaultService =
        dataServices.find((s: any) => s.name.toLowerCase() === "mtn") ||
        dataServices[0];

      const defaultNetwork = {
        name: defaultService.name,
        logo: defaultService.image || require("../../../assets/images/mtn.png"),
      };

      setSelectedNetwork(defaultNetwork);
      loadCategoriesAndPlans(defaultNetwork);
    }
  }, [dataServices]);

  // Load categories and plans for a network
  const loadCategoriesAndPlans = async (network: { name: string }) => {
    try {
      const result = await dispatch(
        fetchDataCategories({
          network: network.name.split(" ")[0],
          serviceType: "data",
        })
      );

      if (fetchDataCategories.fulfilled.match(result)) {
        const cats = result.payload || [];
        setCategories(cats);

        const firstCategory = cats[0] || "";
        setActiveTab(firstCategory);

        if (firstCategory) {
          fetchPlans(network.name, firstCategory);
        }
      } else {
        showToast(result.payload || "Failed to fetch categories", "error");
      }
    } catch (err) {
      showToast("Error fetching categories", "error");
    }
  };

  // Fetch plans based on network + category
  const fetchPlans = async (networkName: string, category: string) => {
    setPlansLoading(true);
    try {
      const result = await dispatch(
        fetchDataPlans({ network: networkName.split(" ")[0], category })
      );

      if (!fetchDataPlans.fulfilled.match(result)) {
        showToast(result.payload || "Failed to fetch plans", "error");
      }
    } catch {
      showToast("Unexpected error while fetching plans", "error");
    } finally {
      setPlansLoading(false);
    }
  };

  // Handle network selection
  const handleNetworkSelect = async (network: { name: string; logo: any }) => {
    setSelectedNetwork(network);
    loadCategoriesAndPlans(network);
  };

  // Handle purchase submission
  const handleFormSubmit = async (pin: string) => {
    if (!selectedPlan || !selectedNetwork) return;

    const payload = {
      networkId: selectedNetwork.name.split(" ")[0].toLowerCase(),
      userId: user?._id,
      dataType: selectedPlan.category,
      planId: selectedPlan._id,
      phone,
      amount: selectedPlan.ourPrice,
      pinCode: pin,
    };

    try {
      setLoading(true);
      const resultAction = await dispatch(purchaseData(payload as any));
      if (purchaseData.fulfilled.match(resultAction)) {
        showToast("Data purchase successful!", "success");
        router.push({
          pathname: "/(protected)/history/[id]",
          params: { id: resultAction.payload.transactionId },
        });
      } else {
        const transactionId = resultAction.payload?.transactionId;
        if (transactionId) {
          router.push({
            pathname: "/(protected)/history/[id]",
            params: { id: transactionId },
          });
        } else {
          showToast(resultAction.payload?.error || "Purchase failed", "error");
        }
      }
    } finally {
      setLoading(false);
      setPinVisible(false);
      setPinCode("");
    }
  };

  return (
    <ApSafeAreaView>
      <ApScrollView style={{ backgroundColor: "white" }}>
        <ApHeader title="Data Plans" />

        <BannerCarousel
          images={banners}
          heightRatio={0.25}
          borderRadius={16}
          autoplayInterval={4000}
        />

        {/* Network Picker */}
        {selectedNetwork && (
          <NetworkPhonePicker
            selectedNetwork={selectedNetwork as any}
            setSelectedNetwork={handleNetworkSelect as any}
            phone={phone}
            setPhone={setPhone}
            networks={dataServices.map((s: any) => ({
              name: s.name,
              image: s.image || require("../../../assets/images/mtn.png"),
            }))}
          />
        )}

        {/* Category Tabs */}
        <View className="px-4 mt-6">
          <Text className="text-gray-800 text-lg font-semibold mb-3">
            Data Plans
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setActiveTab(cat);
                  selectedNetwork && fetchPlans(selectedNetwork.name, cat);
                }}
                className="mr-6 pb-2"
              >
                <Text
                  className={`text-base ${
                    activeTab === cat
                      ? "text-green-600 font-bold"
                      : "text-gray-500"
                  }`}
                >
                  {cat}
                </Text>
                {activeTab === cat && (
                  <View className="h-1 bg-green-600 mt-1 rounded-full" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Plans */}
        {plansLoading ? (
          <View className="px-4 mt-4 flex-row justify-center">
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : (
          <View className="px-4 mt-4 flex-row flex-wrap justify-between">
            {plans.map((p, i) => (
              <TouchableOpacity
                key={i}
                className="w-[32%] bg-gray-100 border border-gray-200 rounded-xl p-4 mb-4"
                onPress={() => {
                  setSelectedPlan(p);
                  setPinVisible(true);
                }}
              >
                <Text className="text-[20px] font-semibold text-center">
                  {p.name.match(/\d+(\.\d+)?(GB|MB)/i)?.[0]}
                </Text>
                <Text className="text-gray-600 text-sm mt-1 text-center bg-green-100 px-2 py-1 rounded-full">
                  {p.validity}
                </Text>
                <Text className="text-green-600 font-semibold mt-1 text-center text-lg">
                  ₦{p.ourPrice}
                </Text>
              </TouchableOpacity>
            ))}
            {/* Phantom views for alignment */}
            {Array.from({ length: (3 - (plans.length % 3)) % 3 }).map(
              (_, i) => (
                <View key={`phantom-${i}`} className="w-[32%] mb-4" />
              )
            )}
          </View>
        )}

        {/* PIN Modal */}
        <PinModal
          visible={pinVisible}
          onClose={() => setPinVisible(false)}
          loading={loading}
          onSubmit={(pin) => {
            setPinCode(pin);
            handleFormSubmit(pin);
          }}
        />
      </ApScrollView>
    </ApSafeAreaView>
  );
}
