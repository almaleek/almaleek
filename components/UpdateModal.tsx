import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Linking,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { Rocket } from "lucide-react-native";

interface UpdateModalProps {
  visible: boolean;
  forceUpdate: boolean;
  storeUrl: string;
  onClose?: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  forceUpdate,
  storeUrl,
  onClose,
}) => {
  const handleUpdate = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl).catch((err) =>
        console.error("Failed to open store URL:", err)
      );
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {
        if (!forceUpdate && onClose) onClose();
      }}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <View className="mx-6 bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl items-center border border-neutral-100 dark:border-neutral-800">
          <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-4">
            <Rocket size={32} color="#2563EB" />
          </View>
          
          <Text className="text-xl font-bold text-neutral-900 dark:text-white mb-2 text-center">
            Update Available
          </Text>
          
          <Text className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-6 leading-5">
            A new version of the app is available. Please update to enjoy the latest features and improvements.
          </Text>

          <TouchableOpacity
            onPress={handleUpdate}
            className="w-full bg-blue-600 py-3.5 rounded-2xl items-center mb-3 active:opacity-90"
          >
            <Text className="text-white font-semibold text-base">
              Update Now
            </Text>
          </TouchableOpacity>

          {!forceUpdate && (
            <TouchableOpacity
              onPress={onClose}
              className="w-full py-3 rounded-2xl items-center"
            >
              <Text className="text-neutral-500 dark:text-neutral-400 font-medium">
                Maybe Later
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default UpdateModal;
