import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApScrollView from "@/components/scrollview/scrollview";
import ApHeader from "@/components/headers/header";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchBanks,
  performNameEnquiry,
  initiateTransfer,
  clearEnquiry,
  clearTransfer,
} from "@/redux/features/remita/remitaSlice";
import { Search, ChevronDown, CheckCircle, XCircle } from "lucide-react-native";
import MainLoader from "@/components/loaders/mainloader";
import { router } from "expo-router";
import BannerCarousel from "@/components/carousel/banner";
import PinModal from "@/components/modals/pinModal";

const TransferSchema = Yup.object().shape({
  bankCode: Yup.string().required("Bank is required"),
  accountNumber: Yup.string()
    .length(10, "Account number must be 10 digits")
    .required("Account number is required"),
  amount: Yup.number()
    .min(100, "Minimum amount is 100")
    .required("Amount is required"),
  narration: Yup.string().required("Narration is required"),
});

const banners = [
  require("../../../assets/images/banner1.png"),
  require("../../../assets/images/banner2.png"),
  require("../../../assets/images/banner3.png"),
];


export default function TransferScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    banks,
    banksLoading,
    enquiryResult,
    enquiryLoading,
    enquiryError,
    transferLoading,
    transferResult,
    transferError,
  } = useSelector((state: RootState) => state.remita);
  const { user } = useSelector((state: RootState) => state.auth);

  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  const [showAccountBankMatches, setShowAccountBankMatches] = useState(false);
  const handledOnceRef = useRef(false);
  const enquiryDebounceRef = useRef<any>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [pinVisible, setPinVisible] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const amountlists = [
    { label: "₦1,000", value: "1000" },
    { label: "₦2,000", value: "2000" },
    { label: "₦5,000", value: "5000" },
    { label: "₦10,000", value: "10000" },
    { label: "₦20,000", value: "20000" },
    { label: "₦50,000", value: "50000" },
    { label: "₦100,000", value: "100000" },
    { label: "Others", value: "" },
  ];

  useEffect(() => {
    if (!banks.length) {
      dispatch(fetchBanks());
    }
  }, [dispatch, banks.length]);

  useEffect(() => {
    if (transferResult && !handledOnceRef.current) {
      handledOnceRef.current = true;
      try {
        const res: any = transferResult || {};
        const txId =
          res?.transactionId ||
          res?.data?.transactionId ||
          res?.request_id ||
          res?.data?.request_id ||
          res?._id ||
          res?.data?._id ||
          res?.id ||
          res?.data?.id;

        if (txId) {
          router.push({
            pathname: "/(protected)/history/[id]",
            params: { id: String(txId) },
          });
        } else {
          router.push({
            pathname: "/(protected)/history/[id]",
            params: { id: String(txId) },
          });
        }
      } finally {
        handledOnceRef.current = false;
        dispatch(clearTransfer());
        dispatch(clearEnquiry());
        setPinVisible(false);
        setPinCode("");
      }
    } else if (transferError && !handledOnceRef.current) {
      handledOnceRef.current = true;
      Alert.alert("Error", transferError?.message || "Transfer failed");
      dispatch(clearTransfer());
      handledOnceRef.current = false;
    }
  }, [transferResult, transferError, dispatch]);

  const bankList = Array.isArray(banks) ? banks : [];
  const filteredBanks = bankList.filter((bank: any) => {
    const term = searchText.toLowerCase();
    return (
      bank.bankName.toLowerCase().includes(term) ||
      String(bank.bankCode).toLowerCase().includes(term)
    );
  });

  const handleAccountChange = (text: string, setFieldValue: any, values: any) => {
    setFieldValue("accountNumber", text);
    const prefix = text && text.length >= 3 ? text.slice(0, 3) : "";
    if (prefix.length === 3) {
      const hasMatch = bankList.some((bank: any) =>
        String(bank.bankCode).startsWith(prefix)
      );
      setShowAccountBankMatches(hasMatch);
    } else {
      setShowAccountBankMatches(false);
    }
    if (enquiryDebounceRef.current) {
      clearTimeout(enquiryDebounceRef.current);
    }
    enquiryDebounceRef.current = setTimeout(() => {
      if (text.length === 10 && values.bankCode) {
        dispatch(
          performNameEnquiry({
            destinationBankCode: values.bankCode,
            destinationAccountNumber: text,
          })
        );
      } else {
        dispatch(clearEnquiry());
      }
    }, 400);
  };

  const handleTransfer = (values: any) => {
    if (!enquiryResult?.accountNumber) {
      Alert.alert("Error", "Please verify account details first");
      return;
    }

    const payload = {
      destinationBankCode: values.bankCode,
      destinationAccountNumber: values.accountNumber,
      destinationAccountName: enquiryResult.nameOnAccount,
      amount: Number(values.amount),
      transactionDescription: values.narration,
      paymentIdentifier: `TXN-${Date.now()}`, // Generate a unique ID
      userId: user?._id,
      pinCode,
    };

    dispatch(initiateTransfer(payload));
  };

  return (
    <ApSafeAreaView>
      <ApHeader title="Transfer" />
      <StatusBar style="dark" />

      {banksLoading && bankList.length === 0 ? (
        <MainLoader />
      ) : (
        <ApScrollView style={{ backgroundColor: "white" }}>
          <View className="p-4">
            <Formik
              initialValues={{
                bankCode: "",
                accountNumber: "",
                amount: "",
                narration: "",
              }}
              validationSchema={TransferSchema}
              onSubmit={handleTransfer}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                setFieldValue,
              }) => {
                const accountPrefix =
                  values.accountNumber && values.accountNumber.length >= 3
                    ? values.accountNumber.slice(0, 3)
                    : "";
                const accountBankMatches =
                  accountPrefix.length === 3
                    ? bankList.filter((bank: any) =>
                        String(bank.bankCode).startsWith(accountPrefix)
                      )
                    : [];

                return (
                <View>
                  {step === 1 && (
                    <>
                      <ApTextInput
                        name="accountNumber"
                        label="Account Number"
                        placeholder="Enter 10-digit account number"
                        keyboardType="numeric"
                        maxLength={10}
                        onChange={(text) =>
                          handleAccountChange(text, setFieldValue, values)
                        }
                        loading={enquiryLoading}
                      />
                      {accountBankMatches.length > 0 && showAccountBankMatches && (
                        <View className="mb-3 border border-gray-200 rounded-lg bg-white max-h-48">
                          {accountBankMatches.map((item: any) => (
                            <TouchableOpacity
                              key={item.bankCode}
                              className="px-3 py-2 border-b border-gray-100"
                              onPress={() => {
                                setSelectedBank(item);
                                setFieldValue("bankCode", item.bankCode);
                                setShowAccountBankMatches(false);
                              }}
                            >
                              <Text className="text-gray-900">
                                {item.bankName}
                              </Text>
                              <Text className="text-gray-500 text-xs">
                                Code: {item.bankCode}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      <Text className="mb-1 text-gray-700 font-semibold">Bank</Text>
                      <TouchableOpacity
                        onPress={() => setBankModalVisible(true)}
                        className="flex-row items-center justify-between border border-gray-300 rounded-lg px-3 py-3 mb-4 bg-gray-50"
                      >
                        <Text
                          className={
                            selectedBank ? "text-gray-900" : "text-gray-400"
                          }
                        >
                          {selectedBank ? selectedBank.bankName : "Select Bank"}
                        </Text>
                        <ChevronDown size={20} color="#6b7280" />
                      </TouchableOpacity>
                      {touched.bankCode && errors.bankCode && (
                        <Text className="text-red-500 text-sm mb-2 -mt-2">
                          {errors.bankCode}
                        </Text>
                      )}

                      {enquiryResult && (
                        <View className="bg-green-50 p-3 rounded-lg mb-4 flex-row items-center border border-green-200">
                          <CheckCircle size={20} color="#16a34a" />
                          <Text className="ml-2 text-green-700 font-bold uppercase">
                            {enquiryResult.nameOnAccount}
                          </Text>
                        </View>
                      )}

                      {enquiryError && (
                        <View className="bg-red-50 p-3 rounded-lg mb-4 flex-row items-center border border-red-200">
                          <XCircle size={20} color="#dc2626" />
                          <Text className="ml-2 text-red-700 font-medium">
                            Account not found
                          </Text>
                        </View>
                      )}

                      <ApButton
                        title="Continue"
                        onPress={() => setStep(2)}
                        disabled={!enquiryResult || enquiryLoading}
                      />
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <View className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <Text className="text-gray-700 font-semibold">Recipient</Text>
                        <Text className="text-gray-900 mt-1">
                          {enquiryResult?.nameOnAccount || "Unknown"}
                        </Text>
                        <Text className="text-gray-600">
                          {selectedBank?.bankName || "Bank"} • {values.accountNumber}
                        </Text>
                      </View>

                      <View className="flex-row flex-wrap justify-between mb-2">
                        {amountlists.map((item) => {
                          const isSelected =
                            values.amount?.toString() === item.value &&
                            item.value !== "";
                          return (
                            <TouchableOpacity
                              key={item.label}
                              className={`rounded-full px-3 py-2 border items-center mb-2 ${
                                isSelected
                                  ? "bg-green-100 border-green-500"
                                  : "bg-gray-100 border-gray-300"
                              }`}
                              style={{ minWidth: "22%", alignItems: "center" }}
                              onPress={() => setFieldValue("amount", item.value)}
                              disabled={transferLoading || enquiryLoading}
                            >
                              <Text
                                className={`text-sm font-semibold ${
                                  isSelected ? "text-green-700" : "text-gray-900"
                                }`}
                              >
                                {item.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <ApTextInput
                        name="amount"
                        label="Amount"
                        placeholder="Enter amount"
                        keyboardType="numeric"
                      />

                      <ApTextInput
                        name="narration"
                        label="Narration"
                        placeholder="What is this for?"
                      />

                      <ApButton
                        title="Send"
                        onPress={() => {
                          if (!enquiryResult) {
                            Alert.alert("Error", "Please verify account details first");
                            return;
                          }
                          setPinVisible(true);
                        }}
                        loading={transferLoading}
                        disabled={!enquiryResult || enquiryLoading || transferLoading}
                      />

                      <ApButton
                        title="Back"
                        variant="secondary"
                        onPress={() => setStep(1)}
                      />
                    </>
                  )}

                  {/* Bank Selection Modal */}
                  <Modal
                    visible={bankModalVisible}
                    animationType="slide"
                    presentationStyle="pageSheet"
                  >
                    <View className="flex-1 bg-white pt-6">
                      <View className="px-4 pb-2 border-b border-gray-100 flex-row items-center">
                        <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                          <Search size={20} color="#9ca3af" />
                          <TextInput
                            placeholder="Search bank"
                            className="ml-2 flex-1 text-base"
                            value={searchText}
                            onChangeText={(newText) => {
                              setSearchText(newText);
                              const match = bankList.find(
                                (b: any) =>
                                  String(b.bankCode).toLowerCase() === newText.toLowerCase()
                              );
                              if (match) {
                                setSelectedBank(match);
                                setFieldValue("bankCode", match.bankCode);
                                setBankModalVisible(false);
                              }
                            }}
                            autoFocus
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => setBankModalVisible(false)}
                          className="ml-4"
                        >
                          <Text className="text-blue-600 font-medium">Cancel</Text>
                        </TouchableOpacity>
                      </View>

                      <FlatList
                        data={filteredBanks}
                        keyExtractor={(item) => item.bankCode}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            className="p-4 border-b border-gray-100 active:bg-gray-50"
                            onPress={() => {
                              setSelectedBank(item);
                              setFieldValue("bankCode", item.bankCode);
                              setBankModalVisible(false);
                            }}
                          >
                            <Text className="text-base text-gray-900">
                              {item.bankName}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  </Modal>

                  <PinModal
                    visible={pinVisible}
                    loading={transferLoading}
                    onClose={() => {
                      if (!transferLoading) setPinVisible(false);
                    }}
                    onSubmit={(pin) => {
                      setPinCode(pin);
                      setPinVisible(false);
                      handleSubmit();
                    }}
                  />
                </View>
              )}}
            </Formik>

          </View>
           <BannerCarousel
          images={banners}
          heightRatio={0.25}
          borderRadius={16}
          autoplayInterval={4000}
        />
        </ApScrollView>
      )}

    </ApSafeAreaView>
  );
}
