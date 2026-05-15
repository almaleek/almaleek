import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./features/user/userSlice";
import transactionReducer from "./features/transaction/transactionSlice";
import walletReducer from "./features/wallet/walletSlice";
import notificationReducer from "./features/notifications/notificationSlice";
import marketplaceProductsReducer from "./features/marketplace/productsSlice";
import marketplaceChatReducer from "./features/marketplace/chatSlice";
import easyAccessdataPlansReducer from "./features/easyAccess/service"; // Assuming you have this reducer imported
import remitaReducer from "./features/remita/remitaSlice";
import settingReducer from "./features/setting/settingSlice";

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  transactions: transactionReducer,
  wallets: walletReducer,
  notifications: notificationReducer,
  marketplaceProducts: marketplaceProductsReducer,
  marketplaceChat: marketplaceChatReducer,
  easyAccessdataPlans: easyAccessdataPlansReducer, // Assuming you have this reducer imported
  remita: remitaReducer,
  setting: settingReducer,
});

// Create store
export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
