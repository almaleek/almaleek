import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApHeader from "@/components/headers/header";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import ApScrollView from "@/components/scrollview/scrollview";
import NetworkPhonePicker from "@/components/network/networkPicker";
import BannerCarousel from "@/components/carousel/banner";
import PinModal from "@/components/modals/pinModal";

import {
  getDataServices,
  purchaseAirtime,
} from "@/redux/features/easyAccess/service";
import { AppDispatch, RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect, useRouter } from "expo-router";
import { useToast } from "@/components/toast/toastProvider";

// DEFAULT NETWORKS
const networks = [
  {
    name: "MTN",
    logo: require("../../../assets/images/mtn.png"),
    prefixes: [
      "0803",
      "0806",
      "0703",
      "0706",
      "0813",
      "0816",
      "0810",
      "0903",
      "0906",
      "0913",
      "0916",
    ],
  },
  {
    name: "Airtel",
    logo: require("../../../assets/images/airtel.png"),
    prefixes: [
      "0802",
      "0808",
      "0708",
      "0812",
      "0701",
      "0902",
      "0907",
      "0901",
      "0912",
    ],
  },
];

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
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const [pinVisible, setPinVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);
  const { dataServices } = useSelector(
    (state: RootState) => state.easyAccessdataPlans
  );

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { showToast } = useToast();

  const banners = [
    require("../../../assets/images/banner1.png"),
    require("../../../assets/images/banner2.png"),
    require("../../../assets/images/banner3.png"),
  ];

  // Auto-detect network
  const detectNetwork = (phone: string) => {
    const prefix = phone.slice(0, 4);
    const found = networks.find((net) => net.prefixes.includes(prefix));
    if (found) setSelectedNetwork(found);
  };

  // Load list from backend
  useFocusEffect(
    useCallback(() => {
      dispatch(getDataServices("airtime") as any);
    }, [dispatch])
  );

  // HANDLE AIRTIME SUBMIT (SEPARATED)
  const handleAirtimeSubmit = async (
    values: any,
    setFieldValue: (field: string, value: any) => void
  ) => {
    setLoading(true);

    const payload = {
      ...values,
      networkId: selectedNetwork.name.replace(/\s+.*/, "").toUpperCase(),
      userId: user?._id,
      amount: Number(values.amount),
    };

    console.log(payload);

    try {
      const result = await dispatch(purchaseAirtime(payload as any));

      if (purchaseAirtime.fulfilled.match(result)) {
        showToast("Airtime purchase successful!", "success");

        router.push({
          pathname: "/(protected)/history/[id]",
          params: { id: result.payload.transactionId },
        });
      } else {
        const transactionId = result.payload?.transactionId;
        if (transactionId) {
          router.push({
            pathname: "/(protected)/history/[id]",
            params: { id: transactionId },
          });
        } else {
          showToast(result.payload?.error || "Purchase failed", "error");
        }
      }
    } finally {
      setLoading(false);
      setPinVisible(false);
      setFieldValue("pinCode", ""); // Clear PIN
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
          initialValues={{ amount: "", phone: "", pinCode: "" }}
          validationSchema={schema}
          onSubmit={(values, { setFieldValue }) => {
            handleAirtimeSubmit(values, setFieldValue);
          }}
        >
          {({ handleSubmit, values, setFieldValue, errors, touched }) => (
            <>
              {/* Phone + Network picker */}
              <NetworkPhonePicker
                selectedNetwork={selectedNetwork as any}
                setSelectedNetwork={(net) => setSelectedNetwork(net as any)}
                phone={values.phone}
                setPhone={(num: string) => {
                  setFieldValue("phone", num);
                  detectNetwork(num);
                }}
                networks={dataServices}
              />

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
                        setFieldValue("amount", item.value),
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
              />
              {touched.amount && errors.amount && (
                <Text className="text-red-500 mt-1">{errors.amount}</Text>
              )}

              {/* PROCEED BUTTON → open PIN modal */}
              <View className="px-4 mt-4 mb-8">
                <ApButton
                  title="Proceed to Pay"
                  onPress={() => {
                    if (!values.amount || !values.phone) {
                      showToast("Please enter phone and amount", "error");
                      return;
                    }
                    setPinVisible(true);
                  }}
                  loading={loading}
                />
              </View>

              {/* PIN MODAL (Blocks API until PIN entered) */}
              <PinModal
                visible={pinVisible}
                onClose={() => setPinVisible(false)}
                loading={loading}
                onSubmit={(pin) => {
                  setFieldValue("pinCode", pin); // Save PIN
                  handleSubmit(); // Submit the API
                }}
              />
            </>
          )}
        </Formik>
      </ApScrollView>
    </ApSafeAreaView>
  );
}
