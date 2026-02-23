import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useRouter, useNavigation, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useAutoLogout(timeout = 60000) {
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPathRef = useRef<string | null>(pathname);

  useEffect(() => {
    lastPathRef.current = pathname;
  }, [pathname]);

  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      (async () => {
        try {
          const routeToSave =
            lastPathRef.current || "/(protected)/(tabs)";
          await AsyncStorage.setItem("locked_route", routeToSave);
        } catch (e) {
          console.log("Failed to save locked route", e);
        }
        router.replace("/(security)/passcode");
      })();
    }, timeout);
  };

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => {
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
