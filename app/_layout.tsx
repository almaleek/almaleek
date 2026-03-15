

import React, { useEffect,useState } from "react";
import "../global.css";
import { ToastProvider } from "@/components/toast/toastProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setTokens, logout } from "@/redux/features/user/userSlice";

import ApLoader from "@/components/loaders/mainloader";
import { injectLogoutHandler } from "@/redux/apis/common/aixosInstance";

import { useRouter, Stack } from "expo-router";
import { Provider, useDispatch } from "react-redux";
import { store } from "@/redux/store";
import { usePushNotifications } from "@/hooks/usePushNotifications";


function AppContent() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [appReady, setAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

    // 🔔 Initialize Push Notifications
  usePushNotifications();

 
  useEffect(() => {
    injectLogoutHandler(() => {
      dispatch(logout());
      router.replace("/(auth)/signin");
    });
  }, []);

  useEffect(() => {
    const loadAppState = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        const hasSeen = await AsyncStorage.getItem("hasSeenOnboarding");
        const hasPasscode = await AsyncStorage.getItem("app_passcode");

        if (!hasSeen) {
          setInitialRoute("/onboarding");
          setAppReady(true);
          return;
        }

        // 2️⃣ User logged in
        if (accessToken && refreshToken) {
          dispatch(setTokens({ accessToken, refreshToken }));
          setInitialRoute("/(security)/passcode");
          setAppReady(true);
          return;
        }
        dispatch(logout());
        setInitialRoute("/(auth)/signin");
        setAppReady(true);
      } catch (err) {
        console.log("App load error:", err);
        dispatch(logout());
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
  }, [appReady, initialRoute]);



  // Loading screen while deciding initial route
  if (!appReady) {
    return (
      <ApLoader />
    );
  }

  // Render Slot (root navigator)
  return (
    <Stack screenOptions={{ headerShown: false }} />
   
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
