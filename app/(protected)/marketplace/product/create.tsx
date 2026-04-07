import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { ChevronDown, Plus, Search, X } from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApHeader from "@/components/headers/header";
import ApScrollView from "@/components/scrollview/scrollview";
import ApTextInput from "@/components/textInput/textInput";
import ApButton from "@/components/button/button";
import { useToast } from "@/components/toast/toastProvider";
import { AppDispatch, RootState } from "@/redux/store";
import { createMarketplaceProduct } from "@/redux/features/marketplace/productsSlice";
import { marketplaceAxiosInstance } from "@/redux/apis/common/aixosInstance";

const schema = Yup.object().shape({
  title: Yup.string().trim().min(3).max(140).required("Title is required"),
  category: Yup.string().trim().max(50).required("Category is required"),
  location: Yup.string().trim().min(2).max(120).required("Location is required"),
  stock: Yup.number()
    .typeError("Stock must be a number")
    .min(0, "Stock cannot be negative")
    .required("Stock is required"),
  price: Yup.number()
    .typeError("Price must be a number")
    .min(0, "Price cannot be negative")
    .required("Price is required"),
  description: Yup.string().trim().max(5000),
});

type PickedImage = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

export default function CreateMarketplaceProduct() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { showToast } = useToast();
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const isAgent = String(role || "").toLowerCase() === "agent";
  const { width: windowWidth } = useWindowDimensions();
  const storeModalWidth = Math.max(280, Math.min(windowWidth - 32, 520));

  const [storeChecked, setStoreChecked] = useState(false);
  const [hasStore, setHasStore] = useState(true);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeCreating, setStoreCreating] = useState(false);

  const [images, setImages] = useState<PickedImage[]>([]);
  const [activeImage, setActiveImage] = useState<number>(0);
  const [categoryModal, setCategoryModal] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");

  const categories = useMemo(
    () => ["Phones", "Electronics", "Fashion", "Home", "Services", "Car", "Other", ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!isAgent) {
        if (!cancelled) {
          setHasStore(true);
          setStoreChecked(true);
        }
        return;
      }

      try {
        await marketplaceAxiosInstance.get("/stores/me");
        if (!cancelled) {
          setHasStore(true);
          setStoreChecked(true);
        }
      } catch (e: any) {
        const status = e?.response?.status;
        if (!cancelled) {
          if (status === 404) {
            setHasStore(false);
            setStoreModalOpen(true);
          } else {
            showToast("Failed to check your store. Please try again.", "error");
          }
          setStoreChecked(true);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isAgent, showToast]);

  const createStore = async () => {
    const name = storeName.trim();
    const location = storeLocation.trim();
    const phone = storePhone.trim();

    if (!name) {
      showToast("Store name is required", "error");
      return;
    }
    if (!location) {
      showToast("Store location is required", "error");
      return;
    }

    try {
      setStoreCreating(true);
      await marketplaceAxiosInstance.post("/stores", { name, location, phone });
      setHasStore(true);
      setStoreModalOpen(false);
      showToast("Store created", "success");
    } catch (e: any) {
      const msg =
        typeof e?.response?.data?.error === "string"
          ? e.response.data.error
          : "Failed to create store";
      showToast(msg, "error");
    } finally {
      setStoreCreating(false);
    }
  };

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm?.granted) {
      showToast("Please allow photo access to add images", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 3,
      quality: 0.85,
    });

    if (result.canceled) return;
    const picked = (result.assets || []).slice(0, 10).map((a: any) => ({
      uri: a.uri,
      fileName: a.fileName,
      mimeType: a.mimeType,
    }));
    setImages(picked);
    setActiveImage(0);
  };

  const removeImage = (uri: string) => {
    setImages((prev) => {
      const next = prev.filter((p) => p.uri !== uri);
      const nextIndex = Math.min(activeImage, Math.max(0, next.length - 1));
      setActiveImage(nextIndex);
      return next;
    });
  };

  const mappedImages = useMemo(
    () =>
      images.map((a) => ({
        uri: a.uri,
        fileName: a.fileName,
        mimeType: a.mimeType,
      })),
    [images]
  );

  return (
    <ApSafeAreaView>
      <View className="px-4 pt-4">
        <ApHeader title="Sell Product" link="/(protected)/marketplace/(tabs)" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        style={{ flex: 1 }}
      >
        <ApScrollView className="bg-gray-50" contentContainerStyle={{ paddingBottom: 420 }}>
          <View className="px-4 pt-4">
            <Formik
              initialValues={{
                title: "",
                category: "",
                location: "",
                stock: "1",
                price: "",
                description: "",
              }}
              validationSchema={schema}
              onSubmit={async (values, { resetForm }) => {
                try {
                  if (isAgent && (!storeChecked || !hasStore)) {
                    setStoreModalOpen(true);
                    throw { error: "Create your store first to add products" };
                  }

                  const created = await dispatch(
                    createMarketplaceProduct({
                      title: values.title.trim(),
                      category: values.category.trim(),
                      location: values.location.trim(),
                      stock: values.stock,
                      price: values.price,
                      description: values.description.trim(),
                      images: mappedImages,
                    })
                  ).unwrap();

                  resetForm();
                  setImages([]);
                  showToast("Product uploaded", "success");
                  router.replace(`/(protected)/marketplace/product/${created._id}` as never);
                } catch (e: any) {
                  const code = e?.code || e?.response?.data?.code;
                  if (code === "STORE_REQUIRED") {
                    setHasStore(false);
                    setStoreModalOpen(true);
                  }
                  showToast(
                    typeof e?.error === "string" ? e.error : "Failed to upload product",
                    "error"
                  );
                }
              }}
            >
              {({ handleSubmit, isSubmitting, values, errors, touched, setFieldValue, setFieldTouched }) => {
                const filteredCategories = categories.filter((c) =>
                  c.toLowerCase().includes(categoryQuery.trim().toLowerCase())
                );

                return (
                <View>
                <View className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                  <View className="bg-gray-100">
                    {images.length ? (
                      <View className="relative">
                        <Image
                          source={{ uri: images[Math.min(activeImage, images.length - 1)]?.uri }}
                          style={{ width: "100%", aspectRatio: 1.2 }}
                          contentFit="cover"
                        />
                        <View className="absolute top-3 right-3 bg-black/40 rounded-full px-2 py-1">
                          <Text className="text-white text-[11px] font-semibold">
                            {Math.min(activeImage + 1, images.length)}/{images.length}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={pickImages}
                        activeOpacity={0.9}
                        className="items-center justify-center"
                        style={{ width: "100%", aspectRatio: 1.2 }}
                      >
                        <View className="w-16 h-16 rounded-2xl bg-white items-center justify-center border border-gray-200">
                          <Plus size={26} color="#16a34a" />
                        </View>
                        <Text className="mt-3 text-sm font-semibold text-gray-900">
                          Add product photos
                        </Text>
                        <Text className="mt-1 text-xs text-gray-500">
                          Add up to 10 images
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View className="p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-gray-900">
                        Images
                      </Text>
                      <TouchableOpacity
                        onPress={pickImages}
                        activeOpacity={0.9}
                        className="bg-green-50 border border-green-100 rounded-full px-3 py-1.5"
                      >
                        <Text className="text-green-700 font-semibold text-xs">
                          {images.length ? "Change" : "Pick"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {images.length ? (
                      <View className="mt-3">
                        <FlatList
                          data={images}
                          horizontal
                          keyExtractor={(item) => item.uri}
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{ paddingRight: 6 }}
                          renderItem={({ item, index }) => {
                            const selected = index === activeImage;
                            return (
                              <TouchableOpacity
                                onPress={() => setActiveImage(index)}
                                activeOpacity={0.9}
                                className={`mr-2 rounded-2xl overflow-hidden border ${
                                  selected ? "border-green-600" : "border-gray-200"
                                }`}
                                style={{ width: 72, height: 72 }}
                              >
                                <Image
                                  source={{ uri: item.uri }}
                                  style={{ width: "100%", height: "100%" }}
                                  contentFit="cover"
                                />
                                <TouchableOpacity
                                  onPress={() => removeImage(item.uri)}
                                  activeOpacity={0.85}
                                  className="absolute top-1.5 right-1.5 bg-black/60 rounded-full p-1"
                                >
                                  <X size={14} color="#fff" />
                                </TouchableOpacity>
                              </TouchableOpacity>
                            );
                          }}
                        />
                        <Text className="mt-2 text-[11px] text-gray-500">
                          Tap a thumbnail to preview
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View className="h-4" />

                <ApTextInput
                  name="title"
                  label="Title"
                  placeholder="e.g. iPhone 13 Pro Max"
                />

                <View className="mt-4">
                  <Text className="text-sm font-semibold text-gray-800 mb-2">Category</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCategoryModal(true);
                      setFieldTouched("category", true, false);
                    }}
                    activeOpacity={0.9}
                    className={`bg-white border rounded-2xl px-4 py-4 flex-row items-center justify-between ${
                      touched.category && errors.category ? "border-red-300" : "border-gray-200"
                    }`}
                  >
                    <Text className={`${values.category ? "text-gray-900" : "text-gray-500"} font-medium`}>
                      {values.category || "Select category"}
                    </Text>
                    <ChevronDown size={20} color="#6b7280" />
                  </TouchableOpacity>
                  {touched.category && errors.category ? (
                    <Text className="text-xs text-red-500 mt-1">{String(errors.category)}</Text>
                  ) : null}
                </View>

                <ApTextInput
                  name="location"
                  label="Location"
                  placeholder="e.g. Lekki, Lagos"
                />
                <ApTextInput
                  name="stock"
                  label="Stock"
                  placeholder="e.g. 3"
                  keyboardType="numeric"
                />
                <ApTextInput
                  name="price"
                  label="Price"
                  placeholder="e.g. 250000"
                  keyboardType="numeric"
                />
                <ApTextInput
                  name="description"
                  label="Description"
                  placeholder="Describe your product..."
                  multiline
                />

                <ApButton
                  title={isSubmitting ? "Uploading..." : "Upload Product"}
                  onPress={handleSubmit as any}
                  loading={isSubmitting}
                />

                <Modal visible={storeModalOpen} transparent animationType="slide">
                  <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
                    style={{ flex: 1 }}
                  >
                    <View className="flex-1 bg-black/50 items-center justify-center">
                      <ScrollView
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{
                          flexGrow: 1,
                          justifyContent: "center",
                          alignItems: "center",
                          padding: 16,
                        }}
                      >
                        <View
                          className="bg-white rounded-3xl p-4"
                          style={{ width: storeModalWidth }}
                        >
                          <View className="flex-row items-center justify-between">
                            <Text className="text-base font-bold text-gray-900">
                              Create Store
                            </Text>
                            <TouchableOpacity
                              onPress={() => {
                                setStoreModalOpen(false);
                                if (!hasStore) router.back();
                              }}
                              activeOpacity={0.8}
                              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                            >
                              <X size={18} color="#111827" />
                            </TouchableOpacity>
                          </View>

                          <Text className="mt-2 text-sm text-gray-600">
                            You need a store before you can add products.
                          </Text>

                          <View className="mt-4">
                            <Text className="text-sm font-semibold text-gray-800 mb-2">
                              Store Name
                            </Text>
                            <TextInput
                              value={storeName}
                              onChangeText={setStoreName}
                              placeholder="e.g. Almaleek Gadgets"
                              placeholderTextColor="#6b7280"
                              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900"
                            />
                          </View>

                          <View className="mt-3">
                            <Text className="text-sm font-semibold text-gray-800 mb-2">
                              Store Location
                            </Text>
                            <TextInput
                              value={storeLocation}
                              onChangeText={setStoreLocation}
                              placeholder="e.g. Lekki, Lagos"
                              placeholderTextColor="#6b7280"
                              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900"
                            />
                          </View>

                          <View className="mt-3">
                            <Text className="text-sm font-semibold text-gray-800 mb-2">
                              Phone (optional)
                            </Text>
                            <TextInput
                              value={storePhone}
                              onChangeText={setStorePhone}
                              placeholder="e.g. 080..."
                              placeholderTextColor="#6b7280"
                              keyboardType="phone-pad"
                              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900"
                            />
                          </View>

                          <View className="mt-5">
                            <ApButton
                              title={storeCreating ? "Creating..." : "Create Store"}
                              onPress={createStore as any}
                              loading={storeCreating}
                            />
                          </View>
                        </View>
                      </ScrollView>
                    </View>
                  </KeyboardAvoidingView>
                </Modal>

                <Modal visible={categoryModal} transparent animationType="slide">
                  <View className="flex-1 bg-black/50 justify-end mb-4">
                    <View className="bg-white max-h-[75%] rounded-t-3xl p-4">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-base font-bold text-gray-900">Select Category</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setCategoryModal(false);
                            setCategoryQuery("");
                          }}
                          activeOpacity={0.8}
                          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                        >
                          <X size={18} color="#111827" />
                        </TouchableOpacity>
                      </View>

                      <View className="mt-3 bg-gray-100 rounded-2xl px-3 py-2 flex-row items-center">
                        <Search size={18} color="#6b7280" />
                        <TextInput
                          value={categoryQuery}
                          onChangeText={setCategoryQuery}
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
                                setFieldValue("category", item);
                                setCategoryModal(false);
                                setCategoryQuery("");
                              }}
                              activeOpacity={0.9}
                              className={`px-4 py-4 rounded-2xl mb-2 border ${
                                values.category === item
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
              );
            }}
          </Formik>
          </View>
        </ApScrollView>
      </KeyboardAvoidingView>
    </ApSafeAreaView>
  );
}
