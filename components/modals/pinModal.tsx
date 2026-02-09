import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Lock } from "lucide-react-native";

type PinModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  loading?: boolean;
  title?: string;
  details?: { label: string; value: string }[];
};

export default function PinModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
  title = "Review Transaction",
  details,
}: PinModalProps) {
  const [pin, setPin] = useState<string>("");
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (!visible) {
      setPin("");
      setStep(1);
    } else {
      setStep(details ? 1 : 2);
    }
  }, [visible, details]);

  const handlePress = (num: string) => {
    if (pin.length >= 4 || loading) return;
    const newPin = pin + num;
    setPin(newPin);
    if (newPin.length === 4) onSubmit(newPin);
  };

  const handleDelete = () => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const keypad: string[][] = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "del"],
  ];

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/30">
        <View className="bg-white rounded-t-3xl p-6 pb-10 relative shadow-xl">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            {step === 2 && details ? (
              <TouchableOpacity
                onPress={() => setStep(1)}
                disabled={loading}
                className="p-2"
              >
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            
            <TouchableOpacity
              onPress={() => {
                if (!loading) onClose();
                setPin("");
                setStep(1);
              }}
              className="p-2"
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {step === 1 && details ? (
            /* Review Step */
            <View>
              <Text className="text-xl font-bold text-center mb-6 text-gray-800">
                {title}
              </Text>
              
              <View className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                {details.map((item, index) => (
                  <View key={index} className="flex-row justify-between py-2 border-b border-gray-100 last:border-0">
                    <Text className="text-gray-500 font-medium">{item.label}</Text>
                    <Text className="text-gray-900 font-bold text-right flex-1 ml-4">
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setStep(2)}
                className="bg-green-600 py-4 rounded-xl items-center shadow-sm active:opacity-90"
              >
                <Text className="text-white font-bold text-lg">Confirm & Pay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* PIN Step */
            <>
              {/* Lock Icon & Title */}
              <View className="items-center mb-6">
                <Lock size={36} color="#32d47a" />
                <Text className="text-green-600 font-semibold text-lg mt-2">
                  Enter Transaction PIN
                </Text>

                {/* PIN Dots */}
                <View className="flex-row mt-4 space-x-4">
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      className={`w-4 h-4 rounded-full ${
                        pin.length > i ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </View>
              </View>

              {/* Keypad */}
              <View className="items-center">
                {keypad.map((row, rowIndex) => (
                  <View
                    key={rowIndex}
                    className="flex-row justify-between w-full px-10 my-2"
                  >
                    {row.map((item, idx) => {
                      if (item === "") return <View key={idx} className="w-16" />;
                      if (item === "del")
                        return (
                          <Pressable
                            key={idx}
                            onPress={handleDelete}
                            className="w-16 h-16 justify-center items-center bg-gray-100 rounded-full"
                          >
                            <Text className="text-green-600 font-semibold">⌫</Text>
                          </Pressable>
                        );

                      return (
                        <Pressable
                          key={idx}
                          onPress={() => handlePress(item)}
                          className="w-16 h-16 justify-center items-center bg-green-50 rounded-full shadow"
                          android_ripple={{
                            color: "rgba(50,212,122,0.3)",
                            borderless: true,
                          }}
                        >
                          <Text className="text-green-600 text-2xl font-bold">
                            {item}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Loading Overlay */}
          {loading && (
            <View className="absolute inset-0 bg-black/25 justify-center items-center rounded-t-3xl">
              <ActivityIndicator size="large" color="#32d47a" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
