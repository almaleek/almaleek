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
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import { BlurView } from "expo-blur";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApScrollView from "@/components/scrollview/scrollview";
import ApHeader from "@/components/headers/header";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  getEasyAccessPlanServices,
  getElectricityServices,
  handleVerifyMeter,
  purchaseElectricity

} from "@/redux/features/easyAccess/service";
import { electricityLogos } from "@/constants/eletricitylog";
import { useToast } from "@/components/toast/toastProvider";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  phone: Yup.string()
    .required("Phone number is required")
    .matches(/^[0-9]{11}$/, "Enter a valid 11-digit phone number"),
});

const presetAmounts = ["1000", "2000", "3000", "5000", "10000", "20000"];

interface CustomerDetails {
  name?: string;
  address?: string;
}

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: "rgba(17,24,39,0.55)",
    alignItems: "center",
    minWidth: 190,
  },
  loadingText: {
    color: "white",
    marginTop: 12,
    fontWeight: "600",
  },
});

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
  const [verifiedMeterNo, setVerifiedMeterNo] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [pinVisible, setPinVisible] = useState(false);
  const [details, setDetails] = useState<any[]>([]);
  const {easyAccessPlans, electricityServices} = useSelector((state:RootState)=>state.easyAccessdataPlans)
  const [lastMeter, setLastMeter] = useState("");
  const [useCashback, setUseCashback] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);

  // Load providers once
  useEffect(() => {
    dispatch(
      getElectricityServices()
    );
  }, [dispatch]); 


  // Load last used meter number from storage
  useEffect(() => {
    const loadLastMeter = async () => {
      try {
        const saved = await AsyncStorage.getItem("last_meter_number");
        if (saved) {
          setLastMeter(saved);
        }
      } catch (e) {
        console.log("Error loading last meter number", e);
      }
    };
    loadLastMeter();
  }, []);

  // Set IBEDC as default provider when services load
  useEffect(() => {
    if (!Array.isArray(electricityServices) || electricityServices.length === 0) return;
    if (selectedProvider) return;

    const ibedcProvider =
      electricityServices.find((p: any) => {
        const code = (p.code || "").toLowerCase();
        const name = (p.name || "").toLowerCase();
        return code === "ibedc" || name.includes("ibadan");
      }) || electricityServices[0];

    setSelectedProvider(ibedcProvider);
  }, [electricityServices, selectedProvider]);

  const plans = Array.isArray(easyAccessPlans)
    ? easyAccessPlans
    : [];

  const easyAccessPlanCode = plans.find((c: any) =>
    c.name?.toLowerCase().includes(selectedTab.toLowerCase())
  )?.code;


  const formatProvider = (prov: string) =>
    prov
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "default";

  const getProviderDisplayName = (name: string) => {
    if (!name) return "";
    const lowerName = name.toLowerCase();
    let displayName = name;

    if (lowerName.includes("eko")) displayName = "Eko Electricity (EKEDC)";
    else if (lowerName.includes("ikeja")) displayName = "Ikeja Electricity (IKEDC)";
    else if (lowerName.includes("abuja")) displayName = "Abuja Electricity (AEDC)";
    else if (lowerName.includes("ibadan")) displayName = "Ibadan Electricity (IBEDC)";
    else if (lowerName.includes("enugu")) displayName = "Enugu Electricity (EEDC)";
    else if (lowerName.includes("port harcourt") || lowerName.includes("phed"))
      displayName = "Port Harcourt Electricity (PHED)";
    else if (lowerName.includes("jos")) displayName = "Jos Electricity (JEDC)";
    else if (lowerName.includes("kaduna")) displayName = "Kaduna Electricity (KAEDCO)";
    else if (lowerName.includes("kano")) displayName = "Kano Electricity (KEDCO)";
    else if (lowerName.includes("benin")) displayName = "Benin Electricity (BEDC)";
    else if (lowerName.includes("yola")) displayName = "Yola Electricity (YEDC)";
    
    // Ensure it ends with Electricity if not already there
    if (!displayName.toLowerCase().includes("electricity")) {
        displayName += " Electricity";
    }
    
    return displayName;
  };

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
      return { ok: false as const };
    }
    setLoading(true);
    try {
      const companyCode = (selectedProvider?.code || "ibedc").toLowerCase();
      const companyKey = companyCode.endsWith("electric") ? companyCode : `${companyCode}electric`;

      const payload = {
        company: companyKey,
        metertype: (values.metertype || selectedTab).toLowerCase() === "prepaid" ? "prepaid" : "postpaid",
        meterno: values.meterno,
        amount: values.amount ? Number(values.amount) : 1000,
      };

      const resultAction = await dispatch(handleVerifyMeter(payload));

      if (handleVerifyMeter.fulfilled.match(resultAction)) {
        const res = resultAction.payload || {};
        
        // Extract from nested structure if present (EasyAccess format)
        const content = res?.message?.content || res?.content;
        
        const name =
          content?.Customer_Name ||
          content?.Name ||
          res?.customer_name ||
          res?.name ||
          "";
          
        const address =
          content?.Address ||
          content?.Customer_Address ||
          res?.address ||
          "";

        setCustomerDetails({ name, address });
        setIsMeterVerified(true);
        setVerifiedMeterNo(values.meterno);
        try {
          await AsyncStorage.setItem("last_meter_number", values.meterno);
          setLastMeter(values.meterno);
        } catch (e) {
          console.log("Error saving last meter number", e);
        }
        showToast("✅ Meter number verified successfully!", "success");
        return { ok: true as const, name, address };
      } else {
        const errorMessage = resultAction.payload as string || "Verification failed";
        showToast(errorMessage, "error");
        setCustomerDetails({});
        setIsMeterVerified(false);
        setVerifiedMeterNo("");
        return { ok: false as const };
      }
    } catch (err: any) {
      console.error("verifyMeter error:", err);
      showToast(
        err?.message || "Unexpected error verifying meter number",
        "error"
      );
      setCustomerDetails({});
      setIsMeterVerified(false);
      setVerifiedMeterNo("");
      return { ok: false as const };
    } finally {
      setLoading(false);
    }
  };

  const openPaymentReview = async (values: any) => {
    const meterNo = String(values?.meterno || "").trim();
    const phone = String(values?.phone || "").trim();
    const amountNumber = Number(values?.amount);

    if (!meterNo) {
      showToast("Enter meter number first", "error");
      return;
    }
    if (!/^[0-9]{11}$/.test(phone)) {
      showToast("Enter a valid 11-digit phone number", "error");
      return;
    }
    if (!Number.isFinite(amountNumber) || amountNumber < 100) {
      showToast("Enter a valid amount (minimum ₦100)", "error");
      return;
    }

    const needsVerify =
      !isMeterVerified || !verifiedMeterNo || verifiedMeterNo !== meterNo;

    let verifiedName = customerDetails.name || "";
    let verifiedAddress = customerDetails.address || "";

    if (needsVerify) {
      const v = await verifyMeter({ ...values, meterno: meterNo, phone, amount: amountNumber });
      if (!v.ok) return;
      verifiedName = v.name || "";
      verifiedAddress = v.address || "";
    }

    setPinVisible(true);
    setDetails([
      { label: "Provider", value: getProviderDisplayName(selectedProvider?.name || "") },
      { label: "Meter Number", value: meterNo },
      { label: "Meter Type", value: values.metertype || selectedTab },
      { label: "Customer Name", value: verifiedName },
      { label: "Address", value: verifiedAddress },
      { label: "Phone", value: phone },
      { label: "Amount", value: `₦${amountNumber.toLocaleString()}` },
    ]);
  };

  const handlePurchase = async (values: any, enteredPin: string) => {
    if (!isMeterVerified) {
      showToast("Please verify your meter number first!", "error");
      return;
    }
    if (!enteredPin || enteredPin.length !== 4) {
      showToast("Please enter a valid 4-digit PIN", "error");
      return;
    }

    const companyCode = (selectedProvider?.code || "").toLowerCase();
    const companyKey = companyCode.endsWith("electric") ? companyCode : `${companyCode}electric`;

    const payload = {
      company: companyKey,
      meterNumber: values.meterno,
      meterType:
        (values.metertype || selectedTab).toLowerCase() === "prepaid" ? "prepaid" : "postpaid",
      amount: Number(values.amount),
      pinCode: enteredPin,
      phone: values.phone,
      useCashback,
    };
    try {
      setLoading(true);
      const result = await dispatch(purchaseElectricity(payload as any));
      if (purchaseElectricity.fulfilled.match(result)) {
        showToast("Electricity purchase successful!", "success");
        router.push({
          pathname: "/(protected)/(services)/success",
          params: { 
            status: "success",
            service: "Electricity",
            network: getProviderDisplayName(selectedProvider?.name || ""),
            amount: values.amount,
            transactionId: result.payload.transactionId 
          },
        });
      } else {
        const txId = (result.payload as any)?.transactionId;
        router.push({
          pathname: "/(protected)/(services)/success",
          params: { 
            status: "failed",
            service: "Electricity",
            network: getProviderDisplayName(selectedProvider?.name || ""),
            amount: values.amount,
            message: (result.payload as any)?.error || "Purchase failed",
            transactionId: txId || ""
          },
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
      getEasyAccessPlanServices({
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
            meterno: lastMeter,
            company: selectedProvider?.name || "",
            metertype: selectedTab,
            amount: "",
            phone: (user as any)?.phoneNumber || (user as any)?.phone || "",
          }}
          validationSchema={ElectricitySchema}
          enableReinitialize
          onSubmit={openPaymentReview}
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
                className="mx-4 mt-4 p-4 border border-gray-300 rounded-xl flex-row justify-between items-center"
                onPress={openProviderModal}
              >
                <View className="flex-row items-center gap-4">
                  <Image
                    source={
                      selectedProvider
                        ? electricityLogos[
                            formatProvider(selectedProvider.name)
                          ] || electricityLogos.default
                        : electricityLogos.default
                    }
                    style={{ width: 35, height: 35, borderRadius: 8 }}
                  />

                  <Text className="text-gray-700 font-semibold text-base">
                    {selectedProvider
                      ? getProviderDisplayName(selectedProvider.name)
                      : "Select Provider"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="gray" />
              </TouchableOpacity>

              {/* Prepaid / Postpaid Tabs */}
              <View className="flex-row mx-4 mt-4 bg-gray-100 p-1 rounded-xl">
                {["prepaid", "postpaid"].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => {
                      setSelectedTab(tab as any);
                      setFieldValue("metertype", tab);
                      setIsMeterVerified(false);
                      setCustomerDetails({});
                      setVerifiedMeterNo("");
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
                    onChangeText={(text) => {
                      setIsMeterVerified(false);
                      setCustomerDetails({});
                      setVerifiedMeterNo("");
                      setFieldValue("meterno", text);
                    }}
                    onBlur={handleBlur("meterno")}
                    keyboardType="numeric"
                    placeholder="Enter meter number"
                    className="flex-1 py-3 text-lg"
                  />
                  <Ionicons name="flash-outline" size={22} color="gray" />
                </View>
                {touched.meterno && errors.meterno && (
                  <Text className="text-red-500 text-xs mt-1">
                    {String(errors.meterno)}
                  </Text>
                )}
              </View>

              {/* Phone Number Input */}
              <View className="mx-4 mt-4">
                <Text className="text-gray-500 mb-1">
                  Phone Number
                </Text>

                <View className="flex-row items-center border border-gray-300 rounded-xl px-3">
                  <TextInput
                    value={values.phone}
                    onChangeText={handleChange("phone")}
                    onBlur={handleBlur("phone")}
                    keyboardType="numeric"
                    placeholder="Enter phone number"
                    className="flex-1 py-3 text-lg"
                  />
                  <Ionicons name="call-outline" size={22} color="gray" />
                </View>
                {touched.phone && errors.phone && (
                  <Text className="text-red-500 text-xs mt-1">
                    {String(errors.phone)}
                  </Text>
                )}
              </View>

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
                      onPress={async () => {
                        if (loading) return;
                        setSelectedAmount(amt);
                        setFieldValue("amount", amt);
                        await openPaymentReview({ ...values, amount: amt });
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

              {/* Submit Button */}
              <View className="px-4 mt-8 mb-10">
                <ApButton
                  title="Pay Bill"
                  onPress={() => {
                    // run Formik validation, then onSubmit: open PIN modal if verified
                    handleSubmit();
                  }}
                  loading={loading}
                />
              </View>
              <PinModal
                visible={pinVisible}
                loading={loading}
                title="Review Electricity Payment"
                details={details}
                useCashback={useCashback}
                setUseCashback={setUseCashback}
                cashbackBalance={(user as any)?.cashbackBalance ?? 0}
                onClose={() => {
                  if (!loading) setPinVisible(false);
                }}
                onSubmit={(pin) => {
                  setPinCode(pin);
                  handlePurchase(values, pin);
                }}
              />

              {/* Provider Modal */}
              <Modal visible={providerModal} transparent animationType="fade">
                <View className="flex-1 bg-black/40 justify-center items-center px-4">
                  <View className="bg-white rounded-2xl w-full max-h-[70%] p-5">
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-xl font-bold text-gray-900">
                        Select Provider
                      </Text>
                      <TouchableOpacity onPress={closeProviderModal}>
                        <Ionicons name="close-circle" size={28} color="#374151" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                      {Array.isArray(electricityServices) &&
                        electricityServices.map((item: any) => {
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
                            className="flex-row items-center p-4 border-b border-gray-100 "
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
                            <View className="ml-4 flex-1">
                                <Text className="text-lg font-semibold text-gray-800">
                                {getProviderDisplayName(
                                    item.name || item.providerName || item.code
                                )}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#ccc" />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              <Modal
                visible={loading}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => {}}
              >
                <View style={styles.loadingOverlay}>
                  <BlurView
                    intensity={35}
                    tint="dark"
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.loadingCard}>
                    <ActivityIndicator size="large" color="#32d47a" />
                    <Text style={styles.loadingText}>Processing...</Text>
                  </View>
                </View>
              </Modal>
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
