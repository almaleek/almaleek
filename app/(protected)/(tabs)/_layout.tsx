import { Tabs } from "expo-router";
import React from "react";
import { HapticTab } from "@/components/haptic-tab";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Home, Clock, Gift, User } from "lucide-react-native";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets(); // safe area for bottom navigation

  const greenText = "#16a34a"; // text-green-600
  const greenBg = "#dcfce7"; // light green background

  const tabs = [
    { name: "index", title: "Home", icon: Home },
    { name: "history", title: "History", icon: Clock },
    { name: "reward", title: "Reward", icon: Gift },
    { name: "profile", title: "Profile", icon: User },
  ];

  return (
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
  );
}
