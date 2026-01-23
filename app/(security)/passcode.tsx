import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StatusBar,
  Alert,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Fingerprint, User as UserIcon } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { Redirect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PasscodeScreen() {
  const router = useRouter();
  const PASSCODE_LENGTH = 4;
  const MAX_ATTEMPTS = 3;

  const [code, setCode] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);

  // Shake animation
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const getSavedPasscode = async () => {
    return await AsyncStorage.getItem("app_passcode");
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 🔐 Verify PIN Safely (No Infinite Loop)
  const verifyPin = async (enteredCode: string[]) => {
    const savedPasscode = await getSavedPasscode();
    const pin = enteredCode.join("");

    if (savedPasscode === pin) {
      router.replace("/(protected)/(tabs)");
      return;
    }

    // Wrong PIN
    triggerShake();
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (nextAttempts >= MAX_ATTEMPTS) {
      Alert.alert("Too many attempts", "Please log in with your credentials");
      router.replace("/(auth)/signin");
      console.log(pin, "sigin");
    } else {
      Alert.alert("Wrong PIN", "Please try again");
    }

    // Reset code after verifying
    setCode([]);
  };

  // 🔢 Add digit handler
  const addDigit = (digit: string) => {
    if (code.length >= PASSCODE_LENGTH) return;

    const updated = [...code, digit];
    setCode(updated);

    // When PIN is complete → verify once
    if (updated.length === PASSCODE_LENGTH) {
      verifyPin(updated);
    }
  };

  // 🔙 Remove last digit
  const removeDigit = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  // 🔒 Biometric Authentication
  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return Alert.alert("Biometrics not supported");
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return Alert.alert("No biometrics enrolled");
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate",
      });

      if (result.success) {
        router.replace("/(protected)/(tabs)");
      } else {
        Alert.alert("Failed", "Authentication failed.");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Biometric authentication failed.");
    }
  };

  const keypad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["bio", "0", "del"],
  ];

  return (
    <View className="flex-1 bg-gray-50 pt-8">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Section */}
      <View className="flex-1 justify-center items-center">
        <View className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
          <UserIcon size={48} color="green" />
        </View>

        <Text className="text-2xl font-semibold text-gray-800 mt-4">
          Welcome back!
        </Text>

        {/* PIN Dots */}
        <Animated.View
          style={{
            flexDirection: "row",
            marginTop: 32,
            transform: [{ translateX: shakeAnim }],
          }}
        >
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
        </Animated.View>
      </View>

      {/* Keypad */}
      <View className="px-14 pb-6">
        <View className="items-center">
          {keypad.map((row, index) => (
            <View key={index} className="flex-row justify-between w-full mb-14">
              {row.map((key) => {
                if (key === "bio")
                  return (
                    <Pressable key={key} onPress={handleBiometricAuth}>
                      <View className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center">
                        <Fingerprint size={32} color="green" />
                      </View>
                    </Pressable>
                  );

                if (key === "del")
                  return (
                    <Pressable key={key} onPress={removeDigit}>
                      <View className="w-20 h-20 rounded-full bg-black/70 flex items-center justify-center">
                        <Text className="text-white text-xl">⌫</Text>
                      </View>
                    </Pressable>
                  );

                return (
                  <Pressable key={key} onPress={() => addDigit(key)}>
                    <View className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                      <Text className="text-2xl font-semibold text-indigo-900">
                        {key}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <TouchableOpacity
          className="items-center mt-6 mb-20"
          onPress={() => router.push("/(auth)/signin")}
        >
          <Text className="text-sm text-gray-700 underline">
            Log in using credentials
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
