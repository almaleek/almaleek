import { Slot, useRouter } from "expo-router";
import useAutoLogout from "@/hooks/use-auto-logout";
import React, { useEffect, useState } from "react";
import Constants from "expo-constants";
import { Platform } from "react-native";
import axiosInstance from "@/redux/apis/common/aixosInstance";
import UpdateModal from "@/components/UpdateModal";

export default function ProtectedLayout() {
  useAutoLogout(180000);
  
  
  const [updateVisible, setUpdateVisible] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [storeUrl, setStoreUrl] = useState("");

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const response = await axiosInstance.get("/auth/settings");
        const settings = response.data;
        
        const currentVersion = Constants.expoConfig?.version || "1.0.0";
        const latestVersion = settings.mobileAppVersion;
        
        if (isUpdateAvailable(currentVersion, latestVersion)) {
          setForceUpdate(settings.forceUpdate);
          setStoreUrl(
            Platform.OS === "ios" 
              ? settings.iosAppUrl 
              : settings.androidAppUrl
          );
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
    const c = current.split('.').map(Number);
    const l = latest.split('.').map(Number);
    
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
      <Slot />
      <UpdateModal 
        visible={updateVisible}
        forceUpdate={forceUpdate}
        storeUrl={storeUrl}
        onClose={() => setUpdateVisible(false)}
      />
    </>
  );
}
