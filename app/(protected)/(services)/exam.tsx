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
import { Formik } from "formik";
import * as Yup from "yup";
import { ChevronRight } from "lucide-react-native";

import { RootState, AppDispatch } from "@/redux/store";
import { examLogos } from "@/constants/examlogo";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApScrollView from "@/components/scrollview/scrollview";
import ApHeader from "@/components/headers/header";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import BannerCarousel from "@/components/carousel/banner";
import { useToast } from "@/components/toast/toastProvider";
import PinModal from "@/components/modals/pinModal";
import { getRemitaServices, getRemitaPlanServices, purchaseExam } from "@/redux/features/easyAccess/service";

export default function ExamScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { showToast } = useToast();

  const { user } = useSelector((state: RootState) => state.auth);
  const { remitaPlans, remitaServices } = useSelector(
    (state: RootState) => state.easyAccessdataPlans
  );

  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [unitPrice, setUnitPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [pinVisible, setPinVisible] = useState(false);
  const [providerModal, setProviderModal] = useState(false);

  useEffect(() => {
    dispatch(getRemitaServices("5"));
  }, [dispatch]);

  const handleProviderSelect = async (provider: any) => {
    setSelectedProvider(provider);
    setSelectedPlan(null);
    setUnitPrice(0);
    setProviderModal(false);

    if (provider?.code) {
      dispatch(
        getRemitaPlanServices({
          categoryCode: "educations",
          productCode: provider.code.toLowerCase(),
        })
      );
    }
  };

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
    const price = plan?.amount || plan?.unitPrice || 0;
    setUnitPrice(Number(price));
  };

  const plans = Array.isArray(remitaPlans)
    ? remitaPlans
    : (remitaPlans as any)?.items || [];

  const formatProvider = (prov?: string) =>
    typeof prov === "string"
      ? prov.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
      : "default";

  const validationSchema = Yup.object({
    quantity: Yup.number().required("Enter quantity").min(1, "Minimum 1"),
    phone: Yup.string()
      .matches(/^[0-9]{11}$/, "Must be an 11-digit phone number")
      .required("Phone number required"),
  });

  const handleFormSubmit = async (formValues: any, enteredPin: string) => {
    if (!selectedPlan) return showToast("Please select an Exam Type", "error");

    if (!enteredPin || enteredPin.length !== 4) {
      showToast("Please enter a valid 4-digit PIN", "error");
      return;
    }

    try {
      const quantity = Number(formValues.quantity);
      const price = unitPrice > 0 ? unitPrice : Number(formValues.amount);
      const totalAmount = quantity * price;

      const payload = {
        productCode: selectedPlan?.code || "",
        pinCode: enteredPin,
        phoneNumber: formValues.phone,
        amount: totalAmount,
      };

      setLoading(true);

      const result = await dispatch(purchaseExam({ payload }));

      setLoading(false);

      if (purchaseExam.fulfilled.match(result)) {
        showToast("✅ Exam Pin purchase successful!", "success");
      } else {
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

  const banners = [
    require("../../../assets/images/banner1.png"),
    require("../../../assets/images/banner2.png"),
    require("../../../assets/images/banner3.png"),
  ];

  return (
    <ApSafeAreaView>
      <ApHeader title="Exam PIN Purchase" />
      <ApScrollView style={{ backgroundColor: "white" }}>
        <BannerCarousel
          images={banners}
          heightRatio={0.25}
          borderRadius={16}
          autoplayInterval={4000}
        />

        {/* Provider Selector */}
        <TouchableOpacity
          className="mt-4 p-3 mx-4 border border-gray-300 rounded-xl flex-row gap-4 items-center mb-2"
          onPress={() => setProviderModal(true)}
        >
          <View className="flex-1 flex-row justify-between">
            <View className="flex-1 flex-row gap-4 items-center">
              {selectedProvider && (
                <Image
                  source={
                    examLogos[formatProvider(selectedProvider.code)] ||
                    examLogos.default
                  }
                  style={{ width: 35, height: 35, borderRadius: 8 }}
                />
              )}
              <Text className="text-gray-700 font-semibold text-base">
                {selectedProvider?.name || "Select Exam Board"}
              </Text>
            </View>
            <ChevronRight color="gray" />
          </View>
        </TouchableOpacity>

        {/* Plans Grid */}
        {selectedProvider && (
          <View className="mt-4 px-4">
            <Text className="text-gray-800 font-bold text-lg mb-3">
              Select Exam Type
            </Text>

            {plans.length === 0 ? (
              <Text className="text-gray-500 italic">Loading plans...</Text>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {plans.map((plan: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handlePlanSelect(plan)}
                    className={`w-[48%] mb-3 p-4 rounded-2xl border ${
                      selectedPlan?.code === plan.code
                        ? "bg-green-50 border-green-500"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Text className="font-bold text-sm text-gray-800 mb-1">
                      {plan.name}
                    </Text>
                    <Text
                      className="text-gray-500 text-[10px] leading-tight mb-2"
                      numberOfLines={2}
                    >
                      {plan.description}
                    </Text>
                    <Text className="text-green-700 font-bold">
                      {plan.amount ? `₦${plan.amount}` : "Dynamic Price"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Purchase Form */}
        {selectedPlan && (
          <View className="mt-4 border-t border-gray-100 pt-4">
            <Text className="px-4 text-gray-800 font-bold text-lg mb-3">
              Enter Details
            </Text>
            <Formik
              initialValues={{
                quantity: "1",
                phone: "",
                amount: unitPrice > 0 ? String(unitPrice) : "",
              }}
              enableReinitialize
              validationSchema={validationSchema}
              onSubmit={(values) => {
                if (unitPrice === 0 && !values.amount) {
                  showToast("Please enter amount", "error");
                  return;
                }
                setPinVisible(true);
              }}
            >
              {({ handleChange, handleSubmit, values }) => (
                <View className="p-4 pt-0">
                  <ApTextInput
                    label="Quantity"
                    name="quantity"
                    placeholder="Enter number of PINs"
                    keyboardType="numeric"
                    onChangeText={handleChange("quantity")}
                    value={values.quantity}
                  />

                  <ApTextInput
                    label="Phone Number"
                    name="phone"
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    onChangeText={handleChange("phone")}
                    value={values.phone}
                  />

                  <ApTextInput
                    label="Amount (per PIN)"
                    name="amount"
                    value={unitPrice > 0 ? String(unitPrice) : values.amount}
                    editable={unitPrice === 0}
                    onChangeText={handleChange("amount")}
                    placeholder="Enter Amount"
                  />

                  <ApTextInput
                    label="Total Amount"
                    name="totalAmount"
                    valueOverride={String(
                      (Number(values.quantity) || 0) *
                        (unitPrice > 0
                          ? unitPrice
                          : Number(values.amount) || 0)
                    )}
                    disabled={true}
                    placeholder="0"
                  />

                  <ApButton
                    title={
                      loading ? "Processing..." : `Buy ${selectedPlan.name}`
                    }
                    onPress={handleSubmit as any}
                    disabled={loading}
                  />

                  <PinModal
                    visible={pinVisible}
                    loading={loading}
                    onClose={() => {
                      if (!loading) setPinVisible(false);
                    }}
                    onSubmit={(pin) => {
                      setPinCode(pin);
                      handleFormSubmit(values, pin);
                    }}
                  />
                </View>
              )}
            </Formik>
          </View>
        )}

        {/* Provider Modal */}
        <Modal visible={providerModal} transparent animationType="fade">
          <View className="flex-1 bg-black/40 justify-center items-center">
            <View className="w-[90%] bg-white p-5 rounded-2xl">
              <Text className="text-xl font-semibold mb-4">
                Select Exam Board
              </Text>

              <ScrollView>
                {Array.isArray(remitaServices) &&
                  remitaServices.map((item: any) => (
                    <TouchableOpacity
                      key={item.code || item.name}
                      className="flex-row items-center p-3 border-b border-gray-100"
                      onPress={() => handleProviderSelect(item)}
                    >
                      <Image
                        source={
                          examLogos[formatProvider(item.code)] ||
                          examLogos.default
                        }
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                      />
                      <Text className="ml-3 text-base font-semibold">
                        {item.name}
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
      </ApScrollView>
    </ApSafeAreaView>
  );
}
