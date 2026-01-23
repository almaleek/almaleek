import { View, Text, Image, Animated, Easing } from "react-native";
import React, { useEffect, useRef } from "react";

export default function ApLoader({ text = "Loading..." }: { text?: string }) {
  const fadeAnim = useRef(new Animated.Value(0.5)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      {/* Glow effect */}
      <View className="absolute w-44 h-44 bg-green-200/30 rounded-full blur-2xl" />

      {/* Animated Logo */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          backgroundColor: "rgba(255,255,255,0.6)",
          padding: 25,
          borderRadius: 80,
          shadowColor: "#32d47a",
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 5,
        }}
      >
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 55, height: 55 }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Text */}
      <Text className="mt-5 text-lg font-semibold text-gray-700 tracking-wide">
        {text}
      </Text>
    </View>
  );
}
