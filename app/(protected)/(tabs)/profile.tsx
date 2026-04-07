import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, Switch } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { useRouter } from "expo-router";
import ApHomeHeader from "@/components/headers/homeheader";
import { logout } from "@/redux/features/user/userSlice";
import ApSafeAreaView from "@/components/safeAreaView/safeAreaView";
import { useToast } from "@/components/toast/toastProvider";
import axiosInstance from "@/redux/apis/common/aixosInstance";
import { updateTransactionMessagePreference } from "@/redux/features/user/userThunk";
import { 
  Lock, 
  KeyRound, 
  Contact, 
  LogOut, 
  ChevronRight, 
  User, 
  ShieldCheck, 
  HeadphonesIcon,
  Bell,
  HelpCircle,
  FileText,
  Store
} from "lucide-react-native";

type ProfileItem =
  | {
      id: string;
      icon: any;
      label: string;
      href: string;
      color: string;
      kind: "link";
    }
  | {
      id: string;
      icon: any;
      label: string;
      subLabel?: string;
      color: string;
      kind: "toggle";
      value: boolean;
      loading?: boolean;
      onToggle: (value: boolean) => void;
    };

function ProfileRow({ item, onPress }: { item: ProfileItem; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center p-4 active:bg-gray-50"
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: `${item.color}15` }}
      >
        <item.icon size={20} color={item.color} strokeWidth={2} />
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-800">{item.label}</Text>
        {"subLabel" in item && item.subLabel ? (
          <Text className="text-xs text-gray-500 mt-1">{item.subLabel}</Text>
        ) : null}
      </View>

      {item.kind === "toggle" ? (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          disabled={Boolean(item.loading)}
        />
      ) : (
        <ChevronRight size={20} color="#d1d5db" />
      )}
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAgent = String(user?.role || "").toLowerCase() === "agent";
  const [transactionMessageCharge, setTransactionMessageCharge] = React.useState<number>(0);
  const [transactionMessageCompanyName, setTransactionMessageCompanyName] = React.useState<string>("Almaleek");
  const [updatingTxMsg, setUpdatingTxMsg] = React.useState(false);
  const [txMsgEnabled, setTxMsgEnabled] = React.useState(Boolean(user?.transactionMessageEnabled));

  React.useEffect(() => {
    setTxMsgEnabled(Boolean(user?.transactionMessageEnabled));
  }, [user?.transactionMessageEnabled]);

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axiosInstance.get("/auth/settings");
        const settings = response.data || {};
        setTransactionMessageCharge(Number(settings.transactionMessageCharge || 0));
        setTransactionMessageCompanyName(String(settings.transactionMessageCompanyName || "Almaleek"));
      } catch {
      }
    };
    loadSettings();
  }, []);

  const handleToggleTransactionMessage = async (enabled: boolean) => {
    const previousValue = txMsgEnabled;
    setTxMsgEnabled(enabled);

    try {
      setUpdatingTxMsg(true);
      const resultAction = await dispatch(updateTransactionMessagePreference({ enabled }));
      if (updateTransactionMessagePreference.fulfilled.match(resultAction)) {
        showToast(
          enabled ? "Transaction alerts enabled" : "Transaction alerts disabled"
        );
      } else {
        setTxMsgEnabled(previousValue);
        showToast(resultAction.payload as string, "error");
      }
    } catch {
      setTxMsgEnabled(previousValue);
      showToast("Unexpected error. Please try again.", "error");
    } finally {
      setUpdatingTxMsg(false);
    }
  };

  const handleLogout = async () => {
    try {
      dispatch(logout());
      router.push("/(auth)/signin");
    } catch (err) {
      showToast("Logout Failed", "Please try again.", "error");
      console.log("Logout failed", err);
    }
  };

  const sections = [
    {
      title: "Security",
      items: [
        {
          id: "1",
          icon: Lock,
          label: "Change Password",
          href: "/(protected)/updatepassword",
          color: "#3b82f6", // blue
          kind: "link"
        },
        {
          id: "2",
          icon: KeyRound,
          label: "Transaction PIN",
          href: "/(protected)/updatepin",
          color: "#8b5cf6", // violet
          kind: "link"
        },
      ]
    },
    {
      title: "Notifications",
      items: [
        {
          id: "txmsg",
          icon: Bell,
          label: "Transaction Message",
          subLabel:
            transactionMessageCharge > 0
              ? `Charge ${transactionMessageCharge} per message · powered by ${transactionMessageCompanyName}`
              : `Free · powered by ${transactionMessageCompanyName}`,
          color: "#f59e0b",
          kind: "toggle",
          value: txMsgEnabled,
          loading: updatingTxMsg,
          onToggle: handleToggleTransactionMessage,
        },
      ],
    },
    ...(isAgent
      ? [
          {
            title: "Marketplace",
            items: [
              {
                id: "m1",
                icon: Store,
                label: "My Store",
                href: "/marketplace/store",
                color: "#16a34a",
                kind: "link"
              },
            ],
          },
        ]
      : []),
    {
      title: "Support & Legal",
      items: [
        {
          id: "3",
          icon: HeadphonesIcon,
          label: "Contact Support",
          href: "/(protected)/contact",
          color: "#10b981", // emerald
          kind: "link"
        },
        // {
        //   id: "4",
        //   icon: HelpCircle,
        //   label: "FAQs",
        //   href: "/(protected)/faqs",
        //   color: "#f59e0b" // amber
        // },
        // {
        //   id: "5",
        //   icon: FileText,
        //   label: "Terms & Privacy",
        //   href: "/(protected)/terms",
        //   color: "#6b7280" // gray
        // },
      ]
    }
  ];

  return (
    <ApSafeAreaView>
      <View className="pt-2 pb-2 bg-white">
        <ApHomeHeader />
      </View>

      <ScrollView className="flex-1 bg-gray-50 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm shadow-gray-200 mb-8 items-center border border-gray-100">
          <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4 border-4 border-white shadow-sm">
             <Text className="text-3xl font-bold text-green-700 uppercase">
               {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
             </Text>
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-1">
            {user?.firstName?.split(" ").map((n: string) => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()).join(" ")} {user?.lastName?.split(" ").map((n: string) => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()).join(" ")}
          </Text>
          <Text className="text-sm text-gray-500 font-medium mb-4">
            {user?.email}
          </Text>
          <View className="flex-row gap-3">
             <View className="px-3 py-1 bg-green-50 rounded-full border border-green-100">
                <Text className="text-xs font-semibold text-green-700 capitalize">{user?.role || 'User'}</Text>
             </View>
             {user?.phone && (
               <View className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                  <Text className="text-xs font-semibold text-gray-600">{user?.phone}</Text>
               </View>
             )}
          </View>
        </View>

        {/* Menu Sections */}
        {sections.map((section, idx) => (
          <View key={idx} className="mb-6">
            <Text className="text-sm font-bold text-gray-900 mb-3 ml-1 uppercase tracking-wider opacity-60">
              {section.title}
            </Text>
            <View className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-gray-100 border border-gray-100">
              {section.items.map((item, index) => (
                <View
                  key={item.id}
                  className={index !== section.items.length - 1 ? "border-b border-gray-50" : ""}
                >
                  <ProfileRow
                    item={item as any}
                    onPress={() => {
                      if ((item as any).kind === "link") {
                        router.push((item as any).href as any);
                      }
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center bg-red-50 p-4 rounded-2xl mb-12 border border-red-100 active:bg-red-100"
        >
          <LogOut size={20} color="#ef4444" className="mr-2" />
          <Text className="text-base font-bold text-red-600">Log Out</Text>
        </TouchableOpacity>

        <View className="items-center mb-10">
          <Text className="text-xs text-gray-400">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </ApSafeAreaView>
  );
}
