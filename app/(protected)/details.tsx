import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";

interface RecipientDetails {
  name?: string;
  location?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  capacity?: number;
  operatingHours?: Record<
    string,
    { available: boolean; open: string; close: string }
  >;
}

interface DonorDetails {
  name?: string;
  food_types?: Record<string, boolean>;
  lastUpdated?: string;
  location?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  operatingHours?: Record<
    string,
    { available: boolean; open: string; close: string }
  >;
}

// Define days in order (matching JavaScript's getDay() order: 0 = sunday)
const daysOfWeek = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Converts a time string (e.g., "9:30 AM") to 24‑hour components.
 * If timeStr is missing or improperly formatted, returns { hours: 0, minutes: 0 }.
 */
const convertTimeTo24Hour = (
  timeStr?: string
): { hours: number; minutes: number } => {
  if (!timeStr) return { hours: 0, minutes: 0 };
  const parts = timeStr.split(" ");
  if (parts.length < 2) return { hours: 0, minutes: 0 };
  const [time, modifier] = parts;
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier.toUpperCase() === "PM" && hours < 12) {
    hours += 12;
  }
  if (modifier.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }
  return { hours, minutes };
};

/**
 * Iterates over the next 7 days to find the donor's next closing Date
 * based on their operatingHours. Days marked unavailable or with blank closing times are skipped.
 * Returns a Date if found; otherwise, null.
 */
const getClosestDonorClosingDate = (operatingHours: any): Date | null => {
  if (!operatingHours) return null;
  const now = new Date();
  let dayIndex = now.getDay(); // 0 = sunday ...

  for (let i = 0; i < 7; i++) {
    const currentDay = daysOfWeek[(dayIndex + i) % 7];
    const daySchedule = operatingHours[currentDay];
    if (
      daySchedule &&
      daySchedule.available &&
      daySchedule.close &&
      daySchedule.close.trim() !== ""
    ) {
      const { hours, minutes } = convertTimeTo24Hour(daySchedule.close);
      const candidate = new Date(now);
      candidate.setDate(now.getDate() + i);
      candidate.setHours(hours, minutes, 0, 0);
      if (candidate > now) {
        return candidate;
      }
    }
  }
  return null;
};

/**
 * Wrapper that formats the donor closing Date (if available) into a string including date and time.
 */
const getClosestDonorClosingTime = (operatingHours: any): string => {
  const candidate = getClosestDonorClosingDate(operatingHours);
  return candidate
    ? candidate.toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Unavailable";
};

/**
 * Given a starting donor closing Date, iterates over the next 7 days to find the recipient's next open Date.
 * Days marked unavailable or with blank open times are skipped.
 * Returns a Date if found; otherwise, null.
 */
const getNextRecipientOpenDate = (
  operatingHours: any,
  donorCandidate: Date
): Date | null => {
  if (!operatingHours || !donorCandidate) return null;
  const now = new Date();
  // Ensure candidate is in the future – if not, start with the following day.
  const candidateDate = new Date(donorCandidate);
  if (candidateDate <= now) {
    candidateDate.setDate(candidateDate.getDate() + 1);
  }
  let dayIndex = candidateDate.getDay();

  for (let i = 0; i < 7; i++) {
    const currentDay = daysOfWeek[(dayIndex + i) % 7];
    const daySchedule = operatingHours[currentDay];
    if (
      daySchedule &&
      daySchedule.available &&
      daySchedule.open &&
      daySchedule.open.trim() !== ""
    ) {
      const { hours, minutes } = convertTimeTo24Hour(daySchedule.open);
      const candidateOpen = new Date(candidateDate);
      candidateOpen.setDate(candidateDate.getDate() + i);
      candidateOpen.setHours(hours, minutes, 0, 0);
      if (candidateOpen > candidateDate) {
        return candidateOpen;
      }
    }
  }
  return null;
};
const getRoleColor = (role) => {
  switch (role) {
    case "farmer":
      return "orange";
    case "donor":
      return "blue";
    case "recipient":
      return "green";
    default:
      return "gray";
  }
};

// Capitalize first letter
const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
/**
 * Wrapper that formats the recipient open Date (if available) into a string including date and time.
 * Note: It expects the donorCloseTime (as a Date string) to be parseable.
 */
const getNextRecipientOpenTime = (
  operatingHours: any,
  donorCloseTimeStr: string
): string => {
  // Parse the donorCloseTimeStr produced by our wrapper; ideally, it should be an ISO string.
  // Here we assume that donorCloseTimeStr is in a format that new Date() can parse.
  const donorDate = new Date(donorCloseTimeStr);
  if (isNaN(donorDate.getTime())) return "Unavailable";
  const candidate = getNextRecipientOpenDate(operatingHours, donorDate);
  return candidate
    ? candidate.toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Unavailable";
};

export default function DetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    recipientName: string;
    recipientId: string;
    donorName: string;
    donorId: string;
    transaction_type: string;
    description: string;
  }>();

  const [recipientDetails, setRecipientDetails] =
    useState<RecipientDetails | null>(null);
  const [donorDetails, setDonorDetails] = useState<DonorDetails | null>(null);

  useEffect(() => {
    fetchRecipientDetails();
    fetchDonorDetails();
  }, []);

  const fetchRecipientDetails = async () => {
    if (!params.recipientId) {
      console.error("Recipient ID is missing.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", params.recipientId)
        .single();

      if (error) throw error;
      if (data?.details) {
        setRecipientDetails(data.details as RecipientDetails);
      } else {
        console.error("Recipient not found.");
      }
    } catch (error) {
      console.error("Error fetching recipient details:", error);
    }
  };

  const fetchDonorDetails = async () => {
    if (!params.donorId) {
      console.error("Donor ID is missing.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", params.donorId)
        .single();

      if (error) throw error;
      if (data?.details) {
        setDonorDetails(data.details as DonorDetails);
      } else {
        console.error("Donor not found.");
      }
    } catch (error) {
      console.error("Error fetching donor details:", error);
    }
  };

  // Update the updateDecision function with proper error handling
  const updateDecision = async (decisionValue: boolean) => {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser) {
        Alert.alert("Error", "You must be logged in to make a decision.");
        return;
      }
      // Ensure donorDetails and recipientDetails include operatingHours.
      if (!donorDetails || !recipientDetails) {
        Alert.alert("Error", "Missing donor/recipient details.");
        return;
      }
      if (decisionValue) {
        // Compute times using the actual operating hours from Supabase.
        const donorCloseTime = getClosestDonorClosingTime(
          donorDetails.operatingHours
        );
        const recipientNextOpen = getNextRecipientOpenTime(
          recipientDetails.operatingHours,
          donorCloseTime
        );

        const acceptedTask = {
          donorId: params.donorId,
          donorName: donorDetails.name,
          recipientId: params.recipientId,
          recipientName: recipientDetails.name,
          donorClosingTime: donorCloseTime,
          recipientOpenTime: recipientNextOpen,
          timestamp: new Date().toISOString(),
        };
        // Update donor record with accepted_task entry
        const { data: donorData, error: donorUpdateError } = await supabase
          .from("users")
          .select("details")
          .eq("id", params.donorId)
          .single();
        if (donorUpdateError) throw donorUpdateError;
        const donorAccepted = donorData.details.accepted_tasks || [];
        donorAccepted.push(acceptedTask);
        const { error: updateDonorError } = await supabase
          .from("users")
          .update({
            details: { ...donorData.details, accepted_tasks: donorAccepted },
          })
          .eq("id", params.donorId);
        if (updateDonorError) throw updateDonorError;
        // Update recipient record with accepted_task entry
        const { data: recipientData, error: recipientUpdateError } =
          await supabase
            .from("users")
            .select("details")
            .eq("id", params.recipientId)
            .single();
        if (recipientUpdateError) throw recipientUpdateError;
        const recipientAccepted = recipientData.details.accepted_tasks || [];
        recipientAccepted.push(acceptedTask);
        const { error: updateRecipientError } = await supabase
          .from("users")
          .update({
            details: {
              ...recipientData.details,
              accepted_tasks: recipientAccepted,
            },
          })
          .eq("id", params.recipientId);
        if (updateRecipientError) throw updateRecipientError;
      }
      // ... remaining decision update logic...
      Alert.alert(
        "Success",
        `You have ${decisionValue ? "accepted" : "declined"} the donation.`
      );
      router.push("/home");
    } catch (error) {
      console.error("Error updating decision:", error);
      Alert.alert("Error", "There was an error submitting your decision.");
    }
  };

  const handleAccept = () => {
    updateDecision(true);
  };

  const handleDecline = () => {
    updateDecision(false);
  };

  const isOffer = params.transaction_type === "offer";
  const mainColor = isOffer ? "blue" : "teal";
  const mainColorHex = isOffer ? "#3949AB" : "#0D9488";
  const secondaryColorHex = isOffer ? "#7986CB" : "#5EEAD4";

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Gradient */}

      {/* Content */}
      <ScrollView className="flex-1 bg-gray-50">
        {/* Transaction Banner */}
        <View
          className={`bg-${mainColor}-50 p-4 border-b border-${mainColor}-100`}
        >
          <View className="flex-row items-center mb-2">
            <View className={`bg-${mainColor}-100 rounded-full p-2 mr-3`}>
              <Ionicons
                name={isOffer ? "gift-outline" : "hand-left-outline"}
                size={20}
                color={mainColorHex}
              />
            </View>
            <Text className={`text-${mainColor}-700 font-bold text-lg`}>
              {capitalize(params.transaction_type || "Unknown")}
            </Text>
          </View>
          <Text className="text-gray-800 text-base">
            {params.description || "No description provided"}
          </Text>
        </View>

        {/* Main Content Container */}
        <View className="p-4">
          {/* Map Section */}
          <View className="bg-white rounded-xl overflow-hidden shadow-lg mb-6">
            <View className="h-[200px] w-full">
              <MapView
                provider={PROVIDER_DEFAULT}
                style={{ height: "100%", width: "100%" }}
                initialRegion={{
                  latitude: 40.5169,
                  longitude: -74.4063,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
              >
                {donorDetails?.location && (
                  <Marker
                    coordinate={{
                      latitude: donorDetails.location.coordinates.latitude,
                      longitude: donorDetails.location.coordinates.longitude,
                    }}
                    title={donorDetails.name || "Donor"}
                    description={donorDetails.location.street}
                    pinColor="blue"
                  >
                    <View className="bg-blue-600 p-2 rounded-full">
                      <Ionicons name="basket-outline" size={16} color="white" />
                    </View>
                  </Marker>
                )}

                {recipientDetails?.location && (
                  <Marker
                    coordinate={{
                      latitude: recipientDetails.location.coordinates.latitude,
                      longitude:
                        recipientDetails.location.coordinates.longitude,
                    }}
                    title={recipientDetails.name || "Recipient"}
                    description={recipientDetails.location.street}
                    pinColor="green"
                  >
                    <View className="bg-green-600 p-2 rounded-full">
                      <Ionicons name="home-outline" size={16} color="white" />
                    </View>
                  </Marker>
                )}
              </MapView>
            </View>

            {/* Distance and Time Information */}
            <View className="p-4 border-t border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons
                    name="navigate-outline"
                    size={20}
                    color={mainColorHex}
                  />
                  <Text className="ml-2 text-gray-700 font-medium">
                    Distance:
                  </Text>
                  <Text className="ml-2 text-gray-900 font-bold">
                    {"15.7"} miles
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="car-outline" size={20} color={mainColorHex} />
                  <Text className="ml-2 text-gray-700 font-medium">
                    Drive time:
                  </Text>
                  <Text className="ml-2 text-gray-900 font-bold">
                    {"34 mins"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recipient Section */}
          <View className="mb-6 bg-white rounded-xl overflow-hidden shadow-lg">
            <LinearGradient
              colors={["#4CAF50", "#81C784"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-4 py-3"
            >
              <View className="flex-row items-center p-2">
                <Ionicons name="home-outline" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  RECIPIENT
                </Text>
              </View>
            </LinearGradient>

            <View className="p-4">
              <Text className="text-xl font-semibold text-gray-800 mb-3">
                {recipientDetails?.name || "Unknown Recipient"}
              </Text>

              {recipientDetails && (
                <View>
                  <View className="mb-4">
                    <View className="flex-row items-center mb-1">
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color="#4CAF50"
                      />
                      <Text className="ml-2 text-sm font-bold text-gray-600 uppercase">
                        Address
                      </Text>
                    </View>
                    <Text className="text-base text-gray-700 ml-6">
                      {recipientDetails.location
                        ? `${recipientDetails.location.street}\n${recipientDetails.location.city}, ${recipientDetails.location.state} ${recipientDetails.location.zipCode}`
                        : "No address available"}
                    </Text>
                  </View>

                  <View className="h-[1px] bg-gray-200 my-3" />

                  <View>
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="cube-outline" size={18} color="#4CAF50" />
                      <Text className="ml-2 text-sm font-bold text-gray-600 uppercase">
                        Capacity
                      </Text>
                    </View>
                    <Text className="text-base text-gray-700 ml-6">
                      {recipientDetails.capacity || "700"} lbs
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Donor Section */}
          <View className="mb-6 bg-white rounded-xl overflow-hidden shadow-lg">
            <LinearGradient
              colors={["#1E88E5", "#64B5F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-4 py-3"
            >
              <View className="flex-row items-center p-2">
                <Ionicons name="basket-outline" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">DONOR</Text>
              </View>
            </LinearGradient>

            <View className="p-4">
              <Text className="text-xl font-semibold text-gray-800 mb-3">
                {donorDetails?.name || "Unknown Donor"}
              </Text>

              {donorDetails && (
                <View>
                  <View className="mb-4">
                    <View className="flex-row items-center mb-1">
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color="#1E88E5"
                      />
                      <Text className="ml-2 text-sm font-bold text-gray-600 uppercase">
                        Address
                      </Text>
                    </View>
                    <Text className="text-base text-gray-700 ml-6">
                      {donorDetails.location
                        ? `${donorDetails.location.street}\n${donorDetails.location.city}, ${donorDetails.location.state} ${donorDetails.location.zipCode}`
                        : "No address available"}
                    </Text>
                  </View>

                  <View className="h-[1px] bg-gray-200 my-3" />

                  <View>
                    <View className="flex-row items-center mb-1">
                      <Ionicons
                        name="nutrition-outline"
                        size={18}
                        color="#1E88E5"
                      />
                      <Text className="ml-2 text-sm font-bold text-gray-600 uppercase">
                        Food Types Available
                      </Text>
                    </View>
                    <View className="mt-1 ml-6 flex-row flex-wrap">
                      {["Kosher", "Vegetarian", "Gluten-free"].map(
                        ([type, value]) =>
                          value && (
                            <View
                              key={type}
                              className="bg-blue-50 rounded-full px-3 py-1 mb-2 mr-2"
                            >
                              <Text className="text-sm text-blue-700">
                                {type}
                              </Text>
                            </View>
                          )
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Timing Information */}
          {donorDetails?.operatingHours && recipientDetails?.operatingHours && (
            <View className="mb-6 bg-white rounded-xl overflow-hidden shadow-lg">
              <LinearGradient
                colors={[mainColorHex, secondaryColorHex]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-4 py-3"
              >
                <View className="flex-row items-center p-2">
                  <Ionicons name="time-outline" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    TIMING INFORMATION
                  </Text>
                </View>
              </LinearGradient>

              <View className="p-4">
                <View className="mb-4">
                  <View className="flex-row items-center mb-1">
                    <Ionicons
                      name="close-circle-outline"
                      size={18}
                      color={mainColorHex}
                    />
                    <Text className="ml-2 text-sm font-bold text-gray-600 uppercase">
                      Donor Closing Time
                    </Text>
                  </View>
                  <Text className="text-base text-gray-700 ml-6">
                    {"5/4/2025 7:00 PM"}
                  </Text>
                </View>

                <View className="h-[1px] bg-gray-200 my-3" />

                <View>
                  <View className="flex-row items-center mb-1">
                    <Ionicons
                      name="open-outline"
                      size={18}
                      color={mainColorHex}
                    />
                    <Text className="ml-2 text-sm font-bold text-gray-600 uppercase">
                      Recipient Next Available
                    </Text>
                  </View>
                  <Text className="text-base text-gray-700 ml-6">
                    {"5/5/2025 9:00 AM"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Decision Buttons */}
          <View className="flex-row justify-around my-6">
            <TouchableOpacity
              className="bg-green-500 py-4 px-8 rounded-lg flex-row items-center shadow-md"
              onPress={handleAccept}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="white"
              />
              <Text className="text-white text-base font-semibold text-center ml-2">
                Accept
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-500 py-4 px-8 rounded-lg flex-row items-center shadow-md"
              onPress={handleDecline}
            >
              <Ionicons name="close-circle-outline" size={20} color="white" />
              <Text className="text-white text-base font-semibold text-center ml-2">
                Decline
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`bg-${mainColor}-600 py-4 px-8 rounded-lg flex-row items-center justify-center self-center mb-8 shadow-md`}
            onPress={() => router.push("/marketplace")}
          >
            <Ionicons
              name="arrow-back-circle-outline"
              size={20}
              color="white"
            />
            <Text className="text-white text-base font-semibold text-center ml-2">
              Return to Marketplace
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
