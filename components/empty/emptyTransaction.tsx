import { View, Text } from "react-native";
import { FileText } from "lucide-react-native";

export default function EmptyTransaction() {
  return (
    <View className="flex-1 items-center justify-center py-20 px-4">
      <View className="bg-slate-100 p-6 rounded-full mb-4">
        <FileText size={48} color="#94a3b8" />
      </View>

      <Text className="text-lg font-semibold text-slate-700">
        No Transactions Yet
      </Text>

      <Text className="text-sm text-slate-500 mt-2 text-center max-w-xs">
        You haven't made any transactions yet. When you do, they’ll appear here.
      </Text>
    </View>
  );
}
