import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchTransactionById } from "@/redux/features/transaction/transactionSlice";
import { CheckCircle, Clock, XCircle } from "lucide-react-native";
import ApScrollView from "@/components/scrollview/scrollview";
import ApLoader from "@/components/loaders/mainloader";

export default function TransactionPage() {
  const { request_id } = useLocalSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const { transaction, loading } = useSelector(
    (state: RootState) => state.transactions
  );

  // Fetch transaction on mount
  useEffect(() => {
    if (request_id) {
      dispatch(fetchTransactionById({ _id: request_id as string }));
    }
  }, [dispatch, request_id]);

  // Render each key-value pair
  const RenderTrans = ({ title, name }: { title: string; name: string }) => (
    <View className="flex-row justify-between py-1">
      <Text className="font-semibold text-gray-800">{title}</Text>
      <Text className="text-gray-700">{name}</Text>
    </View>
  );

  // Render fields specific to service type
  const renderServiceFields = () => {
    if (!transaction) return null;

    switch (transaction.service) {
      case "wallet":
        return <RenderTrans title="Transaction Type:" name={transaction.transaction_type || "N/A"} />;
      case "airtime":
        return (
          <>
            <RenderTrans title="Network:" name={transaction.network?.toUpperCase() || "N/A"} />
            <RenderTrans title="Phone:" name={transaction.mobile_no || "N/A"} />
          </>
        );
      case "data":
        return (
          <>
            <RenderTrans title="Network:" name={transaction.network?.toUpperCase() || "N/A"} />
            <RenderTrans title="Phone:" name={transaction.mobile_no || "N/A"} />
            <RenderTrans title="Data Plan:" name={transaction.data_type || "N/A"} />
          </>
        );
      case "electricity":
        return (
          <>
            <RenderTrans title="Meter No:" name={transaction.meter_no || "N/A"} />
            <RenderTrans title="Token:" name={transaction.token || "N/A"} />
            <RenderTrans title="Customer:" name={transaction.customer_name || "N/A"} />
          </>
        );
      case "exam_pin":
        return <RenderTrans title="Pin:" name={transaction.waec_pin || "N/A"} />;
      default:
        return null;
    }
  };

  // Show loader
  if (loading) return <ApLoader />;

  // Handle missing transaction
  if (!transaction) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500">Transaction not found.</Text>
      </View>
    );
  }

  // Format currency
  const formatCurrency = (amount: number | undefined | null) =>
    amount != null ? `₦${Number(amount).toLocaleString()}` : "₦0";

  return (
    <ApScrollView style={{ backgroundColor: "white", flex: 1 }}>

      <View className=" bg-white p-6 rounded-xl shadow-lg">
        {/* Status & service */}
        <View className="items-center mb-4">
          {transaction.status === "success" && (
            <>
              <CheckCircle size={48} color="green" />
              <Text className="text-xl font-bold text-green-700 mt-2">
                Transaction Successful
              </Text>
            </>
          )}
          {transaction.status === "pending" && (
            <>
              <Clock size={48} color="gold" />
              <Text className="text-xl font-bold text-yellow-700 mt-2">
                Transaction Pending
              </Text>
            </>
          )}
          {transaction.status === "failed" && (
            <>
              <XCircle size={48} color="red" />
              <Text className="text-xl font-bold text-red-700 mt-2">
                Transaction Failed
              </Text>
            </>
          )}

          <Text className="px-4 py-1 bg-gray-200 mt-3 rounded-full capitalize">
            {transaction.service || "N/A"}
          </Text>

          <Text className="text-gray-600 text-center mt-3 px-6">
            Thank you for choosing our service! We appreciate your trust.
          </Text>
        </View>

        {/* Transaction info */}
        <View className="mt-4 space-y-3">
          <RenderTrans
            title="Reference:"
            name={transaction.client_reference || transaction.reference_no || "N/A"}
          />
          <RenderTrans title="Amount:" name={formatCurrency(transaction.amount)} />
          <RenderTrans
            title="Date:"
            name={
              transaction.transaction_date
                ? new Date(transaction.transaction_date).toLocaleString()
                : "N/A"
            }
          />

          {/* Service-specific fields */}
          {renderServiceFields()}

          <RenderTrans title="Previous Balance:" name={formatCurrency(transaction.previous_balance)} />
          <RenderTrans title="New Balance:" name={formatCurrency(transaction.new_balance)} />
        </View>
      </View>
    </ApScrollView>

  );
}
