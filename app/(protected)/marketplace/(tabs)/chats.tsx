import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
import { Image } from "expo-image";
import { RefreshCw, Search, Wifi, WifiOff } from "lucide-react-native";

import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchUserChats,
  setActiveConversation,
  upsertConversation,
} from "@/redux/features/marketplace/chatSlice";
import { MARKETPLACE_API_URL } from "@/redux/apis/common/aixosInstance";

export default function MarketplaceChats() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loading, chats } = useSelector((state: RootState) => state.marketplaceChat);

  const [socketStatus, setSocketStatus] = useState<"connecting" | "connected" | "disconnected">(
    "connecting"
  );

  const socketRef = useRef<Socket | null>(null);

  const socketUrl = useMemo(() => MARKETPLACE_API_URL.replace(/\/api\/?$/, ""), []);
  const [query, setQuery] = useState("");

  useEffect(() => {
    dispatch(fetchUserChats({ page: 1, limit: 30 }));
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) {
          setSocketStatus("disconnected");
          return;
        }

        const s = io(socketUrl, {
          transports: ["websocket"],
          auth: { token: accessToken },
        });

        socketRef.current = s;

        s.on("connect", () => {
          if (!cancelled) setSocketStatus("connected");
        });
        s.on("disconnect", () => {
          if (!cancelled) setSocketStatus("disconnected");
        });
        s.on("connect_error", () => {
          if (!cancelled) setSocketStatus("disconnected");
        });

        s.on("chat:conversationUpdate", (conversation: any) => {
          dispatch(upsertConversation(conversation));
        });
      } catch {
        setSocketStatus("disconnected");
      }
    };

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [dispatch, socketUrl]);

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats || [];
    return (chats || []).filter((c: any) => {
      const title = String(c?.productId?.title || "Product").toLowerCase();
      const last = String(c?.lastMessageText || "").toLowerCase();
      const other = String(c?.otherUserId || "").toLowerCase();
      return title.includes(q) || last.includes(q) || other.includes(q);
    });
  }, [chats, query]);

  return (
    <View>
      <View className="bg-green-700 px-4 pt-8 pb-4">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-2xl font-extrabold text-white">Chats</Text>
            <View className="flex-row items-center mt-1">
              {socketStatus === "connected" ? (
                <Wifi size={14} color="rgba(255,255,255,0.9)" />
              ) : socketStatus === "connecting" ? (
                <Wifi size={14} color="rgba(255,255,255,0.9)" />
              ) : (
                <WifiOff size={14} color="rgba(255,255,255,0.9)" />
              )}
              <Text className="text-xs text-white/80 ml-1">
                {socketStatus === "connected"
                  ? "Connected"
                  : socketStatus === "connecting"
                  ? "Connecting..."
                  : "Offline"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => dispatch(fetchUserChats({ page: 1, limit: 30 }))}
            activeOpacity={0.85}
            className="w-11 h-11 rounded-2xl bg-white/15 items-center justify-center"
          >
            <RefreshCw size={18} color="rgba(255,255,255,0.95)" />
          </TouchableOpacity>
        </View>

        <View className="mt-4 bg-white/15 rounded-2xl px-3 py-2 flex-row items-center">
          <Search size={18} color="rgba(255,255,255,0.9)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search chats"
            placeholderTextColor="rgba(255,255,255,0.7)"
            className="flex-1 ml-2 text-white"
          />
        </View>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item: any) => String(item._id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          loading ? (
            <View className="py-10 items-center">
              <ActivityIndicator />
            </View>
          ) : (
            <View className="py-10 items-center">
              <Text className="text-gray-500">No chats yet.</Text>
            </View>
          )
        }
        renderItem={({ item: c }: any) => {
          const title = c?.productId?.title || "Product";
          const subtitle = c?.lastMessageText || "No messages yet";
          const unread = Number(c?.unreadCount || 0);
          const dt = c?.lastMessageAt || c?.updatedAt || c?.createdAt;
          const timeText = dt
            ? new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "";
          const imageUrl =
            c?.productId?.images?.[0] || `https://picsum.photos/seed/almaleek-chat-${c._id}/200/200`;

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                dispatch(setActiveConversation(c));
                router.push(`/(protected)/marketplace/chat/${c._id}` as never);
              }}
              className="bg-white"
            >
              <View className="flex-row items-center px-4 py-3">
                <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    source={{ uri: imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </View>

                <View className="flex-1 ml-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[15px] font-semibold text-gray-900 flex-1 pr-3" numberOfLines={1}>
                      {title}
                    </Text>
                    <Text className={`text-[11px] ${unread > 0 ? "text-green-700" : "text-gray-400"}`}>
                      {timeText}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className={`text-[13px] flex-1 pr-3 ${unread > 0 ? "text-gray-700 font-medium" : "text-gray-500"}`} numberOfLines={1}>
                      {subtitle}
                    </Text>
                    {unread > 0 ? (
                      <View className="bg-green-600 rounded-full min-w-[22px] h-[22px] px-2 items-center justify-center">
                        <Text className="text-white text-[11px] font-bold">{unread}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
              <View className="h-[1px] bg-gray-100 ml-[76px]" />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
