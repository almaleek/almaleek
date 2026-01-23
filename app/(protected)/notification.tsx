import { View, Text, ScrollView } from "react-native";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check } from "lucide-react-native";
import { AppDispatch, RootState } from "@/redux/store";
import { getAllNotification } from "@/redux/features/notifications/notificationSlice";
import ApHeader from "@/components/headers/header";
import EmptyTransaction from "@/components/empty/emptyTransaction";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import ApScrollView from "@/components/scrollview/scrollview";

export default function NotificationPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { notifications: notifies } = useSelector(
    (state: RootState) => state.notifications
  );

  useEffect(() => {
    dispatch(getAllNotification());
  }, [dispatch]);

  return (
    <ApSafeAreaView>
      <View className="mt-4">
        <ApHeader title="Notifications" />
      </View>

      <ApScrollView>
        {notifies?.length === 0 ? (
          <EmptyTransaction />
        ) : (
          notifies.map((notification: any) => (
            <View
              key={notification?._id}
              className={`p-4 rounded-md shadow border ${
                notification?.read ? "bg-gray-200" : "bg-white"
              }`}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">
                    {notification?.title}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {notification?.message}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">
                    {new Date(notification?.createdAt).toLocaleString()}
                  </Text>
                </View>

                {!notification?.read && (
                  <Check size={20} color="#22c55e" /> // green-500
                )}
              </View>
            </View>
          ))
        )}
      </ApScrollView>
    </ApSafeAreaView>
  );
}
