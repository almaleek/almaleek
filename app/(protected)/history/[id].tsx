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

  const formatServiceLabel = (raw: string) => {
    const key = String(raw || "").toLowerCase().trim();
    if (!key) return "";
    if (key === "cable_tv" || key === "cable") return "Cable TV";
    if (key === "exam_pin" || key === "exam") return "Exam";
    if (key === "data_card") return "Data Card";
    return key.replace(/_/g, " ");
  };

  const parseRefundNote = (note: any) => {
    const text = String(note || "").trim();
    if (!text) return null;
    const serviceMatch = text.match(/refund for\s+(.+?)(?:\s+txid:|\s+ref:|$)/i);
    const txIdMatch = text.match(/txid:\s*([a-f0-9]{24})/i);
    const refMatch = text.match(/ref:\s*([a-z0-9_-]+)/i);
    if (!serviceMatch && !txIdMatch && !refMatch) return null;
    return {
      service: serviceMatch?.[1]?.trim() || "",
      txId: txIdMatch?.[1] || "",
      ref: refMatch?.[1] || "",
    };
  };

  const getTransactionTypeLabel = () => {
    const raw = String(transaction?.transaction_type || "").toLowerCase();
    if (raw === "credit_note") return "credit";
    if (raw === "debit_note") return "debit";
    return raw || "wallet";
  };

  const walletRefundMeta =
    String(transaction?.service || "").toLowerCase() === "wallet" &&
    String(transaction?.transaction_type || "").toLowerCase() === "refund"
      ? parseRefundNote(transaction?.note)
      : null;

  const walletTypeValue =
    walletRefundMeta?.service
      ? `Refund (${formatServiceLabel(walletRefundMeta.service)})`
      : transaction.note
        ? String(transaction.note)
        : getTransactionTypeLabel();

  return (
    <ApSafeAreaView>
      <ApHeader
        title="Transaction Receipt"
        link="/(protected)/(tabs)/history"
      />

      <ApScrollView style={{ backgroundColor: "#f5f5f5", flex: 1 }}>
        <View className="p-4">
          <View
            ref={receiptRef}
            collapsable={false}
            className="bg-white p-6 rounded-2xl shadow-xl mx-1 border border-gray-100"
          >
            <View className="items-center mb-6">
              {transaction.status === "success" && <CheckCircle size={52} color="#16a34a" />}
              {transaction.status === "pending" && <Clock size={52} color="#f59e0b" />}
              {transaction.status === "failed" && <XCircle size={52} color="#dc2626" />}
              <View
                className={`mt-3 px-3 py-1 rounded-full border ${
                  transaction.status === "success"
                    ? "bg-green-100 border-green-200"
                    : transaction.status === "pending"
                    ? "bg-orange-100 border-orange-200"
                    : "bg-red-100 border-red-200"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    transaction.status === "success"
                      ? "text-green-700"
                      : transaction.status === "pending"
                      ? "text-orange-700"
                      : "text-red-700"
                  }`}
                >
                  {transaction.status?.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text className="text-3xl font-extrabold text-gray-900 text-center">
              {formatCurrency(transaction.amount)}
            </Text>
            <Text className="text-gray-500 text-sm text-center mt-1">
              {transaction.transaction_date
                ? new Date(transaction.transaction_date).toLocaleString()
                : "N/A"}
            </Text>

            <View className="h-[1px] bg-gray-200 my-6" />

            <RenderRow
              label="Reference"
              value={
                transaction.client_reference ||
                transaction.reference_no ||
                "N/A"
              }
            />
            <RenderRow
              label="Date"
              value={
                transaction.transaction_date
                  ? new Date(transaction.transaction_date).toLocaleString()
                  : "N/A"
              }
            />
            <RenderRow
              label="Service"
              value={
                transaction.service === "wallet"
                  ? "wallet"
                  : transaction.service || "N/A"
              }
            />
            {transaction.service === "wallet" && (
              <RenderRow
                label="Type"
                value={walletTypeValue}
              />
            )}
            {!!walletRefundMeta?.txId && (
              <RenderRow label="Related TxId" value={walletRefundMeta.txId} />
            )}
            {!!walletRefundMeta?.ref && (
              <RenderRow label="Related Ref" value={walletRefundMeta.ref} />
            )}
            {transaction.note && transaction.service !== "wallet" && (
              <RenderRow label="Note" value={String(transaction.note)} />
            )}

            {transaction.destination_account_name && (
              <RenderRow label="Beneficiary" value={transaction.destination_account_name} />
            )}
            {transaction.destination_account_number && (
              <RenderRow label="Account No" value={transaction.destination_account_number} />
            )}
            {transaction.description && (
              <RenderRow label="Description" value={transaction.description} />
            )}

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
              className="flex-row items-center bg-blue-600 px-6 py-3 rounded-2xl gap-4 shadow-md"
            >
              {processing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Share2 size={20} color="white" className="mr-2" />
                  <Text className="text-white font-semibold">Share Receipt</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ApScrollView>
    </ApSafeAreaView>
  );
}
