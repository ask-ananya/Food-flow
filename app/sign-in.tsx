import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Link } from "expo-router";
import { useRouter } from "expo-router";
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setAuthError(null); // Clear previous errors
    const { email, password } = data;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    // Successful sign in
    router.push("/home");
  };

  const onInvalid = (errors: any) =>
    Alert.alert("Validation Error", JSON.stringify(errors));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView className="flex-1">
        <View className="px-6 py-12 flex-1">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </Text>
            <Text className="text-gray-600">Sign in to continue</Text>
          </View>

          <View className="space-y-6">
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
                        onChangeText={(text) => {
                          onChange(text);
                          setAuthError(null); // Clear error when typing
                        }}
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

            {/* Password Field */}
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
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        setAuthError(null); // Clear error when typing
                      }}
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

            {/* Authentication Error Display */}
            {authError && (
              <View className="bg-red-50 p-3 rounded-lg border border-red-200">
                <Text className="text-red-600 text-sm text-center">
                  {authError}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-blue-600 py-4 rounded-lg items-center mt-4"
              onPress={handleSubmit(onSubmit, onInvalid)}
            >
              <Text className="text-white font-semibold text-base">
                Sign In
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-600">Don't have an account? </Text>
              <TouchableOpacity>
                <Text className="text-blue-600 font-semibold">
                  {" "}
                  <Link href="/sign-up">Sign Up</Link>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
