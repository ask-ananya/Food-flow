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

export default function MainPage() {
  const [isPublicDonor, setIsPublicDonor] = useState(false);
  const [donorList, setDonorList] = useState([]);
  const [recipientModalVisible, setRecipientModalVisible] = useState(false);
  const [donorModalVisible, setDonorModalVisible] = useState(false);
  const [capacity, setCapacity] = useState("");
  const [isPublicRecipient, setIsPublicRecipient] = useState(false);
  const [foodTypes, setFoodTypes] = useState({
    dairyFree: false,
    glutenFree: false,
    halal: false,
    kosher: false,
    vegan: false,
    vegetarian: false,
  });

  const [recipientList, setRecipientList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const [userType, setUserType] = useState(null);

  useEffect(() => {
    checkUserTypeAndShowPopup();
    checkIfPublicRecipient();
    //loadPublicRecipients();
    //loadPublicDonors();
    checkIfPublicDonor();
    loadMatches();
  }, []);

  const checkIfPublicDonor = async () => {
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

    try {
      setIsPublicDonor(data.public && data.user_type === "donor");
    } catch (error) {
      console.error("Error checking public donor status:", error);
    }
  };

  const loadPublicDonors = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_type", "donor")
      .eq("public", true);

    if (error) throw error;
    setDonorList(data);
    console.log(data);
  };

  const checkIfPublicRecipient = async () => {
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

    try {
      setIsPublicDonor(data.public && data.user_type === "recipient");
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

  const handleSubmitRecipient = async () => {
    if (!capacity) return;

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

    try {
      // First update user details

      var updateObj = data.details;
      updateObj["current_capcity"] = Number(capacity);
      updateObj["last_updated"] = new Date().toISOString();
      updateObj["public"] = isPublicRecipient;

      const { error } = await supabase
        .from("users")
        .update(updateObj)
        .eq("id", authUser.id);

      if (error) throw error;

      setRecipientModalVisible(false);
      setCapacity("");
      await loadPublicRecipients(); // Reload the list
    } catch (error) {
      console.error("Detailed error:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      // Show more specific error based on the operation
      if (error.code === "permission-denied") {
        console.error(
          "Permission denied. Please check if you are properly authenticated."
        );
      }
    }
  };

  const handleSubmitDonor = async () => {
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

    try {
      // Update user details
      var updateObj = data.details;
      updateObj["food_types"] = foodTypes; // Change from capacity to foodTypes
      updateObj["last_updated"] = new Date().toISOString();
      updateObj["public"] = isPublicDonor;

      const { error } = await supabase
        .from("users")
        .update({ details: updateObj }) // Wrap updateObj in details field
        .eq("id", authUser.id);

      if (error) throw error;

      setDonorModalVisible(false);
      setFoodTypes({
        dairyFree: false,
        glutenFree: false,
        halal: false,
        kosher: false,
        vegan: false,
        vegetarian: false,
      });
      await loadPublicDonors(); // Reload donor list after update
    } catch (error) {
      console.error("Detailed error:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      if (error.code === "permission-denied") {
        console.error(
          "Permission denied. Please check if you are properly authenticated."
        );
      }
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
    /*
    let data = await (
      await fetch(
        `https://matching-79369524935.us-east1.run.app/${authUser.id}`
      )
    ).json();
    */

    let data = [
      [
        "1649f05f-37ae-47ea-bb76-b6f1c2d70364",
        "4e94a74b-698a-45ff-aed6-63b6f0c15fdb",
      ],
      [
        "1649f05f-37ae-47ea-bb76-b6f1c2d70364",
        "4e94a74b-698a-45ff-aed6-63b6f0c15fdb",
      ],
    ];
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
                                    {recipientList[0].name}
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
                                    {donorList[0].name}
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
                                    {recipientList[1].name}
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
                                    {donorList[1].name}
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
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="m-5 bg-white rounded-2xl p-8 items-center shadow-md shadow-black/25 w-4/5">
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
                  onValueChange={(checked) => setIsPublicRecipient(checked)} // Changed from onCheckedChange
                  color={isPublicRecipient ? "#3949AB" : undefined}
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
          </View>
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
                      onValueChange={(checked) =>
                        setFoodTypes((prev) => ({
                          ...prev,
                          [key]: checked,
                        }))
                      }
                      color={value ? "#3949AB" : undefined}
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
                  onValueChange={(checked) => setIsPublicDonor(checked)}
                  color={isPublicDonor ? "#3949AB" : undefined}
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