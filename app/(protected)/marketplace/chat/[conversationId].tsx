import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
import { ArrowLeft, MoreVertical, RefreshCw, SendHorizontal, X } from "lucide-react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppDispatch, RootState } from "@/redux/store";
import {
  addMessage,
  fetchChatMessages,
  upsertConversation,
} from "@/redux/features/marketplace/chatSlice";
import { MARKETPLACE_API_URL } from "@/redux/apis/common/aixosInstance";

export default function MarketplaceChatThread() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  const { activeConversation, messages, loading } = useSelector(
    (state: RootState) => state.marketplaceChat
  );
  const userId = useSelector((state: RootState) => state.auth.user?._id);

  const [socketStatus, setSocketStatus] = useState<"connecting" | "connected" | "disconnected">(
    "connecting"
  );
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const listRef = useRef<FlatList<any> | null>(null);

  const socketUrl = useMemo(() => MARKETPLACE_API_URL.replace(/\/api\/?$/, ""), []);

  useEffect(() => {
    if (!conversationId) return;
    dispatch(fetchChatMessages({ conversationId, page: 1, limit: 50 }));
  }, [conversationId, dispatch]);

  useEffect(() => {
    messageIdsRef.current = new Set(messages.map((m: any) => m._id));
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);

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
          if (conversationId) s.emit("chat:join", { conversationId });
          if (conversationId) s.emit("chat:markRead", { conversationId });
        });
        s.on("disconnect", () => {
          if (!cancelled) setSocketStatus("disconnected");
        });
        s.on("connect_error", () => {
          if (!cancelled) setSocketStatus("disconnected");
        });

        s.on("chat:newMessage", (msg: any) => {
          if (!msg?.conversationId) return;
          if (String(msg.conversationId) !== String(conversationId)) return;
          if (msg?._id && messageIdsRef.current.has(String(msg._id))) return;
          if (msg?._id) messageIdsRef.current.add(String(msg._id));
          dispatch(addMessage(msg));
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
  }, [conversationId, dispatch, socketUrl]);

  const onSend = async () => {
    const message = text.trim();
    if (!message || !conversationId) return;
    if (!socketRef.current || socketStatus !== "connected") return;

    setSending(true);
    setText("");
    socketRef.current.emit(
      "chat:send",
      { conversationId, message },
      (ack: any) => {
        setSending(false);
        if (!ack?.ok) return;
        const msg = ack.message;
        if (msg?._id && !messageIdsRef.current.has(String(msg._id))) {
          messageIdsRef.current.add(String(msg._id));
          dispatch(addMessage(msg));
        }
      }
    );
  };

  const title = activeConversation?.productId?.title
    ? String(activeConversation.productId.title)
    : "Chat";
  const headerImage =
    activeConversation?.productId?.images?.[0] ||
    (conversationId ? `https://picsum.photos/seed/almaleek-chat-${conversationId}/200/200` : "");

  return (
    <View className="flex-1">
      <View className="bg-green-700 px-4 pt-8 pb-3">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="w-10 h-10 items-center justify-center -ml-1"
          >
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>

          <View className="w-9 h-9 rounded-full overflow-hidden bg-white/20 ml-1">
            {headerImage ? (
              <Image
                source={{ uri: headerImage }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : null}
          </View>

          <View className="ml-3 flex-1">
            <Text className="text-white font-semibold text-base" numberOfLines={1}>
              {title}
            </Text>
            <Text className="text-white/80 text-[11px] mt-0.5">
              {socketStatus === "connected"
                ? "online"
                : socketStatus === "connecting"
                ? "connecting..."
                : "offline"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            activeOpacity={0.8}
            className="w-10 h-10 items-center justify-center"
          >
            <MoreVertical size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View className="flex-1 px-3 pt-3" style={{ backgroundColor: "#ece5dd" }}>
          {loading && messages.length === 0 ? (
            <View className="py-8 items-center">
              <ActivityIndicator />
            </View>
          ) : (
            <FlatList
              ref={(r) => {
                listRef.current = r;
              }}
              data={messages}
              keyExtractor={(item: any) => String(item._id)}
              contentContainerStyle={{ paddingBottom: 16 }}
              renderItem={({ item }: any) => {
                const mine = userId ? String(item.senderId) === String(userId) : false;
                const timeText = item?.createdAt
                  ? new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <View className={`mb-3 ${mine ? "items-end" : "items-start"}`}>
                    <View
                      className={`max-w-[82%] px-3 py-2.5 ${
                        mine
                          ? "bg-[#DCF8C6] rounded-2xl rounded-tr-sm"
                          : "bg-white rounded-2xl rounded-tl-sm"
                      }`}
                    >
                      <Text className={`${mine ? "text-gray-900" : "text-gray-900"} text-[14px] leading-5`}>
                        {item.message}
                      </Text>
                      <View className="flex-row justify-end mt-1">
                        <Text className="text-[10px] text-gray-500">{timeText}</Text>
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>

        <View
          className="px-3 pb-6 pt-2"
          style={{
            backgroundColor: "#ece5dd",
            // paddingBottom: insets.bottom,

          }}
        >
          <View className="flex-row items-center">
            <View className="flex-1 bg-white rounded-full px-4 py-2 mr-2">
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={socketStatus === "connected" ? "Message" : "Offline"}
                editable={socketStatus === "connected" && !sending}
                multiline
                className="text-gray-900 min-h-[40px]"
              />
            </View>
            <TouchableOpacity
              onPress={onSend}
              disabled={socketStatus !== "connected" || sending || !text.trim()}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                socketStatus === "connected" && text.trim() ? "bg-green-600" : "bg-white/60"
              }`}
            >
              {sending ? (
                <ActivityIndicator color={socketStatus === "connected" && text.trim() ? "#fff" : "#111827"} />
              ) : (
                <SendHorizontal
                  size={20}
                  color={socketStatus === "connected" && text.trim() ? "#fff" : "#111827"}
                />
              )}
            </TouchableOpacity>
          </View>

          {activeConversation?.otherUserId ? (
            <Text className="text-[11px] text-gray-600 mt-1 ml-1">
              {String(activeConversation.otherUserId).slice(0, 10)}...
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={menuOpen} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
          className="flex-1 bg-black/40"
        >
          <View className="absolute top-16 right-4 bg-white rounded-2xl overflow-hidden w-48">
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                dispatch(fetchChatMessages({ conversationId, page: 1, limit: 50 }));
              }}
              activeOpacity={0.85}
              className="px-4 py-4 flex-row items-center"
            >
              <RefreshCw size={18} color="#111827" />
              <Text className="ml-3 text-gray-900 font-semibold">Refresh</Text>
            </TouchableOpacity>

            <View className="h-px bg-gray-100" />

            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                const productId = activeConversation?.productId?._id;
                if (productId) {
                  router.push(`/(protected)/marketplace/product/${productId}` as never);
                }
              }}
              activeOpacity={0.85}
              className="px-4 py-4"
            >
              <Text className="text-gray-900 font-semibold">View product</Text>
            </TouchableOpacity>

            <View className="h-px bg-gray-100" />

            <TouchableOpacity
              onPress={() => setMenuOpen(false)}
              activeOpacity={0.85}
              className="px-4 py-4 flex-row items-center"
            >
              <X size={18} color="#111827" />
              <Text className="ml-3 text-gray-900 font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
