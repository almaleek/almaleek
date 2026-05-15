import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Fingerprint, LogOut } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/features/user/userSlice";

export default function BiometricScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleBiometricAuth = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          "Biometrics Unavailable",
          "Please log in with your credentials or enable biometrics in settings."
        );
        handleLogout();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to continue",
        fallbackLabel: "Use Passcode",
      });

      if (result.success) {
        router.replace("/(protected)/(tabs)");
      } else {
        // If they cancel or fail, we stay on this screen and offer retry
        setIsAuthenticating(false);
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Biometric authentication failed.");
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/(auth)/signin");
  };

  useEffect(() => {
    handleBiometricAuth();
  }, []);

  return (
    <View className="flex-1 bg-white pt-8 px-6">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Section */}
      <View className="flex-1 justify-center items-center">
        <View className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-6">
          <Fingerprint size={48} color="#16a34a" />
        </View>

        <Text className="text-2xl font-bold text-gray-900 text-center">
          Security Check
        </Text>
        <Text className="text-gray-500 text-center mt-2 px-4">
          Please authenticate using biometrics to access your account.
        </Text>

        <View className="mt-12 w-full px-8">
          {isAuthenticating ? (
            <ActivityIndicator size="large" color="#16a34a" />
          ) : (
            <Pressable
              onPress={handleBiometricAuth}
              className="bg-green-600 py-4 rounded-xl items-center shadow-sm"
            >
              <Text className="text-white font-semibold text-lg">
                Try Again
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Bottom Section */}
      <View className="pb-12">
        <Pressable
          onPress={handleLogout}
          className="flex-row items-center justify-center py-4"
        >
          <LogOut size={20} color="#ef4444" className="mr-2" />
          <Text className="text-red-500 font-medium ml-2">Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}
