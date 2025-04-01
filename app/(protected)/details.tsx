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
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

interface RecipientDetails {
  name?: string;
  location?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  capacity?: number;
  operatingHours?: Record<string, { available: boolean; open: string; close: string }>;
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
  operatingHours?: Record<string, { available: boolean; open: string; close: string }>;
}

// Define days in order (matching JavaScript's getDay() order: 0 = sunday)
const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/**
 * Converts a time string (e.g., "9:30 AM") to 24‑hour components.
 * If timeStr is missing or improperly formatted, returns { hours: 0, minutes: 0 }.
 */
const convertTimeTo24Hour = (timeStr?: string): { hours: number; minutes: number } => {
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
const getNextRecipientOpenDate = (operatingHours: any, donorCandidate: Date): Date | null => {
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

/**
 * Wrapper that formats the recipient open Date (if available) into a string including date and time.
 * Note: It expects the donorCloseTime (as a Date string) to be parseable.
 */
const getNextRecipientOpenTime = (operatingHours: any, donorCloseTimeStr: string): string => {
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
    recipientImage: string;
    recipientId: string;
    donorName: string;
    donorImage: string;
    donorId: string;
  }>();

  const [recipientDetails, setRecipientDetails] = useState<RecipientDetails | null>(null);
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
        const donorCloseTime = getClosestDonorClosingTime(donorDetails.operatingHours);
        const recipientNextOpen = getNextRecipientOpenTime(recipientDetails.operatingHours, donorCloseTime);
        
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
        const donorAccepted = (donorData.details.accepted_tasks || []);
        donorAccepted.push(acceptedTask);
        const { error: updateDonorError } = await supabase
          .from("users")
          .update({ details: { ...donorData.details, accepted_tasks: donorAccepted } })
          .eq("id", params.donorId);
        if (updateDonorError) throw updateDonorError;
        // Update recipient record with accepted_task entry
        const { data: recipientData, error: recipientUpdateError } = await supabase
          .from("users")
          .select("details")
          .eq("id", params.recipientId)
          .single();
        if (recipientUpdateError) throw recipientUpdateError;
        const recipientAccepted = (recipientData.details.accepted_tasks || []);
        recipientAccepted.push(acceptedTask);
        const { error: updateRecipientError } = await supabase
          .from("users")
          .update({ details: { ...recipientData.details, accepted_tasks: recipientAccepted } })
          .eq("id", params.recipientId);
        if (updateRecipientError) throw updateRecipientError;
      }
      // ... remaining decision update logic...
      Alert.alert("Success", `You have ${decisionValue ? "accepted" : "declined"} the donation.`);
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
          Details
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 bg-[#f8f9fa]">
        {/* Recipient Section */}
        <View className="p-4 mb-6">
          <Text className="text-xs font-extrabold tracking-wider text-gray-600 mb-2">
            RECIPIENT
          </Text>
          <Text className="text-2xl font-semibold text-[#2d3748] mb-4">
            {params.recipientName}
          </Text>

          <View className="bg-white rounded-xl shadow-lg shadow-black/5 mb-4 overflow-hidden">
            <Image source={{ uri: params.recipientImage }} className="w-full h-[200px]" />
          </View>

          {recipientDetails && (
            <View className="bg-white rounded-xl p-4 shadow-lg shadow-black/5">
              <View className="my-2">
                <Text className="text-xs font-bold text-[#3949AB] mb-1 uppercase tracking-wider">
                  Address
                </Text>
                <Text className="text-base text-[#4A5568] leading-6 font-medium">
                  {recipientDetails?.location
                    ? `${recipientDetails.location.street}\n${recipientDetails.location.city}, ${recipientDetails.location.state} ${recipientDetails.location.zipCode}`
                    : "No address available"}
                </Text>
              </View>

              <View className="h-[1px] bg-[#e2e8f0] my-3" />

              <View className="my-2">
                <Text className="text-xs font-bold text-[#3949AB] mb-1 uppercase tracking-wider">
                  Capacity
                </Text>
                <Text className="text-base text-[#4A5568] leading-6 font-medium">
                  {recipientDetails.capacity || "Not specified"} lbs
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Donor Section */}
        <View className="p-4 mb-6">
          <Text className="text-xs font-extrabold tracking-wider text-gray-600 mb-2">
            DONOR
          </Text>
          <Text className="text-2xl font-semibold text-[#2d3748] mb-4">
            {params.donorName}
          </Text>

          <View className="bg-white rounded-xl shadow-lg shadow-black/5 mb-4 overflow-hidden">
            <Image source={{ uri: params.donorImage }} className="w-full h-[200px]" />
          </View>

          {donorDetails && (
            <View className="bg-white rounded-xl p-4 shadow-lg shadow-black/5">
              <View className="my-2">
                <Text className="text-xs font-bold text-[#3949AB] mb-1 uppercase tracking-wider">
                  Address
                </Text>
                <Text className="text-base text-[#4A5568] leading-6 font-medium">
                  {donorDetails?.location
                    ? `${donorDetails.location.street}\n${donorDetails.location.city}, ${donorDetails.location.state} ${donorDetails.location.zipCode}`
                    : "No address available"}
                </Text>
              </View>

              <View className="h-[1px] bg-[#e2e8f0] my-3" />

              <View className="my-2">
                <Text className="text-xs font-bold text-[#3949AB] mb-1 uppercase tracking-wider">
                  Food Types Available
                </Text>
                <View className="mt-1">
                  {Object.entries(donorDetails.food_types || {}).map(
                    ([type, value]) =>
                      value && (
                        <Text
                          key={type}
                          className="text-base text-[#4A5568] leading-6 py-0.5 font-medium"
                        >
                          {type
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </Text>
                      )
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Decision Buttons */}
        <View className="flex-row justify-around my-4">
          <TouchableOpacity
            className="bg-[#4CAF50] py-3 px-6 rounded-lg"
            onPress={handleAccept}
          >
            <Text className="text-white text-base font-semibold text-center">
              Accept
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-[#F44336] py-3 px-6 rounded-lg"
            onPress={handleDecline}
          >
            <Text className="text-white text-base font-semibold text-center">
              Decline
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-[#303F9F] py-3 px-6 rounded-lg self-center mb-6"
          onPress={() => router.push("/home")}
        >
          <Text className="text-white text-base font-semibold text-center">
            Return to Home
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}