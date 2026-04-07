import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";
import { ArrowLeft, Star, Trash2 } from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { Image } from "expo-image";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApScrollView from "@/components/scrollview/scrollview";
import ApButton from "@/components/button/button";
import { useToast } from "@/components/toast/toastProvider";
import { MARKETPLACE_API_URL } from "@/redux/apis/common/aixosInstance";
import { AppDispatch, RootState } from "@/redux/store";
import {
  clearSelectedProduct,
  deleteMyMarketplaceProductReview,
  fetchMarketplaceProductById,
  fetchMarketplaceProductReviews,
  upsertMarketplaceProductReview,
} from "@/redux/features/marketplace/productsSlice";

export default function MarketplaceProductDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const { selectedProduct, selectedLoading, reviewsLoading, ratingsAverage, ratingsCount, reviews } =
    useSelector((state: RootState) => state.marketplaceProducts);
  const userId = useSelector((state: RootState) => state.auth.user?._id);

  const myReview = useMemo(
    () => (userId ? reviews.find((r) => String(r.userId) === String(userId)) : undefined),
    [reviews, userId]
  );

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [carouselWidth, setCarouselWidth] = useState<number>(0);
  const [activeImage, setActiveImage] = useState<number>(0);

  const images = useMemo(() => {
    if (selectedProduct?.images?.length) return selectedProduct.images.filter(Boolean);
    if (selectedProduct?._id) {
      return [`https://picsum.photos/seed/almaleek-product-${selectedProduct._id}/1200/900`];
    }
    return [];
  }, [selectedProduct?._id, selectedProduct?.images]);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchMarketplaceProductById(String(id)));
    dispatch(fetchMarketplaceProductReviews(String(id)));
    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (myReview) {
      setRating(Number(myReview.rating) || 0);
      setComment(myReview.comment || "");
    } else {
      setRating(0);
      setComment("");
    }
  }, [myReview]);

  useEffect(() => {
    setActiveImage(0);
  }, [selectedProduct?._id]);

  const startChat = async () => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) return;

    const socketUrl = MARKETPLACE_API_URL.replace(/\/api\/?$/, "");
    const s = io(socketUrl, {
      transports: ["websocket"],
      auth: { token: accessToken },
    });

    s.emit("chat:start", { productId: String(id) }, (ack: any) => {
      s.disconnect();
      if (!ack?.ok) return;
      const convId = ack?.conversation?._id || ack?.conversationId;
      if (convId) {
        router.push(`/(protected)/marketplace/chat/${String(convId)}` as never);
        return;
      }
      router.push("/(protected)/marketplace/(tabs)/chats");
    });
  };

  return (
    <ApSafeAreaView>
      <View className="px-4 pt-4 pb-3 bg-white border-b border-gray-100 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>

        <View className="flex-1 items-center">
          <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
            Product
          </Text>
        </View>

        <View className="w-10 h-10" />
      </View>

      <ApScrollView className="bg-gray-50">
        <View className="px-4 pt-4">
          {selectedLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator />
            </View>
          ) : !selectedProduct ? (
            <View className="py-8 items-center">
              <Text className="text-gray-500">Product not found.</Text>
            </View>
          ) : (
            <View>
              <View className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <View
                  className="bg-gray-100"
                  onLayout={(e) => {
                    const w = e.nativeEvent.layout.width;
                    if (w && w !== carouselWidth) setCarouselWidth(w);
                  }}
                >
                  {carouselWidth > 0 ? (
                    <FlatList
                      data={images}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(uri, idx) => `${idx}-${uri}`}
                      onMomentumScrollEnd={(e) => {
                        const x = e.nativeEvent.contentOffset.x;
                        const next = carouselWidth ? Math.round(x / carouselWidth) : 0;
                        setActiveImage(next);
                      }}
                      renderItem={({ item: uri }) => (
                        <Image
                          source={{ uri }}
                          style={{ width: carouselWidth, aspectRatio: 1 }}
                          contentFit="cover"
                        />
                      )}
                    />
                  ) : (
                    <Image
                      source={{
                        uri:
                          selectedProduct.images?.[0] ||
                          `https://picsum.photos/seed/almaleek-product-${selectedProduct._id}/1200/900`,
                      }}
                      style={{ width: "100%", aspectRatio: 1 }}
                      contentFit="cover"
                    />
                  )}

                  {images.length > 1 ? (
                    <>
                      <View className="absolute bottom-3 w-full flex-row justify-center">
                        {images.map((_, idx) => (
                          <View
                            key={`dot-${idx}`}
                            className={`w-2 h-2 rounded-full mx-1 ${
                              idx === activeImage ? "bg-white" : "bg-white/50"
                            }`}
                          />
                        ))}
                      </View>
                      <View className="absolute top-3 right-3 bg-black/40 rounded-full px-2 py-1">
                        <Text className="text-white text-[11px] font-semibold">
                          {Math.min(activeImage + 1, images.length)}/{images.length}
                        </Text>
                      </View>
                    </>
                  ) : null}
                </View>

                <View className="p-4">
                  <Text className="text-lg font-extrabold text-gray-900" numberOfLines={2}>
                    {selectedProduct.title}
                  </Text>

                  {selectedProduct.storeName ? (
                    <Text className="text-xs text-gray-600 mt-1" numberOfLines={1}>
                      {selectedProduct.storeName}
                    </Text>
                  ) : null}

                  <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-green-700 font-extrabold text-lg">
                      ₦{Number(selectedProduct.price).toLocaleString()}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {selectedProduct.category || "General"}
                    </Text>
                  </View>

                  <View className="flex-row items-center mt-2">
                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                    <Text className="ml-1 text-xs text-gray-600">
                      {(ratingsAverage || 0).toFixed(1)} ({ratingsCount || 0})
                    </Text>
                  </View>

                  {selectedProduct.description ? (
                    <Text className="text-sm text-gray-600 mt-3">
                      {selectedProduct.description}
                    </Text>
                  ) : null}

                  <View className="mt-4">
                    <TouchableOpacity
                      onPress={startChat}
                      className="bg-green-600 rounded-2xl py-3 items-center"
                      activeOpacity={0.9}
                    >
                      <Text className="text-white font-bold">Chat Owner</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mt-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-bold text-gray-900">Reviews</Text>
                  <View className="flex-row items-center gap-1">
                    <Star size={16} color="#16a34a" fill="#16a34a" />
                    <Text className="text-sm font-semibold text-gray-900">
                      {(ratingsAverage || 0).toFixed(1)}
                    </Text>
                    <Text className="text-xs text-gray-500">({ratingsCount || 0})</Text>
                  </View>
                </View>

               

                <View className="mt-6">
                  {reviewsLoading && reviews.length === 0 ? (
                    <View className="py-4 items-center">
                      <ActivityIndicator />
                    </View>
                  ) : reviews.length === 0 ? (
                    <Text className="text-gray-500 text-sm">No reviews yet.</Text>
                  ) : (
                    <View className="space-y-3">
                      {[...reviews]
                        .sort((a, b) => {
                          const at = a.updatedAt || a.createdAt || "";
                          const bt = b.updatedAt || b.createdAt || "";
                          return bt.localeCompare(at);
                        })
                        .slice(0, 10)
                        .map((r) => (
                          <View
                            key={`${r.userId}-${r.createdAt || ""}`}
                            className="border border-gray-100 rounded-2xl p-3 bg-white"
                          >
                            <View className="flex-row items-center justify-between">
                              <Text className="text-xs text-gray-500">
                                {String(r.userId).slice(0, 10)}...
                              </Text>
                              <View className="flex-row items-center gap-2">
                                <View className="flex-row items-center gap-1">
                                  <Star size={14} color="#16a34a" fill="#16a34a" />
                                  <Text className="text-xs font-semibold text-gray-900">
                                    {Number(r.rating).toFixed(0)}
                                  </Text>
                                </View>

                                {String(r.userId) === String(userId) ? (
                                  <TouchableOpacity
                                    className="bg-red-50 border border-red-100 rounded-full px-2 py-1 flex-row items-center"
                                    activeOpacity={0.8}
                                    onPress={async () => {
                                      if (!id) return;
                                      try {
                                        await dispatch(
                                          deleteMyMarketplaceProductReview(String(id))
                                        ).unwrap();
                                        await dispatch(fetchMarketplaceProductReviews(String(id)));
                                        showToast("Review deleted", "success");
                                      } catch (e: any) {
                                        showToast(
                                          typeof e?.error === "string"
                                            ? e.error
                                            : "Failed to delete review",
                                          "error"
                                        );
                                      }
                                    }}
                                  >
                                    <Trash2 size={14} color="#dc2626" />
                                    <Text className="ml-1 text-xs font-semibold text-red-600">
                                      Delete
                                    </Text>
                                  </TouchableOpacity>
                                ) : null}
                              </View>
                            </View>
                            {r.comment ? (
                              <Text className="text-sm text-gray-700 mt-2">
                                {r.comment}
                              </Text>
                            ) : null}
                          </View>
                        ))}
                    </View>
                  )}
                </View>


                 <View className="mt-8">
                  <Text className="text-sm font-semibold text-gray-800 mb-2">
                    {myReview ? "Edit your review" : "Write a review"}
                  </Text>

                  <View className="flex-row items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <TouchableOpacity
                        key={n}
                        onPress={() => setRating(n)}
                        className="p-1"
                        activeOpacity={0.8}
                      >
                        <Star
                          size={26}
                          color={n <= rating ? "#16a34a" : "#d1d5db"}
                          fill={n <= rating ? "#16a34a" : "transparent"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View className="border border-gray-200 rounded-2xl px-3 py-2 bg-gray-50">
                    <TextInput
                      value={comment}
                      onChangeText={setComment}
                      placeholder="Share your experience..."
                      multiline
                      className="text-gray-900 min-h-[80px]"
                    />
                  </View>

                  <ApButton
                    title={reviewsLoading ? "Saving..." : "Save Review"}
                    loading={reviewsLoading}
                    disabled={!rating}
                    onPress={async () => {
                      if (!id) return;
                      try {
                        await dispatch(
                          upsertMarketplaceProductReview({
                            productId: String(id),
                            rating,
                            comment,
                          })
                        ).unwrap();
                        await dispatch(fetchMarketplaceProductReviews(String(id)));
                        showToast("Review saved", "success");
                      } catch (e: any) {
                        showToast(
                          typeof e?.error === "string" ? e.error : "Failed to save review",
                          "error"
                        );
                      }
                    }}
                  />
                </View>



              </View>
            </View>
          )}
        </View>
      </ApScrollView>
    </ApSafeAreaView>
  );
}
