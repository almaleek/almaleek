import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { marketplaceAxiosInstance } from "@/redux/apis/common/aixosInstance";

export type MarketplaceConversation = {
  _id: string;
  productId: any;
  buyerId: string;
  sellerId: string;
  lastMessageText?: string;
  lastMessageAt?: string | null;
  buyerUnread?: number;
  sellerUnread?: number;
  unreadCount?: number;
  otherUserId?: string;
  createdAt: string;
  updatedAt?: string;
};

export type MarketplaceMessage = {
  _id: string;
  conversationId: string;
  senderId: string;
  message: string;
  createdAt: string;
};

type ListChatsResponse = {
  items: MarketplaceConversation[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type GetMessagesResponse = {
  conversation: MarketplaceConversation;
  items: MarketplaceMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const fetchUserChats = createAsyncThunk(
  "marketplace/chat/list",
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await marketplaceAxiosInstance.get<ListChatsResponse>("/chat", {
        params,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch chats");
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  "marketplace/chat/messages",
  async (
    params: { conversationId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await marketplaceAxiosInstance.get<GetMessagesResponse>(
        `/chat/${params.conversationId}`,
        { params: { page: params.page, limit: params.limit } }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch messages");
    }
  }
);

interface MarketplaceChatState {
  loading: boolean;
  error: string | null;
  chats: MarketplaceConversation[];
  activeConversation: MarketplaceConversation | null;
  messages: MarketplaceMessage[];
}

const initialState: MarketplaceChatState = {
  loading: false,
  error: null,
  chats: [],
  activeConversation: null,
  messages: [],
};

const marketplaceChatSlice = createSlice({
  name: "marketplaceChat",
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
      state.messages = [];
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    upsertConversation: (state, action) => {
      const incoming = action.payload as MarketplaceConversation;
      const idx = state.chats.findIndex((c) => c._id === incoming._id);
      if (idx === -1) state.chats.unshift(incoming);
      else state.chats[idx] = { ...state.chats[idx], ...incoming };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload.items;
      })
      .addCase(fetchUserChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchChatMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.activeConversation = action.payload.conversation;
        state.messages = action.payload.items;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setActiveConversation, addMessage, upsertConversation } =
  marketplaceChatSlice.actions;

export default marketplaceChatSlice.reducer;

