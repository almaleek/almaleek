import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";

import { RootState, AppDispatch } from "@/redux/store";

import { examLogos } from "@/constants/examlogo";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApScrollView from "@/components/scrollview/scrollview";
import ApHeader from "@/components/headers/header";
import { useToast } from "@/components/toast/toastProvider";
import PinModal from "@/components/modals/pinModal";
import ApButton from "@/components/button/button";
import {
  fetchDataPlans,
  getExamServices,
  purchaseExam as purchaseExamPin,
} from "@/redux/features/easyAccess/service";
import BannerCarousel from "@/components/carousel/banner";
import { Ionicons } from "@expo/vector-icons";
const banners = [
  require("../../../assets/images/banner1.png"),
  require("../../../assets/images/banner2.png"),
  require("../../../assets/images/banner3.png"),
];

const ExamSchema = Yup.object().shape({
  phone: Yup.string()
    .required("Phone number is required")
    .matches(/^[0-9]{11}$/, "Enter a valid 11-digit phone number"),
});

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
  const [useCashback, setUseCashback] = useState(false);

  useEffect(() => {
    dispatch(getExamServices());
  }, [dispatch]);

  const fetchExamPlans = async (provider: any) => {
    setPlansLoading(true);
    try {
      const providerName = (
        provider.name ||
        provider.productName ||
        provider.code ||
        provider ||
        ""
      )
        .split(" ")[0]
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

      const result = await dispatch(
        fetchDataPlans({
          network: providerName,
          serviceType: "exam",
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
    if (selectedProvider) {
      return;
    }
    const defaultService = examServices[0];
    setSelectedProvider(defaultService);
    fetchExamPlans(defaultService);
  }, [examServices, selectedProvider]);

  const formatProvider = (prov?: string) =>
    typeof prov === "string"
      ? prov
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
      : "default";

  const openProviderModal = () => setProviderModal(true);
  const closeProviderModal = () => setProviderModal(false);

  const handleSelectProvider = (product: any) => {
    setSelectedProvider(product);
    closeProviderModal();
    fetchExamPlans(product);
  };

  const handlePurchase = async (payload: { phone: string }, enteredPin: string) => {
    if (!selectedProvider || !selectedPlan) {
      showToast("Please select an Exam plan", "error");
      return;
    }
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

      const requestPayload = {
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
        phone: String(payload.phone || "").trim(),
        amount: Number(amount),
        useCashback,
      };

      setLoading(true);

      const result = await dispatch(
        purchaseExamPin({ payload: requestPayload }) as any
      );

      setLoading(false);

      if (purchaseExamPin.fulfilled.match(result)) {
        showToast("✅ Exam Pin purchase successful!", "success");
        const transactionId =
          result?.payload?.transactionId || result?.payload?.transaction?._id;
        router.push({
          pathname: "/(protected)/(services)/success",
          params: { 
            status: "success",
            service: "Exam PIN",
            network: selectedProvider?.name || selectedProvider?.productName,
            amount: amount,
            number: payload.phone,
            transactionId: transactionId || ""
          },
        });
      } else {
        const transactionId =
          result?.payload?.transactionId || result?.payload?.transaction?._id;
        router.push({
          pathname: "/(protected)/(services)/success",
          params: { 
            status: "failed",
            service: "Exam PIN",
            network: selectedProvider?.name || selectedProvider?.productName,
            amount: amount,
            number: payload.phone,
            message: result?.payload?.error || "Exam purchase failed..",
            transactionId: transactionId || ""
          },
        });
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
      <ApScrollView style={{ backgroundColor: "white" }}>
        <ApHeader title="Exam PIN Purchase" />

        <BannerCarousel
          images={banners}
          heightRatio={0.25}
          borderRadius={16}
          autoplayInterval={4000}
        />

        <Formik
          initialValues={{
            phone: (user as any)?.phoneNumber || (user as any)?.phone || "",
          }}
          validationSchema={ExamSchema}
          enableReinitialize
          onSubmit={(values) => {
            if (!selectedProvider) {
              showToast("Please select an Exam type", "error");
              return;
            }
            if (!selectedPlan) {
              showToast("Please select a plan", "error");
              return;
            }

            const amount =
              selectedPlan?.ourPrice || selectedPlan?.amount || selectedPlan?.unitPrice || 0;

            setDetails([
              {
                label: "Exam Type",
                value:
                  selectedProvider?.name || selectedProvider?.productName || "N/A",
              },
              {
                label: "Plan",
                value: selectedPlan?.name || selectedPlan?.productName || "N/A",
              },
              { label: "Phone", value: String(values.phone || "").trim() },
              { label: "Amount", value: `₦${Number(amount).toLocaleString()}` },
            ]);
            setPinVisible(true);
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
            <>
              <TouchableOpacity
                className="mx-4 mt-4 p-4 border border-gray-300 rounded-xl flex-row justify-between items-center"
                onPress={openProviderModal}
              >
                <View className="flex-row items-center gap-4">
                  <Image
                    source={
                      selectedProvider
                        ? examLogos[
                            formatProvider(
                              selectedProvider.code ||
                                selectedProvider.productCode ||
                                selectedProvider.name
                            )
                          ] || examLogos.default
                        : examLogos.default
                    }
                    style={{ width: 35, height: 35, borderRadius: 8 }}
                  />

                  <Text className="text-gray-700 font-semibold text-base">
                    {selectedProvider?.name ||
                      selectedProvider?.productName ||
                      "Select Exam Type"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="gray" />
              </TouchableOpacity>

              <View className="mx-4 mt-4">
                <Text className="text-gray-500 mb-1">Phone Number</Text>
                <View className="flex-row items-center border border-gray-300 rounded-xl px-3">
                  <TextInput
                    value={values.phone}
                    onChangeText={(text) => {
                      const cleaned = String(text || "")
                        .replace(/\s+/g, "")
                        .replace(/[^\d]/g, "");
                      handleChange("phone")(cleaned);
                    }}
                    onBlur={handleBlur("phone")}
                    keyboardType="numeric"
                    placeholder="Enter phone number"
                    className="flex-1 py-3 text-lg"
                    maxLength={11}
                  />
                  <Ionicons name="call-outline" size={22} color="gray" />
                </View>
                {touched.phone && errors.phone && (
                  <Text className="text-red-500 text-xs mt-1">
                    {String(errors.phone)}
                  </Text>
                )}
              </View>

              <View className="mt-6 mx-4">
                <Text className="text-gray-700 font-semibold text-base mb-3">
                  Select Plan
                </Text>

                {plansLoading ? (
                  <Text className="text-center text-gray-500 mb-2">
                    Loading plans...
                  </Text>
                ) : !Array.isArray(plans) || plans.length === 0 ? (
                  <Text className="text-center text-gray-500 mb-2">
                    No plans available
                  </Text>
                ) : (
                  <View className="flex-row flex-wrap justify-between">
                    {plans.map((plan: any, index: number) => {
                      const amount =
                        plan?.ourPrice || plan?.amount || plan?.unitPrice || 0;
                      const isSelected =
                        (selectedPlan?._id &&
                          plan?._id &&
                          selectedPlan._id === plan._id) ||
                        (!selectedPlan?._id &&
                          selectedPlan?.name &&
                          selectedPlan.name === plan?.name);

                      return (
                        <TouchableOpacity
                          key={plan._id || plan.name || index}
                          className={`w-[32%] p-4 rounded-xl mb-4 border ${
                            isSelected
                              ? "bg-green-100 border-green-500"
                              : "bg-gray-50 border-gray-200"
                          }`}
                          onPress={() => setSelectedPlan(plan)}
                        >
                          <Text className="text-[16px] font-semibold text-center">
                            {plan.name || plan.productName || "Exam Plan"}
                          </Text>
                          <Text className="text-gray-600 text-xs mt-1 text-center bg-white px-2 py-1 rounded-full">
                            {plan.validity || "Validity N/A"}
                          </Text>
                          <Text className="text-green-600 font-semibold mt-2 text-center text-lg">
                            ₦{Number(amount).toLocaleString()}
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
              </View>

              <View className="px-4 mt-6 mb-10">
                <ApButton
                  title="Buy Exam Pin"
                  onPress={handleSubmit as any}
                  loading={loading}
                />
              </View>

              <PinModal
                visible={pinVisible}
                loading={loading}
                title="Review Exam Purchase"
                details={details}
                useCashback={useCashback}
                setUseCashback={setUseCashback}
                cashbackBalance={user?.cashbackBalance ?? 0}
                onClose={() => {
                  if (!loading) setPinVisible(false);
                }}
                onSubmit={(pin) => {
                  setPinCode(pin);
                  handlePurchase({ phone: values.phone }, pin);
                }}
              />

              <Modal visible={providerModal} transparent animationType="fade">
                <View className="flex-1 bg-black/40 justify-center items-center px-4">
                  <View className="bg-white rounded-2xl w-full max-h-[70%] p-5">
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-xl font-bold text-gray-900">
                        Select Exam Type
                      </Text>
                      <TouchableOpacity onPress={closeProviderModal}>
                        <Ionicons
                          name="close-circle"
                          size={28}
                          color="#374151"
                        />
                      </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                      {Array.isArray(examServices) &&
                        examServices.map((item: any) => {
                          const formatted = formatProvider(
                            item.code || item.productCode || item.name || ""
                          );
                          const logo = examLogos[formatted] || examLogos.default;
                          return (
                            <TouchableOpacity
                              key={item.code || item._id || item.name}
                              className="flex-row items-center p-4 border-b border-gray-100"
                              onPress={() => handleSelectProvider(item)}
                            >
                              <Image
                                source={logo}
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 50,
                                }}
                              />
                              <View className="ml-4 flex-1">
                                <Text className="text-lg font-semibold text-gray-800">
                                  {item.name || item.productName}
                                </Text>
                              </View>
                              <Ionicons
                                name="chevron-forward"
                                size={18}
                                color="#ccc"
                              />
                            </TouchableOpacity>
                          );
                        })}
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              {(loading || plansLoading) && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.35)",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 9999,
                  }}
                >
                  <ActivityIndicator size="large" color="#32d47a" />
                  <Text style={{ color: "white", marginTop: 12 }}>
                    Processing...
                  </Text>
                </View>
              )}
            </>
          )}
        </Formik>
      </ApScrollView>
    </ApSafeAreaView>
  );
}
 