import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApScrollView from "@/components/scrollview/scrollview";
import ApHeader from "@/components/headers/header";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  getRemitaPlanServices,
  getRemitaServices,
  handleVerifyMeter,
  purchaseElectricity

} from "@/redux/features/easyAccess/service";
import { electricityLogos } from "@/constants/eletricitylog";
import { useToast } from "@/components/toast/toastProvider";
import { useRouter } from "expo-router";

import PinModal from "@/components/modals/pinModal"; // expects `loading` prop
import BannerCarousel from "@/components/carousel/banner";

const banners = [
  require("../../../assets/images/banner1.png"),
  require("../../../assets/images/banner2.png"),
  require("../../../assets/images/banner3.png"),
];

// --------------------
// Form Validation
// --------------------
const ElectricitySchema = Yup.object().shape({
  meterno: Yup.string()
    .required("Meter number is required")
    .min(5, "Enter a valid meter number"),
  amount: Yup.number()
    .required("Amount is required")
    .min(100, "Minimum amount is ₦100"),
});

const presetAmounts = ["1000", "2000", "3000", "5000", "10000", "20000"];

interface CustomerDetails {
  name?: string;
  address?: string;
}

export default function ElectricityScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { showToast } = useToast();

  // UI state
  const [selectedTab, setSelectedTab] = useState<"prepaid" | "postpaid">(
    "prepaid"
  );
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);
  const [providerModal, setProviderModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const [loading, setLoading] = useState(false); // used for both verify & purchase
  const [isMeterVerified, setIsMeterVerified] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({});
  const [pinVisible, setPinVisible] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const {remitaPlans, remitaServices} = useSelector((state:RootState)=>state.easyAccessdataPlans)

  const defaultProvider = {
    name: "IBEDC",
    logo: electricityLogos.default,
  };

  const { user } = useSelector((state: RootState) => state.auth);

  // Load providers once
  useEffect(() => {
    dispatch(getRemitaServices("1"));
    dispatch(
      getRemitaPlanServices({ categoryCode: "electricity", productCode: "ibedc" })
    );
  }, [dispatch]);

  const plans = Array.isArray(remitaPlans)
    ? remitaPlans
    : (remitaPlans as any)?.items || [];

  const remitaPlanCode = plans.find((c: any) =>
    c.name?.toLowerCase().includes(selectedTab.toLowerCase())
  )?.code;


  const formatProvider = (prov: string) =>
    prov
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "default";

  //
  // VERIFY METER
  //
  const verifyMeter = async (
    values: {
      meterno: string;
      company?: string;
      metertype?: string;
      amount?: string | number;
      phone?: string;
    },
    setFieldValue?: (field: string, value: any) => void
  ) => {
    if (!values.meterno) {
      showToast("Enter meter number first", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        productCode:remitaPlanCode,
        company: selectedProvider?.code + "electric" || "ibedc",
        metertype: (values.metertype || selectedTab).toLowerCase() === "prepaid" ? "01" : "02",
        meterno: values.meterno,
        amount: values.amount ? Number(values.amount) : 1000,
      };

      const resultAction = await dispatch(handleVerifyMeter(payload));

      if (handleVerifyMeter.fulfilled.match(resultAction)) {
        const res = resultAction.payload?.message.content || resultAction.payload || {};
        console.log(res, "the response")
        const name =
          res?.customerName ||
          res?.nameOnAccount ||
          res?.Customer_Name ||
          res?.name ||
          "";
        const address =
          res?.address ||
          res?.data?.Address ||
          res?.Address ||
          "";
        setCustomerDetails({ name, address });
        setIsMeterVerified(true);
        showToast("✅ Meter number verified successfully!", "success");
      } else {
        const errPayload = resultAction.payload as any;
        const errorMessage =
          errPayload?.message || "Verification failed from provider";
        showToast(errorMessage, "error");
        setCustomerDetails({});
        setIsMeterVerified(false);
        setFieldValue?.("amount", "");
        setFieldValue?.("metertype", "");
      }
    } catch (err: any) {
      console.error("verifyMeter error:", err);
      showToast(
        err?.message || "Unexpected error verifying meter number",
        "error"
      );
      setCustomerDetails({});
      setIsMeterVerified(false);
    } finally {
      setLoading(false);
    }
  };

  //
  // HANDLE PURCHASE
  //
  const performPurchase = async (values: any, pin: string) => {
    if (!isMeterVerified) {
      showToast("Please verify your meter number first!", "error");
      return;
    }
    if (!pin || pin.length !== 4) {
      showToast("Please enter a valid 4-digit PIN", "error");
      return;
    }

    const payload = {
      discoCode: selectedProvider?.code || "",
      meterNumber: values.meterno,
      meterType:
        (values.metertype || selectedTab).toLowerCase() === "prepaid" ? "01" : "02",
      amount: Number(values.amount),
      pinCode:pin,
    };

    setLoading(true);
    try {
      const resultAction = await dispatch(purchaseElectricity(payload));
      const resPayload = resultAction.payload as any;
      console.log(resPayload, "the payload");

      if (purchaseElectricity.fulfilled.match(resultAction)) {
        showToast("✅ Electricity vend successful!", "success");
      } else {
        showToast(resPayload?.error || resPayload?.message || "Purchase failed", "error");
      }
      // Navigate if transactionId exists, regardless of success/failure
      if (resPayload?.transactionId) {
        router.push({
          pathname: "/(protected)/history/[id]",
          params: { id: resPayload.transactionId },
        });
      }
    } finally {
      setLoading(false);
      setPinVisible(false);
      setPinCode("");
    }
  };

  //
  // UI helpers
  //
  const openProviderModal = () => setProviderModal(true);
  const closeProviderModal = () => setProviderModal(false);

  const handleSelectProvider = (
    provider: any,
    setFieldValue?: any,
    planId?: string
  ) => {
    setSelectedProvider(provider);
    if (setFieldValue) setFieldValue("company", provider.name || provider);
    if (planId) setSelectedPlanId(planId);
    dispatch(
      getRemitaPlanServices({
        categoryCode: "electricity",
        productCode: provider.code,
      })
    );
    closeProviderModal();
  };

  return (
    <ApSafeAreaView>
      <ApScrollView style={{ backgroundColor: "white" }}>
        <ApHeader title="Electricity" />

        <Formik
          initialValues={{
            meterno: "",
            company: selectedProvider?.name || defaultProvider.name,
            metertype: selectedTab,
            amount: "",
            phone: "",
          }}
          validationSchema={ElectricitySchema}
          enableReinitialize
          onSubmit={(values) => {
            // On "Pay Now" we simply open the PIN modal (if meter verified). The actual purchase will run when PIN entered.
            if (!isMeterVerified) {
              showToast("Please verify your meter number first!", "error");
              return;
            }
            setPinVisible(true);
          }}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            setFieldValue,
          }) => (
            <>
            
              {/* PROVIDER SELECTION */}
              <TouchableOpacity
                className="mx-4 mt-4 p-4 border border-gray-300 rounded-xl flex-row gap-4 items-center"
                onPress={openProviderModal}
              >
                <Image
                  source={
                    selectedProvider
                      ? electricityLogos[
                          formatProvider(selectedProvider.name)
                        ] || electricityLogos.default
                      : defaultProvider.logo
                  }
                  style={{ width: 35, height: 35, borderRadius: 8 }}
                />

                <Text className="text-gray-700 font-semibold text-base">
                  {selectedProvider?.name || defaultProvider.name}
                </Text>
              </TouchableOpacity>

              {/* Prepaid / Postpaid Tabs */}
              <View className="flex-row mx-4 mt-4 bg-gray-100 p-1 rounded-xl">
                {["prepaid", "postpaid"].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => {
                      setSelectedTab(tab as any);
                      setFieldValue("metertype", tab);
                    }}
                    className={`flex-1 p-3 rounded-xl ${
                      selectedTab === tab ? "bg-green-600" : ""
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        selectedTab === tab ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Meter Number Input */}
              <View className="mx-4 mt-4">
                <Text className="text-gray-500 mb-1">
                  Meter / Account Number
                </Text>

                <View className="flex-row items-center border border-gray-300 rounded-xl px-3">
                  <TextInput
                    value={values.meterno}
                    onChangeText={handleChange("meterno")}
                    onBlur={handleBlur("meterno")}
                    keyboardType="numeric"
                    placeholder="Enter meter number"
                    className="flex-1 py-3 text-lg"
                  />
                  <Ionicons name="flash-outline" size={22} color="gray" />
                </View>
                {touched.meterno && errors.meterno && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.meterno}
                  </Text>
                )}
              </View>

              {/* Verify / Proceed */}
              <TouchableOpacity
                className="mx-4 mt-3 bg-green-600 p-3 rounded-xl"
                onPress={() => {
                  // if (!values.amount) {
                  //   showToast("Please enter amount before verifying", "error");
                  //   return;
                  // }
                  verifyMeter(values, setFieldValue);
                }}
                disabled={loading}
              >
                <Text className="text-center text-white font-semibold">
                  {loading ? "Checking..." : "Verify Meter"}
                </Text>
              </TouchableOpacity>

              {/* Customer details after verification */}
              {isMeterVerified && customerDetails.name && (
                <View className="mx-4 mt-4 p-3 bg-green-50 rounded-xl">
                  <Text className="font-semibold">{customerDetails.name}</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    {customerDetails.address}
                  </Text>
                </View>
              )}

              {/* Select Amount */}
              <View className="mt-6 mx-4">
                <Text className="text-gray-700 font-semibold text-base mb-3">
                  Select Amount
                </Text>

                <View className="flex-row justify-between flex-wrap">
                  {presetAmounts.map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      onPress={() => {
                        setSelectedAmount(amt);
                        setFieldValue("amount", amt);
                      }}
                      className={`w-[30%] p-6 rounded-xl mb-3 border ${
                        selectedAmount === amt
                          ? "bg-green-100 border-green-500"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold text-[16px] mb-1 ${
                          selectedAmount === amt
                            ? "text-black"
                            : "text-gray-700"
                        }`}
                      >
                        ₦{Number(amt).toLocaleString()}
                      </Text>
                      <Text
                        className={`text-center text-xs text-green-600 ${
                          selectedAmount === amt
                            ? "text-black"
                            : "text-gray-500"
                        }`}
                      >
                        Pay ₦{Number(amt).toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom Amount */}
              <View className="px-4">
                <ApTextInput
                  placeholder="Enter custom amount"
                  label="Amount"
                  name="amount"
                  keyboardType="numeric"
                  value={values.amount}
                  onChangeText={(v: string) => {
                    setSelectedAmount(null);
                    setFieldValue("amount", v);
                  }}
                />
              </View>

              {/* Pay Now */}
              <View className="mx-4 mb-6">
                <ApButton
                  title="Pay Now"
                  onPress={() => {
                    // run Formik validation, then onSubmit: open PIN modal if verified
                    handleSubmit();
                  }}
                />
              </View>

              {/* Provider Modal */}
              <Modal visible={providerModal} transparent animationType="slide">
                <View className="flex-1 bg-black/40 justify-end">
                  <View className="bg-white p-5 rounded-t-3xl max-h-[70%]">
                    <Text className="font-bold text-xl mb-3">
                      Select Provider
                    </Text>

                    <ScrollView>
                      {Array.isArray(remitaServices) &&
                        remitaServices.map((item: any) => {
                        const formatted = formatProvider(
                          item.code || item.name ||
                          ""
                        );
                        const logo =
                          electricityLogos[formatted] ||
                          electricityLogos.default;
                        return (
                          <TouchableOpacity
                            key={item.code || item._id || item.name}
                            className="flex-row items-center p-3 border-b border-gray-300 "
                            onPress={() =>
                              handleSelectProvider(item, setFieldValue)
                            }
                          >
                            <Image
                              source={logo}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 50,
                              }}
                            />
                            <Text className="ml-3 text-base font-semibold">
                              {item.name || item.providerName || item.code}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <TouchableOpacity
                      className="mt-4 bg-red-500 p-3 rounded-xl"
                      onPress={closeProviderModal}
                    >
                      <Text className="text-center text-white font-semibold">
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {/* PIN MODAL */}
              <PinModal
                visible={pinVisible}
                loading={loading}
                onClose={() => {
                  if (!loading) setPinVisible(false);
                }}
                onSubmit={(pin) => {
                  setPinCode(pin);
                  performPurchase(values, pin);
                }}
              />

              {/* Fullscreen loader overlay (covers screen and modals) */}
              {loading && (
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

        <BannerCarousel
          images={banners}
          heightRatio={0.25}
          borderRadius={16}
          autoplayInterval={4000}
        />
      </ApScrollView>
    </ApSafeAreaView>
  );
}
