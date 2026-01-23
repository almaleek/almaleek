import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useRouter, useNavigation } from "expo-router";

export default function useAutoLogout(timeout = 60000) {
  const router = useRouter();
  const navigation = useNavigation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      router.replace("/(security)/passcode");
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
