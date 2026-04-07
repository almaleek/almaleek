import { Tabs } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { HapticTab } from "@/components/haptic-tab";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Home, Clock, Gift, User, ShieldCheck } from "lucide-react-native";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import PinModal from "@/components/modals/pinModal";
import { addPin, currentUser } from "@/redux/features/user/userThunk";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets(); // safe area for bottom navigation
  const dispatch = useDispatch<AppDispatch>();
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const isAgent = user?.role === "agent";
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [settingPin, setSettingPin] = useState(false);

  useEffect(() => {
    if (accessToken) {
      dispatch(currentUser());
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    if (user?.pinStatus === false) {
      setShowPinSetup(true);
      return;
    }
    if (user?.pinStatus === true) {
      setShowPinSetup(false);
    }
  }, [user?.pinStatus]);

  const greenText = "#16a34a"; // text-green-600
  const greenBg = "#dcfce7"; // light green background

  const tabs = useMemo(() => [
    { name: "index", title: "Home", icon: Home },
    { name: "history", title: "History", icon: Clock },
    { 
      name: "reward", 
      title: isAgent ? "Admin" : "Reward", 
      icon: isAgent ? ShieldCheck : Gift 
    },
    { name: "profile", title: "Profile", icon: User },
  ], [isAgent]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            paddingTop: 10,
            paddingBottom: insets.bottom + 10,
            height: 60 + insets.bottom,
            backgroundColor: "#fff",
            borderTopWidth: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            marginTop: 4,
          },
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    backgroundColor: focused ? greenBg : "transparent",
                    borderRadius: 25,
                    padding: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <tab.icon size={28} color={focused ? greenText : "#6b7280"} />
                </View>
              ),
              tabBarLabel: ({ focused }) => (
                <Text
                  style={{
                    color: focused ? greenText : "#6b7280",
                    fontWeight: focused ? "600" : "400",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {tab.title}
                </Text>
              ),
            }}
          />
        ))}
      </Tabs>

      <PinModal
        visible={showPinSetup}
        canClose={false}
        onClose={() => {}}
        mode="create"
        loading={settingPin}
        onSubmit={async (pin) => {
          try {
            setSettingPin(true);
            const action = await dispatch(addPin({ pin }));
            if (addPin.fulfilled.match(action)) {
              await dispatch(currentUser());
              setShowPinSetup(false);
            }
          } finally {
            setSettingPin(false);
          }
        }}
      />
    </>
  );
}
