import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { AppState, Platform } from "react-native";
import { useEffect, useRef, useState } from "react";
import axiosInstance from "@/redux/apis/common/aixosInstance";
import { useSelector } from "react-redux";
import { useRootNavigationState, useRouter } from "expo-router";

if (!(Platform.OS === "android" && Constants.executionEnvironment === "storeClient")) {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = (notification?.request?.content?.data || {}) as Record<
        string,
        any
      >;
      const isForeground = AppState.currentState === "active";
      const isChat = data?.type === "marketplace_chat";

      if (isForeground && isChat) {
        return {
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }

      return {
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    // Skip notification setup in Expo Go on Android
    if (Constants.executionEnvironment === 'storeClient') {
      console.log('Push notifications are not supported in Expo Go on Android. Use a development build.');
      return;
    }

    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice && Constants.executionEnvironment !== 'storeClient') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    try {
      // Get the native device push token (FCM for Android, APNs for iOS)
      const pushTokenString = (
        await Notifications.getDevicePushTokenAsync()
      ).data;
      console.log("Device Push Token:", pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      console.log(`${e}`);
    }
  } else {
    console.log('Must use physical device for Push Notifications or use a Development Build');
  }
}

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const lastHandledNotificationId = useRef<string | null>(null);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // Only send if user is logged in
  const { accessToken } = useSelector((state: any) => state.auth || {});

  const normalizeNotificationId = (value: unknown): string | null => {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return null;
  };

  const handleNotificationPress = (payload: any) => {
    const type = payload?.type;
    if (type === "marketplace_chat") {
      const conversationId = String(payload?.conversationId || "").trim();
      if (conversationId) {
        setPendingRoute(`/marketplace/chat/${conversationId}`);
      }
    }
  };

  useEffect(() => {
    if (!pendingRoute) return;
    if (!rootNavigationState?.key) return;

    const id = setTimeout(() => {
      router.replace(pendingRoute as any);
      setPendingRoute(null);
    }, 0);

    return () => clearTimeout(id);
  }, [pendingRoute, rootNavigationState?.key, router]);

  const sendTokenToBackend = async (token: string) => {
      try {
          if (!accessToken) return;
          await axiosInstance.post("/auth/update-fcm-token", { fcmToken: token });
          console.log("FCM Token sent to backend successfully");
      } catch (error) {
          console.error("Failed to send FCM token to backend", error);
      }
  };

  useEffect(() => {
    // Skip listener setup in Expo Go on Android
    if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') {
      return;
    }

    registerForPushNotificationsAsync()
      .then((token) => {
        setExpoPushToken(token);
        if (token) {
            sendTokenToBackend(token);
        }
      })
      .catch((error: any) => setExpoPushToken(`${error}`));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const notificationId = normalizeNotificationId(
          response?.notification?.request?.identifier ??
            response?.notification?.request?.content?.data?.messageId
        );
        if (notificationId && lastHandledNotificationId.current === notificationId) return;
        if (notificationId) lastHandledNotificationId.current = notificationId;

        const data = response?.notification?.request?.content?.data;
        handleNotificationPress(data);
      });

    (async () => {
      try {
        const last = await Notifications.getLastNotificationResponseAsync();
        if (!last) return;
        const notificationId = normalizeNotificationId(
          last?.notification?.request?.identifier ??
            last?.notification?.request?.content?.data?.messageId
        );
        if (notificationId && lastHandledNotificationId.current === notificationId) return;
        if (notificationId) lastHandledNotificationId.current = notificationId;

        const data = last?.notification?.request?.content?.data;
        handleNotificationPress(data);
      } catch {}
    })();

    return () => {
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, [accessToken, router]);

  return {
    expoPushToken,
    notification,
  };
};

export default usePushNotifications;

