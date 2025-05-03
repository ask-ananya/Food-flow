import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
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
  const [location, setLocation] = useState<LocationType>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [operatingHours, setOperatingHours] = useState<Record<string, any>>({});
  const [capacity, setCapacity] = useState("");
  const [area, setArea] = useState("");
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

      setUserData(data as UserData);
      setUserType(data.user_type as UserType);

      if (data.details) {
        setLocation(data.details.location || location);
        setOperatingHours(data.details.operatingHours || {});
        if (data.user_type === "recipient") {
          setCapacity(data.details.capacity || "");
        } else if (data.user_type === "donor") {
          setEstablishmentType(data.details.establishmentType || "");
          setDonationFrequency(data.details.donationFrequency || "");
          setTypicalDonations(data.details.typicalDonations || "");
        } else {
          setArea(data.details.area || "");
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

  const handleSave = async () => {
    try {
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
            ? { establishmentType, donationFrequency, typicalDonations }
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
      await loadUserData();
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
      <ScrollView className="flex-1 p-4 py-2">
        {/* Header */}

        {/* Account Info */}
        <View className="bg-indigo-50 rounded-xl py-6 my-4 mb-2 shadow-lg mx-0">
          <View className="px-4">
            <View className="flex-row items-center mb-4">
              <Ionicons
                name="person-circle-outline"
                size={20}
                color="#4F46E5"
                className="mr-2"
              />
              <Text className="text-xl font-semibold text-indigo-700">
                Account Information
              </Text>
            </View>
            <Text className="text-sm font-medium text-indigo-600 mb-1">
              Email
            </Text>
            <Text className="text-base text-gray-800 mb-4">
              {userData?.email ?? "Loading..."}
            </Text>
            <Text className="text-sm font-medium text-indigo-600 mb-1">
              Account Type
            </Text>
            <Text className="text-base font-semibold text-indigo-800">
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

        {/* Edit Profile */}
        <View className="bg-teal-50 rounded-xl py-6 my-4 shadow-lg mx-0">
          <View className="px-4">
            <View className="flex-row items-center mb-4">
              <Ionicons
                name="pencil-outline"
                size={20}
                color="#047857"
                className="mr-2"
              />
              <Text className="text-xl font-semibold text-teal-700">
                Edit Profile
              </Text>
            </View>

            {/* Address */}
            <Text className="text-sm font-medium text-teal-600 mb-1">
              Street
            </Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-lg p-3 mb-2 text-base h-12 pt-1"
              placeholder="Street"
              value={location.street}
              onChangeText={(text) =>
                setLocation((prev) => ({ ...prev, street: text }))
              }
            />

            <Text className="text-sm font-medium text-teal-600 mb-1">City</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-lg p-3 mb-2 text-base h-12 pt-1"
              placeholder="City"
              value={location.city}
              onChangeText={(text) =>
                setLocation((prev) => ({ ...prev, city: text }))
              }
            />

            <View className="flex-row justify-between mb-2">
              <View className="flex-1 mr-2">
                <Text className="text-sm font-medium text-teal-600 mb-1">
                  State
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg p-3 text-base h-12 pt-1"
                  placeholder="ST"
                  value={location.state}
                  maxLength={2}
                  autoCapitalize="characters"
                  onChangeText={(text) =>
                    setLocation((prev) => ({ ...prev, state: text }))
                  }
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-teal-600 mb-1">
                  ZIP Code
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg p-3 text-base h-12 pt-1"
                  placeholder="ZIP Code"
                  value={location.zipCode}
                  keyboardType="numeric"
                  maxLength={5}
                  onChangeText={(text) =>
                    setLocation((prev) => ({ ...prev, zipCode: text }))
                  }
                />
              </View>
            </View>

            {userType === "recipient" && (
              <>
                <Text className="text-sm font-medium text-teal-600 mb-1">
                  Storage Capacity
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg p-3 mb-2 text-base h-12 pt-1"
                  placeholder="e.g. 100 sq ft"
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="numeric"
                />
              </>
            )}

            {userType === "farmer" && (
              <>
                <Text className="text-sm font-medium text-teal-600 mb-1">
                  Area
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg p-3 mb-2 text-base h-12 pt-1"
                  placeholder="Area"
                  value={area}
                  onChangeText={setArea}
                  keyboardType="numeric"
                />
              </>
            )}

            {userType === "donor" && (
              <>
                <Text className="text-sm font-medium text-teal-600 mb-1">
                  Establishment Type
                </Text>
                <View className="bg-white border border-gray-200 rounded-lg mb-2 overflow-hidden">
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

                <Text className="text-sm font-medium text-teal-600 mb-1">
                  Donation Frequency
                </Text>
                <View className="bg-white border border-gray-200 rounded-lg mb-2 overflow-hidden">
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

                <Text className="text-sm font-medium text-teal-600 mb-1">
                  Typical Donations
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg p-3 h-24 text-base text-top mb-2 "
                  placeholder="Items & quantities"
                  value={typicalDonations}
                  onChangeText={setTypicalDonations}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          className="bg-indigo-600 py-4 my-2 rounded-xl flex-row items-center justify-center mx-0 shadow-md"
          onPress={handleSave}
          disabled={loading}
        >
          <Ionicons
            name="save-outline"
            size={20}
            color="white"
            className="mr-2"
          />
          <Text className="text-white font-semibold text-base">
            {loading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-teal-600 py-4 my-2 rounded-xl flex-row items-center justify-center mx-0 shadow-md"
          onPress={handleSignOut}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="white"
            className="mr-2"
          />
          <Text className="text-white font-semibold text-base">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
