import React from "react";
import {
  ScrollView,
  ViewStyle,
  Dimensions,
  RefreshControlProps,
} from "react-native";

interface AppScrollViewProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  contentContainerClassName?: string;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
  refreshControl?: React.ReactNode; // optional refreshControl
}

// Get screen height
const { height: screenHeight } = Dimensions.get("window");

export default function ApScrollView({
  children,
  className,
  style,
  contentContainerClassName,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  refreshControl,
}: AppScrollViewProps) {
  return (
    <ScrollView
      className={className}
      style={[{ flex: 1 }, style]}
      contentContainerClassName={contentContainerClassName}
      contentContainerStyle={[
        {
          paddingVertical: 16,
          minHeight: screenHeight, // ensures full-screen height
          flexGrow: 1,
          paddingBottom: 200,
        },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      refreshControl={refreshControl as any} // 🔥 optional support
    >
      {children}
    </ScrollView>
  );
}
