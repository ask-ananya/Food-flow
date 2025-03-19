import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextInput } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { OperatingHoursSection } from "./operating-hours";
import { supabase } from "@/lib/supabase";
import { Link, useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { Modal } from "react-native";
import { Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native";
import { ActivityIndicator } from "react-native";

// Common schemas

const coordinatesSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const locationSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "Valid ZIP code required"),
  coordinates: coordinatesSchema,
});

const operatingHoursSchema = z.object({
  monday: z.object({
    open: z.string(),
    close: z.string(),
    available: z.boolean(),
  }),
  tuesday: z.object({
    open: z.string(),
    close: z.string(),
    available: z.boolean(),
  }),
  wednesday: z.object({
    open: z.string(),
    close: z.string(),
    available: z.boolean(),
  }),
  thursday: z.object({
    open: z.string(),
    close: z.string(),
    available: z.boolean(),
  }),
  friday: z.object({
    open: z.string(),
    close: z.string(),
    available: z.boolean(),
  }),
  saturday: z.object({
    open: z.string(),
    close: z.string(),
    available: z.boolean(),
  }),
  sunday: z.object({
    open: z.string(),
    close: z.string(),
    available: z.boolean(),
  }),
});

// Detail Schemas
const donorDetailsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  establishmentType: z.string().min(1, "Establishment type is required"),
  location: locationSchema,
  operatingHours: operatingHoursSchema,
});

const dietaryRestrictionsSchema = z.object({
  halal: z.boolean(),
  kosher: z.boolean(),
  vegetarian: z.boolean(),
  vegan: z.boolean(),
  glutenFree: z.boolean(),
  dairyFree: z.boolean(),
});

const recipientDetailsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  capacity: z.string().min(1, "Capacity is required"),
  hasRefrigeration: z.boolean(),
  location: locationSchema,
  dietaryRestrictions: dietaryRestrictionsSchema,
  operatingHours: operatingHoursSchema,
});

// Base schema for common fields.
// We declare donorDetails and recipientDetails as z.any() so they don't get validated automatically.
const signUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    userType: z.enum(["individual", "donor", "recipient"]),
    donorDetails: z.any(),
    recipientDetails: z.any(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    // Only validate donorDetails if userType is "donor"
    if (data.userType === "donor") {
      const result = donorDetailsSchema.safeParse(data.donorDetails);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            ...issue,
            path: ["donorDetails", ...issue.path],
          });
        });
      }
    }
    // Only validate recipientDetails if userType is "recipient"
    if (data.userType === "recipient") {
      const result = recipientDetailsSchema.safeParse(data.recipientDetails);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            ...issue,
            path: ["recipientDetails", ...issue.path],
          });
        });
      }
    }
    // For "individual", donorDetails and recipientDetails are ignored.
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

// Default operating hours (used in default values)
const defaultOperatingHours = {
  monday: { open: "", close: "", available: false },
  tuesday: { open: "", close: "", available: false },
  wednesday: { open: "", close: "", available: false },
  thursday: { open: "", close: "", available: false },
  friday: { open: "", close: "", available: false },
  saturday: { open: "", close: "", available: false },
  sunday: { open: "", close: "", available: false },
};

export default function SignUpScreen() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [showEstablishmentTypeDropdown, setShowEstablishmentTypeDropdown] =
    React.useState(false);
  const [showAccountTooltip, setShowAccountTooltip] = React.useState(false);
  const [showUserTypeDropdown, setShowUserTypeDropdown] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      userType: "individual",
      donorDetails: {
        name: "",
        establishmentType: "",
        location: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          coordinates: { longitude: 0, latitude: 0 },
        },
        operatingHours: defaultOperatingHours,
      },
      recipientDetails: {
        name: "",
        capacity: "",
        hasRefrigeration: false,
        location: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          coordinates: { longitude: 0, latitude: 0 },
        },
        dietaryRestrictions: {
          halal: false,
          kosher: false,
          vegetarian: false,
          vegan: false,
          glutenFree: false,
          dairyFree: false,
        },
        operatingHours: defaultOperatingHours,
      },
    },
  });

  const userType = watch("userType");

  const geocodeAddress = async (address: string) => {
    const OPENROUTE_SERVICE_API_KEY =
      "5b3ce3597851110001cf624832fdc07e4faf477fa76a70c083547c65";

    try {
      const response = await fetch(
        `https://api.openrouteservice.org/geocode/search?api_key=${OPENROUTE_SERVICE_API_KEY}&text=${encodeURIComponent(
          address,
        )}&size=1`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Geocoding request failed");
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].geometry.coordinates;
        return { longitude, latitude };
      } else {
        throw new Error("No coordinates found for the given address");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      Alert.alert(
        "Geocoding Error",
        "Could not find coordinates for the provided address",
      );
      return null;
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
    console.log("Form submitted:", data);
    const { email, password, userType } = data;
    let details = null;

    if (userType === "donor") {
      details = data.donorDetails;
    } else if (userType === "recipient") {
      details = data.recipientDetails;
    }

    if (details && details.location) {
      // Create full address string
      const fullAddress = `${details.location.street}, ${details.location.city}, ${details.location.state} ${details.location.zipCode}`;

      // Attempt to geocode the address
      const coordinates = await geocodeAddress(fullAddress);

      if (coordinates) {
        // Add coordinates to the location details
        details.location.coordinates = coordinates;
      }
    }
    // For individual, details remains null

    // Sign up using Supabase Auth (one argument only)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);
    if (authError) {
      console.error(authError);
      Alert.alert("Error signing up", authError.message);
      return;
    }

    const user = authData.user;
    if (!user) {
      console.error("failed user check RAHHHHH");
      Alert.alert("Error", "User data not returned after sign up");
      return;
    }

    // Build the record to insert into the "users" table.
    const userRecord = {
      id: user.id,
      email,
      user_type: userType,
      details, // donorDetails, recipientDetails, or null (if individual)
    };

    // Insert the additional user details into the "users" table.
    const { error: dbError } = await supabase
      .from("users")
      .insert([userRecord]);

    if (dbError) {
      Alert.alert("Error inserting user data", dbError.message);
    } else {
      console.log("User data inserted successfully");
      router.push("/sign-in"); // Navigate to sign-in page
    }
  };

  const onInvalid = (errors: any) =>
    Alert.alert("Validation Error", JSON.stringify(errors));

  const renderDonorFields = () => {
    if (userType !== "donor") return null;

    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Donor Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Organization Name</Text>
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="donorDetails.name"
              render={({ field: { onChange, value } }) => (
                <>
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter organization name"
                    placeholderTextColor="#A0AEC0"
                    value={value}
                    onChangeText={onChange}
                  />
                </>
              )}
            />
          </View>
        </View>

        {/* claude ai */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Establishment Type</Text>
          <Controller
            control={control}
            name="donorDetails.establishmentType"
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity
                  style={styles.dropdownContainer}
                  onPress={() => setShowEstablishmentTypeDropdown(true)}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <Text
                    style={[
                      styles.dropdownText,
                      !value && styles.dropdownPlaceholder,
                    ]}
                  >
                    {value
                      ? value.charAt(0).toUpperCase() + value.slice(1)
                      : "Select Establishment Type"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {/* Modal for Establishment Type selection */}
                <Modal
                  transparent={true}
                  visible={showEstablishmentTypeDropdown}
                  animationType="fade"
                  onRequestClose={() => setShowEstablishmentTypeDropdown(false)}
                >
                  <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowEstablishmentTypeDropdown(false)}
                  >
                    <View style={styles.dropdownModal}>
                      {["restaurant", "bakery", "grocery", "cafe", "other"].map(
                        (type) => (
                          <TouchableOpacity
                            key={type}
                            style={styles.dropdownItem}
                            onPress={() => {
                              onChange(type);
                              setShowEstablishmentTypeDropdown(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                value === type &&
                                  styles.dropdownItemTextSelected,
                              ]}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                            {value === type && (
                              <Ionicons
                                name="checkmark"
                                size={20}
                                color="#303F9F"
                              />
                            )}
                          </TouchableOpacity>
                        ),
                      )}
                    </View>
                  </TouchableOpacity>
                </Modal>
              </>
            )}
          />
        </View>

        <Text style={styles.sectionSubtitle}>Location Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Street Address</Text>
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="donorDetails.location.street"
              render={({ field: { onChange, value } }) => (
                <>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholderTextColor="#A0AEC0"
                    placeholder="Enter Street Address"
                    value={value}
                    onChangeText={onChange}
                  />
                </>
              )}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>City</Text>
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="donorDetails.location.city"
              render={({ field: { onChange, value } }) => (
                <>
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter city"
                    placeholderTextColor="#A0AEC0"
                    value={value}
                    onChangeText={onChange}
                  />
                </>
              )}
            />
          </View>
        </View>

        <View style={styles.addressRow}>
          <View style={[styles.inputGroup, styles.stateInput]}>
            <Text style={styles.inputLabel}>State</Text>
            <View style={styles.inputContainer}>
              <Controller
                control={control}
                name="donorDetails.location.state"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    placeholderTextColor="#A0AEC0"
                    autoCapitalize="characters"
                    value={value}
                    onChangeText={onChange}
                    maxLength={2}
                  />
                )}
              />
            </View>
          </View>

          <View style={[styles.inputGroup, styles.zipInput]}>
            <Text style={styles.inputLabel}>ZIP Code</Text>
            <View style={styles.inputContainer}>
              <Controller
                control={control}
                name="donorDetails.location.zipCode"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="00000"
                    placeholderTextColor="#A0AEC0"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                )}
              />
            </View>
          </View>
        </View>

        <OperatingHoursSection control={control} userType="donor" />
      </View>
    );
  };

  const renderRecipientFields = () => (
    <View style={styles.detailsContainer}>
      <Text style={styles.sectionTitle}>Recipient Details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Organization Name</Text>
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="recipientDetails.name"
            render={({ field: { onChange, value } }) => (
              <>
                <Ionicons
                  name="business-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter organization name"
                  placeholderTextColor="#A0AEC0"
                  value={value}
                  onChangeText={onChange}
                />
              </>
            )}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Storage Capacity (sq ft)</Text>
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="recipientDetails.capacity"
            render={({ field: { onChange, value } }) => (
              <>
                <Ionicons
                  name="cube-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter storage capacity"
                  placeholderTextColor="#A0AEC0"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                />
              </>
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="recipientDetails.hasRefrigeration"
        render={({ field: { onChange, value } }) => (
          <TouchableOpacity
            style={[styles.toggleCard, value && styles.toggleCardActive]}
            onPress={() => onChange(!value)}
          >
            <Ionicons
              name={value ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={value ? "#fff" : "#303F9F"}
            />
            <Text
              style={[
                styles.toggleCardText,
                value && styles.toggleCardTextActive,
              ]}
            >
              Refrigeration Available
            </Text>
          </TouchableOpacity>
        )}
      />

      <>
        <Text style={styles.sectionSubtitle}>Location Details</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Street Address</Text>
          <Controller
            control={control}
            name="recipientDetails.location.street"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter street address"
                  placeholderTextColor="#A0AEC0"
                  value={value}
                  onChangeText={onChange}
                />
              </View>
            )}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>City</Text>
          <Controller
            control={control}
            name="recipientDetails.location.city"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Ionicons
                  name="business-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter city"
                  placeholderTextColor="#A0AEC0"
                  value={value}
                  onChangeText={onChange}
                />
              </View>
            )}
          />
        </View>
        <View style={styles.addressRow}>
          <View style={[styles.inputGroup, styles.stateInput]}>
            <Text style={styles.inputLabel}>State</Text>
            <Controller
              control={control}
              name="recipientDetails.location.state"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    placeholderTextColor="#A0AEC0"
                    value={value}
                    autoCapitalize="characters"
                    maxLength={2}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
          </View>
          <View style={[styles.inputGroup, styles.zipInput]}>
            <Text style={styles.inputLabel}>ZIP Code</Text>
            <Controller
              control={control}
              name="recipientDetails.location.zipCode"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="00000"
                    placeholderTextColor="#A0AEC0"
                    value={value}
                    keyboardType="numeric"
                    maxLength={5}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
          </View>
        </View>
      </>

      <Text style={styles.sectionSubtitle}>
        Dietary Restrictions Catered To
      </Text>
      <Controller
        control={control}
        name={`recipientDetails.dietaryRestrictions`}
        render={({ field: { onChange, value } }) => (
          <View style={styles.restrictionsContainer}>
            {Object.keys(value).map((restriction) => {
              console.log(restriction);
              return (
                <TouchableOpacity
                  key={restriction}
                  style={[
                    styles.restrictionButton,
                    value[restriction] && styles.restrictionButtonActive,
                  ]}
                  onPress={() =>
                    onChange({
                      ...value,
                      [restriction]: !value[restriction],
                    })
                  }
                >
                  <Text
                    style={[
                      styles.restrictionText,
                      value[restriction] && styles.restrictionTextActive,
                    ]}
                  >
                    {restriction.charAt(0).toUpperCase() +
                      restriction.slice(1).replace(/([A-Z])/g, " $1")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />

      <OperatingHoursSection control={control} userType="donor" />
    </View>
  );

  /*return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView className="flex-1">
        <View className="px-6 py-12 flex-1">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </Text>
            <Text className="text-gray-600">Sign up to get started</Text>
          </View>
          <View className="space-y-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                User Type
              </Text>
              <Controller
                control={control}
                name="userType"
                render={({ field: { onChange, value } }) => (
                  <View className="border rounded-lg overflow-hidden">
                    <Picker selectedValue={value} onValueChange={onChange}>
                      <Picker.Item label="Individual" value="individual" />
                      <Picker.Item label="Donor" value="donor" />
                      <Picker.Item label="Recipient" value="recipient" />
                    </Picker>
                  </View>
                )}
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Email
              </Text>
              <View className="relative">
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="flex-row items-center border rounded-lg overflow-hidden">
                      <View className="p-3 bg-gray-50">
                        <MaterialIcons name="email" size={20} color="#6B7280" />
                      </View>
                      <TextInput
                        className="flex-1 p-3 text-gray-900"
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    </View>
                  )}
                />
              </View>
              {errors.email && (
                <Text className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </Text>
              )}
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="flex-row items-center border rounded-lg overflow-hidden">
                    <View className="p-3 bg-gray-50">
                      <MaterialIcons name="lock" size={20} color="#6B7280" />
                    </View>
                    <TextInput
                      className="flex-1 p-3 text-gray-900"
                      placeholder="Create a password"
                      secureTextEntry={!showPassword}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                    <TouchableOpacity
                      className="pr-3"
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialIcons
                        name={showPassword ? "visibility-off" : "visibility"}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </Text>
              )}
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="flex-row items-center border rounded-lg overflow-hidden">
                    <View className="p-3 bg-gray-50">
                      <MaterialIcons name="lock" size={20} color="#6B7280" />
                    </View>
                    <TextInput
                      className="flex-1 p-3 text-gray-900"
                      placeholder="Confirm your password"
                      secureTextEntry={!showConfirmPassword}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                    <TouchableOpacity
                      className="pr-3"
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <MaterialIcons
                        name={
                          showConfirmPassword ? "visibility-off" : "visibility"
                        }
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>
            {userType === "donor" && renderDonorFields()}
            {userType === "recipient" && renderRecipientFields()}
            <TouchableOpacity
              className="bg-blue-600 py-4 rounded-lg items-center mt-4"
              onPress={handleSubmit(onSubmit, onInvalid)}
            >
              <Text className="text-white font-semibold text-base">
                Sign Up
              </Text>
            </TouchableOpacity>
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-600">Already have an account? </Text>
              <TouchableOpacity>
                <Text className="text-blue-600 font-semibold">
                  {" "}
                  <Link href="/sign-in">Sign In</Link>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
  */

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.mainContainer}
    >
      <LinearGradient
        colors={["#F5F7FF", "#EDF0FF"]}
        style={styles.background}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Create Account</Text>
          <Text style={styles.pageSubtitle}>
            Please fill in the details below to sign up
          </Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="email@example.com"
                      placeholderTextColor="#A0AEC0"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Create a password"
                      placeholderTextColor="#A0AEC0"
                      autoCapitalize="none"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      placeholderTextColor="#A0AEC0"
                      autoCapitalize="none"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelWithTooltip}>
                <Text style={styles.inputLabel}>Account Type</Text>
                <TouchableOpacity
                  onPress={() => setShowAccountTooltip(true)}
                  style={styles.tooltipIcon}
                >
                  <Ionicons name="help-circle-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <Controller
                control={control}
                name="userType"
                render={({ field: { onChange, value } }) => (
                  <>
                    <TouchableOpacity
                      style={styles.dropdownContainer}
                      onPress={() => setShowUserTypeDropdown(true)}
                    >
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#666"
                        style={styles.inputIcon}
                      />
                      <Text style={styles.dropdownText}>
                        {value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : "Select Account Type"}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    <Modal
                      transparent={true}
                      visible={showUserTypeDropdown}
                      animationType="fade"
                      onRequestClose={() => setShowUserTypeDropdown(false)}
                    >
                      <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowUserTypeDropdown(false)}
                      >
                        <View style={styles.dropdownModal}>
                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              onChange("individual");
                              setShowUserTypeDropdown(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                value === "individual" &&
                                  styles.dropdownItemTextSelected,
                              ]}
                            >
                              Individual
                            </Text>
                            {value === "individual" && (
                              <Ionicons
                                name="checkmark"
                                size={20}
                                color="#303F9F"
                              />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              onChange("recipient");
                              setShowUserTypeDropdown(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                value === "recipient" &&
                                  styles.dropdownItemTextSelected,
                              ]}
                            >
                              Recipient Organization
                            </Text>
                            {value === "recipient" && (
                              <Ionicons
                                name="checkmark"
                                size={20}
                                color="#303F9F"
                              />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              onChange("donor");
                              setShowUserTypeDropdown(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                value === "donor" &&
                                  styles.dropdownItemTextSelected,
                              ]}
                            >
                              Donor Organization
                            </Text>
                            {value === "donor" && (
                              <Ionicons
                                name="checkmark"
                                size={20}
                                color="#303F9F"
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    </Modal>
                  </>
                )}
              />

              <Modal
                transparent={true}
                visible={showAccountTooltip}
                animationType="fade"
                onRequestClose={() => setShowAccountTooltip(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowAccountTooltip(false)}
                >
                  <View style={styles.tooltipModal}>
                    <Text style={styles.tooltipTitle}>Account Types</Text>

                    <View style={styles.tooltipItem}>
                      <Text style={styles.tooltipItemTitle}>Individual</Text>
                      <Text style={styles.tooltipItemDescription}>
                        Someone who will deliver food between donation centers
                        and recipient locations.
                      </Text>
                    </View>

                    <View style={styles.tooltipItem}>
                      <Text style={styles.tooltipItemTitle}>
                        Donor Organization
                      </Text>
                      <Text style={styles.tooltipItemDescription}>
                        Someone who will donate food to donation centers and
                        recipient locations.
                      </Text>
                    </View>

                    <View style={styles.tooltipItem}>
                      <Text style={styles.tooltipItemTitle}>
                        Recipient Organization
                      </Text>
                      <Text style={styles.tooltipItemDescription}>
                        Someone who will receive food from donation centers and
                        recipient locations.
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.tooltipCloseButton}
                      onPress={() => setShowAccountTooltip(false)}
                    >
                      <Text style={styles.tooltipCloseButtonText}>Got it</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>

            {watch("userType") === "recipient" && renderRecipientFields()}
            {watch("userType") === "donor" && renderDonorFields()}

            <TouchableOpacity
              style={[
                styles.signupButton,
                loading && styles.signupButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit, onInvalid)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.loginLinkText}>
              Already have an account?{" "}
              <Text style={styles.loginText}>
                <Link href="/sign-in">Log In</Link>
              </Text>
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 60,
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#303F9F",
    marginBottom: 8,
    marginTop: 16,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#4A5568",
    marginBottom: 32,
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    height: 54,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2D3748",
    height: "100%",
  },
  eyeIcon: {
    padding: 8,
  },
  signupButton: {
    backgroundColor: "#3949AB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 12,
    marginBottom: 16,
  },
  signupButtonDisabled: {
    backgroundColor: "#A4A6B3",
  },
  errorText: {
    color: "#E53E3E",
    fontSize: 14,
    marginTop: 4,
  },
  signupButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginLink: {
    alignItems: "center",
    marginTop: 8,
  },
  loginLinkText: {
    fontSize: 16,
    color: "#4A5568",
  },
  loginText: {
    color: "#3949AB",
    fontWeight: "600",
  },
  detailsContainer: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#303F9F",
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#4A5568",
    marginTop: 20,
    marginBottom: 12,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginVertical: 8,
  },
  toggleCardActive: {
    backgroundColor: "#3949AB",
    borderColor: "#3949AB",
  },
  toggleCardText: {
    fontSize: 16,
    color: "#4A5568",
    marginLeft: 12,
  },
  toggleCardTextActive: {
    color: "white",
  },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stateInput: {
    flex: 1,
    marginRight: 12,
  },
  zipInput: {
    flex: 2,
  },
  restrictionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  restrictionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    minWidth: "48%",
    alignItems: "center",
  },
  restrictionButtonActive: {
    backgroundColor: "#3949AB",
    borderColor: "#3949AB",
  },
  restrictionText: {
    fontSize: 14,
    color: "#4A5568",
  },
  restrictionTextActive: {
    color: "white",
  },
  dayContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 16,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
  },
  dayToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#EF5350",
  },
  dayToggleButtonActive: {
    backgroundColor: "#4CAF50",
  },
  dayToggleButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  hoursInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeInputWrapper: {
    flex: 1,
    marginRight: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: "#4A5568",
    marginBottom: 4,
    marginLeft: 4,
  },
  timeInput: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  dropdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    height: 54,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: "#2D3748",
    marginLeft: 12,
  },
  dropdownPlaceholder: {
    color: "#A0AEC0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownModal: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 8,
    width: "80%",
    maxWidth: 400,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#4A5568",
  },
  dropdownItemTextSelected: {
    color: "#303F9F",
    fontWeight: "500",
  },
  labelWithTooltip: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tooltipIcon: {
    marginLeft: 8,
    marginBottom: 7,
    padding: 2,
  },
  tooltipModal: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#303F9F",
    marginBottom: 16,
    textAlign: "center",
  },
  tooltipItem: {
    marginBottom: 16,
  },
  tooltipItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 4,
  },
  tooltipItemDescription: {
    fontSize: 14,
    color: "#4A5568",
    lineHeight: 20,
  },
  tooltipCloseButton: {
    backgroundColor: "#3949AB",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  tooltipCloseButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
