import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";

interface BankLogoProps {
  bankName: string;
  bankCode?: string;
  url?: string;
  size?: number;
}

export const BankLogo: React.FC<BankLogoProps> = ({
  bankName,
  bankCode,
  url,
  size = 40,
}) => {
  const [imageError, setImageError] = useState(false);

  // Helper to get initials
  const getInitials = (name: string) => {
    if (!name) return "BK";
    return name
      .split(" ")
      .filter(n => n.length > 0)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Helper to generate a potential logo URL
  const getLogoUrl = (name: string) => {
    if (!name) return "";
    // Clean the name to get a domain-like string
    // e.g. "Access Bank" -> "accessbank.com"
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    // Try to guess domain. Most banks are [name].com or [name]bank.com
    // This is a best-effort. 
    return `https://img.logo.dev/${cleanName}.com?token=pk_M1HIHuinRWmMAgcU0iUZaQ`;
  };

  const logoUrl = url || getLogoUrl(bankName);
  const initials = getInitials(bankName);
  
  // Random-ish background color based on name
  const getBgColor = (name: string) => {
    if (!name) return "#166534";
    const colors = ["#166534", "#1e40af", "#b91c1c", "#a21caf", "#c2410c", "#0f766e"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (imageError || !logoUrl) {
    return (
      <View
        style={[
          styles.container,
          { width: size, height: size, backgroundColor: getBgColor(bankName) },
        ]}
      >
        <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: logoUrl }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="cover"
      onError={() => setImageError(true)}
      cachePolicy="disk" 
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
  },
  text: {
    color: "white",
    fontWeight: "bold",
  },
});
