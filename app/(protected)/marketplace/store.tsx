import React, { useEffect, useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useSelector } from "react-redux";

import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApHeader from "@/components/headers/header";
import ApScrollView from "@/components/scrollview/scrollview";
import ApButton from "@/components/button/button";
import { useToast } from "@/components/toast/toastProvider";
import { marketplaceAxiosInstance } from "@/redux/apis/common/aixosInstance";
import { RootState } from "@/redux/store";

type MarketplaceStore = {
  _id: string;
  ownerId: string;
  name: string;
  location: string;
  phone?: string;
  description?: string;
  logoUrl?: string;
};

export default function MarketplaceStoreScreen() {
  const { showToast } = useToast();
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const isAgent = String(role || "").toLowerCase() === "agent";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<MarketplaceStore | null>(null);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!isAgent) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const res = await marketplaceAxiosInstance.get<MarketplaceStore>("/stores/me");
        if (cancelled) return;
        setStore(res.data);
        setName(String(res.data?.name || ""));
        setLocation(String(res.data?.location || ""));
        setPhone(String(res.data?.phone || ""));
        setDescription(String(res.data?.description || ""));
      } catch (e: any) {
        if (cancelled) return;
        if (e?.response?.status === 404) {
          setStore(null);
        } else {
          showToast("Failed to load store", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isAgent, showToast]);

  const submit = async () => {
    const payload = {
      name: name.trim(),
      location: location.trim(),
      phone: phone.trim(),
      description: description.trim(),
    };

    if (!payload.name) {
      showToast("Store name is required", "error");
      return;
    }
    if (!payload.location) {
      showToast("Store location is required", "error");
      return;
    }

    try {
      setSaving(true);
      if (store) {
        const res = await marketplaceAxiosInstance.put<MarketplaceStore>("/stores/me", payload);
        setStore(res.data);
        showToast("Store updated", "success");
      } else {
        const res = await marketplaceAxiosInstance.post<MarketplaceStore>("/stores", payload);
        setStore(res.data);
        showToast("Store created", "success");
      }
    } catch (e: any) {
      const msg =
        typeof e?.response?.data?.error === "string"
          ? e.response.data.error
          : "Failed to save store";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ApSafeAreaView>
      <View className="px-4 pt-4">
        <ApHeader title="My Store" link="/marketplace" />
      </View>

      <ApScrollView className="bg-gray-50">
        <View className="px-4 pt-4">
          {!isAgent ? (
            <View className="bg-white rounded-3xl border border-gray-100 p-5">
              <Text className="text-base font-bold text-gray-900">Not available</Text>
              <Text className="mt-2 text-sm text-gray-600">
                Store management is only available for agents.
              </Text>
            </View>
          ) : loading ? (
            <View className="bg-white rounded-3xl border border-gray-100 p-5">
              <Text className="text-sm text-gray-600">Loading store...</Text>
            </View>
          ) : (
            <View className="bg-white rounded-3xl border border-gray-100 p-5">
              <Text className="text-base font-bold text-gray-900">
                {store ? "Update your store" : "Create your store"}
              </Text>
              <Text className="mt-2 text-sm text-gray-600">
                Your store shows buyers who you are and where you’re located.
              </Text>

              <View className="mt-5">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Store Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Almaleek Gadgets"
                  placeholderTextColor="#6b7280"
                  className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900"
                />
              </View>

              <View className="mt-4">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Location</Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Lekki, Lagos"
                  placeholderTextColor="#6b7280"
                  className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900"
                />
              </View>

              <View className="mt-4">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Phone (optional)</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. 080..."
                  placeholderTextColor="#6b7280"
                  keyboardType="phone-pad"
                  className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900"
                />
              </View>

              <View className="mt-4">
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                  Description (optional)
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Tell buyers what you sell..."
                  placeholderTextColor="#6b7280"
                  multiline
                  className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900"
                  style={{ minHeight: 120, textAlignVertical: "top" }}
                />
              </View>

              <View className="mt-6">
                <ApButton
                  title={saving ? "Saving..." : store ? "Save Changes" : "Create Store"}
                  onPress={submit as any}
                  loading={saving}
                />
              </View>
            </View>
          )}
        </View>
      </ApScrollView>
    </ApSafeAreaView>
  );
}
