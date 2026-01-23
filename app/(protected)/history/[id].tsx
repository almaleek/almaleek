import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchTransactionById } from "@/redux/features/transaction/transactionSlice";
import {
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Share2,
} from "lucide-react-native";
import ApScrollView from "@/components/scrollview/scrollview";
import ApLoader from "@/components/loaders/mainloader";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApHeader from "@/components/headers/header";

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

export default function TransactionPage() {
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const receiptRef = useRef<View>(null);
  const [processing, setProcessing] = useState(false);

  const { transaction, loading } = useSelector(
    (state: RootState) => state.transactions
  );

  useEffect(() => {
    if (id) dispatch(fetchTransactionById({ _id: id as string }));
  }, [dispatch, id]);

  if (loading) return <ApLoader />;

  if (!transaction)
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500">Transaction not found.</Text>
      </View>
    );

  const formatCurrency = (amount: number | undefined | null) =>
    amount != null ? `₦${Number(amount).toLocaleString()}` : "₦0";

  // ---------------------- DOWNLOAD ONLY ----------------------
  // const handleDownloadOnly = async () => {
  //   if (!receiptRef.current) return;

  //   try {
  //     setProcessing(true);
  //     const uri = await captureRef(receiptRef, { format: "png", quality: 0.9 });

  //     const fileUri = `${FileSystem.cacheDirectory}Almaleek_Receipt_${transaction.reference_no}.png`;

  //     await FileSystem.copyAsync({ from: uri, to: fileUri });

  //     Alert.alert("Success", "Receipt downloaded successfully.");
  //   } catch (error) {
  //     Alert.alert("Error", "Unable to download receipt.");
  //   } finally {
  //     setProcessing(false);
  //   }
  // };

  // ---------------------- SHARE ONLY ----------------------
  const handleShareOnly = async () => {
    if (!receiptRef.current) return;

    try {
      setProcessing(true);
      const uri = await captureRef(receiptRef, { format: "png", quality: 0.9 });
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `Almaleek Receipt - ${transaction.reference_no}`,
      });
    } catch (error) {
      Alert.alert("Error", "Unable to share receipt.");
    } finally {
      setProcessing(false);
    }
  };

  const RenderRow = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row justify-between py-2 border-b border-gray-200">
      <Text className="text-gray-600 font-medium">{label}</Text>
      <Text className="text-gray-800 font-semibold">{value}</Text>
    </View>
  );

  return (
    <ApSafeAreaView>
      <ApHeader
        title="Transaction Receipt"
        link="/(protected)/(tabs)/history"
      />

      <ApScrollView style={{ backgroundColor: "#f5f5f5", flex: 1 }}>
        <View className="p-4">
          {/* RECEIPT CARD */}
          <View
            ref={receiptRef}
            collapsable={false}
            className="bg-white p-6 rounded-2xl shadow-lg mx-1"
          >
            {/* Status Icon */}
            <View className="items-center mb-4">
              {transaction.status === "success" && (
                <CheckCircle size={52} color="green" />
              )}
              {transaction.status === "pending" && (
                <Clock size={52} color="orange" />
              )}
              {transaction.status === "failed" && (
                <XCircle size={52} color="red" />
              )}
              <Text className="mt-2 text-xl font-bold">
                {transaction.status?.toUpperCase()}
              </Text>
            </View>

            {/* Transaction Fields */}
            <RenderRow
              label="Reference"
              value={
                transaction.client_reference ||
                transaction.reference_no ||
                "N/A"
              }
            />
            <RenderRow
              label="Amount"
              value={formatCurrency(transaction.amount)}
            />
            <RenderRow
              label="Date"
              value={
                transaction.transaction_date
                  ? new Date(transaction.transaction_date).toLocaleString()
                  : "N/A"
              }
            />
            <RenderRow label="Service" value={transaction.service || "N/A"} />

            {/* CONDITIONAL FIELDS */}
            {transaction.network && (
              <RenderRow
                label="Network"
                value={transaction.network.toUpperCase()}
              />
            )}
            {transaction.mobile_no && (
              <RenderRow label="Phone" value={transaction.mobile_no} />
            )}
            {transaction.data_type && (
              <RenderRow label="Plan" value={transaction.data_type} />
            )}
            {transaction.meter_no && (
              <RenderRow label="Meter No" value={transaction.meter_no} />
            )}
            {transaction.token && (
              <RenderRow label="Token" value={transaction.token} />
            )}
            {transaction.customer_name && (
              <RenderRow label="Customer" value={transaction.customer_name} />
            )}
            {transaction.waec_pin && (
              <RenderRow label="Pin" value={transaction.waec_pin} />
            )}

            <RenderRow
              label="Previous Balance"
              value={formatCurrency(transaction.previous_balance)}
            />
            <RenderRow
              label="New Balance"
              value={formatCurrency(transaction.new_balance)}
            />

            <Text className="text-center mt-4 text-gray-500 text-xs">
              Thank you for choosing Almaleek 💚
            </Text>
          </View>

          {/* ACTION BUTTONS */}
          <View className="flex-row justify-center gap-4 mt-6">
            {/* Download */}
            {/* <TouchableOpacity
              onPress={handleDownloadOnly}
              disabled={processing}
              className="flex-row items-center bg-green-700 px-6 py-3 rounded-xl"
            >
              {processing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Download size={20} color="white" className="mr-2" />
                  <Text className="text-white font-semibold">Download</Text>
                </>
              )}
            </TouchableOpacity> */}

            {/* Share */}
            <TouchableOpacity
              onPress={handleShareOnly}
              disabled={processing}
              className="flex-row items-center bg-blue-600 px-6 py-3 rounded-xl gap-4"
            >
              {processing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Share2 size={20} color="white" className="mr-2" />
                  <Text className="text-white font-semibold">Share</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ApScrollView>
    </ApSafeAreaView>
  );
}
