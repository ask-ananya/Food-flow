import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Sample data for transaction history
const transactions = [
  {
    id: 1,
    donor: "Fresh Market Downtown",
    recipient: "Hope Community Kitchen",
    foodType: "Fresh Produce, Bread",
    quantity: "45 lbs",
    distance: "3.2 miles",
    date: "March 23, 2024",
    rating: 5,
    status: "Completed",
  },
  {
    id: 2,
    donor: "Sunshine Bakery",
    recipient: "St. Mary's Food Bank",
    foodType: "Baked Goods",
    quantity: "28 lbs",
    distance: "5.7 miles",
    date: "March 21, 2024",
    rating: 4,
    status: "Completed",
  },
  {
    id: 3,
    donor: "Green Grove Market",
    recipient: "Community Outreach Center",
    foodType: "Dairy, Vegetables",
    quantity: "62 lbs",
    distance: "2.1 miles",
    date: "March 19, 2024",
    rating: 5,
    status: "Completed",
  },
  {
    id: 4,
    donor: "Harbor Restaurant",
    recipient: "Local Shelter Alliance",
    foodType: "Prepared Meals",
    quantity: "35 lbs",
    distance: "4.3 miles",
    date: "March 18, 2024",
    rating: 4,
    status: "Completed",
  },
  {
    id: 5,
    donor: "City Fresh Foods",
    recipient: "Youth Center Foundation",
    foodType: "Mixed Groceries",
    quantity: "83 lbs",
    distance: "6.8 miles",
    date: "March 16, 2024",
    rating: 5,
    status: "Completed",
  },
  {
    id: 6,
    donor: "Garden Grocery",
    recipient: "Senior Care Center",
    foodType: "Fresh Produce",
    quantity: "41 lbs",
    distance: "1.9 miles",
    date: "March 15, 2024",
    rating: 5,
    status: "Completed",
  },
  {
    id: 7,
    donor: "Metro Mart",
    recipient: "Family Support Network",
    foodType: "Canned Goods, Dry Foods",
    quantity: "94 lbs",
    distance: "7.2 miles",
    date: "March 13, 2024",
    rating: 4,
    status: "Completed",
  },
  {
    id: 8,
    donor: "Riverfront Cafe",
    recipient: "Veterans Food Bank",
    foodType: "Prepared Meals, Bread",
    quantity: "52 lbs",
    distance: "3.5 miles",
    date: "March 12, 2024",
    rating: 5,
    status: "Completed",
  },
  {
    id: 9,
    donor: "Harvest Foods",
    recipient: "Children's Mission",
    foodType: "Mixed Groceries",
    quantity: "67 lbs",
    distance: "4.8 miles",
    date: "March 10, 2024",
    rating: 4,
    status: "Completed",
  },
  {
    id: 10,
    donor: "Daily Fresh Market",
    recipient: "Community Kitchen",
    foodType: "Produce, Dairy",
    quantity: "73 lbs",
    distance: "2.9 miles",
    date: "March 9, 2024",
    rating: 5,
    status: "Completed",
  },
];

export default function History() {
  const router = useRouter();
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={16}
        color={index < rating ? "#FFD700" : "#CBD5E0"}
        className="mr-0.5"
      />
    ));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between p-5 bg-white border-b border-[#E2E8F0] shadow-sm">
        <TouchableOpacity
          className="p-2 rounded-full bg-white/80"
          onPress={() => router.push("/home")}
        >
          <Ionicons name="arrow-back" size={24} color="#303F9F" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-[#303F9F] flex-1 text-center -ml-6">
          History
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 bg-[#f8f9fa] p-4">
        {transactions.map((transaction) => (
          <View key={transaction.id} className="bg-white rounded-xl p-4 mb-4 shadow-lg shadow-black/5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm text-[#4A5568] font-medium">
                {transaction.date}
              </Text>
              <View className="flex-row">
                {renderStars(transaction.rating)}
              </View>
            </View>

            <View className="h-[1px] bg-[#E2E8F0] my-3" />

            <View className="mb-3">
              <View className="flex-row mb-2 items-center">
                <Text className="w-20 text-sm text-[#3949AB] font-semibold">
                  Donor:
                </Text>
                <Text className="flex-1 text-sm text-[#2D3748]">
                  {transaction.donor}
                </Text>
              </View>
              <View className="flex-row mb-2 items-center">
                <Text className="w-20 text-sm text-[#3949AB] font-semibold">
                  Recipient:
                </Text>
                <Text className="flex-1 text-sm text-[#2D3748]">
                  {transaction.recipient}
                </Text>
              </View>
              <View className="flex-row mb-2 items-center">
                <Text className="w-20 text-sm text-[#3949AB] font-semibold">
                  Food Type:
                </Text>
                <Text className="flex-1 text-sm text-[#2D3748]">
                  {transaction.foodType}
                </Text>
              </View>
              <View className="flex-row mb-2 items-center">
                <Text className="w-20 text-sm text-[#3949AB] font-semibold">
                  Quantity:
                </Text>
                <Text className="flex-1 text-sm text-[#2D3748]">
                  {transaction.quantity}
                </Text>
              </View>
              <View className="flex-row mb-2 items-center">
                <Text className="w-20 text-sm text-[#3949AB] font-semibold">
                  Distance:
                </Text>
                <Text className="flex-1 text-sm text-[#2D3748]">
                  {transaction.distance}
                </Text>
              </View>
            </View>

            <View className="bg-[#E8EAF6] p-2 rounded-lg self-start">
              <Text className="text-[#3949AB] text-xs font-semibold">
                {transaction.status}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
