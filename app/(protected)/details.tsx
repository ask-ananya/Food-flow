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
  location?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  capacity?: number;
}

interface DonorDetails {
  food_types?: Record<string, boolean>;
  lastUpdated?: string;
  location?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

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

      const { data, error } = await supabase
        .from("users")
        .select("decisions")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      const decisions = data?.decisions || [];
      const newDecision = {
        recipient: params.recipientId,
        donor: params.donorId,
        decision: decisionValue,
        timestamp: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("users")
        .update({ decisions: [...decisions, newDecision] })
        .eq("id", authUser.id);

      if (updateError) throw updateError;

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