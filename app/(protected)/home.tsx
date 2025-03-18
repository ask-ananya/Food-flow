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
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Ionicons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { router, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native";

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
  user_type: "donor" | "recipient" | "individual";
  details: UserDetails;
}

interface MatchedUser {
  id: string;
  name: string;
}

interface AcceptedTask {
  donorId: string;
  donorName: string;
  recipientId: string;
  recipientName: string;
  donorClosingTime: string;
  recipientOpenTime: string;
  timestamp: string;
}

export default function MainPage() {
  const [isPublicDonor, setIsPublicDonor] = useState<boolean>(false);
  const [donorList, setDonorList] = useState<MatchedUser[]>([]);
  const [recipientModalVisible, setRecipientModalVisible] =
    useState<boolean>(false);
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
  const navigation = useRouter();

  const [recipientList, setRecipientList] = useState<MatchedUser[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  const [userType, setUserType] = useState<
    "donor" | "recipient" | "individual" | null
  >(null);
  const [acceptedTasks, setAcceptedTasks] = useState<AcceptedTask[]>([]);

  useEffect(() => {
    checkUserTypeAndShowPopup();
    checkIfPublicRecipient();
    checkIfPublicDonor();
    loadMatches();
    // For donor/recipient, load accepted tasks
    if (userType === "donor" || userType === "recipient") {
      loadAcceptedTasks();
    }
  }, [userType]);

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
      setDonorList(
        data.map(({ id, details: { name } }: User) => ({ id, name })),
      );
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
        `https://matching-79369524935.us-east1.run.app/${authUser.id}`,
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

  // Helper functions to get closing/open times (replace dummy logic as needed)
  const getClosestDonorClosingTime = (operatingHours: any): string => {
    // Dummy implementation – replace with actual logic based on donorDetails.operatingHours
    return "18:00";
  };

  const getNextRecipientOpenTime = (
    operatingHours: any,
    donorCloseTime: string,
  ): string => {
    // Dummy implementation – replace with actual logic based on recipientDetails.operatingHours
    return "09:00";
  };

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
      // Fetch donor and recipient details from the current page params or state
      const donorId = "donorId"; // Replace with actual donorId
      const recipientId = "recipientId"; // Replace with actual recipientId

      const { data: donorDetails, error: donorError } = await supabase
        .from("users")
        .select("*")
        .eq("id", donorId)
        .single();
      if (donorError) throw donorError;

      const { data: recipientDetails, error: recipientError } = await supabase
        .from("users")
        .select("*")
        .eq("id", recipientId)
        .single();
      if (recipientError) throw recipientError;

      if (!donorDetails || !recipientDetails) {
        Alert.alert("Error", "Missing donor/recipient details.");
        return;
      }
      // Only process accepted decisions
      if (decisionValue) {
        const donorCloseTime = getClosestDonorClosingTime(
          donorDetails.operatingHours,
        );
        const recipientNextOpen = getNextRecipientOpenTime(
          recipientDetails.operatingHours,
          donorCloseTime,
        );

        // Create new accepted task object to be stored for both donor and recipient
        const acceptedTask = {
          donorId: donorId,
          donorName: donorDetails.name,
          recipientId: recipientId,
          recipientName: recipientDetails.name,
          donorClosingTime: donorCloseTime,
          recipientOpenTime: recipientNextOpen,
          timestamp: new Date().toISOString(),
        };

        // Update donor record
        const { data: donorData, error: donorUpdateError } = await supabase
          .from("users")
          .select("details")
          .eq("id", donorId)
          .single();
        if (donorUpdateError) throw donorUpdateError;
        const donorAccepted = donorData.details.accepted_tasks || [];
        donorAccepted.push(acceptedTask);
        const { error: updateDonorError } = await supabase
          .from("users")
          .update({
            details: { ...donorData.details, accepted_tasks: donorAccepted },
          })
          .eq("id", donorId);
        if (updateDonorError) throw updateDonorError;

        // Update recipient record
        const { data: recipientData, error: recipientUpdateError } =
          await supabase
            .from("users")
            .select("details")
            .eq("id", recipientId)
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
          .eq("id", recipientId);
        if (updateRecipientError) throw updateRecipientError;
      }

      // Update decisions if required (existing functionality)
      const { data, error } = await supabase
        .from("users")
        .select("decisions")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      const decisions = data?.decisions || [];
      const newDecision = {
        recipient: recipientId,
        donor: donorId,
        decision: decisionValue,
        timestamp: new Date().toISOString(),
      };

      const { error: updateDecisionError } = await supabase
        .from("users")
        .update({ decisions: [...decisions, newDecision] })
        .eq("id", authUser.id);
      if (updateDecisionError) throw updateDecisionError;

      Alert.alert(
        "Success",
        `You have ${decisionValue ? "accepted" : "declined"} the donation.`,
      );
      router.push("/home");
    } catch (error) {
      console.error("Error updating decision:", error);
      Alert.alert("Error", "There was an error submitting your decision.");
    }
  };

  const loadAcceptedTasks = async () => {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser) return;
      const { data, error } = await supabase
        .from("users")
        .select("details")
        .eq("id", authUser.id)
        .single();
      if (error) throw error;
      const tasks: AcceptedTask[] = data.details.accepted_tasks || [];
      // Sort tasks by timestamp and take the last three
      tasks.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      setAcceptedTasks(tasks.slice(-3));
    } catch (error) {
      console.error("Error loading accepted tasks:", error);
    }
  };

  const renderMatchCard = (recipientInfo: any, donorInfo: any, index: any) => {
    return (
      <View key={`match-${index}`} style={styles.urgentCard}>
        <View style={styles.combinedCardContent}>
          {/* Recipient Section */}
          <View style={styles.cardHalf}>
            <Text style={styles.cardSectionTitle}>RECIPIENT</Text>
            <Text style={styles.cardOrganizationName}>
              {recipientInfo.name}
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Donor Section */}
          <View style={styles.cardHalf}>
            <Text style={styles.cardSectionTitle}>DONOR</Text>
            <Text style={styles.cardOrganizationName}>{donorInfo.name}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() =>
            navigation.navigate("/(protected)/details", {
              recipientName: recipientInfo.name,
              recipientId: recipientInfo.id,
              donorName: donorInfo.name,
              donorId: donorInfo.id,
            })
          }
        >
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSingleEntityCard = (entityInfo: any, index: any, type: any) => {
    return (
      <View key={`entity-${index}`} style={styles.urgentCard}>
        <View style={styles.combinedCardContent}>
          <View style={styles.cardHalf}>
            <Text style={styles.cardSectionTitle}>{type}</Text>
            <Text style={styles.cardOrganizationName}>{entityInfo.name}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => {
            const navigationParams =
              type === "RECIPIENT"
                ? { recipientName: entityInfo.name, recipientId: entityInfo.id }
                : { donorName: entityInfo.name, donorId: entityInfo.id };

            navigation.navigate("/(protected)/details", navigationParams);
          }}
        >
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={["#F5F7FF", "#EDF0FF"]}
        style={styles.background}
      />
      <SafeAreaView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FoodFlow</Text>
          <View style={styles.headerIcons}>
            <Ionicons
              name="person-circle-outline"
              size={30}
              color="#303F9F"
              style={styles.icon}
            />
            <Ionicons
              name="notifications-outline"
              size={24}
              color="#303F9F"
              style={styles.icon}
            />
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Make a donation today..."
              placeholderTextColor="#888"
            />
          </View>

          {/* Content Section */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Metrics Section */}
            <View style={styles.metricsContainer}>
              <View style={[styles.metricCard, styles.smallMetricCard]}>
                <LinearGradient
                  colors={["#E8EAF6", "#C5CAE9"]}
                  style={styles.metricGradient}
                >
                  <Text style={styles.metricNumber}>0</Text>
                  <Text style={styles.metricLabel}>Donation{"\n"}Spots</Text>
                </LinearGradient>
              </View>

              <View style={[styles.metricCard, styles.primaryMetricCard]}>
                <LinearGradient
                  colors={["#303F9F", "#3949AB"]}
                  style={styles.metricGradient}
                >
                  <Text style={[styles.metricNumber, { color: "white" }]}>
                    0
                  </Text>
                  <Text style={[styles.metricLabel, { color: "white" }]}>
                    Total Donations
                  </Text>
                </LinearGradient>
              </View>

              <View style={[styles.metricCard, styles.smallMetricCard]}>
                <LinearGradient
                  colors={["#E8EAF6", "#C5CAE9"]}
                  style={styles.metricGradient}
                >
                  <Text style={styles.metricNumber}>0</Text>
                  <Text style={styles.metricLabel}>Drivers{"\n"}Nearby</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Matches/Recommendations Section */}
            <View style={styles.recommendationsSection}>
              <Text style={styles.sectionTitle}>Recommended Matches</Text>

              {/* Loading State */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Progress.Circle
                    size={30}
                    indeterminate={true}
                    color="#303F9F"
                  />
                  <Text style={styles.loadingText}>Looking for matches...</Text>
                </View>
              ) : userType === null ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#303F9F" />
                  <Text style={styles.loadingText}>Loading user data...</Text>
                </View>
              ) : (
                <>
                  {/* Individual User Match Display */}
                  {userType === "individual" ? (
                    <>
                      {/* Render match cards */}
                      {recipientList.length > 0 && donorList.length > 0 ? (
                        recipientList
                          .slice(0, 2)
                          .map(
                            (recipient, index) =>
                              donorList[index] &&
                              renderMatchCard(
                                recipient,
                                donorList[index],
                                index,
                              ),
                          )
                      ) : (
                        <Text style={styles.noMatchesText}>
                          No matches found at this time.
                        </Text>
                      )}

                      {/* Show "View More" button if more than 2 recommendations */}
                      {recipientList.length > 2 && (
                        <TouchableOpacity style={styles.viewMoreButton}>
                          <Text style={styles.viewMoreButtonText}>
                            View {recipientList.length - 2} more
                            recommendations...
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <>
                      {acceptedTasks.map((task, index) => (
                        <View
                          key={index}
                          className="bg-white rounded-2xl my-2.5 p-4 shadow-lg shadow-black/12 -translate-y-0.5 border border-white/80 mx-4"
                        >
                          <View className="flex-row rounded-xl overflow-hidden">
                            <View className="flex-1 p-4">
                              <Text className="text-xs font-extrabold tracking-wider text-gray-600 mb-2">
                                {userType === "donor" ? "Recipient" : "Donor"}
                              </Text>
                              <Text className="text-base font-semibold text-[#2d3748] leading-6">
                                {userType === "donor"
                                  ? task.recipientName
                                  : task.donorName}
                              </Text>
                              <Text className="text-xs text-gray-600 mt-1">
                                {userType === "donor"
                                  ? `Pickup at ${task.donorClosingTime}`
                                  : `Donation at ${task.recipientOpenTime}`}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            className="bg-[#3949AB] py-2 px-6 rounded-lg mt-4 self-center shadow shadow-black/10"
                            onPress={() =>
                              router.push({
                                pathname: "/details",
                                params: {
                                  recipientName: task.recipientName,
                                  recipientId: task.recipientId,
                                  donorName: task.donorName,
                                  donorId: task.donorId,
                                },
                              })
                            }
                          >
                            <Text className="text-white font-semibold text-sm">
                              Details
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Recipient Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={recipientModalVisible}
          onRequestClose={() => {}}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setRecipientModalVisible(false)}
            style={styles.modalOverlay}
          >
            <TouchableOpacity
              style={styles.modalView}
              onStartShouldSetResponder={() => true}
            >
              <Text style={styles.modalTitle}>Storage Capacity</Text>
              <Text style={styles.modalSubtitle}>
                Please enter your current food storage capacity
              </Text>

              <View style={styles.modalInputContainer}>
                <TextInput
                  style={styles.capacityInput}
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholder="Enter capacity in square feet"
                  keyboardType="numeric"
                  placeholderTextColor="#A0AEC0"
                />
                <Text style={styles.unitText}>sq. ft.</Text>
              </View>

              <View style={styles.checkboxContainer}>
                <Checkbox
                  style={styles.checkbox}
                  checked={isPublicRecipient}
                  onCheckedChange={setIsPublicRecipient}
                  color={isPublicRecipient ? "#3949AB" : undefined}
                />
                <Text style={styles.checkboxLabel}>
                  Make my organization visible to donors
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitRecipient}
              >
                <Text style={styles.submitButtonText}>Update Capacity</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Donor Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={donorModalVisible}
          onRequestClose={() => setDonorModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Food Types Available</Text>
              <Text style={styles.modalSubtitle}>
                Please select the types of food you have available today
              </Text>

              <View style={styles.foodTypesContainer}>
                {Object.entries(foodTypes).map(([key, value]) => (
                  <View key={key} style={styles.checkboxContainer}>
                    <Checkbox
                      style={styles.checkbox}
                      checked={value}
                      onCheckedChange={(newValue: boolean) =>
                        setFoodTypes((prev) => ({
                          ...prev,
                          [key]: newValue,
                        }))
                      }
                      color={value ? "#3949AB" : undefined}
                    />
                    <Text style={styles.checkboxLabel}>
                      {key.charAt(0).toUpperCase() +
                        key.slice(1).replace(/([A-Z])/g, " $1")}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.checkboxContainer}>
                <Checkbox
                  style={styles.checkbox}
                  checked={isPublicDonor}
                  onCheckedChange={setIsPublicDonor}
                  color={isPublicDonor ? "#3949AB" : undefined}
                />
                <Text style={styles.checkboxLabel}>
                  Make my organization visible to recipients
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitDonor}
              >
                <Text style={styles.submitButtonText}>Update Food Types</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

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
    justifyContent: "space-between",
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
