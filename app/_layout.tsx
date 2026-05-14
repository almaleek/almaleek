

import React, { useEffect, useState } from "react";
import "../global.css";
import { ToastProvider } from "@/components/toast/toastProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setTokens, logout, setBiometricEnabled } from "@/redux/features/user/userSlice";

import ApLoader from "@/components/loaders/mainloader";
import { injectLogoutHandler } from "@/redux/apis/common/aixosInstance";

import { useRouter, Stack } from "expo-router";
import { Provider, useSelector } from "react-redux";
import { store, RootState } from "@/redux/store";
import { fetchGlobalSettings } from "@/redux/features/setting/settingSlice";




function AppContent() {
  const router = useRouter();

  const [appReady, setAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  const { settings } = useSelector((state: RootState) => state.setting);

  useEffect(() => {
    store.dispatch(fetchGlobalSettings());
  }, []);
 
  useEffect(() => {
    injectLogoutHandler(() => {
      store.dispatch(logout());
      router.replace("/(auth)/signin");
    });
  }, [router]);

  useEffect(() => {
    const loadAppState = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        const hasSeen = await AsyncStorage.getItem("hasSeenOnboarding");
        const biometricEnabled = await AsyncStorage.getItem("biometric_enabled");

        if (!hasSeen) {
          setInitialRoute("/onboarding");
          setAppReady(true);
          return;
        }

        // 2️⃣ User logged in
        if (accessToken && refreshToken) {
          store.dispatch(setTokens({ accessToken, refreshToken }));
          if (biometricEnabled === "true") {
            store.dispatch(setBiometricEnabled(true));
            setInitialRoute("/(security)/biometric");
          } else {
            setInitialRoute("/(protected)/(tabs)");
          }
          setAppReady(true);
          return;
        }
        store.dispatch(logout());
        setInitialRoute("/(auth)/signin");
        setAppReady(true);
      } catch (err) {
        console.log("App load error:", err);
        store.dispatch(logout());
        setInitialRoute("/(auth)/signin");
        setAppReady(true);
      }
    };

    loadAppState();
  }, []);

  // Navigate after appReady
  useEffect(() => {
    if (appReady && initialRoute) {
      router.replace(initialRoute as any);
    }
  }, [appReady, initialRoute, router]);



  // Loading screen while deciding initial route
  if (!appReady) {
    return (
      <ApLoader />
    );
  }

  // Render Slot (root navigator)
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Provider>
  );
}
