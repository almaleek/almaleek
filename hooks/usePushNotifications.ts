import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useEffect, useRef, useState } from "react";
import axiosInstance from "@/redux/apis/common/aixosInstance";
import { useSelector } from "react-redux";

if (Platform.OS !== 'android' || Constants.executionEnvironment !== 'storeClient') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
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
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Only send if user is logged in
  const { accessToken } = useSelector((state: any) => state.auth || {});

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
        console.log(response);
      });

    return () => {
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, [accessToken]);

  return {
    expoPushToken,
    notification,
  };
};

