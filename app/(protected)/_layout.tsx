import { Stack } from "expo-router";
import useAutoLogout from "@/hooks/use-auto-logout";
import usePushNotifications from "@/hooks/use-push-notifications";
import React, { useEffect, useState } from "react";
import Constants from "expo-constants";
import { Button, NativeModules, Platform } from "react-native";
import axiosInstance from "@/redux/apis/common/aixosInstance";
import UpdateModal from "@/components/modals/updateModal";


export default function ProtectedLayout() {
  useAutoLogout(180000);
  usePushNotifications();

  const [updateVisible, setUpdateVisible] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");
  const [androidUrl, setAndroidUrl] = useState("");
  const [iosUrl, setIosUrl] = useState("");



  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const response = await axiosInstance.get("/auth/settings");
        const settings = response.data;

        const currentVersion = Constants.expoConfig?.version || "1.0.0";
        const latestVersion = Platform.OS === "android" ? settings.androidVersion : settings.iosVersion;

        if (isUpdateAvailable(currentVersion, latestVersion)) {
          setForceUpdate(settings.forceUpdate);
          setLatestVersion(latestVersion);
          setAndroidUrl(settings.androidAppUrl);
          setIosUrl(settings.iosAppUrl);
          setUpdateVisible(true);
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    };

    checkUpdate();
  }, []);

  const isUpdateAvailable = (current: string, latest: string) => {
    if (!latest) return false;
    const c = current.split(".").map(Number);
    const l = latest.split(".").map(Number);

    for (let i = 0; i < Math.max(c.length, l.length); i++) {
      const cv = c[i] || 0;
      const lv = l[i] || 0;
      if (lv > cv) return true;
      if (lv < cv) return false;
    }
    return false;
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Button title="Test Overlay" onPress={() => OverlayModule.showOverlay()} />
      <UpdateModal
        visible={updateVisible}
        onClose={() => setUpdateVisible(false)}
        latestVersion={latestVersion}
        forceUpdate={forceUpdate}
        androidUrl={androidUrl}
        iosUrl={iosUrl}
      />
    </>
  );
}
