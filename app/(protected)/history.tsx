import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
import { useRouter } from "expo-router";
export default function History() {
  const router = useRouter();
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={16}
        color={index < rating ? "#FFD700" : "#CBD5E0"}
        style={{ marginRight: 2 }}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/home")}
        >
          <Ionicons name="arrow-back" size={24} color="#303F9F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{transaction.date}</Text>
              <View style={styles.ratingContainer}>
                {renderStars(transaction.rating)}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBody}>
              <View style={styles.row}>
                <Text style={styles.label}>Donor:</Text>
                <Text style={styles.value}>{transaction.donor}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Recipient:</Text>
                <Text style={styles.value}>{transaction.recipient}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Food Type:</Text>
                <Text style={styles.value}>{transaction.foodType}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Quantity:</Text>
                <Text style={styles.value}>{transaction.quantity}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Distance:</Text>
                <Text style={styles.value}>{transaction.distance}</Text>
              </View>
            </View>

            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{transaction.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#303F9F",
    flex: 1,
    textAlign: "center",
    marginLeft: -24,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  date: {
    fontSize: 14,
    color: "#4A5568",
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  cardBody: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  label: {
    width: 80,
    fontSize: 14,
    color: "#3949AB",
    fontWeight: "600",
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: "#2D3748",
  },
  statusContainer: {
    backgroundColor: "#E8EAF6",
    padding: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#3949AB",
    fontSize: 12,
    fontWeight: "600",
  },
});
