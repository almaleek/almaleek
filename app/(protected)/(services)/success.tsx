import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApHeader from "@/components/headers/header";

export default function SuccessScreen() {
  const router = useRouter();
  const { status, message, transactionId, amount, service, network } = useLocalSearchParams();
  const isSuccess = status === "success";

  return (
    <ApSafeAreaView>
      <ApHeader title={isSuccess ? "Success" : "Failed"} />
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={isSuccess ? "checkmark-circle" : "close-circle"}
            size={100}
            color={isSuccess ? "#4CAF50" : "#F44336"}
          />
        </View>

        <Text style={styles.statusText}>
          {isSuccess ? "Transaction Successful" : "Transaction Failed"}
        </Text>

        <Text style={styles.messageText}>
          {message || (isSuccess ? "Your purchase was successful!" : "Something went wrong during the transaction.")}
        </Text>

        <View style={styles.detailsContainer}>
          {service && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service:</Text>
              <Text style={styles.detailValue}>{service}</Text>
            </View>
          )}
          {network && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network/Provider:</Text>
              <Text style={styles.detailValue}>{network}</Text>
            </View>
          )}
          {/* {amount && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>₦{Number(amount).toLocaleString()}</Text>
            </View>
          )}  */}
          {transactionId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID:</Text>
              <Text style={styles.detailValue}>{transactionId}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: isSuccess ? "#4CAF50" : "#F44336" }]}
          onPress={() => router.replace("/(protected)/(tabs)")}
        >
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push("/(protected)/(tabs)/history")}
        >
          <Text style={styles.historyButtonText}>View History</Text>
        </TouchableOpacity>
      </View>
    </ApSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
    backgroundColor: "white",
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  messageText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  detailsContainer: {
    width: "100%",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#888",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  historyButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#666",
    marginBottom: 16,
    width: "100%",
  },
  historyButtonText: {
    color: "#666",
    fontSize: 14,
  },
});
