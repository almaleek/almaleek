import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";

import { RootState, AppDispatch } from "@/redux/store";

import { examLogos } from "@/constants/examlogo";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApScrollView from "@/components/scrollview/scrollview";
import ApHeader from "@/components/headers/header";
import { useToast } from "@/components/toast/toastProvider";
import PinModal from "@/components/modals/pinModal";
import {
  fetchDataPlans,
  getExamServices,
  purchaseExam as purchaseExamPin,
} from "@/redux/features/easyAccess/service";
import BannerCarousel from "@/components/carousel/banner";
const banners = [
  require("../../../assets/images/banner1.png"),
  require("../../../assets/images/banner2.png"),
  require("../../../assets/images/banner3.png"),
];

export default function ExamScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { showToast } = useToast();

  const { user } = useSelector((state: RootState) => state.auth);
  const { examServices, plans } = useSelector(
    (state: RootState) => state.easyAccessdataPlans
  );

  const [providerModal, setProviderModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [pinCode, setPinCode] = useState("");
  const [pinVisible, setPinVisible] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [details, setDetails] = useState<any[]>([]);

  useEffect(() => {
    dispatch(getExamServices());
  }, [dispatch]);


  const fetchExamPlans = async (providerName: string) => {
    setPlansLoading(true);
    try {
      const result = await dispatch(
        fetchDataPlans({
          network: providerName.split(" ")[0],
          // category: "exam"
        })
      );
      if (fetchDataPlans.fulfilled.match(result)) {
        const payload: any = result.payload || {};
        const serverPlans: any[] = payload.plans || [];
        if (serverPlans.length) {
          const first = serverPlans[0];
          setSelectedPlan(first);
        }
      } else {
        showToast(result.payload || "Failed to fetch exam plans", "error");
      }
    } catch (err) {
      showToast("Unexpected error fetching exam plans", "error");
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    if (!Array.isArray(examServices) || !examServices.length) return;
    if (selectedProvider) return;
    const defaultService = examServices[0];
    setSelectedProvider(defaultService);
    fetchExamPlans(defaultService.name || "");
  }, [examServices, selectedProvider]);

  const handleCategorySelect = (product: any) => {
    setSelectedProvider(product);
    setSelectedPlan(product);
    setProviderModal(false);
  };

  const formatProvider = (prov?: string) =>
    typeof prov === "string"
      ? prov
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
      : "default";

  const handlePurchase = async (enteredPin: string) => {
    if (!selectedProvider || !selectedPlan)
      return showToast("Please select an Exam plan", "error");

    if (!enteredPin || enteredPin.length !== 4) {
      showToast("Please enter a valid 4-digit PIN", "error");
      return;
    }

    try {
      const amount =
        selectedPlan?.ourPrice ||
        selectedPlan?.amount ||
        selectedPlan?.unitPrice ||
        0;
      if (!amount) {
        showToast("Invalid plan amount", "error");
        return;
      }

      const payload = {
        pinCode: enteredPin,
        planId:
          selectedPlan?._id ||
          selectedPlan?.id ||
          selectedPlan?.planId ||
          "",
        productCode:
          selectedPlan?.code ||
          selectedPlan?.productCode ||
          selectedProvider?.code ||
          selectedProvider?.name,
        phone: (user as any)?.phoneNumber || (user as any)?.phone || "",
        amount: Number(amount),
      };

      setLoading(true);

      const result = await dispatch(
        purchaseExamPin({ payload }) as any
      );

      
      setLoading(false);

      // --- SUCCESS HANDLER ---
      if (purchaseExamPin.fulfilled.match(result)) {
        showToast("✅ Exam Pin purchase successful!", "success");
      }

      if (!purchaseExamPin.fulfilled.match(result)) {
        showToast(result?.payload?.error || "Exam purchase failed..", "error");
      }
    } catch (error: any) {
      setLoading(false);
      showToast(error?.message || "Something went wrong! Try again.", "error");
    } finally {
      setLoading(false);
      setPinVisible(false);
      setPinCode("");
    }
  };

  return (
    <ApSafeAreaView>
      <ApHeader title="Exam PIN Purchase" />

       <BannerCarousel
                images={banners}
                heightRatio={0.25}
                borderRadius={16}
                autoplayInterval={4000}
              />

      <ApScrollView style={{ backgroundColor: "white" }}>
        <View className="p-4">
          <TouchableOpacity
            className="p-4 border-b border-gray-300 rounded-xl flex-row justify-between items-center mb-4"
            onPress={() => setProviderModal(true)}
          >
            <View className="flex-row items-center gap-3">
              <Image
                source={
                  selectedProvider?.code || selectedProvider?.name
                    ? examLogos[
                        formatProvider(
                          selectedProvider.code || selectedProvider.name
                        )
                      ] || examLogos.default
                    : examLogos.default
                }
                style={{ width: 35, height: 35, borderRadius: 8 }}
              />

              <Text className="text-gray-700 font-semibold">
                {selectedProvider?.name ||
                  selectedProvider?.productName ||
                  "Select Exam Type"}
              </Text>
            </View>
          </TouchableOpacity>

          {plansLoading && (
            <Text className="text-center text-gray-500 mb-2">
              Loading plans...
            </Text>
          )}

          {!plansLoading && Array.isArray(plans) && plans.length === 0 && (
            <Text className="text-center text-gray-500 mb-2">
              No plans available
            </Text>
          )}

          {!plansLoading &&
            Array.isArray(plans) &&
            plans.length > 0 && (
              <View className="mt-2 flex-row flex-wrap justify-between">
                {plans.map((plan: any, index: number) => {
                  const amount =
                    plan?.ourPrice || plan?.amount || plan?.unitPrice || 0;

                  return (
                    <TouchableOpacity
                      key={plan._id || plan.name || index}
                      className="w-[32%] bg-gray-100 border border-gray-200 rounded-xl p-4 mb-4"
                      onPress={() => {
                        setSelectedPlan(plan);
                        setDetails([
                          {
                            label: "Exam Type",
                            value:
                              selectedProvider?.name ||
                              selectedProvider?.productName ||
                              "N/A",
                          },
                          {
                            label: "Plan",
                            value: plan.name || plan.productName || "N/A",
                          },
                          {
                            label: "Validity",
                            value: plan.validity || "N/A",
                          },
                          {
                            label: "Amount",
                            value: `₦${amount}`,
                          },
                          {
                            label: "Phone",
                            value:
                              (user as any)?.phoneNumber ||
                              (user as any)?.phone ||
                              "N/A",
                          },
                        ]);
                        setPinVisible(true);
                      }}
                    >
                      <Text className="text-[16px] font-semibold text-center">
                        {plan.name || plan.productName || "Exam Plan"}
                      </Text>
                      <Text className="text-gray-600 text-xs mt-1 text-center bg-green-100 px-2 py-1 rounded-full">
                        {plan.validity || "Validity N/A"}
                      </Text>
                      <Text className="text-green-600 font-semibold mt-2 text-center text-lg">
                        ₦{amount}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {Array.from({ length: (3 - (plans.length % 3)) % 3 }).map(
                  (_, i) => (
                    <View key={`phantom-${i}`} className="w-[32%] mb-4" />
                  )
                )}
              </View>
            )}

          <Modal visible={providerModal} transparent animationType="fade">
            <View className="flex-1 justify-center items-center bg-black/40 px-4">
              <View className="bg-white w-full rounded-2xl p-5">
                <Text className="text-xl font-semibold mb-4 text-center">
                  Select Exam Type
                </Text>

                <ScrollView>
                  {Array.isArray(examServices) &&
                    examServices.map((item: any) => (
                      <TouchableOpacity
                        key={item.code || item._id || item.name}
                        className="flex-row items-center p-3 border-b border-gray-200"
                        onPress={() => {
                          handleCategorySelect(item);
                          fetchExamPlans(item.name || item.productName || "");
                        }}
                      >
                        <Image
                          source={
                            examLogos[
                              formatProvider(item.code || item.productCode)
                            ] || examLogos.default
                          }
                          style={{ width: 40, height: 40, borderRadius: 50 }}
                        />
                        <Text className="ml-3 text-base font-semibold">
                          {item.name || item.productName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity
                  className="mt-4 p-3 bg-red-500 rounded-lg"
                  onPress={() => setProviderModal(false)}
                >
                  <Text className="text-white text-center font-semibold">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <PinModal
            visible={pinVisible}
            loading={loading}
            title="Review Exam Purchase"
            details={details}
            onClose={() => {
              if (!loading) setPinVisible(false);
            }}
            onSubmit={(pin) => {
              setPinCode(pin);
              handlePurchase(pin);
            }}
          />
        </View>
      </ApScrollView>
    </ApSafeAreaView>
  );
}
