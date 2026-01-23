import React, { useState } from "react";
import { View, Text, Pressable, StatusBar, Alert } from "react-native";
import { Fingerprint, KeyRound } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function PasscodeSetupScreen() {
  const router = useRouter();
  const PASSCODE_LENGTH = 4;

  const [code, setCode] = useState<string[]>([]);
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [tempPasscode, setTempPasscode] = useState<string>("");

  const addDigit = (d: string) => {
    if (code.length >= PASSCODE_LENGTH) return;
    setCode((p) => [...p, d]);
  };

  const removeDigit = () => setCode((p) => p.slice(0, -1));

  const clearCode = () => setCode([]);

  const savePasscode = async () => {
    await AsyncStorage.setItem("app_passcode", tempPasscode);
  };

  const keypad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["bio", "0", "del"],
  ];

  const handlePasscodeFlow = async () => {
    const entered = code.join("");

    if (step === "create") {
      setTempPasscode(entered);
      clearCode();
      setStep("confirm");
      return;
    }

    if (step === "confirm") {
      if (entered !== tempPasscode) {
        Alert.alert("Passcode mismatch", "Your passcodes do not match.");
        clearCode();
        setStep("create");
        return;
      }

      await savePasscode();
      Alert.alert("Success", "Passcode has been set successfully!");
      router.push("/(protected)/(tabs)");
    }
  };

  if (code.length === PASSCODE_LENGTH) {
    setTimeout(handlePasscodeFlow, 150);
  }

  const enableBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert(
          "Not supported",
          "Your device does not support biometric authentication."
        );
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert(
          "Not enrolled",
          "No fingerprint/Face ID found. Please register on your device first."
        );
        return;
      }

      const verify = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable biometric login",
        cancelLabel: "Cancel",
      });

      if (verify.success) {
        await AsyncStorage.setItem("biometric_enabled", "true");
        Alert.alert("Enabled", "Biometric authentication activated.");
      }
    } catch (e) {
      Alert.alert("Error", "Something went wrong enabling biometrics.");
    }
  };

  return (
    <View className="flex-1 bg-gray-50 pt-8">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER */}
      <View className="flex-1 justify-center items-center">
        <View className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
          <KeyRound size={48} color="green" />
        </View>

        <Text className="text-2xl font-bold mt-4 text-gray-800">
          {step === "create" ? "Create Passcode" : "Confirm Passcode"}
        </Text>

        <Text className="text-gray-500 mt-1">
          Secure your account with a passcode
        </Text>

        {/* DOTS */}
        <View className="flex-row mt-8 space-x-3">
          {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => (
            <View
              key={i}
              className={`w-4 h-4 rounded-full border mx-2 ${
                i < code.length
                  ? "bg-green-600 border-green-600"
                  : "border-gray-300 bg-transparent"
              }`}
            />
          ))}
        </View>
      </View>

      {/* KEYPAD */}
      <View className="px-14 pb-6">
        <View className="items-center">
          {keypad.map((row, idx) => (
            <View key={idx} className="flex-row w-full justify-between mb-14">
              {row.map((k) => {
                if (k === "bio")
                  return (
                    <Pressable key={k} onPress={enableBiometric}>
                      <View className="w-20 h-20 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        <Fingerprint size={32} color="green" />
                      </View>
                    </Pressable>
                  );

                if (k === "del")
                  return (
                    <Pressable key={k} onPress={removeDigit}>
                      <View className="w-20 h-20 rounded-full bg-red-500/80 flex items-center justify-center">
                        <Text className="text-white text-xl">⌫</Text>
                      </View>
                    </Pressable>
                  );

                return (
                  <Pressable key={k} onPress={() => addDigit(k)}>
                    <View className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                      <Text className="text-2xl font-semibold text-indigo-900">
                        {k}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* CANCEL / BACK */}
        <Pressable
          className="items-center mt-2 mb-20"
          onPress={() => router.back()}
        >
          <Text className="text-sm text-gray-700 underline">Back</Text>
        </Pressable>
      </View>
    </View>
  );
}
