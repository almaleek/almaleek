import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
} from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import { ChevronRight } from "lucide-react-native";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApScrollView from "@/components/scrollview/scrollview";
import ApHeader from "@/components/headers/header";
import PinModal from "@/components/modals/pinModal";

import { RootState } from "@/redux/store";
import { cableLogos } from "@/constants/cabletvlogo";
import { useToast } from "@/components/toast/toastProvider";
import BannerCarousel from "@/components/carousel/banner";
import { Ionicons } from "@expo/vector-icons";
import {
  getRemitaPlanServices,
  getRemitaServices,
   handleVerifyTvSub,
  purchaseTvSub,
} from "@/redux/features/easyAccess/service";


// Banner Images
const banners = [
  require("../../../assets/images/banner1.png"),
  require("../../../assets/images/banner2.png"),
  require("../../../assets/images/banner3.png"),
];

export default function CableScreen() {
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const { showToast } = useToast();

  // GLOBAL STATE
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    cableProviders,
    cablePackages,
    cablePackagesLoading,
    smartcardValidationResult,
    smartcardValidationLoading,
    cableSubscribeLoading,
  } = useSelector((state: RootState) => state.remita);

  // LOCAL STATE
  const [selectedProvider, setSelectedProvider] = useState("DSTV");
  const [selectedProviderCode, setSelectedProviderCode] = useState("");
  const [planCategory, setPlanCategory] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<any>({});
  const [providerModal, setProviderModal] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [smartCardNo, setSmartCardNo] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("HOT");
  const [isVerifying, setIsVerifying] = useState(false);
  const [cablePlans, setCablePlans] = useState();
  const {remitaPlans, remitaServices} = useSelector((state:RootState)=>state.easyAccessdataPlans)

  const defaultProvider = {
    name: "DSTV",
    logo: cableLogos.default,
  };

  /** ------------------------
   *  LOAD PROVIDERS ON MOUNT
   * ------------------------ */
    useEffect(() => {
    dispatch(getRemitaServices("4"));
  }, [dispatch]);

  const onProviderChoose = async (
    providerName: string,
    providerCode?: string
  ) => {
    setSelectedProvider(providerName);
    if (providerCode) setSelectedProviderCode(providerCode);
    setProviderModal(false);
  };

  const handleVerify = async (smartcardNumber: string, providerCode?: string) => {
    setIsVerifying(true);

    let activeCode = providerCode || selectedProviderCode;
    if (!activeCode) {
      const service = Array.isArray(remitaServices)
        ? remitaServices.find(
            (s: any) =>
              s.name === selectedProvider || s.providerName === selectedProvider
          )
        : null;
      activeCode = service?.code;
    }

    try {
      const resultAction = await dispatch(
        handleVerifyTvSub({
          productCode: activeCode || "",
          cableType: selectedProvider,
          smartCardNo: smartcardNumber,
        })
      );

      if (handleVerifyTvSub.fulfilled.match(resultAction)) {
        const data = resultAction.payload?.data || resultAction.payload || {};
        const content = data?.message?.content || data?.content || {};
        setCustomerDetails({
          name: content.Customer_Name || data?.customerName || "",
          smartCard: content.Smartcard_Number || smartcardNumber,
          balance: content.Balance || data?.balance || "",
        });
        setIsVerified(true);
        showToast("✅ Smart Card verified!", "success");
      } else {
        showToast(resultAction.payload, "error");
        setIsVerifying(false);
      }
    } catch {
      showToast("❌ Verification failed", "error");
      setIsVerifying(false);
    }
  };

  /** ------------------------
   *  SELECT CATEGORY → LOAD PLANS
   * ------------------------ */
  const handleCategory = async (category: string) => {
    dispatch(
      getRemitaPlanServices({
        categoryCode: "cable_tv",
        productCode: category.toLowerCase(),
      })
    );
  };

  useEffect(() => {
    handleCategory(selectedProvider);
  }, [selectedProvider]);

  /** ------------------------
   *  PURCHASE (triggered from PIN modal)
   * ------------------------ */
  const handlePurchase = async (pin: string) => {
    if (!selectedPlan) return alert("Select a plan");
    if (!isVerified) {
      showToast("Please verify your SmartCard Number first", "error");
      return;
    }

    const payload = {
      productCode: selectedPlan?.code || "",
      cableType: selectedProvider,
      smartCardNo: smartCardNo || customerDetails.smartCard || "",
      pinCode: pin,
      customerName: customerDetails.name || "",
      // amount: Number(selectedPlan?.amount || selectedPlan?.ourPrice || 0),
      amount: 100,
    };

    try {
      setLoading(true);

      const result = await dispatch(purchaseTvSub(payload));
      const resPayload = result.payload as any;

      if (purchaseTvSub.fulfilled.match(result)) {
        // showToast("✅ TV Cable subscription successful!", "success");
        if (resPayload?.transactionId) {
          router.push({
            pathname: "/(protected)/history/[id]",
            params: { id: resPayload.transactionId },
          });
        }
      }

    } catch {
      showToast("Error processing subscription", "error");
    } finally {
      setLoading(false);
      setPinVisible(false);
      setPinCode("");
    }
  };

  /** Utility */
  const formatProvider = (prov: string) =>
    prov
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "default";

  const extractDuration = (name: string) => {
    const match = name.match(/(\d+\s*(?:MONTH|DAY|WEEK|YEAR)S?)/i);
    return match ? match[0] : "";
  };

  const tabs = ["HOT", "Premium"];

  const plans = Array.isArray(remitaPlans)
    ? remitaPlans
    : (remitaPlans as any)?.items || [];

  return (
    <ApSafeAreaView>
      <ApHeader title="Cable TV Subscription" />

      <ApScrollView style={{ backgroundColor: "white" }}>
        <BannerCarousel
          images={banners}
          heightRatio={0.25}
          borderRadius={16}
          autoplayInterval={4000}
        />
        <Formik initialValues={{ smartcard: "" }} onSubmit={() => {}}>
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            setFieldValue,
          }) => (
            <View>
              {/* Provider Selector */}
              <TouchableOpacity
                className=" mt-4 p-3 mx-4 border border-gray-300 rounded-xl flex-row gap-4 items-center mb-2"
                onPress={() => {
                  setProviderModal(true);
                  handleCategory(selectedProvider);
                }}
              >
                <View className="flex-1 flex-row justify-between">
                  <View className="flex-1 flex-row gap-4 items-center">
                    {selectedProvider && (
                      <Image
                        source={
                          selectedProvider
                            ? cableLogos[formatProvider(selectedProvider)] ||
                              cableLogos.default
                            : defaultProvider.logo
                        }
                        style={{ width: 35, height: 35, borderRadius: 8 }}
                      />
                    )}

                    <Text className="text-gray-700 font-semibold text-base">
                      {selectedProvider || "Select Cable Provider"}
                    </Text>
                  </View>

                  <ChevronRight color="gray" />
                </View>
              </TouchableOpacity>

              <View className="mx-4 mt-4">
                <Text className="text-gray-500 mb-1">SmartCard Number</Text>

                <View className="flex-row items-center border border-gray-300 rounded-xl px-3">
                  <TextInput
                    value={values.smartcard}
                    onChangeText={handleChange("smartcard")}
                    onBlur={handleBlur("smartcard")}
                    keyboardType="numeric"
                    placeholder="Enter meter number"
                    className="flex-1 py-3 text-lg"
                  />
                  <Ionicons name="flash-outline" size={22} color="gray" />
                </View>
                {touched.smartcard && errors.smartcard && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.smartcard}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                className="mx-4 mt-3 bg-green-600 p-3 rounded-xl"
                onPress={() => {
                  if (!values.smartcard)
                    return showToast("Enter SmartCard number", "error");
                  setSmartCardNo(values.smartcard);
                  setIsVerifying(true);
                  handleVerify(values.smartcard).finally(() =>
                    setIsVerifying(false)
                  );
                }}
              >
                <Text className="text-center text-white font-semibold">
                  {isVerifying ? "Checking..." : "Verify SmartCard"}
                </Text>
              </TouchableOpacity>

              {/* Customer details after verification */}
              {isVerified && customerDetails.name && (
                <View className="mx-4 mt-4 p-3 bg-green-50 rounded-xl">
                  <Text className="font-semibold text-md text-gray-600">
                    Name: {customerDetails.name}
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    {customerDetails.balance
                      ? `Balance: ${customerDetails.balance}`
                      : null}
                  </Text>
                </View>
              )}

              {/* Tabs */}
              <View className="px-4 mt-6">
                <Text className="text-gray-800 text-lg font-semibold mb-3">
                  TV Plans
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {tabs.map((t, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setActiveTab(t)}
                      className="mr-6 pb-2"
                    >
                      <Text
                        className={`text-base ${
                          activeTab === t
                            ? "text-green-600 font-bold"
                            : "text-gray-500"
                        }`}
                      >
                        {t}
                      </Text>

                      {activeTab === t && (
                        <View className="h-1 bg-green-600 mt-1 rounded-full" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Plan Grid */}
              <View className="px-4 mt-4 flex-row flex-wrap justify-between">
                {plans.map((p: any, i: number) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      setSelectedPlan(p);
                      setPinVisible(true);
                    }}
                    className="w-[32%] bg-gray-100 border border-gray-200 rounded-xl p-4 mb-4"
                  >
                    <Text className="text-[12px] font-semibold  text-center">
                      {p?.name || p?.packageName || p?.code}
                    </Text>
                    {/* <Text className="text-gray-600 text-sm mt-1 text-center bg-green-100 px-2 py-1 rounded-full">
                      {p?.validity || p?.duration || extractDuration(p?.name || "")}
                    </Text> */}
                    <Text className=" text-gray-600 text-lg mt-1 text-center bg-green-100 px-2 py-1 rounded-full">
                      ₦{p?.amount || p?.ourPrice}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Provider Modal */}
              <Modal visible={providerModal} transparent animationType="fade">
                <View className="flex-1 bg-black/40 justify-center items-center">
                  <View className="w-[90%] bg-white p-5 rounded-2xl">
                    <Text className="text-xl font-semibold mb-4">
                      Select Provider
                    </Text>

                    <ScrollView>
                      {Array.isArray(remitaServices) &&
                        remitaServices.map((item: any) => {
                        const formatted = formatProvider(item.name || item.providerName || item.code || "");
                        return (
                          <TouchableOpacity
                            key={item.code || item._id || item.name}
                            className="flex-row items-center p-3 border-b"
                            onPress={() => onProviderChoose(item.name || item.providerName || item.code, item.code)}
                          >
                            <Image
                              source={cableLogos[formatted] || cableLogos.default}
                              style={{ width: 40, height: 40 }}
                            />
                            <Text className="ml-3 text-base font-semibold">
                              {item.name || item.providerName || item.code}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
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

              {/* PIN Modal */}
              <PinModal
                visible={pinVisible}
                loading={loading}
                onClose={() => !loading && setPinVisible(false)}
                onSubmit={(pin) => {
                  setPinCode(pin);
                  handlePurchase(pin);
                }}
              />
            </View>
          )}
        </Formik>
      </ApScrollView>
    </ApSafeAreaView>
  );
}
