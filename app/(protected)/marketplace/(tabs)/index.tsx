import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ChevronDown, MapPin, Search, Star, X } from "lucide-react-native";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchMarketplaceProducts } from "@/redux/features/marketplace/productsSlice";

export default function MarketplaceHome() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<string>("");
  const [locationModal, setLocationModal] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [category, setCategory] = useState<string>("");

  const { loading, items } = useSelector(
    (state: RootState) => state.marketplaceProducts
  );
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const isAgent = String(role || "").toLowerCase() === "agent";

  const locationOptions = useMemo(
    () => [
      "All",
      "Kwara",
      "Niger",
      "Kogi",
      "Oyo",
      "Osun",
      "Ekiti",
      "Ogun",
      "Lagos",
      "Ondo",
      "Edo",
      "Delta",
      "FCT",
      "Nasarawa",
      "Benue",
      "Plateau",
      "Kaduna",
      "Kebbi",
      "Zamfara",
      "Sokoto",
      "Jigawa",
    ],
    []
  );

  const categoryOptions = useMemo(
    () => ["Phones", "Electronics", "Fashion", "Home", "Services", "Other"],
    []
  );

  const filteredLocations = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return locationOptions;
    return locationOptions.filter((x) => x.toLowerCase().includes(q));
  }, [locationOptions, locationQuery]);

  const categoryChips = useMemo(
    () => ["All", ...categoryOptions],
    [categoryOptions]
  );

  const fetchProducts = useCallback(
    (next: { location?: string; category?: string; search?: string }) => {
      dispatch(
        fetchMarketplaceProducts({
          page: 1,
          limit: 20,
          location: next.location || undefined,
          category: next.category || undefined,
          search: next.search || undefined,
        })
      );
    },
    [dispatch]
  );

  const applyLocation = async (next: string) => {
    const normalized = next.trim();
    setLocation(normalized);
    fetchProducts({ location: normalized, category, search: query.trim() });
  };

  const applyCategory = async (next: string) => {
    const normalized = next.trim();
    setCategory(normalized);
    fetchProducts({ location, category: normalized, search: query.trim() });
  };

  const detectLocation = async () => {
    let mod: any;
    try {
      mod = await import("expo-location");
    } catch {
      return "";
    }

    if (typeof mod?.requestForegroundPermissionsAsync !== "function") return "";
    const perm = await mod.requestForegroundPermissionsAsync();
    if (!perm?.granted) return "";

    if (typeof mod?.getCurrentPositionAsync !== "function") return "";
    const pos = await mod.getCurrentPositionAsync({ accuracy: mod.Accuracy?.Balanced ?? undefined });
    const coords = pos?.coords;
    if (!coords) return "";

    if (typeof mod?.reverseGeocodeAsync !== "function") return "";
    const geo = await mod.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    const first = Array.isArray(geo) && geo.length ? geo[0] : undefined;
    const city = first?.city ? String(first.city).trim() : "";
    const region = first?.region ? String(first.region).trim() : "";
    return city || region || "";
  };

  useEffect(() => {
    fetchProducts({ location: "", category: "", search: "" });
  }, [fetchProducts]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(items) ? items : [];
    if (!q) return list;
    return list.filter((p: any) => {
      const title = String(p?.title || "").toLowerCase();
      const category = String(p?.category || "").toLowerCase();
      const location = String(p?.location || "").toLowerCase();
      const storeName = String(p?.storeName || "").toLowerCase();
      return (
        title.includes(q) ||
        category.includes(q) ||
        location.includes(q) ||
        storeName.includes(q)
      );
    });
  }, [items, query]);

  useEffect(() => {
    const q = query.trim();
    const id = setTimeout(() => {
      fetchProducts({ location, category, search: q });
    }, 450);
    return () => clearTimeout(id);
  }, [query, location, category, fetchProducts]);

  return (
    <ApSafeAreaView>
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Marketplace</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Buy and sell products inside Almaleek.
        </Text>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 2, paddingBottom: 120 }}
        ListHeaderComponent={
          <View className="pt-2 pb-4">
            <View className="bg-gray-100 rounded-2xl px-3 py-2 flex-row items-center">
              <TouchableOpacity
                onPress={() => setLocationModal(true)}
                activeOpacity={0.9}
                className="flex-row items-center max-w-[45%]"
              >
                <MapPin size={18} color="#16a34a" />
                <Text className="ml-2 text-gray-900 font-semibold" numberOfLines={1}>
                  {location ? location : "All"}
                </Text>
                <ChevronDown size={18} color="#6b7280" />
              </TouchableOpacity>

              {location ? (
                <TouchableOpacity
                  onPress={() => applyLocation("")}
                  activeOpacity={0.85}
                  className="ml-2 w-9 h-9 rounded-full bg-white/80 items-center justify-center"
                >
                  <X size={16} color="#111827" />
                </TouchableOpacity>
              ) : null}

              <View className="w-px h-6 bg-gray-300 mx-3" />

              <Search size={18} color="#6b7280" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={location ? `Search in ${location}` : "Search products"}
                placeholderTextColor="#6b7280"
                className="flex-1 ml-2 text-gray-900"
                returnKeyType="search"
              />
            </View>

            <View className="mt-3">
              <FlatList
                data={categoryChips}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item}
                contentContainerStyle={{ paddingRight: 10 }}
                renderItem={({ item }) => {
                  const active = item === "All" ? !category : category === item;
                  return (
                    <TouchableOpacity
                      onPress={() => applyCategory(item === "All" ? "" : item)}
                      activeOpacity={0.9}
                      className={`px-4 py-2 rounded-full border mr-2 ${
                        active
                          ? "bg-green-600 border-green-600"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text className={`${active ? "text-white" : "text-gray-800"} font-semibold`}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            {isAgent ? (
              <View className="flex-row mt-3">
                <TouchableOpacity
                  onPress={() => router.push("/(protected)/marketplace/product/create")}
                  activeOpacity={0.9}
                  className="flex-1 bg-green-600 rounded-2xl py-3 items-center justify-center"
                >
                  <Text className="text-white font-semibold">Sell</Text>
                </TouchableOpacity>

                <View className="w-3" />

                <TouchableOpacity
                  onPress={() => router.push("/(protected)/marketplace/(tabs)/myproduct")}
                  activeOpacity={0.9}
                  className="flex-1 bg-white border border-green-600 rounded-2xl py-3 items-center justify-center"
                >
                  <Text className="text-green-700 font-semibold">My Products</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Modal visible={locationModal} transparent animationType="slide">
              <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white max-h-[75%] rounded-t-3xl p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-gray-900">Select Location</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setLocationModal(false);
                        setLocationQuery("");
                      }}
                      activeOpacity={0.85}
                      className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                    >
                      <X size={18} color="#111827" />
                    </TouchableOpacity>
                  </View>

                  <View className="mt-3 bg-gray-100 rounded-2xl px-3 py-2 flex-row items-center">
                    <Search size={18} color="#6b7280" />
                    <TextInput
                      value={locationQuery}
                      onChangeText={setLocationQuery}
                      placeholder="Search location"
                      placeholderTextColor="#6b7280"
                      className="flex-1 ml-2 text-gray-900"
                    />
                  </View>

                  <View className="mt-3">
                    <TouchableOpacity
                      onPress={async () => {
                        const detected = await detectLocation();
                        if (detected) {
                          await applyLocation(detected);
                        }
                        setLocationModal(false);
                        setLocationQuery("");
                      }}
                      activeOpacity={0.9}
                      className="px-4 py-4 rounded-2xl mb-2 border bg-green-50 border-green-200 flex-row items-center"
                    >
                      <MapPin size={18} color="#16a34a" />
                      <Text className="ml-2 text-gray-900 font-semibold">Use current location</Text>
                    </TouchableOpacity>

                    <FlatList
                      data={filteredLocations}
                      keyExtractor={(item) => item}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={async () => {
                            await applyLocation(item === "All" ? "" : item);
                            setLocationModal(false);
                            setLocationQuery("");
                          }}
                          activeOpacity={0.9}
                          className={`px-4 py-4 rounded-2xl mb-2 border ${
                            (item === "All" ? !location : location === item)
                              ? "bg-green-50 border-green-200"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <Text className="text-gray-900 font-semibold">{item}</Text>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={
                        <View className="py-8 items-center">
                          <Text className="text-gray-500">No locations found.</Text>
                        </View>
                      }
                    />
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="py-10 items-center">
              <ActivityIndicator />
            </View>
          ) : (
            <View className="py-10 items-center">
              <Text className="text-gray-500">
                {query.trim() ? "No matches found." : "No products yet."}
              </Text>
            </View>
          )
        }
        renderItem={({ item: p, index }) => {
          const imageUrl =
            Array.isArray(p.images) && p.images.length > 0
              ? p.images[0]
              : `https://picsum.photos/seed/almaleek-${p._id}/800/800`;

          const avg =
            typeof p.ratingsAverage === "number" ? p.ratingsAverage : 0;
          const count = typeof p.ratingsCount === "number" ? p.ratingsCount : 0;

          return (
            <TouchableOpacity
              style={{ flex: 1, marginBottom: 12, marginRight: index % 2 === 0 ? 12 : 0 }}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100"
              activeOpacity={0.9}
              onPress={() =>
                router.push(`/(protected)/marketplace/product/${p._id}` as never)
              }
            >
              <View className="bg-gray-100">
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: "100%", aspectRatio: 1 }}
                  contentFit="cover"
                />
              </View>

              <View className="p-3">
                <Text
                  className="text-sm font-semibold text-gray-900"
                  numberOfLines={2}
                >
                  {p.title}
                </Text>

                {p.storeName ? (
                  <Text className="text-[11px] text-gray-500 mt-1" numberOfLines={1}>
                    {p.storeName}
                  </Text>
                ) : null}

                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-green-700 font-extrabold">
                    ₦{Number(p.price).toLocaleString()}
                  </Text>
                  <Text className="text-[11px] text-gray-500" numberOfLines={1}>
                    {[p.location, p.category].filter(Boolean).join(" • ") || "General"}
                  </Text>
                </View>

                <View className="flex-row items-center mt-1">
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <Text className="ml-1 text-[11px] text-gray-600">
                    {avg ? avg.toFixed(1) : "New"}{count ? ` (${count})` : ""}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </ApSafeAreaView>
  );
}
