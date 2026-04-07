import React from "react";
import { Stack } from "expo-router";

export default function SecurityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="passcode"
        options={{
          presentation: "transparentModal",
          animation: "fade",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="passcode-setup"
        options={{
          presentation: "modal",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="index" />
    </Stack>
  );
}

