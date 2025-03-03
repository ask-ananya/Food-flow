import {
  SafeAreaView,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "react-native-web";
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
      const usertype = data.user_type;
      console.log("User type:", usertype);
      setUserType(usertype);

      if (userType === "recipient") {
        setRecipientModalVisible(true);
      } else if (userType === "donor") {
        setDonorModalVisible(true);
      }
    } catch (error) {
      console.error("Error checking user type:", error);
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
      // First update user details
      var updateObj = data.details;
      updateObj["food_types"] = Number(capacity);
      updateObj["last_updated"] = new Date().toISOString();
      updateObj["public"] = isPublicDonor;

      const { error } = await supabase
        .from("users")
        .update(updateObj)
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
    <View
      style={{
        backgroundColor: "white",
        ...styles.container,
      }}
    >
      <LinearGradient
        colors={["#E8EAF6", "#C5CAE9"]}
        style={styles.background}
      />
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#ffffff", "#E8EAF6"]}
          style={styles.background}
        />
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FoodFlow</Text>
          <View style={styles.headerIcons}>
            <Ionicons
              name="person-circle-outline"
              size={30}
              color="black"
              style={styles.icon}
            />
            <Ionicons
              name="notifications-outline"
              size={24}
              color="black"
              style={styles.icon}
            />
          </View>
        </View>

        <View style={{ flex: 1, padding: 16, backgroundColor: "" }}>
          {/* Input Section */}
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="gray" />
            <TextInput
              style={styles.input}
              placeholder="Make a donation today..."
              placeholderTextColor="gray"
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
            <View style={styles.metricsContainer}>
              <View style={[styles.metricCard, styles.smallMetricCard]}>
                <LinearGradient
                  colors={["#E8EAF6", "#C5CAE9"]}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 16,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 12,
                  }}
                >
                  <Text style={styles.metricNumber}>0</Text>
                  <Text style={styles.metricLabel}>Donation{"\n"}Spots</Text>
                </LinearGradient>
              </View>
              <View style={[styles.metricCard, styles.primaryMetricCard]}>
                <LinearGradient
                  colors={["#303F9F", "#3949AB"]}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 16,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 16,
                  }}
                >
                  <Text style={{ ...styles.metricNumber, color: "white" }}>
                    0
                  </Text>
                  <Text style={{ ...styles.metricLabel, color: "white" }}>
                    Total Donations
                  </Text>
                </LinearGradient>
              </View>
              <View style={[styles.metricCard, styles.smallMetricCard]}>
                <LinearGradient
                  colors={["#E8EAF6", "#C5CAE9"]}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 16,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 12,
                  }}
                >
                  <Text style={styles.metricNumber}>0</Text>
                  <Text style={styles.metricLabel}>Drivers{"\n"}Nearby</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Space Between Sections */}
            <View style={{ flex: 1 }} />

            {userType != null ? (
              <>
                {userType === "individual" ? (
                  <View style={styles.urgentContainer}>
                    {loading ? (
                      <>
                        <View
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            width: "100%",
                            justifyContent: "center",
                          }}
                        >
                          <Progress.Circle size={25} indeterminate={true} />
                          <Text>Getting matches...</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        {/* First Card - Combined Recipient and Donor */}
                        {(recipientList.length > 0 || donorList.length > 0) && (
                          <View style={styles.urgentCard}>
                            <View style={styles.combinedCardContent}>
                              {/* Recipient Section */}
                              {recipientList.length > 0 && (
                                <View style={styles.cardHalf}>
                                  <Text style={styles.cardSectionTitle}>
                                    RECIPIENT
                                  </Text>
                                  <Text style={styles.cardOrganizationName}>
                                    {recipientList[0].name}
                                  </Text>
                                </View>
                              )}

                              {/* Divider */}
                              <View style={styles.cardDivider} />

                              {/* Donor Section */}
                              {donorList.length > 0 && (
                                <View style={styles.cardHalf}>
                                  <Text style={styles.cardSectionTitle}>
                                    DONOR
                                  </Text>
                                  <Text style={styles.cardOrganizationName}>
                                    {donorList[0].name}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <TouchableOpacity
                              style={styles.detailsButton}
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
                              <Text style={styles.detailsButtonText}>
                                Details
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        {/* First Card - Combined Recipient and Donor */}
                        {(recipientList.length > 1 || donorList.length > 1) && (
                          <View style={styles.urgentCard}>
                            <View style={styles.combinedCardContent}>
                              {/* Recipient Section */}
                              {recipientList.length > 0 && (
                                <View style={styles.cardHalf}>
                                  <Text style={styles.cardSectionTitle}>
                                    RECIPIENT
                                  </Text>
                                  <Text style={styles.cardOrganizationName}>
                                    {recipientList[1].name}
                                  </Text>
                                </View>
                              )}

                              {/* Divider */}
                              <View style={styles.cardDivider} />

                              {/* Donor Section */}
                              {donorList.length > 0 && (
                                <View style={styles.cardHalf}>
                                  <Text style={styles.cardSectionTitle}>
                                    DONOR
                                  </Text>
                                  <Text style={styles.cardOrganizationName}>
                                    {donorList[1].name}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <TouchableOpacity
                              style={styles.detailsButton}
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
                              <Text style={styles.detailsButtonText}>
                                Details
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        {/* View More Recommendations Button */}
                        {recipientList.length > 2 && (
                          <TouchableOpacity
                            style={styles.recommendationsButton}
                          >
                            <Text style={styles.recommendationsButtonText}>
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
                    <View style={styles.urgentCard}>
                      <View style={styles.combinedCardContent}>
                        {/* Recipient Section */}
                        <View style={styles.cardHalf}>
                          <Text style={styles.cardSectionTitle}>
                            {userType === "donor" ? "Recipient" : "Donor"}
                          </Text>
                          <Text style={styles.cardOrganizationName}>
                            Edison Pepper Farms
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.detailsButton}
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
                        <Text style={styles.detailsButtonText}>Details</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.urgentCard}>
                      <View style={styles.combinedCardContent}>
                        {/* Recipient Section */}
                        <View style={styles.cardHalf}>
                          <Text style={styles.cardSectionTitle}>
                            {userType === "donor" ? "Recipient" : "Donor"}
                          </Text>
                          <Text style={styles.cardOrganizationName}>
                            Edison Pepper Farms
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.detailsButton}
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
                        <Text style={styles.detailsButtonText}>Details</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.urgentCard}>
                      <View style={styles.combinedCardContent}>
                        {/* Recipient Section */}
                        <View style={styles.cardHalf}>
                          <Text style={styles.cardSectionTitle}>
                            {userType === "donor" ? "Recipient" : "Donor"}
                          </Text>
                          <Text style={styles.cardOrganizationName}>
                            Edison Pepper Farms
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.detailsButton}
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
                        <Text style={styles.detailsButtonText}>Details</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.urgentCard}>
                      <View style={styles.combinedCardContent}>
                        {/* Recipient Section */}
                        <View style={styles.cardHalf}>
                          <Text style={styles.cardSectionTitle}>
                            {userType === "donor" ? "Recipient" : "Donor"}
                          </Text>
                          <Text style={styles.cardOrganizationName}>
                            Edison Pepper Farms
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.detailsButton}
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
                        <Text style={styles.detailsButtonText}>Details</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            ) : (
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Storage Capacity</Text>
              <Text style={styles.modalSubtitle}>
                Please enter your current food storage capacity
              </Text>

              <View style={styles.inputContainer}>
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
                  value={isPublicRecipient}
                  onValueChange={setIsPublicRecipient}
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
                      value={value}
                      onValueChange={(newValue) =>
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
                  value={isPublicDonor}
                  onValueChange={setIsPublicDonor}
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
  container: {
    flex: 1,
    height: "100%",
    backgroundColor: "transparent",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 16,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 16,
  },
  circleCard: {
    width: 150, // Adjust the size as needed
    height: 150, // Adjust the size as needed
    borderRadius: 75, // Half of the width/height to make it a circle
    justifyContent: "center",
    alignItems: "center",
  },
  smallCircleCard: {
    width: 100, // Adjust the size as needed
    height: 100, // Adjust the size as needed
    borderRadius: 50, // Half of the width/height to make it a circle
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    borderRadius: 5,
    padding: 10,
    elevation: 2,
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: "#ff4444",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
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
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#2d3748",
    height: 40,
    paddingVertical: 0,
    selectionColor: "#3949AB",
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    marginBottom: 30,
    paddingHorizontal: 16,
    gap: 12,
  },
  metricCard: {
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    margin: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
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
  urgentContainer: {
    flex: 1,
    marginHorizontal: 15,
    marginBottom: 80,
  },
  urgentLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    marginLeft: -15,
  },
  urgentLabel: {
    color: "red",
    fontWeight: "bold",
    marginLeft: 5,
  },
  urgentImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  urgentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 5,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
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
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "white",
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    borderTopWidth: 0,
    paddingBottom: Platform.OS === "ios" ? 34 : 12,
    marginBottom: -40,
    paddingHorizontal: 16,
    width: "100%",
  },
  navItem: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 0 : 0,
  },
  navLabel: {
    fontSize: 12,
    color: "gray",
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  urgentCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginVertical: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ translateY: -2 }],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  urgentImageLeft: {
    width: 160,
    height: 80,
    flex: "auto",
    borderRadius: 10,
    marginRight: 10,
  },
  cardText: {
    flex: 1,
    justifyContent: "center",
  },
  recommendationsButton: {
    backgroundColor: "#4A4A8A",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
    marginBottom: 30,
  },
  recommendationsButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  metricBackground: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "red",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 6,
  },
  foodTypesText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  lastUpdatedText: {
    fontSize: 11,
    color: "#888",
    fontStyle: "italic",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
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
  inputContainer: {
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
