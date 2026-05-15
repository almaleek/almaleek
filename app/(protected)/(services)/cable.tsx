import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import { ChevronRight } from "lucide-react-native";
import { BlurView } from "expo-blur";

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
  fetchDataCategories,
  fetchDataPlans,
  getCableServices,
  getEasyAccessPlanServices,
   handleVerifyTvSub,
  purchaseTvSub,
} from "@/redux/features/easyAccess/service";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Banner Images
const banners = [
  require("../../../assets/images/banner1.png"),
  require("../../../assets/images/banner2.png"),
  require("../../../assets/images/banner3.png"),
];

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

export default function CableScreen() {
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const { showToast } = useToast();

  // GLOBAL STATE
  const { user } = useSelector((state: RootState) => state.auth);
  // LOCAL STATE
  const [selectedProvider, setSelectedProvider] = useState("DSTV");
  const [selectedProviderCode, setSelectedProviderCode] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<any>({});
  const [verifiedSmartcard, setVerifiedSmartcard] = useState("");
  const [providerModal, setProviderModal] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [smartCardNo, setSmartCardNo] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [isVerifying, setIsVerifying] = useState(false);
  const [details, setDetails] = useState<any[]>([]);
  const {easyAccessPlans, cableServices} = useSelector((state:RootState)=>state.easyAccessdataPlans)
  const [lastSmartcard, setLastSmartcard] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);
  const [useCashback, setUseCashback] = useState(false);
  
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const durationTabs = ["All", "Daily", "Weekly", "Monthly"];
  const getDurationCategory = (validity: string) => {
    const val = (validity || "").toLowerCase();
    const days = parseInt(val);
    if (val.includes("daily")) return "Daily";
    if (val.includes("weekly")) return "Weekly";
    if (val.includes("month") || val.includes("30 days")) return "Monthly";
    if (!isNaN(days)) {
      if (days < 7) return "Daily";
      if (days < 30) return "Weekly";
      return "Monthly";
    }
    return "Monthly";
  };

  const sortedPlans = [...allPlans]
    .filter(
      (p: any) =>
        p?.validity &&
        (p?.name || p?.packageName)
    )
    .sort(
      (a: any, b: any) =>
        Number(a.ourPrice ?? a.amount ?? 0) -
        Number(b.ourPrice ?? b.amount ?? 0)
    );

  const visiblePlans =
    activeTab === "All"
      ? sortedPlans
      : sortedPlans.filter(
          (p: any) => getDurationCategory(p.validity) === activeTab
        );

  const defaultProvider = {
    name: "DSTV",
    logo: cableLogos.default,
  };

  const getErrorMessage = (input: any, fallback: string) => {
    if (!input) return fallback;
    if (typeof input === "string") return input;
    if (typeof input === "number") return String(input);
    if (typeof input === "object") {
      const msg =
        (input as any)?.msg ||
        (input as any)?.message ||
        (input as any)?.error ||
        (input as any)?.data?.msg ||
        (input as any)?.data?.message ||
        (input as any)?.data?.error;
      if (typeof msg === "string" && msg.trim()) return msg;
    }
    try {
      return JSON.stringify(input);
    } catch {
      return fallback;
    }
  };

  /** ------------------------
   *  LOAD PROVIDERS ON MOUNT
   * ------------------------ */
  useEffect(() => {
    dispatch(getCableServices());
  }, [dispatch]);

  // Set default provider to DSTV when cableServices are loaded
  useEffect(() => {
    if (Array.isArray(cableServices) && cableServices.length > 0) {
      if (!selectedProviderCode) {
        const dstvService = cableServices.find((s: any) => 
          (s.name || s.providerName || "").toLowerCase().includes("dstv")
        ) || cableServices[0];
        
        setSelectedProvider(dstvService.name || dstvService.providerName);
        setSelectedProviderCode(dstvService.code);
        loadAllPlansForProvider(dstvService);
      }
    }
  }, [cableServices]);

  const loadAllPlansForProvider = async (provider: any) => {
    setIsLoadingPlans(true);
    setAllPlans([]);
    setSelectedPlanId("");

    try {
      const providerName = (provider.name || provider.providerName || provider || "").split(" ")[0];
      const result = await dispatch(
        fetchDataCategories({
          serviceType: "cable",
          network: providerName,
        }) as any
      );
    

      if (fetchDataCategories.fulfilled.match(result)) {
        const cats = result.payload || [];
        
        
        // Fetch plans for all categories in parallel
        const planPromises = cats.map(async (cat: string) => {
          const planResult = await dispatch(
            fetchDataPlans({
              network: providerName,
              category: cat,
              serviceType: "cable",
            }) as any
          );

        


          
          if (fetchDataPlans.fulfilled.match(planResult)) {
            const payload: any = planResult.payload || {};
            return (payload.plans || []).map((p: any) => ({
              ...p,
              category: cat
            }));
          }
          return [];
        });

        const results = await Promise.all(planPromises);
        const mergedPlans = results.flat();
        setAllPlans(mergedPlans);
      }
    } catch (error) {
      console.error("Error loading plans:", error);
      showToast("Failed to load plans", "error");
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const onProviderChoose = async (
    item: any
  ) => {
    const providerName = item.name || item.providerName || item;
    const providerCode = item.code;
    
    setSelectedProvider(providerName);
    if (providerCode) {
        setSelectedProviderCode(providerCode);
        loadAllPlansForProvider(item);
    }
    setProviderModal(false);
  };

  const handleVerify = async (smartcardNumber: string, providerCode?: string) => {
    setIsVerifying(true);

    let activeCode = providerCode || selectedProviderCode;
    if (!activeCode) {
      const service = Array.isArray(cableServices)
        ? cableServices.find(
            (s: any) =>
              s.name === selectedProvider || s.providerName === selectedProvider
          )
        : null;
      activeCode = service?.code;
    }

    try {
      const resultAction = await dispatch(
        handleVerifyTvSub({
          cableType: selectedProvider,
          smartCardNo: smartcardNumber,
        })
      );

      if (handleVerifyTvSub.fulfilled.match(resultAction)) {
        let data = resultAction.payload || {};
        
        // Extract from nested structure if present (EasyAccess format)
        const content = data?.message?.content || data?.content || data;
        
        const name =
          content?.Customer_Name ||
          content?.Name ||
          data?.customer_name ||
          data?.name ||
          "Verified Customer";

        setCustomerDetails({
          name: name,
          smartCard: smartcardNumber,
        });
        setVerifiedSmartcard(smartcardNumber);
        
        try {
          await AsyncStorage.setItem("last_smartcard_number", smartcardNumber);
          setLastSmartcard(smartcardNumber);
        } catch (e) {
          console.log("Error saving last smartcard number", e);
        }
        setIsVerified(true);
        showToast("✅ Smart Card verified!", "success");
        return { ok: true as const, name };
      } else {
        const msg = getErrorMessage(resultAction.payload, "Verification failed");
        showToast(msg, "error");
        setIsVerified(false);
        setVerifiedSmartcard("");
        setCustomerDetails({});
        return { ok: false as const };
      }
    } catch (err: any) {
      const msg = getErrorMessage(err?.response?.data || err, "Verification failed");
      showToast(msg, "error");
      setIsVerified(false);
      setVerifiedSmartcard("");
      setCustomerDetails({});
      return { ok: false as const };
    } finally {
        setIsVerifying(false);
    }
  };

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
      amount: Number(selectedPlan?.ourPrice || 0),
      useCashback,
    };
  

    try {
      setLoading(true);

      const result = await dispatch(purchaseTvSub(payload));
      const resPayload = result.payload as any;

      if (purchaseTvSub.fulfilled.match(result)) {
        // showToast("✅ TV Cable subscription successful!", "success");
        if (resPayload?.transactionId) {
          router.push({
            pathname: "/(protected)/(services)/success",
            params: { 
              status: "success",
              service: "Cable TV",
              network: selectedProvider,
              amount: selectedPlan?.ourPrice,
              transactionId: resPayload.transactionId 
            },
          });
        }
      } else {
        router.push({
          pathname: "/(protected)/(services)/success",
          params: { 
            status: "failed",
            service: "Cable TV",
            network: selectedProvider,
            amount: selectedPlan?.ourPrice,
            message: resPayload?.error || "Subscription failed",
            transactionId: resPayload?.transactionId || ""
          },
        });
      }

    } catch (err: any) {
      const msg = getErrorMessage(err?.response?.data || err, "Error processing subscription");
      showToast(msg, "error");
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

  useEffect(() => {
    const loadLastSmartcard = async () => {
      try {
        const saved = await AsyncStorage.getItem("last_smartcard_number");
        if (saved) {
          setLastSmartcard(saved);
          setSmartCardNo(saved);
        }
      } catch (e) {
        console.log("Error loading last smartcard number", e);
      }
    };
    loadLastSmartcard();
  }, []);

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
        <Formik
          initialValues={{ smartcard: lastSmartcard }}
          enableReinitialize
          onSubmit={() => {}}
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
            <View>
              {/* Provider Selector */}
              <TouchableOpacity
                className=" mt-4 p-3 mx-4 border border-gray-300 rounded-xl flex-row gap-4 items-center mb-2"
                onPress={() => {
                  setProviderModal(true);
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
                    onChangeText={(text) => {
                      setIsVerified(false);
                      setCustomerDetails({});
                      setVerifiedSmartcard("");
                      setSelectedPlan(null);
                      setPinVisible(false);
                      setFieldValue("smartcard", text);
                      setSmartCardNo(text);
                    }}
                    onBlur={handleBlur("smartcard")}
                    keyboardType="numeric"
                    placeholder="Enter smartcard number"
                    className="flex-1 py-3 text-lg"
                  />
                  <Ionicons name="flash-outline" size={22} color="gray" />
                </View>
                {touched.smartcard && errors.smartcard && (
                  <Text className="text-red-500 text-xs mt-1">
                    {String(errors.smartcard)}
                  </Text>
                )}
              </View>

              {isVerifying && (
                <View className="mx-4 mt-3 flex-row items-center">
                  <ActivityIndicator size="small" color="#22c55e" />
                  <Text className="text-gray-500 ml-2">Verifying smartcard...</Text>
                </View>
              )}

              {/* Customer details after verification */}
              {isVerified && customerDetails.name && (
                <View className="mx-4 mt-4 p-3 bg-green-50 rounded-xl">
                  <Text className="font-semibold text-md text-gray-600">
                    Name: {customerDetails.name}
                  </Text>
                </View>
              )}

              {/* Tabs or Loading Plans */}
              {isLoadingPlans ? (
                <View className="px-4 mt-6 items-center">
                    <ActivityIndicator size="large" color="#22c55e" />
                    <Text className="text-gray-500 mt-2">Loading plans...</Text>
                </View>
              ) : (
                <>
                  <View className="px-4 mt-6">
                    <Text className="text-gray-800 text-lg font-semibold mb-3">
                      TV Plans
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {durationTabs.map((cat, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => {
                            setActiveTab(cat);
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

                  {/* Plan Grid */}
                  <View className="px-4 mt-4 flex-row flex-wrap justify-between">
                    {visiblePlans.length > 0 ? (
                      visiblePlans.map((p, i) => (
                        <TouchableOpacity
                          key={i}
                          className="w-[32%] bg-gray-100 border border-gray-200 rounded-xl p-4 mb-4"
                          onPress={async () => {
                            if (loading || isVerifying) return;
                            if (!smartCardNo && !customerDetails.smartCard) {
                                showToast("Enter smartcard number first", "error");
                                return;
                            }
                            const currentSmartcard = smartCardNo || customerDetails.smartCard || values.smartcard;
                            const needsVerify =
                              !isVerified ||
                              !verifiedSmartcard ||
                              verifiedSmartcard !== currentSmartcard;

                            let verifiedName = customerDetails.name || "";

                            if (needsVerify) {
                              const v = await handleVerify(currentSmartcard);
                              if (!v.ok) return;
                              verifiedName = v.name || "";
                            }

                            setSelectedPlan(p);
                            setDetails([
                              { label: "Provider", value: selectedProvider },
                              { label: "SmartCard Number", value: currentSmartcard },
                              { label: "Customer Name", value: verifiedName },
                              { label: "Plan", value: p?.name || p?.packageName || p?.code },
                              { label: "Amount", value: `₦${p?.ourPrice}` },
                            ]);
                            setPinVisible(true);
                          }}
                        >
                          <Text className="text-[12px] font-semibold text-center" numberOfLines={2}>
                            {p?.name || p?.packageName || p?.code}
                          </Text>
                          <Text className="text-gray-600 text-xs mt-1 text-center bg-green-100 px-2 py-1 rounded-full">
                            {p.validity}
                          </Text>
                          <Text className="text-green-600 font-semibold mt-1 text-center text-lg">
                            ₦{p.ourPrice}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View className="w-full items-center py-10">
                        <Text className="text-gray-400">No plans found matching this category.</Text>
                      </View>
                    )}
                    {/* Phantom views for alignment */}
                    {Array.from({ length: (3 - (visiblePlans.length % 3)) % 3 }).map(
                      (_, i) => (
                        <View key={`phantom-${i}`} className="w-[32%] mb-4" />
                      )
                    )}
                  </View>
                </>
              )}

              {/* Provider Modal */}
              <Modal visible={providerModal} transparent animationType="fade">
                <View className="flex-1 bg-black/40 justify-center items-center px-4">
                  <View className="bg-white w-full rounded-2xl p-5 max-h-[70%]">
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-xl font-bold text-gray-900">
                        Select Provider
                      </Text>
                      <TouchableOpacity onPress={() => setProviderModal(false)}>
                        <Ionicons name="close-circle" size={28} color="#374151" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                      {Array.isArray(cableServices) &&
                        cableServices.map((item: any) => {
                        const formatted = formatProvider(item.name || item.providerName || item.code || "");
                        return (
                          <TouchableOpacity
                            key={item.code || item._id || item.name}
                            className="flex-row items-center p-4 border-b border-gray-100"
                            onPress={() => onProviderChoose(item)}
                          >
                            <Image
                              source={cableLogos[formatted] || cableLogos.default}
                              style={{ width: 40, height: 40, borderRadius: 8 }}
                            />
                            <View className="ml-4 flex-1">
                                <Text className="text-lg font-semibold text-gray-800">
                                    {item.name || item.providerName || item.code}
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

              {/* PIN Modal */}
              <PinModal
                visible={pinVisible}
                loading={loading}
                title="Review Cable Subscription"
                details={details}
                useCashback={useCashback}
                setUseCashback={setUseCashback}
                cashbackBalance={user?.cashbackBalance ?? 0}
                onClose={() => !loading && setPinVisible(false)}
                onSubmit={(pin) => {
                  setPinCode(pin);
                  handlePurchase(pin);
                }}
              />

              <Modal
                visible={isVerifying || loading}
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
                    <Text style={styles.loadingText}>
                      {isVerifying ? "Verifying..." : "Processing..."}
                    </Text>
                  </View>
                </View>
              </Modal>
            </View>
          )}
        </Formik>
      </ApScrollView>
    </ApSafeAreaView>
  );
}
