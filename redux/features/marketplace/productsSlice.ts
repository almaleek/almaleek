import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { marketplaceAxiosInstance } from "@/redux/apis/common/aixosInstance";

export type MarketplaceReview = {
  userId: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MarketplaceProduct = {
  _id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  category?: string;
  location?: string;
  storeName?: string;
  stock?: number;
  isSold?: boolean;
  ownerId: string;
  ratingsAverage?: number;
  ratingsCount?: number;
  createdAt: string;
  updatedAt?: string;
};

type ProductsResponse = {
  items: MarketplaceProduct[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ProductReviewsResponse = {
  ratingsAverage: number;
  ratingsCount: number;
  reviews: MarketplaceReview[];
};

type UpsertReviewResponse = {
  productId: string;
  ratingsAverage: number;
  ratingsCount: number;
  review?: MarketplaceReview;
};

type DeleteReviewResponse = {
  success: boolean;
  ratingsAverage: number;
  ratingsCount: number;
};

export const fetchMarketplaceProducts = createAsyncThunk(
  "marketplace/products/list",
  async (
    params: {
      page?: number;
      limit?: number;
      category?: string;
      location?: string;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      ownerId?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await marketplaceAxiosInstance.get<ProductsResponse>("/products", {
        params,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch marketplace products"
      );
    }
  }
);

export const fetchMarketplaceProductById = createAsyncThunk(
  "marketplace/products/getById",
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await marketplaceAxiosInstance.get<MarketplaceProduct>(
        `/products/${productId}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch product");
    }
  }
);

export const createMarketplaceProduct = createAsyncThunk(
  "marketplace/products/create",
  async (
    params: {
      title: string;
      description?: string;
      price: number | string;
      category?: string;
      location: string;
      stock?: number | string;
      images?: { uri: string; fileName?: string; mimeType?: string }[];
    },
    { rejectWithValue }
  ) => {
    try {
      const form = new FormData();
      form.append("title", params.title);
      form.append("description", params.description || "");
      form.append("price", String(params.price));
      form.append("category", params.category || "");
      form.append("location", params.location);
      if (typeof params.stock !== "undefined") {
        form.append("stock", String(params.stock));
      }

      (params.images || []).slice(0, 10).forEach((img, idx) => {
        const name =
          img.fileName ||
          img.uri.split("/").pop() ||
          `product-image-${idx + 1}.jpg`;
        const type = img.mimeType || "image/jpeg";
        form.append(
          "images",
          { uri: img.uri, name, type } as any
        );
      });

      const response = await marketplaceAxiosInstance.post<MarketplaceProduct>(
        "/products",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || "Failed to create marketplace product"
      );
    }
  }
);

export const fetchMarketplaceProductReviews = createAsyncThunk(
  "marketplace/products/reviews/list",
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await marketplaceAxiosInstance.get<ProductReviewsResponse>(
        `/products/${productId}/reviews`
      );
      return { productId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch reviews");
    }
  }
);

export const upsertMarketplaceProductReview = createAsyncThunk(
  "marketplace/products/reviews/upsert",
  async (
    params: { productId: string; rating: number; comment?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await marketplaceAxiosInstance.post<UpsertReviewResponse>(
        `/products/${params.productId}/reviews`,
        { rating: params.rating, comment: params.comment || "" }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to submit review");
    }
  }
);

export const deleteMyMarketplaceProductReview = createAsyncThunk(
  "marketplace/products/reviews/deleteMine",
  async (productId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const userId = state?.auth?.user?._id ? String(state.auth.user._id) : "";
      const response = await marketplaceAxiosInstance.delete<DeleteReviewResponse>(
        `/products/${productId}/reviews`
      );
      return { productId, userId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to delete review");
    }
  }
);

interface MarketplaceProductsState {
  loading: boolean;
  error: string | null;
  items: MarketplaceProduct[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  selectedProduct: MarketplaceProduct | null;
  selectedLoading: boolean;
  createLoading: boolean;
  reviewsLoading: boolean;
  ratingsAverage: number;
  ratingsCount: number;
  reviews: MarketplaceReview[];
}

const initialState: MarketplaceProductsState = {
  loading: false,
  error: null,
  items: [],
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  selectedProduct: null,
  selectedLoading: false,
  createLoading: false,
  reviewsLoading: false,
  ratingsAverage: 0,
  ratingsCount: 0,
  reviews: [],
};

const marketplaceProductsSlice = createSlice({
  name: "marketplaceProducts",
  initialState,
  reducers: {
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
      state.selectedLoading = false;
      state.reviewsLoading = false;
      state.ratingsAverage = 0;
      state.ratingsCount = 0;
      state.reviews = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketplaceProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarketplaceProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchMarketplaceProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMarketplaceProductById.pending, (state) => {
        state.selectedLoading = true;
        state.error = null;
      })
      .addCase(fetchMarketplaceProductById.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchMarketplaceProductById.rejected, (state, action) => {
        state.selectedLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createMarketplaceProduct.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createMarketplaceProduct.fulfilled, (state, action) => {
        state.createLoading = false;
        state.items = [action.payload, ...state.items].slice(0, 50);
      })
      .addCase(createMarketplaceProduct.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMarketplaceProductReviews.pending, (state) => {
        state.reviewsLoading = true;
        state.error = null;
      })
      .addCase(fetchMarketplaceProductReviews.fulfilled, (state, action) => {
        state.reviewsLoading = false;
        state.ratingsAverage = action.payload.ratingsAverage || 0;
        state.ratingsCount = action.payload.ratingsCount || 0;
        state.reviews = action.payload.reviews || [];
      })
      .addCase(fetchMarketplaceProductReviews.rejected, (state, action) => {
        state.reviewsLoading = false;
        state.error = action.payload as string;
      })
      .addCase(upsertMarketplaceProductReview.pending, (state) => {
        state.reviewsLoading = true;
        state.error = null;
      })
      .addCase(upsertMarketplaceProductReview.fulfilled, (state, action) => {
        state.reviewsLoading = false;
        state.ratingsAverage = action.payload.ratingsAverage || 0;
        state.ratingsCount = action.payload.ratingsCount || 0;
        const incoming = action.payload.review;
        if (incoming) {
          const idx = state.reviews.findIndex((r) => r.userId === incoming.userId);
          if (idx === -1) state.reviews = [incoming, ...state.reviews];
          else state.reviews[idx] = incoming;
        }
      })
      .addCase(upsertMarketplaceProductReview.rejected, (state, action) => {
        state.reviewsLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteMyMarketplaceProductReview.pending, (state) => {
        state.reviewsLoading = true;
        state.error = null;
      })
      .addCase(deleteMyMarketplaceProductReview.fulfilled, (state, action) => {
        state.reviewsLoading = false;
        state.ratingsAverage = action.payload.ratingsAverage || 0;
        state.ratingsCount = action.payload.ratingsCount || 0;
        if (action.payload.userId) {
          state.reviews = state.reviews.filter(
            (r) => String(r.userId) !== String(action.payload.userId)
          );
        }
      })
      .addCase(deleteMyMarketplaceProductReview.rejected, (state, action) => {
        state.reviewsLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedProduct } = marketplaceProductsSlice.actions;
export default marketplaceProductsSlice.reducer;
