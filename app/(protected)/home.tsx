import {
  SafeAreaView,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Ionicons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { router, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

interface FoodTypes {
  dairyFree: boolean;
  glutenFree: boolean;
  halal: boolean;
  kosher: boolean;
  vegan: boolean;
  vegetarian: boolean;
}

interface Location {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface UserDetails {
  name: string;
  location: Location;
  current_capacity?: number;
  food_types?: FoodTypes;
  last_updated?: string;
  public?: boolean;
}

interface User {
  id: string;
  email: string;
  user_type: 'donor' | 'recipient' | 'individual';
  details: UserDetails;
}

interface MatchedUser {
  id: string;
  name: string;
}

export default function MainPage() {
  const [isPublicDonor, setIsPublicDonor] = useState<boolean>(false);
  const [donorList, setDonorList] = useState<MatchedUser[]>([]);
  const [recipientModalVisible, setRecipientModalVisible] = useState<boolean>(false);
  const [donorModalVisible, setDonorModalVisible] = useState<boolean>(false);
  const [capacity, setCapacity] = useState<string>("");
  const [isPublicRecipient, setIsPublicRecipient] = useState<boolean>(false);
  const [foodTypes, setFoodTypes] = useState<FoodTypes>({
    dairyFree: false,
    glutenFree: false,
    halal: false,
    kosher: false,
    vegan: false,
    vegetarian: false,
  });

  const [recipientList, setRecipientList] = useState<MatchedUser[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  const [userType, setUserType] = useState<'donor' | 'recipient' | 'individual' | null>(null);

  useEffect(() => {
    checkUserTypeAndShowPopup();
    checkIfPublicRecipient();
    //loadPublicRecipients();
    //loadPublicDonors();
    checkIfPublicDonor();
    loadMatches();
  }, []);

  const checkIfPublicDonor = async (): Promise<void> => {
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

      setIsPublicDonor(data.public && data.user_type === "donor");
    } catch (error) {
      console.error("Error checking public donor status:", error);
    }
  };

  const loadPublicDonors = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_type", "donor")
        .eq("public", true);

      if (error) throw error;
      setDonorList(data.map(({ id, details: { name } }: User) => ({ id, name })));
    } catch (error) {
      console.error("Error loading public donors:", error);
    }
  };

  const checkIfPublicRecipient = async () => {
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

      setIsPublicRecipient(data.public && data.user_type === "recipient");
    } catch (error) {
      console.error("Error checking public recipient status:", error);
    }
  };

  const loadPublicRecipients = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_type", "recipient")
      .eq("public", true);

    if (error) throw error;
    setRecipientList(data);
    console.log(data);
  };

  const checkUserTypeAndShowPopup = async () => {
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

      const usertype = data.user_type;
      setUserType(usertype);

      if (usertype === "recipient") {
        setRecipientModalVisible(true);
      } else if (usertype === "donor") {
        setDonorModalVisible(true);
      }
    } catch (error) {
      console.error("Error checking user type:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmitRecipient = async (): Promise<void> => {
    if (!capacity) return;

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser) return;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      const updateObj: UserDetails = {
        ...data.details,
        current_capacity: Number(capacity),
        last_updated: new Date().toISOString(),
        public: isPublicRecipient,
      };

      const { error: updateError } = await supabase
        .from("users")
        .update({ details: updateObj })
        .eq("id", authUser.id);

      if (updateError) throw updateError;

      setRecipientModalVisible(false);
      setCapacity("");
      await loadPublicRecipients();
    } catch (error) {
      console.error("Error updating recipient details:", error);
    }
  };

  const handleSubmitDonor = async (): Promise<void> => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser) return;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      const updateObj: UserDetails = {
        ...data.details,
        food_types: foodTypes,
        last_updated: new Date().toISOString(),
        public: isPublicDonor,
      };

      const { error: updateError } = await supabase
        .from("users")
        .update({ details: updateObj })
        .eq("id", authUser.id);

      if (updateError) throw updateError;

      setDonorModalVisible(false);
      setFoodTypes({
        dairyFree: false,
        glutenFree: false,
        halal: false,
        kosher: false,
        vegan: false,
        vegetarian: false,
      });
      await loadPublicDonors();
    } catch (error) {
      console.error("Error updating donor details:", error);
    }
  };

  const loadMatches = async () => {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authUser) return;

    let recs = [],
      dons = [];
    let data = await (
      await fetch(
        `https://matching-79369524935.us-east1.run.app/${authUser.id}`
      )
    ).json();
    
    for (let i = 0; i < data.length; i++) {
      const { data: recipientData, error: error1 } = await supabase
        .from("users")
        .select("*")
        .eq("id", data[i][1])
        .single();

      const { data: donorData, error: error2 } = await supabase
        .from("users")
        .select("*")
        .eq("id", data[i][0])
        .single();
      if (error1) throw error1;
      if (error2) throw error2;
      if (recipientData && donorData) {
        recs.push({ id: recipientData.id, name: recipientData.details.name });
        dons.push({ id: donorData.id, name: donorData.details.name });
      }
    }
    console.log(recs, dons);
    setRecipientList(recs);
    setDonorList(dons);
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={["#E8EAF6", "#C5CAE9"]}
        className="absolute left-0 right-0 top-0 w-full h-full"
      />
      <SafeAreaView className="flex-1">
        <LinearGradient
          colors={["#ffffff", "#E8EAF6"]}
          className="absolute left-0 right-0 top-0 w-full h-full"
        />
        {/* Header Section */}
        <View className="flex-row justify-between items-center p-5 bg-white/95 border-b border-b-[#E2E8F0] shadow-sm z-10">
          <Text className="text-2xl font-bold text-[#303F9F]">FoodFlow</Text>
          <View className="flex-row items-center">
            <Ionicons
              name="person-circle-outline"
              size={30}
              color="black"
              className="ml-4"
            />
            <Ionicons
              name="notifications-outline"
              size={24}
              color="black"
              className="ml-4"
            />
          </View>
        </View>

        <View className="flex-1 p-4">
          {/* Input Section */}
          <View className="flex-row items-center bg-[#F7FAFC] rounded-xl border border-[#E2E8F0] px-4">
            <Ionicons name="location-outline" size={20} color="gray" />
            <TextInput
              className="flex-1 ml-2.5 text-base text-[#2d3748] h-10"
              placeholder="Make a donation today..."
              placeholderTextColor="gray"
              selectionColor="#3949AB"
            />
          </View>

          {/* Recommendations Section */}
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "flex-end",
            }}
          >
            {/* Metrics Section */}
            <View className="flex-row justify-center items-center my-2.5 mb-8 px-4 gap-3">
              <View className="rounded-xl shadow-lg shadow-black/15 m-2 bg-white/90">
                <LinearGradient
                  colors={["#E8EAF6", "#C5CAE9"]}
                  className="w-full h-full rounded-xl justify-center items-center p-3 w-[90px] h-[90px]"
                >
                  <Text className="text-2xl font-bold text-[#303F9F] mb-1">0</Text>
                  <Text className="text-xs text-[#303F9F] text-center font-medium">
                    Donation{"\n"}Spots
                  </Text>
                </LinearGradient>
              </View>
              <View className="rounded-xl shadow-lg shadow-black/15 m-2 bg-white/90">
                <LinearGradient
                  colors={["#303F9F", "#3949AB"]}
                  className="w-full h-full rounded-xl justify-center items-center p-4 w-[120px] h-[120px]"
                >
                  <Text className="text-2xl font-bold text-white mb-1">0</Text>
                  <Text className="text-xs text-white text-center font-medium">
                    Total Donations
                  </Text>
                </LinearGradient>
              </View>
              <View className="rounded-xl shadow-lg shadow-black/15 m-2 bg-white/90">
                <LinearGradient
                  colors={["#E8EAF6", "#C5CAE9"]}
                  className="w-full h-full rounded-xl justify-center items-center p-3 w-[90px] h-[90px]"
                >
                  <Text className="text-2xl font-bold text-[#303F9F] mb-1">0</Text>
                  <Text className="text-xs text-[#303F9F] text-center font-medium">
                    Drivers{"\n"}Nearby
                  </Text>
                </LinearGradient>
              </View>
            </View>

            {/* Space Between Sections */}
            <View className="flex-1" />

            {userType != null ? (
              <>
                {userType === "individual" ? (
                  <View className="flex-1 mx-4 mb-20">
                    {loading ? (
                      <>
                        <View className="flex flex-row w-full justify-center">
                          <Progress.Circle size={25} indeterminate={true} />
                          <Text>Getting matches...</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        {/* First Card - Combined Recipient and Donor */}
                        {(recipientList.length > 0 || donorList.length > 0) && (
                          <View className="bg-white rounded-2xl my-2.5 p-4 shadow-lg shadow-black/12 -translate-y-0.5 border border-white/80">
                            <View className="flex-row rounded-xl overflow-hidden">
                              {/* Recipient Section */}
                              {recipientList.length > 0 && (
                                <View className="flex-1 p-4">
                                  <Text className="text-xs font-extrabold tracking-wider text-gray-600 mb-2">
                                    RECIPIENT
                                  </Text>
                                  <Text className="text-base font-semibold text-[#2d3748] leading-6">
                                    {recipientList[0]?.name}
                                  </Text>
                                </View>
                              )}

                              {/* Divider */}
                              <View className="w-px bg-[#e2e8f0] my-4" />

                              {/* Donor Section */}
                              {donorList.length > 0 && (
                                <View className="flex-1 p-4">
                                  <Text className="text-xs font-extrabold tracking-wider text-gray-600 mb-2">
                                    DONOR
                                  </Text>
                                  <Text className="text-base font-semibold text-[#2d3748] leading-6">
                                    {donorList[0]?.name}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <TouchableOpacity
                              className="bg-[#3949AB] py-2 px-6 rounded-lg mt-4 self-center shadow shadow-black/10"
                              onPress={() =>
                                router.push({
                                  pathname: "/details",
                                  params: {
                                    recipientName: recipientList[0].name,
                                    recipientId: recipientList[0].id,
                                    donorName: donorList[0].name,
                                    donorId: donorList[0].id,
                                  },
                                })
                              }
                            >
                              <Text className="text-white font-semibold text-sm">
                                Details
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        {/* First Card - Combined Recipient and Donor */}
                        {(recipientList.length > 1 || donorList.length > 1) && (
                          <View className="bg-white rounded-2xl my-2.5 p-4 shadow-lg shadow-black/12 -translate-y-0.5 border border-white/80">
                            <View className="flex-row rounded-xl overflow-hidden">
                              {/* Recipient Section */}
                              {recipientList.length > 0 && (
                                <View className="flex-1 p-4">
                                  <Text className="text-xs font-extrabold tracking-wider text-gray-600 mb-2">
                                    RECIPIENT
                                  </Text>
                                  <Text className="text-base font-semibold text-[#2d3748] leading-6">
                                    {recipientList[1]?.name}
                                  </Text>
                                </View>
                              )}

                              {/* Divider */}
                              <View className="w-px bg-[#e2e8f0] my-4" />

                              {/* Donor Section */}
                              {donorList.length > 0 && (
                                <View className="flex-1 p-4">
                                  <Text className="text-xs font-extrabold tracking-wider text-gray-600 mb-2">
                                    DONOR
                                  </Text>
                                  <Text className="text-base font-semibold text-[#2d3748] leading-6">
                                    {donorList[1]?.name}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <TouchableOpacity
                              className="bg-[#3949AB] py-2 px-6 rounded-lg mt-4 self-center shadow shadow-black/10"
                              onPress={() =>
                                router.push({
                                  pathname: "/details",
                                  params: {
                                    recipientName: recipientList[1].name,
                                    recipientId: recipientList[1].id,
                                    donorName: donorList[1].name,
                                    donorId: donorList[1].id,
                                  },
                                })
                              }
                            >
                              <Text className="text-white font-semibold text-sm">
                                Details
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        {/* View More Recommendations Button */}
                        {recipientList.length > 2 && (
                          <TouchableOpacity className="bg-[#4A4A8A] py-2.5 px-5 rounded items-center my-2.5 mb-8">
                            <Text className="text-white font-bold text-sm">
                              View {recipientList.length - 2} more
                              recommendations...
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                ) : (
                  <>
                    <View className="bg-white rounded-2xl my-2.5 p-4 shadow-lg shadow-black/12 -translate-y-0.5 border border-white/80 mx-4">
                      <View className="flex-row rounded-xl overflow-hidden">
                        {/* Recipient Section */}
                        <View className="flex-1 p-4">
                          <Text className="text-xs font-extrabold tracking-wider text-gray-600 mb-2">
                            {userType === "donor" ? "Recipient" : "Donor"}
                          </Text>
                          <Text className="text-base font-semibold text-[#2d3748] leading-6">
                            Edison Pepper Farms
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        className="bg-[#3949AB] py-2 px-6 rounded-lg mt-4 self-center shadow shadow-black/10"
                        onPress={() =>
                          router.push({
                            pathname: "/details",
                            params: {
                              recipientName: recipientList[0].name,
                              recipientId: recipientList[0].id,
                              donorName: donorList[0].name,
                              donorId: donorList[0].id,
                            },
                          })
                        }
                      >
                        <Text className="text-white font-semibold text-sm">Details</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="bg-white rounded-2xl my-2.5 p-4 shadow-lg shadow-black/12 -translate-y-0.5 border border-white/80 mx-4">
                      <View className="flex-row rounded-xl overflow-hidden">
                        {/* Recipient Section */}
                        <View className="flex-1 p-4">
                          <Text className="text-xs font-extrabold tracking-wider text-gray-600 mb-2">
                            {userType === "donor" ? "Recipient" : "Donor"}
                          </Text>
                          <Text className="text-base font-semibold text-[#2d3748] leading-6">
                            Edison Pepper Farms
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        className="bg-[#3949AB] py-2 px-6 rounded-lg mt-4 self-center shadow shadow-black/10"
                        onPress={() =>
                          router.push({
                            pathname: "/details",
                            params: {
                              recipientName: recipientList[0].name,
                              recipientId: recipientList[0].id,
                              donorName: donorList[0].name,
                              donorId: donorList[0].id,
                            },
                          })
                        }
                      >
                        <Text className="text-white font-semibold text-sm">Details</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="bg-white rounded-2xl my-2.5 p-4 shadow-lg shadow-black/12 -translate-y-0.5 border border-white/80 mx-4">
                      <View className="flex-row rounded-xl overflow-hidden">
                        {/* Recipient Section */}
                        <View className="flex-1 p-4">
                          <Text className="text-xs font-extrabold tracking-wider text-gray-600 mb-2">
                            {userType === "donor" ? "Recipient" : "Donor"}
                          </Text>
                          <Text className="text-base font-semibold text-[#2d3748] leading-6">
                            Edison Pepper Farms
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        className="bg-[#3949AB] py-2 px-6 rounded-lg mt-4 self-center shadow shadow-black/10"
                        onPress={() =>
                          router.push({
                            pathname: "/details",
                            params: {
                              recipientName: recipientList[0].name,
                              recipientId: recipientList[0].id,
                              donorName: donorList[0].name,
                              donorId: donorList[0].id,
                            },
                          })
                        }
                      >
                        <Text className="text-white font-semibold text-sm">Details</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="bg-white rounded-2xl my-2.5 p-4 shadow-lg shadow-black/12 -translate-y-0.5 border border-white/80 mx-4">
                      <View className="flex-row rounded-xl overflow-hidden">
                        {/* Recipient Section */}
                        <View className="flex-1 p-4">
                          <Text className="text-xs font-extrabold tracking-wider text-gray-600 mb-2">
                            {userType === "donor" ? "Recipient" : "Donor"}
                          </Text>
                          <Text className="text-base font-semibold text-[#2d3748] leading-6">
                            Edison Pepper Farms
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        className="bg-[#3949AB] py-2 px-6 rounded-lg mt-4 self-center shadow shadow-black/10"
                        onPress={() =>
                          router.push({
                            pathname: "/details",
                            params: {
                              recipientName: recipientList[0].name,
                              recipientId: recipientList[0].id,
                              donorName: donorList[0].name,
                              donorId: donorList[0].id,
                            },
                          })
                        }
                      >
                        <Text className="text-white font-semibold text-sm">Details</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            ) : (
              <View className="flex flex-row w-full justify-center">
                <Progress.Circle size={25} indeterminate={true} />
                <Text>Loading...</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Recipient Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={recipientModalVisible}
          onRequestClose={() => setRecipientModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setRecipientModalVisible(false)} 
            className="flex-1 bg-black/50 justify-center items-center"
          >
            <View 
              className="m-5 bg-white rounded-2xl p-8 items-center shadow-md shadow-black/25 w-4/5"
              onStartShouldSetResponder={() => true}
            >
              <Text className="text-2xl font-bold text-[#303F9F] mb-2 text-center">
                Storage Capacity
              </Text>
              <Text className="text-base text-[#4A5568] mb-6 text-center leading-5">
                Please enter your current food storage capacity
              </Text>

              <View className="flex-row items-center bg-[#F7FAFC] rounded-xl border border-[#E2E8F0] px-4 mb-6 w-full">
                <TextInput
                  className="flex-1 text-lg p-3 text-[#2D3748]"
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholder="Enter capacity in square feet"
                  keyboardType="numeric"
                  placeholderTextColor="#A0AEC0"
                />
                <Text className="text-base text-[#4A5568] font-medium">sq. ft.</Text>
              </View>

              <View className="flex-row items-center mb-3 w-full px-1">
                <Checkbox
                  className="mr-3 rounded border-2 border-[#3949AB]"
                  checked={isPublicRecipient}
                  onCheckedChange={(checked) => setIsPublicRecipient(checked)}
                />
                <Text className="text-base text-[#4A5568]">
                  Make my organization visible to donors
                </Text>
              </View>

              <TouchableOpacity
                className="bg-[#3949AB] py-3.5 px-8 rounded-xl w-full shadow shadow-black/10"
                onPress={handleSubmitRecipient}
              >
                <Text className="text-white text-base font-semibold text-center">
                  Update Capacity
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Donor Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={donorModalVisible}
          onRequestClose={() => setDonorModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="m-5 bg-white rounded-2xl p-8 items-center shadow-md shadow-black/25 w-4/5">
              <Text className="text-2xl font-bold text-[#303F9F] mb-2 text-center">
                Food Types Available
              </Text>
              <Text className="text-base text-[#4A5568] mb-6 text-center leading-5">
                Please select the types of food you have available today
              </Text>

              <View className="w-full mb-4">
                {Object.entries(foodTypes).map(([key, value]) => (
                  <View key={key} className="flex-row items-center mb-3 w-full px-1">
                    <Checkbox
                      className="mr-3 rounded border-2 border-[#3949AB]"
                      checked={value}
                      onCheckedChange={(checked) =>
                        setFoodTypes((prev) => ({
                          ...prev,
                          [key]: checked,
                        }))
                      }
                    />
                    <Text className="text-base text-[#4A5568]">
                      {key.charAt(0).toUpperCase() +
                        key.slice(1).replace(/([A-Z])/g, " $1")}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row items-center mb-3 w-full px-1">
                <Checkbox
                  className="mr-3 rounded border-2 border-[#3949AB]"
                  checked={isPublicDonor}
                  onCheckedChange={(checked) => setIsPublicDonor(checked)}
                />
                <Text className="text-base text-[#4A5568]">
                  Make my organization visible to recipients
                </Text>
              </View>

              <TouchableOpacity
                className="bg-indigo-600 py-3.5 px-8 rounded-xl w-full shadow-sm shadow-black/10"
                onPress={handleSubmitDonor}
              >
                <Text className="text-white text-base font-semibold text-center">
                  Update Food Types
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}