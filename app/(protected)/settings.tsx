import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  const router = useRouter();
  const [userType, setUserType] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Form states
  const [location, setLocation] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [operatingHours, setOperatingHours] = useState({});
  const [capacity, setCapacity] = useState("");
  const [establishmentType, setEstablishmentType] = useState("");
  const [donationFrequency, setDonationFrequency] = useState("");
  const [typicalDonations, setTypicalDonations] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser) return;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserData(data);
        setUserType(data.user_type);

        // Set form data based on user type
        if (data.user_type === "recipient" && data.details) {
          setLocation(data.details.location);
          setOperatingHours(data.details.operatingHours);
          setCapacity(data.details.capacity);
        } else if (data.user_type === "donor" && data.details) {
          setLocation(data.details.location);
          setOperatingHours(data.details.operatingHours);
          setEstablishmentType(data.details.establishmentType);
          setDonationFrequency(data.details.donationFrequency);
          setTypicalDonations(data.details.typicalDonations);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Error", "Failed to load user data");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser) return;

      var updateData = {};

      if (userType === "recipient") {
        updateData.details = {
          ...userData.details,
          location,
          operatingHours,
          capacity,
        };
      } else if (userType === "donor") {
        updateData.details = {
          ...userData.details,
          location,
          operatingHours,
          establishmentType,
          donationFrequency,
          typicalDonations,
        };
      }

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", authUser.id);

      if (error) throw error;

      Alert.alert("Success", "Settings updated successfully");
      setEditMode(false);
    } catch (error) {
      console.error("Error updating settings:", error);
      Alert.alert("Error", "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 bg-gray-50">
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/home")}
          >
            <Ionicons name="arrow-back" size={24} color="#303F9F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <View className="bg-white rounded-xl p-4 m-4 shadow-md">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Account Information
          </Text>
          <View className="mb-4">
            <Text className="text-sm font-medium text-indigo-600 mb-1">
              Email
            </Text>
            <Text className="text-base text-gray-700">
              {userData && userData.email ? userData.email : "Loading..."}
            </Text>
          </View>
          <View className="mb-4">
            <Text className="text-sm font-medium text-indigo-600 mb-1">
              Account Type
            </Text>
            <Text className="text-base text-indigo-600 font-semibold">
              {userType || "Loading..."}
            </Text>
          </View>
        </View>

        {!editMode ? (
          <TouchableOpacity
            className="bg-indigo-600 p-4 rounded-xl m-4 flex-row items-center justify-center shadow-md"
            onPress={() => setEditMode(true)}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color="white"
              className="mr-2"
            />
            <Text className="text-white text-base font-semibold">
              Edit Profile
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="bg-white rounded-xl p-4 m-4 shadow-md">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Edit Profile
            </Text>

            <Text className="text-sm font-medium text-indigo-600 mb-1">
              Address
            </Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-lg p-3 mb-3 text-base"
              placeholder="Street"
              value={location.street}
              onChangeText={(text) =>
                setLocation((prev) => ({ ...prev, street: text }))
              }
            />
            <TextInput
              className="bg-white border border-gray-200 rounded-lg p-3 mb-3 text-base"
              placeholder="City"
              value={location.city}
              onChangeText={(text) =>
                setLocation((prev) => ({ ...prev, city: text }))
              }
            />
            <View className="flex-row justify-between mb-3">
              <TextInput
                className="bg-white border border-gray-200 rounded-lg p-3 flex-1 mr-3 text-base"
                placeholder="State"
                value={location.state}
                maxLength={2}
                autoCapitalize="characters"
                onChangeText={(text) =>
                  setLocation((prev) => ({ ...prev, state: text }))
                }
              />
              <TextInput
                className="bg-white border border-gray-200 rounded-lg p-3 flex-2 text-base"
                placeholder="ZIP Code"
                value={location.zipCode}
                keyboardType="numeric"
                maxLength={5}
                onChangeText={(text) =>
                  setLocation((prev) => ({ ...prev, zipCode: text }))
                }
              />
            </View>

            {userType === "recipient" && (
              <>
                <Text className="text-sm font-medium text-indigo-600 mb-1">
                  Storage Capacity
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg p-3 mb-3 text-base"
                  placeholder="Storage Capacity"
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="numeric"
                />
              </>
            )}

            {userType === "donor" && (
              <>
                <Text className="text-sm font-medium text-indigo-600 mb-1">
                  Establishment Type
                </Text>
                <View className="bg-white border border-gray-200 rounded-lg mb-3">
                  <Picker
                    selectedValue={establishmentType}
                    onValueChange={setEstablishmentType}
                  >
                    <Picker.Item label="Select Type" value="" />
                    <Picker.Item label="Restaurant" value="restaurant" />
                    <Picker.Item label="Bakery" value="bakery" />
                    <Picker.Item label="Grocery Store" value="grocery" />
                    <Picker.Item label="Cafe" value="cafe" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>

                <Text className="text-sm font-medium text-indigo-600 mb-1">
                  Donation Frequency
                </Text>
                <View className="bg-white border border-gray-200 rounded-lg mb-3">
                  <Picker
                    selectedValue={donationFrequency}
                    onValueChange={setDonationFrequency}
                  >
                    <Picker.Item label="Select Frequency" value="" />
                    <Picker.Item label="Daily" value="daily" />
                    <Picker.Item label="Weekly" value="weekly" />
                    <Picker.Item label="Bi-weekly" value="biweekly" />
                    <Picker.Item label="Monthly" value="monthly" />
                    <Picker.Item label="As Available" value="asAvailable" />
                  </Picker>
                </View>

                <Text className="text-sm font-medium text-indigo-600 mb-1">
                  Typical Donations
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg p-3 h-24 text-top text-base"
                  placeholder="Typical Donation Items and Quantities"
                  value={typicalDonations}
                  onChangeText={setTypicalDonations}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}

            <TouchableOpacity
              className="bg-indigo-600 p-4 rounded-xl mx-4 mt-4 flex-row items-center justify-center shadow-md"
              onPress={handleSave}
              disabled={loading}
            >
              <Ionicons
                name="save-outline"
                size={20}
                color="white"
                className="mr-2"
              />
              <Text className="text-white text-base font-semibold">
                {loading ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          className="bg-red-600 p-4 rounded-xl m-4 flex-row items-center justify-center shadow-md"
          onPress={handleSignOut}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="white"
            className="mr-2"
          />
          <Text className="text-white text-base font-semibold">Sign Out</Text>
        </TouchableOpacity>
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
