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
import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { OperatingHoursSection } from "./operating-hours";
import { supabase } from "@/lib/supabase";
import { Link, useRouter } from "expo-router";

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
          address
        )}&size=1`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
          },
        }
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
        "Could not find coordinates for the provided address"
      );
      return null;
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
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

    if (authError) {
      Alert.alert("Error signing up", authError.message);
      return;
    }

    const user = authData.user;
    if (!user) {
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

  const renderDonorFields = () => (
    <View className="space-y-6">
      <Text className="text-xl font-bold text-gray-900">Donor Details</Text>
      <View className="space-y-2">
        <Text className="text-sm font-medium text-gray-700">
          Organization Name
        </Text>
        <Controller
          control={control}
          name="donorDetails.name"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="p-3 border rounded-lg"
              placeholder="Organization name"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
      </View>
      <View className="space-y-2">
        <Text className="text-sm font-medium text-gray-700">
          Establishment Type
        </Text>
        <Controller
          control={control}
          name="donorDetails.establishmentType"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="p-3 border rounded-lg"
              placeholder="Type of establishment"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
      </View>
      <View className="space-y-4">
        <Text className="text-lg font-semibold text-gray-900">Location</Text>
        <Controller
          control={control}
          name="donorDetails.location.street"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="p-3 border rounded-lg mb-2"
              placeholder="Street Address"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        <View className="flex-row space-x-2">
          <View className="flex-1">
            <Controller
              control={control}
              name="donorDetails.location.city"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="p-3 border rounded-lg"
                  placeholder="City"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>
          <View className="w-20">
            <Controller
              control={control}
              name="donorDetails.location.state"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="p-3 border rounded-lg"
                  placeholder="State"
                  value={value}
                  onChangeText={onChange}
                  maxLength={2}
                />
              )}
            />
          </View>
          <View className="w-24">
            <Controller
              control={control}
              name="donorDetails.location.zipCode"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="p-3 border rounded-lg"
                  placeholder="ZIP"
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

  const renderRecipientFields = () => (
    <View className="space-y-6">
      <Text className="text-xl font-bold text-gray-900">Recipient Details</Text>
      <View className="space-y-2">
        <Text className="text-sm font-medium text-gray-700">
          Organization Name
        </Text>
        <Controller
          control={control}
          name="recipientDetails.name"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="p-3 border rounded-lg"
              placeholder="Organization name"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
      </View>
      <View className="space-y-2">
        <Text className="text-sm font-medium text-gray-700">Capacity</Text>
        <Controller
          control={control}
          name="recipientDetails.capacity"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="p-3 border rounded-lg"
              placeholder="Square Footage"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
            />
          )}
        />
      </View>
      <View className="space-y-2">
        <Text className="text-sm font-medium text-gray-700">
          Has Refrigeration
        </Text>
        <Controller
          control={control}
          name="recipientDetails.hasRefrigeration"
          render={({ field: { onChange, value } }) => (
            <Switch value={value} onValueChange={onChange} />
          )}
        />
      </View>
      <View className="space-y-4">
        <Text className="text-lg font-semibold text-gray-900">Location</Text>
        <Controller
          control={control}
          name="recipientDetails.location.street"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="p-3 border rounded-lg mb-2"
              placeholder="Street Address"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        <View className="flex-row space-x-2">
          <View className="flex-1">
            <Controller
              control={control}
              name="recipientDetails.location.city"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="p-3 border rounded-lg"
                  placeholder="City"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>
          <View className="w-20">
            <Controller
              control={control}
              name="recipientDetails.location.state"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="p-3 border rounded-lg"
                  placeholder="State"
                  value={value}
                  onChangeText={onChange}
                  maxLength={2}
                />
              )}
            />
          </View>
          <View className="w-24">
            <Controller
              control={control}
              name="recipientDetails.location.zipCode"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="p-3 border rounded-lg"
                  placeholder="ZIP"
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
      <View className="space-y-4">
        <Text className="text-lg font-semibold text-gray-900">
          Dietary Restrictions
        </Text>
        {Object.entries({
          halal: "Halal",
          kosher: "Kosher",
          vegetarian: "Vegetarian",
          vegan: "Vegan",
          glutenFree: "Gluten Free",
          dairyFree: "Dairy Free",
        }).map(([key, label]) => (
          <View key={key} className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-gray-700">{label}</Text>
            <Controller
              control={control}
              name={`recipientDetails.dietaryRestrictions.${key}`}
              render={({ field: { onChange, value } }) => (
                <Switch value={value} onValueChange={onChange} />
              )}
            />
          </View>
        ))}
      </View>
      <OperatingHoursSection control={control} userType="recipient" />
    </View>
  );

  return (
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
            {/* User Type Selection */}
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
            {/* Email Field */}
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
            {/* Password Fields */}
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
            {/* Conditional Fields */}
            {userType === "donor" && renderDonorFields()}
            {userType === "recipient" && renderRecipientFields()}
            {/* Submit Button */}
            <TouchableOpacity
              className="bg-blue-600 py-4 rounded-lg items-center mt-4"
              onPress={handleSubmit(onSubmit, onInvalid)}
            >
              <Text className="text-white font-semibold text-base">
                Sign Up
              </Text>
            </TouchableOpacity>
            {/* Sign In Link */}
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
}
