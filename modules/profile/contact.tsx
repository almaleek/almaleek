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
} from "lucide-react-native";
import ApHeader from "@/components/headers/header";
import { FontAwesome } from "@expo/vector-icons"; // for WhatsApp icon

export default function ContactUs() {
  const contactItems = [
    // --- Phone ---
    {
      icon: <Phone size={22} color="#2563eb" />,
      text: "+234 08162399919",
      onPress: () => Linking.openURL("tel:+2348162399919"),
    },

    // --- WhatsApp ---
    {
      icon: <FontAwesome name="whatsapp" size={22} color="#25D366" />,
      text: "Chat on WhatsApp",
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
      icon: <Shield size={22} color="#10b981" />,
      text: "Privacy Policy",
      onPress: () => Linking.openURL("https://almaleek.com.ng/privacy-policy"),
    },
    {
      icon: <HelpCircle size={22} color="#f59e0b" />,
      text: "FAQ",
      onPress: () => Linking.openURL("https://almaleek.com.ng/faq"),
    },
  ];

  return (
    <View className="flex-1 bg-gray-100">
      <ApHeader title="Contact Us" link="/(protected)/(tabs)/profile" />

      {/* Card */}
      <View className="bg-white shadow-lg rounded-xl p-6 m-4">
        <Text className="text-2xl font-bold text-center text-gray-800">
          Contact Us
        </Text>

        <Text className="text-center text-gray-500 mt-2 mb-6 text-sm">
          We'd love to hear from you. Reach us through any option below.
        </Text>

        {/* Contact List */}
        <View className="flex flex-col space-y-3">
          {contactItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={item.onPress}
              className="flex flex-row items-center space-x-4 p-4 rounded-lg bg-gray-50 border border-gray-200 my-2 gap-4"
            >
              {item.icon}
              <Text className="text-gray-700 text-sm">{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
