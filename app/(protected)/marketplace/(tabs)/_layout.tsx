import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import { HapticTab } from "@/components/haptic-tab";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text } from "react-native";
import { Home, LayoutGrid, MessageCircle, User } from "lucide-react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export default function MarketplaceTabLayout() {
  const insets = useSafeAreaInsets();
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const isAgent = String(role || "").toLowerCase() === "agent";
  const chats = useSelector((state: RootState) => state.marketplaceChat.chats);
  const totalUnread = useMemo(() => {
    return (chats || []).reduce((sum, c: any) => sum + Number(c?.unreadCount || 0), 0);
  }, [chats]);
  const chatBadge = totalUnread > 99 ? "99+" : totalUnread;

  const tabs = useMemo(
    () => [
      { name: "index", title: "Home", icon: Home },
      { name: "myproduct", title: "My Products", icon: LayoutGrid },
      { name: "chats", title: "Chats", icon: MessageCircle },
      { name: "profile", title: "Profile", icon: User },
    ],
    []
  );

  const greenText = "#16a34a";
  const greenBg = "#dcfce7";

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
            href: tab.name === "myproduct" && !isAgent ? null : undefined,
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
            tabBarBadge:
              tab.name === "chats" && totalUnread > 0 ? chatBadge : undefined,
            tabBarBadgeStyle: {
              backgroundColor: "#ef4444",
              color: "#ffffff",
              fontSize: 10,
              fontWeight: "700",
            },
          }}
        />
      ))}
    </Tabs>
  );
}
