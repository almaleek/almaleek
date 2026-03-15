import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useRouter, useNavigation, usePathname } from "expo-router";

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

    // Don't start timer if already on passcode or auth screen
    // We check against the ref to be sure, although pathname effect updates it.
    // Note: pathname string might vary (e.g. includes params), so checking for substring is safer.
    if (currentPathRef.current.includes("passcode") || 
        currentPathRef.current.includes("(auth)")) {
        return;
    }

    timerRef.current = setTimeout(() => {
      (async () => {
        // Double check inside timeout
        if (currentPathRef.current.includes("passcode") || 
            currentPathRef.current.includes("(auth)")) {
            return;
        }

        // Use push to preserve the navigation stack
        router.push("/(security)/passcode");
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
