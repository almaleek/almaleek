import React, { useRef, useState, useEffect } from "react";
import { View, FlatList, Image, Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

type BannerCarouselProps = {
  images: any[]; // Array of image sources (require or uri)
  heightRatio?: number; // height relative to screen width, default 0.25
  borderRadius?: number; // default 16
  autoplayInterval?: number; // milliseconds, default 3000
};

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  images,
  heightRatio = 0.25,
  borderRadius = 16,
  autoplayInterval = 3000,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // AUTOSCROLL
  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= images.length) nextIndex = 0;

      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [currentIndex, images.length, autoplayInterval]);

  // MANUAL SWIPE TRACKING
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfigRef = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  return (
    <View className="mt-4">
      <FlatList
        ref={flatListRef}
        data={images}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToAlignment="center"
        contentContainerStyle={{ paddingHorizontal: 14 }}
        renderItem={({ item }) => (
          <View style={{ position: "relative" }}>
            <Image
              source={item}
              style={{
                width: screenWidth - 28,
                height: screenWidth * heightRatio,
                borderRadius: borderRadius,
                marginRight: 14,
              }}
              resizeMode="cover"
            />

            {/* DOTS OVERLAY */}
            <View
              style={{
                position: "absolute",
                bottom: 8,
                left: 0,
                right: 0,
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              {images.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: currentIndex === index ? 10 : 8,
                    height: currentIndex === index ? 10 : 8,
                    borderRadius: 5,
                    marginHorizontal: 4,
                    backgroundColor:
                      currentIndex === index ? "#34D399" : "#D1D5DB",
                  }}
                />
              ))}
            </View>
          </View>
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef}
      />
    </View>
  );
};

export default BannerCarousel;
