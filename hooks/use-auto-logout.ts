import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useRouter, useNavigation, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useAutoLogout(timeout = 60000) {
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track current path to avoid locking while already locked
  const currentPathRef = useRef(pathname);

  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Don't start timer if already on biometric or auth screen
    if (currentPathRef.current.includes("biometric") || 
        currentPathRef.current.includes("(auth)")) {
        return;
    }

    timerRef.current = setTimeout(() => {
      (async () => {
        const biometricEnabled = await AsyncStorage.getItem("biometric_enabled");
        if (biometricEnabled !== "true") return;

        // Double check inside timeout
        if (currentPathRef.current.includes("biometric") || 
            currentPathRef.current.includes("(auth)")) {
            return;
        }

        // Use push to preserve the navigation stack
        const lockedRoute = String(currentPathRef.current || "").trim();
        if (lockedRoute) {
          await AsyncStorage.setItem("locked_route", lockedRoute);
        }
        router.push("/(security)/biometric");
      })();
    }, timeout);
  };

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => {
    // Initial start
    startTimer();

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") startTimer();
      else clearTimer();
    });

    const unsubscribe = navigation.addListener("state", () => {
      startTimer();
    });

    return () => {
      clearTimer();
      appStateSub.remove();
      unsubscribe();
    };
  }, []);

  return null;
}
