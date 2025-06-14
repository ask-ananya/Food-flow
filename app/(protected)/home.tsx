import {
  SafeAreaView,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  Image,
  Dimensions,
  Alert,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Ionicons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { router, useRouter, Link, useSegments } from "expo-router";
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

const AnimatedCounter = ({ end, duration = 1500, textStyle }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Animate from 0 to end
    Animated.timing(animatedValue, {
      toValue: end,
      duration,
      useNativeDriver: false,
    }).start();

    // Listen for updates and round down
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.floor(value));
    });

    return () => animatedValue.removeListener(listener);
  }, [end]);

  return <Text style={textStyle}>{displayValue}</Text>;
};

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
  const router = useRouter();
  const segments = useSegments();
  const [recipientList, setRecipientList] = useState<MatchedUser[]>([]);
  const [marketplace, setMarketplace] = useState<any>([]); // todo change types later, too lazy rn to import types from supabase

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
        data.map(({ id, details: { name } }: User) => ({ id, name }))
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

  // Helper functions to get closing/open times (replace dummy logic as needed)
  const getClosestDonorClosingTime = (operatingHours: any): string => {
    // Dummy implementation – replace with actual logic based on donorDetails.operatingHours
    return "18:00";
  };

  const getNextRecipientOpenTime = (
    operatingHours: any,
    donorCloseTime: string
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
          donorDetails.operatingHours
        );
        const recipientNextOpen = getNextRecipientOpenTime(
          recipientDetails.operatingHours,
          donorCloseTime
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
        `You have ${decisionValue ? "accepted" : "declined"} the donation.`
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
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setAcceptedTasks(tasks.slice(-3));
    } catch (error) {
      console.error("Error loading accepted tasks:", error);
    }
  };

  const loadMarketplace = async () => {
    try {
      const { data, error } = await supabase
        .from("marketplace")
        .select("*")
        .limit(10);

      if (error) throw error;

      setMarketplace(data);
    } catch (error) {
      console.error(
        "Error loading marketplace (code a0f9r0asg9as09ga):",
        error
      );
    }
  };

  const renderMatchCard = (recipientInfo: any, donorInfo: any, index: any) => {
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
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

          {/* Donor Section */}
          <View style={styles.cardHalf}>
            <Text style={styles.cardSectionTitle}>DONOR</Text>
            <Text style={styles.cardOrganizationName}>{donorInfo.name}</Text>
          </View>
        </View>
        <Link
          href={{
            pathname: "/details",
            params: {
              recipientName: recipientList[0].name,
              recipientId: recipientList[0].id,
              donorName: donorList[0].name,
              donorId: donorList[0].id,
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

            // @ts-ignore
            router.navigate("/(protected)/details", navigationParams);
          }}
        >
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!segments) {
    return (
      <View className="flex flex-row w-full justify-center">
        <Progress.Circle size={25} indeterminate={true} />
        <Text>Loading...</Text>
      </View>
    );
  }

  // @ts-ignore
  return (
    <SafeAreaView style={styles.mainContainer} className="relative">
      <LinearGradient
        colors={["#E0E0FF", "#EDF0FF"]}
        style={styles.background}
        className="z-10"
      />
      <SafeAreaView style={styles.container}>
        {/* Header Section */}
        <View className="w-full flex flex-col gap-y-2 px-5 py-2 pb-0">
          <Text className="text-4xl font-bold text-primary text-center">
            Welcome to Foodflow
          </Text>
          <Text className="text-center text-xl font-semibold">
            Improving food donation for all.
          </Text>
        </View>
        <View style={styles.contentContainer}>
          {/* Search Input */}

          {/* Content Section */}
          <View
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Metrics Section */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricCard}>
                <LinearGradient
                  colors={["#E8EAF6", "#C5CAE9"]}
                  style={styles.metricGradient}
                >
                  <AnimatedCounter
                    end={144}
                    duration={1500}
                    textStyle={styles.metricNumber}
                  />
                  <Text style={styles.metricLabel}>Total Users</Text>
                </LinearGradient>
              </View>

              <View style={[styles.metricCard, styles.primaryMetricCard]}>
                <LinearGradient
                  colors={["#303F9F", "#3949AB"]}
                  style={styles.metricGradient}
                >
                  <AnimatedCounter
                    end={763}
                    duration={1500}
                    textStyle={[styles.metricNumber, { color: "white" }]}
                  />
                  <Text style={[styles.metricLabel, { color: "white" }]}>
                    Total Donations
                  </Text>
                </LinearGradient>
              </View>

              <View style={styles.metricCard}>
                <LinearGradient
                  colors={["#E8EAF6", "#C5CAE9"]}
                  style={styles.metricGradient}
                >
                  <AnimatedCounter
                    end={52}
                    duration={1500}
                    textStyle={styles.metricNumber}
                  />
                  <Text style={styles.metricLabel}>Active Requests</Text>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.metricsContainer}>
              <View style={styles.metricCard}>
                <LinearGradient
                  colors={["#E8EAF6", "#C5CAE9"]}
                  style={styles.metricGradient}
                >
                  <AnimatedCounter
                    end={7649}
                    duration={2100}
                    textStyle={styles.metricNumber}
                  />
                  <Text style={styles.metricLabel}>Meals Saved</Text>
                </LinearGradient>
              </View>

              <View style={[styles.metricCard, styles.primaryMetricCard]}>
                <LinearGradient
                  colors={["#303F9F", "#3949AB"]}
                  style={styles.metricGradient}
                >
                  <AnimatedCounter
                    end={532}
                    duration={2100}
                    textStyle={[styles.metricNumber, { color: "white" }]}
                  />
                  <Text style={[styles.metricLabel, { color: "white" }]}>
                    kg CO₂ Emissions Saved
                  </Text>
                </LinearGradient>
              </View>
            </View>

            <View className="gap-y-4 flex-col flex mt-4">
              <Text style={styles.sectionTitle}>Features</Text>

              {/* Feature 1: Indigo background + border */}

              {/* Feature 2: Teal background + border */}
              <View
                style={styles.foodHealthContainer}
                className="bg-teal-50 border border-teal-200 rounded-lg p-4"
              >
                <View style={styles.foodHealthContainerLeftHalf}>
                  <Text
                    style={styles.foodHealthContainerText}
                    className="text-teal-900"
                  >
                    Take advantage of real‑time meteorological data to predict
                    disruptions in your local food supply.
                  </Text>
                  <Link href={{ pathname: "/weather" }} asChild>
                    <TouchableOpacity className="mt-2 bg-teal-600 py-1 px-2 flex-row items-center rounded-lg shadow shadow-black/10">
                      <Text className="flex-1 text-white font-semibold text-sm">
                        Learn more
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    </TouchableOpacity>
                  </Link>
                </View>
                <Image
                  source={require("@/assets/images/weather.png")}
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 10,
                    shadowOffset: { width: 0, height: 8 },
                    shadowColor: "#000",
                    shadowRadius: 4,
                  }}
                />
              </View>

              {/* Feature 3: Orange background + border */}
              <View
                style={styles.foodHealthContainer}
                className="bg-orange-200/30 border border-orange-200 rounded-lg p-4"
              >
                <View style={styles.foodHealthContainerLeftHalf}>
                  <Text
                    style={styles.foodHealthContainerText}
                    className="text-orange-900"
                  >
                    View your potential donors and recipients on a map with
                    accurate transportation estimates.
                  </Text>
                  <Link href={{ pathname: "/maps" }} asChild>
                    <TouchableOpacity className="mt-2 bg-orange-600 py-1 px-2 flex-row items-center rounded-lg shadow shadow-black/10">
                      <Text className="flex-1 text-white font-semibold text-sm">
                        View now
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    </TouchableOpacity>
                  </Link>
                </View>
                <Image
                  source={require("@/assets/images/map.png")}
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 10,
                    shadowOffset: { width: 0, height: 8 },
                    shadowColor: "#000",
                    shadowRadius: 4,
                  }}
                />
              </View>

              {/* Feature 4: Yellow background + border, lighter button */}
              <View
                style={styles.foodHealthContainer}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              >
                <View style={styles.foodHealthContainerLeftHalf}>
                  <Text
                    style={styles.foodHealthContainerText}
                    className="text-yellow-900"
                  >
                    Gain access to our smart marketplace with statistical
                    recommendations.
                  </Text>
                  <Link href={{ pathname: "/marketplace" }} asChild>
                    <TouchableOpacity className="mt-2 bg-yellow-400 py-1 px-2 flex-row items-center rounded-lg shadow shadow-black/10">
                      <Text className="flex-1 text-white font-semibold text-sm">
                        Donations made easy
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    </TouchableOpacity>
                  </Link>
                </View>
                <Image
                  source={require("@/assets/images/donate.jpg")}
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 10,
                    shadowOffset: { width: 0, height: 8 },
                    shadowColor: "#000",
                    shadowRadius: 4,
                  }}
                />
              </View>
            </View>
          </View>
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
            <TouchableOpacity style={styles.modalView}>
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
    </SafeAreaView>
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
    marginBottom: 12,
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
    marginBottom: 5,
    gap: 8,
    marginTop: 5,
  },
  metricCard: {
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: "hidden",
    flex: 1,
    height: 70,
  },
  metricGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  primaryMetricCard: {
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
    fontSize: 11,
    color: "#303F9F",
    textAlign: "center",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#303F9F",
    marginBottom: -4,
    marginTop: 8,
    marginLeft: 4,
  },
  recommendationsSection: {
    marginTop: 16,
    marginBottom: 16,
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
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  combinedCardContent: {
    flexDirection: "row",
    borderRadius: 15,
    overflow: "hidden",
  },
  cardHalf: {
    flex: 1,
    padding: 2,
  },
  cardDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 8,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#666",
    marginBottom: 3,
  },
  cardOrganizationName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
    lineHeight: 24,
  },
  detailsButton: {
    backgroundColor: "#3949AB",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
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
  foodHealthContainer: {
    // backgroundColor: "rgba(91, 123, 214, 0.2)",
    borderWidth: 1,
    // borderColor: "rgba(91, 123, 214, 0.7)",
    padding: 10,
    borderRadius: 12,
    display: "flex",
    flexDirection: "row",
    gap: 5,
  },
  foodHealthContainerText: {
    fontWeight: "500",
  },
  foodHealthContainerLeftHalf: {
    flex: 1,
    paddingRight: 5,
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
