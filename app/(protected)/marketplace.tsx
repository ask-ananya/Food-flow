import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase"; // Adjust the import path as needed
import { formatDistanceToNow } from "date-fns";
// Sample user data - in a real app, this would come from authentication
const currentUser = {
  id: "1",
  name: "John Doe",
  role: "farmer", // 'farmer', 'donor', or 'recipient'
};

// Sample transactions data
const transactionsData = [
  {
    id: "1",
    creatorId: "2",
    creatorName: "Jane Smith",
    creatorRole: "donor",
    type: "offer",
    description:
      "Fresh organic vegetables available for donation. 50kg of mixed produce including tomatoes, lettuce, and carrots.",
    date: "2023-05-01",
  },
  {
    id: "2",
    creatorId: "3",
    creatorName: "Mike Johnson",
    creatorRole: "farmer",
    type: "request",
    description:
      "Looking for farming equipment, specifically irrigation systems for a small farm.",
    date: "2023-05-02",
  },
  {
    id: "3",
    creatorId: "4",
    creatorName: "Sarah Williams",
    creatorRole: "recipient",
    type: "request",
    description:
      "Community kitchen needs fresh produce for weekly meal preparation serving 100 people.",
    date: "2023-05-03",
  },
  {
    id: "4",
    creatorId: "5",
    creatorName: "David Brown",
    creatorRole: "donor",
    type: "offer",
    description:
      "Agricultural tools available for donation. Includes shovels, rakes, and basic hand tools.",
    date: "2023-05-04",
  },
  {
    id: "5",
    creatorId: "6",
    creatorName: "Emily Davis",
    creatorRole: "farmer",
    type: "offer",
    description:
      "Excess harvest of apples and pears available for distribution. Approximately 200kg total.",
    date: "2023-05-05",
  },
];

// Get role color
const getRoleColor = (role) => {
  switch (role) {
    case "farmer":
      return "rgba(255, 165, 0, 0.2)"; // Orange for farmers
    case "donor":
      return "rgba(0, 123, 255, 0.2)"; // Blue for donors
    case "recipient":
      return "rgba(40, 167, 69, 0.2)"; // Green for recipients
    default:
      return "gray";
  }
};
const getRelativeTime = (date) => {
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return "Unknown time";
  }
};
// Capitalize first letter
const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export default function Marketplace() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'offer', 'request'
  const [transactions, setTransactions] = useState(transactionsData);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [userData, setUserData] = useState<any>(null); // todo change types later, too lazy rn to import types from supabase
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw new Error(authError.message);
      if (!authUser) {
        router.push("/sign-in");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      if (error) throw new Error(error.message);

      setUserData(data);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const [marketplace, setMarketplace] = useState<any>([]); // todo change types later, too lazy rn to import types from supabase
  const loadMarketplace = async () => {
    try {
      const { data, error } = await supabase
        .from("marketplace")
        .select("*")
        .limit(20);

      if (error) throw error;

      console.log(data[0]);
      setMarketplace(data);
    } catch (error) {
      console.error(
        "Error loading marketplace (code a0f9r0asg9as09ga):",
        error
      );
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, []);

  // Filter transactions based on search query and filter type
  useEffect(() => {
    let filtered = transactionsData;

    // Filter by type if not 'all'
    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.description.toLowerCase().includes(query) ||
          item.creatorName.toLowerCase().includes(query)
      );
    }

    setTransactions(filtered);
  }, [searchQuery, filterType]);

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Offers", value: "offer" },
    { label: "Requests", value: "request" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* User Role Header with Gradient */}

      {/* Search and Filter Section */}
      <View className="px-4 py-3 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
          <Ionicons name="search-outline" size={20} color="gray" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Filter Dropdown */}
          <View className="relative">
            <TouchableOpacity
              className="flex-row items-center ml-2 pl-2 border-l border-gray-300"
              onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Text className="mr-1 text-gray-700">
                {
                  filterOptions.find((option) => option.value === filterType)
                    ?.label
                }
              </Text>
              <Ionicons name="chevron-down" size={16} color="gray" />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {showFilterDropdown && (
              <View className="absolute top-8 right-0 bg-white shadow-md rounded-md z-10 w-32">
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    className={`py-2 px-3 ${
                      filterType === option.value ? "bg-gray-100" : ""
                    }`}
                    onPress={() => {
                      setFilterType(option.value);
                      setShowFilterDropdown(false);
                    }}
                  >
                    <Text>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView className="flex-1 px-4 pt-2 pb-6">
        {transactions.length === 0 ? (
          <View className="py-8 items-center">
            <Ionicons name="alert-circle-outline" size={48} color="gray" />
            <Text className="text-gray-500 text-center mt-2">
              No transactions found
            </Text>
          </View>
        ) : (
          marketplace.map((item, index) => {
            const isSuggested = index <= 2;
            const isOffer = item.transaction_type === "offer";
            return (
              <Link
                key={item.id}
                href={{
                  pathname: "/details",
                  params: {
                    recipientName: item.name,
                    recipientId: item.recipient_id,
                    donorName: userData.name,
                    donorId: userData.id,
                    description: item.description,
                    transaction_type: item.transaction_type,
                  },
                }}
                asChild
              >
                <TouchableOpacity
                  key={item.id}
                  className={`mb-4 p-4 rounded-lg border ${
                    isOffer
                      ? isSuggested
                        ? "bg-yellow-50 border-yellow-400"
                        : "bg-blue-50 border-blue-200"
                      : isSuggested
                      ? "bg-yellow-50 border-yellow-400"
                      : "bg-teal-50 border-teal-200"
                  }`}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-row items-center">
                      {isSuggested && (
                        <Ionicons
                          name="star"
                          size={18}
                          color="gold"
                          className="mr-1"
                        />
                      )}
                      <Ionicons
                        name={
                          item.transaction_type === "offer"
                            ? "gift-outline"
                            : "hand-left-outline"
                        }
                        size={20}
                        color={item.type === "offer" ? "blue" : "teal"}
                      />
                      <Text className="ml-2 font-bold text-base">
                        {capitalize(item.transaction_type)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="person-outline" size={16} color="gray" />
                      <Text className="ml-1 text-sm text-gray-600">
                        {item.name}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-800 mb-3">{item.description}</Text>

                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="gray"
                      />
                      <Text className="ml-1 text-xs text-gray-500">
                        {getRelativeTime(item.created_at)}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Text
                        className={`mr-1 text-sm ${
                          item.transaction_type === "offer"
                            ? "text-blue-600"
                            : "text-teal-600"
                        }`}
                      >
                        View Details
                      </Text>
                      <Ionicons
                        name="arrow-forward-outline"
                        size={16}
                        color={
                          item.transaction_type === "offer" ? "blue" : "teal"
                        }
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </Link>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
/*
  

  const renderMatchCard = (
    recipientInfo: Recipient,
    donorInfo: Donor,
    index: any
  ) => {
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    return (
      <View key={`match-${index}`} style={styles.urgentCard}>
        <View style={styles.combinedCardContent}>
         
          <View style={styles.cardHalf}>
            <Text style={styles.cardSectionTitle}>RECIPIENT</Text>
            <Text style={styles.cardOrganizationName}>
              {recipientInfo.name}
            </Text>
          </View>

     
          <View style={styles.cardDivider} />


          <View style={styles.cardHalf}>
            <Text style={styles.cardSectionTitle}>DONOR</Text>
            <Text style={styles.cardOrganizationName}>{donorInfo.name}</Text>
          </View>
        </View>
        <Link
          href={{
            pathname: "/details",
            params: {
              recipientName: recipientInfo.name,
              recipientId: recipientInfo.id,
              donorName: donorInfo.name,
              donorId: donorInfo.id,
            },
          }}
          asChild
        >
          <TouchableOpacity className="bg-[#3949AB] py-2 px-6 rounded-lg mt-4 self-center shadow shadow-black/10">
            <Text className="text-white font-semibold text-sm">Details</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  };
  */

/*
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white", // Changed from rgba with transparency
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#303F9F",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginLeft: 15,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#2d3748",
    height: 40,
    paddingVertical: 0,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    gap: 12,
    marginTop: 20,
  },
  metricCard: {
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: "hidden",
  },
  metricGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  smallMetricCard: {
    width: 90,
    height: 90,
  },
  primaryMetricCard: {
    width: 120,
    height: 120,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#303F9F",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#303F9F",
    textAlign: "center",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#303F9F",
    marginBottom: 16,
    marginLeft: 4,
  },
  recommendationsSection: {
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  noMatchesText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginVertical: 24,
  },
  urgentCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 0,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  combinedCardContent: {
    flexDirection: "row",
    borderRadius: 15,
    overflow: "hidden",
  },
  cardHalf: {
    flex: 1,
    padding: 16,
  },
  cardDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#666",
    marginBottom: 8,
  },
  cardOrganizationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    lineHeight: 24,
  },
  detailsButton: {
    backgroundColor: "#3949AB",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  viewMoreButton: {
    backgroundColor: "#4A4A8A",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  viewMoreButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    // Add these properties to extend to bottom
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navItem: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  navLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    width: "90%",
    maxWidth: 480,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#303F9F",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#4A5568",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  modalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    marginBottom: 24,
    width: "100%",
  },
  capacityInput: {
    flex: 1,
    fontSize: 18,
    padding: 12,
    color: "#2D3748",
  },
  unitText: {
    fontSize: 16,
    color: "#4A5568",
    fontWeight: "500",
  },
  foodTypesContainer: {
    width: "100%",
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
    paddingHorizontal: 4,
  },
  checkbox: {
    marginRight: 12,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#3949AB",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#4A5568",
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#3949AB",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
*/
