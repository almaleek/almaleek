import React, { useCallback, useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApHeader from "@/components/headers/header";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import ApScrollView from "@/components/scrollview/scrollview";
import NetworkPhonePicker, {
  saveRecentPhoneNumber,
} from "@/components/network/networkPicker";
import BannerCarousel from "@/components/carousel/banner";
import PinModal from "@/components/modals/pinModal";
import { detectNetworkName } from "@/utils/networkDetector";

import {
  getDataServices,
  purchaseAirtime,
} from "@/redux/features/easyAccess/service";
import { AppDispatch, RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useToast } from "@/components/toast/toastProvider";

// QUICK AMOUNT BUTTONS
const amounts = [
  { value: 100, cashback: "₦2 Cashback" },
  { value: 200, cashback: "₦4 Cashback" },
  { value: 500, cashback: "₦10 Cashback" },
  { value: 1000, cashback: "₦20 Cashback" },
  { value: 2000, cashback: "₦40 Cashback" },
  { value: 3000, cashback: "₦80 Cashback" },
  { value: 5000, cashback: "₦160 Cashback" },
  { value: 7000, cashback: "₦320 Cashback" },
  { value: 10000, cashback: "₦640 Cashback" },
];

// FORM VALIDATION
const schema = Yup.object().shape({
  amount: Yup.number()
    .typeError("Amount must be a number")
    .min(50, "Minimum amount is ₦50")
    .required("Amount is required"),
  phone: Yup.string()
    .matches(/^0[7-9][0-1]\d{8}$/, "Enter a valid 11-digit phone number")
    .required("Phone number is required"),
});

export default function AirtimeScreen() {
  const [pinVisible, setPinVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [details, setDetails] = useState<any[]>([]);
  const [useCashback, setUseCashback] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { showToast } = useToast();

  const { user } = useSelector((state: RootState) => state.auth);
  const { dataServices } = useSelector(
    (state: RootState) => state.easyAccessdataPlans
  );

  const [selectedNetwork, setSelectedNetwork] = useState<{
    name: string;
    image: any;
  } | null>(null);

  const defaultNetwork =
    dataServices?.length > 0
      ? (() => {
          const defaultService =
            dataServices.find((s: any) => s.name.toLowerCase() === "mtn") ||
            dataServices[0];
          return {
            name: defaultService.name,
            image:
              defaultService.image ||
              require("../../../assets/images/mtn.png"),
          };
        })()
      : null;

  const displayedNetwork = selectedNetwork || defaultNetwork;

  useEffect(() => {
    if (!selectedNetwork && defaultNetwork) {
      setSelectedNetwork(defaultNetwork);
    }
  }, [defaultNetwork, selectedNetwork]);

  const banners = [
    require("../../../assets/images/banner1.png"),
    require("../../../assets/images/banner2.png"),
    require("../../../assets/images/banner3.png"),
  ];

  // Auto-detect network
  const detectNetwork = (phone: string) => {
    const networkName = detectNetworkName(phone);
    if (networkName && dataServices.length) {
      const found = dataServices.find((s: any) => 
        s.name.toLowerCase().includes(networkName.toLowerCase())
      );
      if (found) {
        const nextNetwork = {
          name: found.name,
          image: found.image || require("../../../assets/images/mtn.png"),
        };
        if (nextNetwork.name !== selectedNetwork?.name) {
          setSelectedNetwork(nextNetwork);
        }
      }
    }
  };

  // Load list from backend
  useFocusEffect(
    useCallback(() => {
      dispatch(getDataServices("airtime") as any);
    }, [dispatch])
  );

  const handleAirtimeSubmit = async (values: any, enteredPin: string) => {
    if (!displayedNetwork) {
      showToast("Please select a network", "error");
      return;
    }
    if (!values.amount || !values.phone) {
      showToast("Please enter phone and amount", "error");
      return;
    }
    if (!enteredPin || enteredPin.length !== 4) {
      showToast("Please enter a valid 4-digit PIN", "error");
      return;
    }
    const payload = {
      ...values,
      networkId: displayedNetwork.name.replace(/\s+.*/, "").toUpperCase(),
      userId: user?._id,
      amount: Number(values.amount),
      pinCode: enteredPin,
      useCashback,
    };
    try {
      setLoading(true);
      const result = await dispatch(purchaseAirtime(payload as any));
      if (purchaseAirtime.fulfilled.match(result)) {
        saveRecentPhoneNumber({ userId: user?._id, phone: values.phone }).catch(
          () => {}
        );
        showToast("Airtime purchase successful!", "success");
        router.push({
          pathname: "/(protected)/(services)/success",
          params: { 
            status: "success",
            service: "Airtime",
            network: selectedNetwork?.name,
            amount: values.amount,
            transactionId: result.payload.transactionId 
          },
        });
      } else {
        const transactionId = result.payload?.transactionId;
        router.push({
          pathname: "/(protected)/(services)/success",
          params: { 
            status: "failed",
            service: "Airtime",
            network: selectedNetwork?.name,
            amount: values.amount,
            message: result.payload?.error || "Purchase failed",
            transactionId: transactionId || ""
          },
        });
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
        <ApHeader title="Airtime Top-Up" />

        {/* Banner */}
        <BannerCarousel
          images={banners}
          heightRatio={0.25}
          borderRadius={16}
          autoplayInterval={4000}
        />

        {/* FORM */}
        <Formik
          initialValues={{ amount: "", phone: "" }}
          validationSchema={schema}
          onSubmit={(values) => {
            if (!values.amount || !values.phone) {
              showToast("Please enter phone and amount", "error");
              return;
            }
            if (!displayedNetwork) {
              showToast("Please select a network", "error");
              return;
            }
            setDetails([
              { label: "Network", value: displayedNetwork.name },
              { label: "Phone Number", value: values.phone },
              { label: "Amount", value: `₦${values.amount}` },
            ]);
            setPinVisible(true);
          }}
        >
          {({ handleSubmit, values, setFieldValue, errors, touched }) => (
            <>
              {/* Phone + Network picker */}
              {displayedNetwork && (
                <NetworkPhonePicker
                  selectedNetwork={displayedNetwork}
                  setSelectedNetwork={(net) => setSelectedNetwork(net)}
                  phone={values.phone}
                  setPhone={(num: string) => {
                    setFieldValue("phone", num);
                    detectNetwork(num);
                  }}
                  networks={dataServices.map((s: any) => ({
                    name: s.name,
                    image: s.image || require("../../../assets/images/mtn.png"),
                  }))}
                  userId={user?._id}
                />
              )}

              {/* QUICK AMOUNTS */}
              <View className="px-4 mt-6">
                <Text className="text-gray-700 font-semibold mb-2">Top up</Text>

                <View className="flex-row flex-wrap justify-between">
                  {amounts.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      className={`w-[31%] mb-4 p-3 rounded-xl border text-center ${
                        values.amount == item.value
                          ? "bg-green-100 border-green-500"
                          : "bg-gray-50 border-gray-200"
                      }`}
                      onPress={() => {
                        setFieldValue("amount", item.value);
                        if (!displayedNetwork) {
                          showToast("Please select a network", "error");
                          return;
                        }
                        setDetails([
                          { label: "Network", value: displayedNetwork.name },
                          { label: "Phone Number", value: values.phone },
                          { label: "Amount", value: `₦${item.value}` },
                        ]);
                        setPinVisible(true);
                      }}
                    >
                      <Text className="text-xs text-green-600 text-center">
                        {item.cashback}
                      </Text>
                      <Text className="text-[1.4rem] font-semibold mt-2 text-center">
                        ₦{item.value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* MANUAL AMOUNT INPUT */}
              <ApTextInput
                name="amount"
                placeholder="Enter Amount"
                keyboardType="numeric"
                label="Amount"
              />

              <View className="px-4 mt-4 mb-10">
                <ApButton
                  title="Buy Now"
                  onPress={handleSubmit as any}
                  loading={loading}
                />
              </View>
              <PinModal
                visible={pinVisible}
                onClose={() => setPinVisible(false)}
                loading={loading}
                title="Review Airtime Purchase"
                details={details}
                useCashback={useCashback}
                setUseCashback={setUseCashback}
                cashbackBalance={user?.cashbackBalance ?? 0}
                onSubmit={(pin) => {
                  setPinCode(pin);
                  handleAirtimeSubmit(values, pin);
                }}
              />
            </>
          )}
        </Formik>
      </ApScrollView>
    </ApSafeAreaView>
  );
}
