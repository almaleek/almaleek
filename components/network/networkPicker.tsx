import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  TextInput,
  ScrollView,
} from "react-native";
import * as Contacts from "expo-contacts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronDown, CircleUser, Trash2, X } from "lucide-react-native";

interface NetworkItem {
  name: string;
  image: any;
}

type RecentPhoneEntry = {
  phone: string;
  count: number;
  lastUsed: number;
};

function getRecentPhonesStorageKey(userId?: string) {
  return `recent_phone_numbers:${userId || "anon"}`;
}

function normalizePhone(value: string) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[^\d+]/g, "");
}

export async function saveRecentPhoneNumber({
  userId,
  phone,
}: {
  userId?: string;
  phone: string;
}) {
  const normalized = normalizePhone(phone);
  if (!normalized) return;

  const key = getRecentPhonesStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);
  const parsed: RecentPhoneEntry[] = raw ? JSON.parse(raw) : [];

  const now = Date.now();
  const existingIndex = parsed.findIndex((p) => p.phone === normalized);
  let next: RecentPhoneEntry[];

  if (existingIndex >= 0) {
    next = parsed.map((p, idx) =>
      idx === existingIndex
        ? { ...p, count: (Number(p.count) || 0) + 1, lastUsed: now }
        : p
    );
  } else {
    next = [{ phone: normalized, count: 1, lastUsed: now }, ...parsed];
  }

  next = next
    .filter((p) => p?.phone)
    .sort((a, b) => Number(b.lastUsed) - Number(a.lastUsed))
    .slice(0, 20);

  await AsyncStorage.setItem(key, JSON.stringify(next));
}

export async function getRecentPhoneNumbers({
  userId,
}: {
  userId?: string;
}): Promise<RecentPhoneEntry[]> {
  const key = getRecentPhonesStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);
  const parsed: RecentPhoneEntry[] = raw ? JSON.parse(raw) : [];
  return Array.isArray(parsed) ? parsed.filter((p) => p?.phone) : [];
}

export async function removeRecentPhoneNumber({
  userId,
  phone,
}: {
  userId?: string;
  phone: string;
}) {
  const normalized = normalizePhone(phone);
  if (!normalized) return;
  const key = getRecentPhonesStorageKey(userId);
  const items = await getRecentPhoneNumbers({ userId });
  const next = items.filter((p) => p.phone !== normalized);
  await AsyncStorage.setItem(key, JSON.stringify(next));
}

export async function clearRecentPhoneNumbers({ userId }: { userId?: string }) {
  const key = getRecentPhonesStorageKey(userId);
  await AsyncStorage.removeItem(key);
}

export default function NetworkPhonePicker({
  selectedNetwork,
  setSelectedNetwork,
  phone,
  setPhone,
  networks, // <<==== NEW PROP
  userId,
}: {
  selectedNetwork: NetworkItem | null;
  setSelectedNetwork: (network: NetworkItem) => void;
  phone: string;
  setPhone: (phone: string) => void;
  networks: NetworkItem[]; // <<==== dynamic list
  userId?: string;
}) {
  const [networkModal, setNetworkModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [recentPhones, setRecentPhones] = useState<RecentPhoneEntry[]>([]);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDropdownInteractingRef = useRef(false);
  const phoneInputRef = useRef<TextInput>(null);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);

  /* Load contacts */
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        setContacts(data);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const items = await getRecentPhoneNumbers({ userId });
        setRecentPhones(items);
      } catch {
        setRecentPhones([]);
      }
    })();
  }, [userId]);

  const sortedRecentPhones = [...recentPhones]
    .filter((p) => p?.phone)
    .sort((a, b) => Number(b.lastUsed) - Number(a.lastUsed));

  const query = normalizePhone(phone);
  const hasSavedNumbers = sortedRecentPhones.length > 0;
  const exactMatch = hasSavedNumbers
    ? sortedRecentPhones.some((p) => p.phone === query)
    : false;
  const visibleRecentPhones = sortedRecentPhones
    .filter((p) => {
      if (!query) return true;
      return String(p.phone || "").includes(query);
    })
    .slice(0, 6);

  return (
    <>
      {/* MAIN INPUT CARD */}
      <View className="px-4 mt-4" style={{ position: "relative", zIndex: 50 }}>
        <View className="flex-row items-center bg-gray-100 p-3 rounded-xl">
          {/* OPEN NETWORK SELECTOR */}
          <TouchableOpacity 
            onPress={() => setNetworkModal(true)}
            className="flex-row items-center bg-white p-1 rounded-full border border-gray-200"
          >
            <Image
              source={
                selectedNetwork?.image || require("../../assets/images/mtn.png")
              }
              className="w-7 h-7 rounded-full"
            />
            <ChevronDown size={16} color="#4B5563" className="ml-1 mr-0.5" />
          </TouchableOpacity>

          {/* PHONE INPUT */}
          <TextInput
            ref={phoneInputRef}
            className="ml-3 flex-1 text-lg font-medium"
            placeholder="Enter phone number"
            value={phone}
            onChangeText={(text) => {
              const cleaned = normalizePhone(text);
              setPhone(cleaned);
            }}
            onFocus={async () => {
              if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
                blurTimeoutRef.current = null;
              }
              setIsPhoneFocused(true);
              try {
                const items = await getRecentPhoneNumbers({ userId });
                setRecentPhones(items);
              } catch {}
            }}
            onBlur={() => {
              if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = setTimeout(() => {
                if (isDropdownInteractingRef.current) return;
                setIsPhoneFocused(false);
              }, 300);
            }}
            keyboardType="numeric"
            maxLength={15}
          />

          {/* CONTACT PICKER */}
          <TouchableOpacity onPress={() => setContactModal(true)}>
            <CircleUser size={22} />
          </TouchableOpacity>
        </View>

        {isPhoneFocused && query.length > 2 && !exactMatch && (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 62,
              zIndex: 999,
              elevation: 30,
            }}
          >
            <View
              pointerEvents="auto"
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {visibleRecentPhones.length === 0 ? (
                <View className="px-3 py-4">
                  <Text className="text-gray-600 text-center">
                    No matches
                  </Text>
                </View>
              ) : (
                visibleRecentPhones.map((item) => (
                  <View
                    key={item.phone}
                    className="px-3 py-3 border-b border-gray-100 flex-row items-center"
                  >
                    <TouchableOpacity
                      className="flex-1"
                      onPressIn={() => {
                        isDropdownInteractingRef.current = true;
                        if (blurTimeoutRef.current) {
                          clearTimeout(blurTimeoutRef.current);
                          blurTimeoutRef.current = null;
                        }
                        setPhone(normalizePhone(item.phone));
                        setIsPhoneFocused(false);
                        phoneInputRef.current?.blur();
                      }}
                      onPress={async () => {
                        try {
                          await saveRecentPhoneNumber({
                            userId,
                            phone: item.phone,
                          });
                          const items = await getRecentPhoneNumbers({ userId });
                          setRecentPhones(items);
                        } catch {}
                        isDropdownInteractingRef.current = false;
                      }}
                    >
                      <Text className="text-base text-gray0299 font-medium">{item.phone}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="ml-3 p-2"
                      onPressIn={() => {
                        isDropdownInteractingRef.current = true;
                        if (blurTimeoutRef.current) {
                          clearTimeout(blurTimeoutRef.current);
                          blurTimeoutRef.current = null;
                        }
                      }}
                      onPressOut={() => {
                        isDropdownInteractingRef.current = false;
                      }}
                      onPress={async () => {
                        if (blurTimeoutRef.current) {
                          clearTimeout(blurTimeoutRef.current);
                          blurTimeoutRef.current = null;
                        }
                        try {
                          await removeRecentPhoneNumber({
                            userId,
                            phone: item.phone,
                          });
                          const items = await getRecentPhoneNumbers({ userId });
                          setRecentPhones(items);
                        } catch {}
                        setIsPhoneFocused(true);
                        phoneInputRef.current?.focus();
                      }}
                    >
                      <X size={18} />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {/* {hasSavedNumbers && (
                <View className="p-3 border-t border-gray-100 items-center justify-center">
                  <TouchableOpacity
                    className="p-2 bg-gray-100 rounded-full"
                    onPressIn={() => {
                      isDropdownInteractingRef.current = true;
                      if (blurTimeoutRef.current) {
                        clearTimeout(blurTimeoutRef.current);
                        blurTimeoutRef.current = null;
                      }
                    }}
                    onPressOut={() => {
                      isDropdownInteractingRef.current = false;
                    }}
                    onPress={async () => {
                      if (blurTimeoutRef.current) {
                        clearTimeout(blurTimeoutRef.current);
                        blurTimeoutRef.current = null;
                      }
                      try {
                        await clearRecentPhoneNumbers({ userId });
                        setRecentPhones([]);
                      } catch {}
                      setIsPhoneFocused(true);
                      phoneInputRef.current?.focus();
                    }}
                  >
                    <Trash2 size={18} />
                  </TouchableOpacity>
                </View>
              )} */}
            </View>
          </View>
        )}
      </View>

      {/* NETWORK SELECT MODAL */}
      <Modal visible={networkModal} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center px-4">
          <View className="bg-white w-full rounded-2xl p-5 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Select Network
              </Text>
              <TouchableOpacity onPress={() => setNetworkModal(false)}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {networks.map((item: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedNetwork(item);
                    setNetworkModal(false);
                  }}
                  className="flex-row items-center p-4 border-b border-gray-100"
                >
                  <Image source={item.image} className="w-10 h-10 rounded-full" />
                  <Text className="ml-4 text-lg font-semibold text-gray-800 capitalize">
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CONTACT PICKER MODAL */}
      <Modal visible={contactModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white w-full max-h-[70%] p-5 rounded-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Select Contact</Text>

              <TouchableOpacity
                onPress={() => setContactModal(false)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={contacts}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item, index) => (item.id || item.lookupKey || index).toString()}
              renderItem={({ item }) => {
                const number = item?.phoneNumbers?.[0]?.number;
                if (!number) return null;

                return (
                  <TouchableOpacity
                    className="py-4 border-b border-gray-100"
                    onPress={() => {
                      const cleaned = normalizePhone(number);
                      setPhone(cleaned);
                      saveRecentPhoneNumber({ userId, phone: cleaned }).catch(
                        () => {}
                      );
                      setContactModal(false);
                    }}
                  >
                    <Text className="text-base font-semibold text-gray-800">{item?.name}</Text>
                    <Text className="text-gray-500 mt-1">{number}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
