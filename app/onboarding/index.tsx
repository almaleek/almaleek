import { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Affordable Data Services",
    subtitle: "Enjoy low-cost data plans from major network providers.",
    image: require("../../assets/images/onboarding1.png"),
  },
  {
    id: "2",
    title: "Seamless Data Purchases",
    subtitle: "Easily recharge your mobile data through a secure platform",
    image: require("../../assets/images/onboarding2.png"),
  },
  {
    id: "3",
    title: "Track Usage & Savings",
    subtitle: "Monitor your data usage and total savings.",
    image: require("../../assets/images/onboarding3.png"),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<any> | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/(auth)/signin");
  };

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      finishOnboarding();
    }
  };

  const skip = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.push("/(auth)/signin");
  };

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={slides}
        ref={flatListRef}
        horizontal
        pagingEnabled
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{ width }}
            className="flex-1 items-center justify-center px-6"
          >
            {/* IMAGE */}
            <Image
              source={item.image}
              style={{ width: width * 0.9, height: height * 0.38 }}
              resizeMode="contain"
              className="mb-6"
            />

            {/* TITLE */}
            <Text className="text-[26px] font-extrabold text-gray-900 text-center mb-2">
              {item.title}
            </Text>

            {/* SUBTITLE */}
            <Text className="text-[16px] text-gray-500 text-center px-3 leading-6">
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      {/* PAGINATION DOTS */}
      <View className="flex-row justify-center mb-10">
        {slides.map((_, i) => (
          <View
            key={i}
            className={`h-2 rounded-full mx-1 ${
              i === currentIndex ? "bg-green-600 w-6" : "bg-gray-300 w-2"
            }`}
          />
        ))}
      </View>

      {/* BUTTONS */}
      <View className="flex-row justify-between items-center px-6 mb-10">
        <TouchableOpacity onPress={skip}>
          <Text className="text-gray-500 text-[16px]">Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goNext}
          className="bg-green-600 px-7 py-3 rounded-xl"
        >
          <Text className="text-white text-[16px] font-semibold">
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
