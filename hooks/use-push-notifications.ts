import { useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import axiosInstance from "@/redux/apis/common/aixosInstance";

export default function usePushNotifications() {
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  useEffect(() => {
    const registerDeviceToken = async () => {
      try {
        const permission = await Notifications.getPermissionsAsync();
        let status = permission.status;
        if (status !== "granted") {
          const requested = await Notifications.requestPermissionsAsync();
          status = requested.status;
        }

        if (status !== "granted") return;

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
          });
        }

        const tokenResult = await Notifications.getDevicePushTokenAsync();
        if (!tokenResult?.data) return;
        if (tokenResult.type !== "fcm") return;

        const token = tokenResult.data;
        const storedToken = await AsyncStorage.getItem("fcmDeviceToken");
        if (storedToken === token) return;

        await axiosInstance.post("/notifications/device/register", { token });
        await AsyncStorage.setItem("fcmDeviceToken", token);
      } catch (error) {
        console.log("Push token registration skipped:", error);
      }
    };

    registerDeviceToken();
  }, []);
}
