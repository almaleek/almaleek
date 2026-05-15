import React from "react";
import { Stack } from "expo-router";

export default function SecurityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="biometric"
        options={{
          presentation: "modal",
          animation: "fade",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="index" />
    </Stack>
  );
}

