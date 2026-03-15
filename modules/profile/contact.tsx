import { View, Text, TouchableOpacity, Linking } from "react-native";
import React from "react";
import {
  Mail,
  Phone,
  Instagram,
  Twitter,
  Facebook,
  Shield,
  HelpCircle,
  ChevronRight,
  MessageCircle,
} from "lucide-react-native";
import ApHeader from "@/components/headers/header";
import { FontAwesome } from "@expo/vector-icons"; // for WhatsApp icon
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApScrollView from "@/components/scrollview/scrollview";

export default function ContactUs() {
  const contactItems = [
    // --- Phone ---
    {
      icon: <Phone size={20} color="#2563eb" />,
      text: "+234 08162399919",
      label: "Customer Support",
      onPress: () => Linking.openURL("tel:+2348162399919"),
    },

    // --- WhatsApp ---
    {
      icon: <FontAwesome name="whatsapp" size={22} color="#25D366" />,
      text: "Chat on WhatsApp",
      label: "Instant Chat",
      onPress: () =>
        Linking.openURL("https://wa.me/2348162399919?text=Hello%20Almaleek"),
    },

    // --- Email ---
    // {
    //   icon: <Mail size={22} color="#2563eb" />,
    //   text: "support@almaleek.com.ng",
    //   onPress: () => Linking.openURL("mailto:support@almaleek.com.ng"),
    // },

    // // --- Socials ---
    // {
    //   icon: <Instagram size={22} color="#db2777" />,
    //   text: "@almaleek.com.ng",
    //   onPress: () => Linking.openURL("https://instagram.com/payonce.com.ng"),
    // },
    // {
    //   icon: <Twitter size={22} color="#3b82f6" />,
    //   text: "@almaleek.com.ng",
    //   onPress: () => Linking.openURL("https://twitter.com/yourpage"),
    // },
    // {
    //   icon: <Facebook size={22} color="#1d4ed8" />,
    //   text: "YourPage",
    //   onPress: () => Linking.openURL("https://facebook.com/yourpage"),
    // },

    // --- Support Links ---
    {
      icon: <Shield size={20} color="#10b981" />,
      text: "Privacy Policy",
      label: "Legal",
      onPress: () => Linking.openURL("https://almaleek.com.ng/privacy-policy"),
    },
    {
      icon: <HelpCircle size={20} color="#f59e0b" />,
      text: "FAQ",
      label: "Common Questions",
      onPress: () => Linking.openURL("https://almaleek.com.ng/faq"),
    },
  ];

  return (
    <ApSafeAreaView>
      <ApHeader title="Contact Us" link="/(protected)/(tabs)/profile" />
      <ApScrollView className="flex-1 bg-gray-50">
        <View className="px-5 pt-6 pb-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Get in Touch
          </Text>
          <Text className="text-gray-500 text-base leading-6">
            Have questions or need assistance? We're here to help you 24/7.
          </Text>
        </View>

        <View className="px-4 mt-2">
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {contactItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={item.onPress}
                activeOpacity={0.7}
                className={`flex-row items-center p-4 ${
                  idx !== contactItems.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-4">
                  {item.icon}
                </View>

                <View className="flex-1">
                  {item.label && (
                    <Text className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wider">
                      {item.label}
                    </Text>
                  )}
                  <Text className="text-gray-900 font-semibold text-base">
                    {item.text}
                  </Text>
                </View>

                <ChevronRight size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mt-8 items-center">
          <Text className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Almaleek. All rights reserved.
          </Text>
        </View>
      </ApScrollView>
    </ApSafeAreaView>
  );
}
