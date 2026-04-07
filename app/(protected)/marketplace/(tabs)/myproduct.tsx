import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { ChevronDown, CheckCircle, Pencil, Search, Trash2, X } from "lucide-react-native";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import { useToast } from "@/components/toast/toastProvider";
import { marketplaceAxiosInstance } from "@/redux/apis/common/aixosInstance";
import { RootState } from "@/redux/store";

type MyProduct = {
  _id: string;
  title: string;
  description?: string;
  price: number;
  images?: string[];
  category?: string;
  location?: string;
  stock?: number;
  isSold?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export default function MarketplaceCategories() {
  const { showToast } = useToast();
  const userId = useSelector((state: RootState) => state.auth.user?._id);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MyProduct[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | "Active" | "Sold">("All");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<MyProduct | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editCategoryModal, setEditCategoryModal] = useState(false);
  const [editCategoryQuery, setEditCategoryQuery] = useState("");

  const categories = useMemo(
    () => ["Phones", "Electronics", "Fashion", "Home", "Services", "Other"],
    []
  );

  const filteredCategories = useMemo(() => {
    const q = editCategoryQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.toLowerCase().includes(q));
  }, [categories, editCategoryQuery]);

  const loadMyProducts = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const resp = await marketplaceAxiosInstance.get("/products", {
        params: { page: 1, limit: 100, ownerId: userId },
      });
      const next = Array.isArray(resp.data?.items) ? resp.data.items : [];
      setItems(next);
    } catch (e: any) {
      showToast(e?.response?.data?.error || "Failed to load your products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyProducts();
  }, [userId]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = Array.isArray(items) ? items : [];
    if (status === "Sold") list = list.filter((p) => Boolean(p.isSold) || Number(p.stock || 0) === 0);
    if (status === "Active") list = list.filter((p) => !Boolean(p.isSold) && Number(p.stock || 0) > 0);
    if (!q) return list;
    return list.filter((p) => {
      const title = String(p?.title || "").toLowerCase();
      const category = String(p?.category || "").toLowerCase();
      const location = String(p?.location || "").toLowerCase();
      return title.includes(q) || category.includes(q) || location.includes(q);
    });
  }, [items, query, status]);

  const openEdit = (p: MyProduct) => {
    setEditing(p);
    setEditTitle(String(p.title || ""));
    setEditCategory(String(p.category || ""));
    setEditLocation(String(p.location || ""));
    setEditPrice(String(p.price ?? ""));
    setEditStock(String(typeof p.stock === "number" ? p.stock : 1));
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(null);
    setEditCategoryModal(false);
    setEditCategoryQuery("");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const title = editTitle.trim();
    const category = editCategory.trim();
    const location = editLocation.trim();
    const price = Number(editPrice);
    const stock = Number(editStock);

    if (!title) return showToast("Title is required", "error");
    if (!category) return showToast("Category is required", "error");
    if (!location) return showToast("Location is required", "error");
    if (!Number.isFinite(price) || price < 0) return showToast("Price must be valid", "error");
    if (!Number.isFinite(stock) || stock < 0) return showToast("Stock must be valid", "error");

    try {
      setLoading(true);
      const form = new FormData();
      form.append("title", title);
      form.append("category", category);
      form.append("location", location);
      form.append("price", String(price));
      form.append("stock", String(Math.floor(stock)));

      const resp = await marketplaceAxiosInstance.put(`/products/${editing._id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setItems((prev) => prev.map((x) => (x._id === editing._id ? resp.data : x)));
      showToast("Product updated", "success");
      closeEdit();
    } catch (e: any) {
      showToast(e?.response?.data?.error || "Failed to update product", "error");
    } finally {
      setLoading(false);
    }
  };

  const markSold = async (p: MyProduct) => {
    try {
      setLoading(true);
      const resp = await marketplaceAxiosInstance.patch(`/products/${p._id}/sold`);
      setItems((prev) => prev.map((x) => (x._id === p._id ? resp.data : x)));
      showToast("Marked as sold", "success");
    } catch (e: any) {
      showToast(e?.response?.data?.error || "Failed to mark as sold", "error");
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (p: MyProduct) => {
    Alert.alert(
      "Delete product",
      "Are you sure you want to delete this product? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await marketplaceAxiosInstance.delete(`/products/${p._id}`);
              setItems((prev) => prev.filter((x) => x._id !== p._id));
              showToast("Product deleted", "success");
            } catch (e: any) {
              showToast(e?.response?.data?.error || "Failed to delete product", "error");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ApSafeAreaView>
      <View className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">My Products</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Manage your listings (edit, delete, mark sold).
        </Text>

        <View className="mt-3 bg-gray-100 rounded-2xl px-3 py-2 flex-row items-center">
          <Search size={18} color="#6b7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by title, category, location"
            placeholderTextColor="#6b7280"
            className="flex-1 ml-2 text-gray-900"
          />
        </View>

        <View className="flex-row mt-3">
          {(["All", "Active", "Sold"] as const).map((s, idx) => {
            const active = status === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                activeOpacity={0.9}
                className={`px-4 py-2 rounded-full border ${
                  active ? "bg-green-600 border-green-600" : "bg-white border-gray-200"
                }`}
                style={{ marginRight: idx === 2 ? 0 : 10 }}
              >
                <Text className={`${active ? "text-white" : "text-gray-800"} font-semibold`}>
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={loadMyProducts}
            activeOpacity={0.9}
            className="ml-auto px-4 py-2 rounded-full border bg-white border-gray-200"
          >
            <Text className="text-gray-800 font-semibold">Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={
          loading ? (
            <View className="py-10 items-center">
              <ActivityIndicator />
            </View>
          ) : (
            <View className="py-10 items-center">
              <Text className="text-gray-500">
                {userId ? "No products found." : "Please sign in to see your products."}
              </Text>
            </View>
          )
        }
        renderItem={({ item: p }) => {
          const imageUrl =
            Array.isArray(p.images) && p.images.length > 0
              ? p.images[0]
              : `https://picsum.photos/seed/my-product-${p._id}/800/800`;
          const sold = Boolean(p.isSold) || Number(p.stock || 0) === 0;
          const stock = typeof p.stock === "number" ? p.stock : 0;
          return (
            <View className="bg-white rounded-3xl overflow-hidden border border-gray-100 mb-4">
              <View className="bg-gray-100">
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: "100%", height: 170 }}
                  contentFit="cover"
                />
              </View>

              <View className="p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-bold text-gray-900 flex-1" numberOfLines={1}>
                    {p.title}
                  </Text>
                  {sold ? (
                    <View className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 flex-row items-center">
                      <CheckCircle size={16} color="#16a34a" />
                      <Text className="ml-1 text-xs font-semibold text-gray-700">Sold</Text>
                    </View>
                  ) : (
                    <View className="px-3 py-1 rounded-full bg-green-50 border border-green-200">
                      <Text className="text-xs font-semibold text-green-700">
                        Stock: {stock}
                      </Text>
                    </View>
                  )}
                </View>

                <Text className="mt-1 text-sm text-gray-500" numberOfLines={1}>
                  {[p.location, p.category].filter(Boolean).join(" • ") || "General"}
                </Text>

                <Text className="mt-3 text-green-700 text-lg font-extrabold">
                  ₦{Number(p.price || 0).toLocaleString()}
                </Text>

                <View className="flex-row mt-4">
                  <TouchableOpacity
                    onPress={() => openEdit(p)}
                    activeOpacity={0.9}
                    className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 items-center justify-center flex-row"
                  >
                    <Pencil size={16} color="#111827" />
                    <Text className="ml-2 text-gray-900 font-semibold">Edit</Text>
                  </TouchableOpacity>

                  <View className="w-3" />

                  <TouchableOpacity
                    onPress={() => markSold(p)}
                    disabled={sold}
                    activeOpacity={0.9}
                    className={`flex-1 rounded-2xl py-3 items-center justify-center flex-row ${
                      sold ? "bg-gray-200" : "bg-green-600"
                    }`}
                  >
                    <CheckCircle size={16} color={sold ? "#6b7280" : "#fff"} />
                    <Text className={`ml-2 font-semibold ${sold ? "text-gray-600" : "text-white"}`}>
                      {sold ? "Sold" : "Mark sold"}
                    </Text>
                  </TouchableOpacity>

                  <View className="w-3" />

                  <TouchableOpacity
                    onPress={() => removeProduct(p)}
                    activeOpacity={0.9}
                    className="w-14 rounded-2xl bg-red-50 border border-red-200 items-center justify-center"
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={editOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-gray-900">Edit Product</Text>
              <TouchableOpacity
                onPress={closeEdit}
                activeOpacity={0.85}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Title</Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Title"
                placeholderTextColor="#6b7280"
                className="bg-gray-100 rounded-2xl px-4 py-4 text-gray-900"
              />
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Category</Text>
              <TouchableOpacity
                onPress={() => setEditCategoryModal(true)}
                activeOpacity={0.9}
                className="bg-gray-100 rounded-2xl px-4 py-4 flex-row items-center justify-between"
              >
                <Text className={`${editCategory ? "text-gray-900" : "text-gray-500"} font-medium`}>
                  {editCategory || "Select category"}
                </Text>
                <ChevronDown size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Location</Text>
              <TextInput
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Location"
                placeholderTextColor="#6b7280"
                className="bg-gray-100 rounded-2xl px-4 py-4 text-gray-900"
              />
            </View>

            <View className="mt-4 flex-row">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Price</Text>
                <TextInput
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="numeric"
                  placeholder="Price"
                  placeholderTextColor="#6b7280"
                  className="bg-gray-100 rounded-2xl px-4 py-4 text-gray-900"
                />
              </View>
              <View className="w-3" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Stock</Text>
                <TextInput
                  value={editStock}
                  onChangeText={setEditStock}
                  keyboardType="numeric"
                  placeholder="Stock"
                  placeholderTextColor="#6b7280"
                  className="bg-gray-100 rounded-2xl px-4 py-4 text-gray-900"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={saveEdit}
              activeOpacity={0.9}
              className="mt-5 bg-green-600 rounded-2xl py-4 items-center justify-center"
            >
              <Text className="text-white font-semibold">Save changes</Text>
            </TouchableOpacity>

            <Modal visible={editCategoryModal} transparent animationType="fade">
              <View className="flex-1 bg-black/40 justify-center items-center px-4">
                <View className="bg-white w-full rounded-3xl p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-gray-900">Select Category</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setEditCategoryModal(false);
                        setEditCategoryQuery("");
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
                      value={editCategoryQuery}
                      onChangeText={setEditCategoryQuery}
                      placeholder="Search category"
                      placeholderTextColor="#6b7280"
                      className="flex-1 ml-2 text-gray-900"
                    />
                  </View>

                  <View className="mt-3">
                    <FlatList
                      data={filteredCategories}
                      keyExtractor={(item) => item}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => {
                            setEditCategory(item);
                            setEditCategoryModal(false);
                            setEditCategoryQuery("");
                          }}
                          activeOpacity={0.9}
                          className={`px-4 py-4 rounded-2xl mb-2 border ${
                            editCategory === item
                              ? "bg-green-50 border-green-200"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <Text className="text-gray-900 font-semibold">{item}</Text>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={
                        <View className="py-8 items-center">
                          <Text className="text-gray-500">No categories found.</Text>
                        </View>
                      }
                    />
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </View>
      </Modal>
    </ApSafeAreaView>
  );
}
