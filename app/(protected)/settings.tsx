import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

type UserType = "donor" | "recipient" | "farmer" | null;

interface LocationType {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface UserDetails {
  location: LocationType;
  operatingHours: Record<string, any>;
  capacity?: string;
  establishmentType?: string;
  donationFrequency?: string;
  typicalDonations?: string;
  area?: string;
}

interface UserData {
  id: string;
  email: string;
  user_type: UserType;
  details: UserDetails;
}

export default function Settings() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Form states with proper types
  const [location, setLocation] = useState<LocationType>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [operatingHours, setOperatingHours] = useState<Record<string, any>>({});
  const [capacity, setCapacity] = useState("");
  const [area, setArea] = useState(""); // Added for farmer type, if needed
  const [establishmentType, setEstablishmentType] = useState("");
  const [donationFrequency, setDonationFrequency] = useState("");
  const [typicalDonations, setTypicalDonations] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  // Improved error handling in loadUserData
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
      if (!data) throw new Error("No user data found");

      setUserData(data as UserData);
      setUserType(data.user_type as UserType);

      if (data.details) {
        setLocation(
          data.details.location || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
          }
        );
        setOperatingHours(data.details.operatingHours || {});

        if (data.user_type === "recipient") {
          setCapacity(data.details.capacity || "");
        } else if (data.user_type === "donor") {
          setEstablishmentType(data.details.establishmentType || "");
          setDonationFrequency(data.details.donationFrequency || "");
          setTypicalDonations(data.details.typicalDonations || "");
        } else {
          setArea(data.details.area || ""); // For farmer type, if needed
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load user data"
      );
    }
  };

  // Improved handleSave with validation
  const handleSave = async () => {
    try {
      // Basic validation
      if (
        !location.street ||
        !location.city ||
        !location.state ||
        !location.zipCode
      ) {
        Alert.alert("Error", "Please fill in all address fields");
        return;
      }

      if (userType === "recipient" && !capacity) {
        Alert.alert("Error", "Please enter storage capacity");
        return;
      }

      if (userType === "donor" && (!establishmentType || !donationFrequency)) {
        Alert.alert(
          "Error",
          "Please select establishment type and donation frequency"
        );
        return;
      }

      setLoading(true);

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw new Error(authError.message);
      if (!authUser) {
        router.push("/sign-in");
        return;
      }

      const updateData = {
        details: {
          ...userData?.details,
          location,
          operatingHours,
          ...(userType === "recipient" ? { capacity } : {}),
          ...(userType === "donor"
            ? {
                establishmentType,
                donationFrequency,
                typicalDonations,
              }
            : {}),
          ...(userType === "farmer" ? { area } : {}),
        },
      };

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", authUser.id);

      if (error) throw new Error(error.message);

      Alert.alert("Success", "Settings updated successfully");
      setEditMode(false);
      await loadUserData(); // Reload user data after successful update
    } catch (error) {
      console.error("Error updating settings:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update settings"
      );
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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between p-5 bg-white border-b border-gray-200 shadow">
          <TouchableOpacity
            className="p-2 rounded-full bg-white/80"
            onPress={() => router.push("/home")}
          >
            <Ionicons name="arrow-back" size={24} color="#303F9F" />
          </TouchableOpacity>
          <Text className="flex-1 text-2xl font-bold text-[#303F9F] text-center -ml-6">
            Settings
          </Text>
          <View className="w-6" />
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
              {userType
                ? userType === "donor"
                  ? "Donor"
                  : userType === "recipient"
                  ? "Recipient"
                  : "Farmer"
                : "Loading..."}
            </Text>
          </View>
        </View>

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

          {userType === "farmer" && (
            <>
              <Text className="text-sm font-medium text-indigo-600 mb-1">
                Area
              </Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-lg p-3 mb-3 text-base"
                placeholder="Area"
                value={area}
                onChangeText={setArea}
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
        </View>

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
        <TouchableOpacity
          className="bg-[#7911ba] p-4 rounded-xl m-4 flex-row items-center justify-center shadow-md"
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
