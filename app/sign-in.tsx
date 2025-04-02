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
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Link } from "expo-router";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TouchableWithoutFeedback } from "react-native";
import { Keyboard } from "react-native";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator } from "react-native";
import { Dimensions } from "react-native";
import { StyleSheet } from "react-native";
import { Button } from "@/components/ui/button";
import { Pressable } from "react-native";
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

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
    setLoading(true);
    setAuthError(null); // Clear previous errors
    const { email, password } = data;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
      setLoading(false);
      return;
    }

    // Successful sign in
    setLoading(false);
    router.push("/home");
  };

  const onInvalid = (errors: any) =>
    Alert.alert("Validation Error", JSON.stringify(errors));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.mainContainer}
    >
      <LinearGradient
        colors={["#F5F7FF", "#EDF0FF"]}
        style={styles.background}
      />

      <SafeAreaView style={styles.container}>
        <Pressable
          onPress={() => {
            router.push("/");
          }}
          className="flex flex-row items-center gap-1 mb-4"
        >
          <Ionicons
            name="arrow-up"
            size={18}
            color="gray"
            className="-rotate-90 text-zinc-500"
          />
        </Pressable>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24, // Ensure the content is centered vertically
          }}
        >
          {/* Logo and Branding */}
          <View style={styles.brandContainer}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logo}
            />
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandTitle}>FoodFlow</Text>
              <Text style={styles.brandSlogan}>Food Donation. Done right.</Text>
            </View>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <>
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
                        onChangeText={(text) => {
                          onChange(text);
                          setAuthError(null);
                        }}
                        onBlur={onBlur}
                      />
                    </>
                  )}
                />
              </View>
              {errors.email && (
                <Text style={{ color: "red", marginTop: 4 }}>
                  {errors.email.message}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#666"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#A0AEC0"
                        autoCapitalize="none"
                        secureTextEntry={!showPassword}
                        value={value}
                        onChangeText={(text) => {
                          onChange(text);
                          setAuthError(null);
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={
                            showPassword ? "eye-off-outline" : "eye-outline"
                          }
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </>
                  )}
                />
              </View>
              {errors.password && (
                <Text style={{ color: "red", marginTop: 4 }}>
                  {errors.password.message}
                </Text>
              )}
            </View>

            <TouchableOpacity style={styles.forgotPasswordLink}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit, onInvalid)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {authError && <Text style={styles.errorText}>{authError}</Text>}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 24,
              }}
            >
              <Text style={{ color: "#4A5568" }}>Don't have an account?</Text>
              <TouchableOpacity>
                <Text
                  style={{
                    color: "#3949AB",
                    fontWeight: "600",
                    marginLeft: 4,
                  }}
                >
                  <Link href="/sign-up">Sign Up</Link>
                </Text>
              </TouchableOpacity>
            </View>
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
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "#3949AB",
    padding: 2,
    margin: 10,
  },
  brandTextContainer: {
    marginLeft: 10,
  },
  brandTitle: {
    fontWeight: "bold",
    fontSize: 28,
    color: "#303F9F",
    textAlign: "left",
  },
  brandSlogan: {
    fontSize: 16,
    maxWidth: 200,
    color: "#4A5568",
    textAlign: "left",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
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
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#3949AB",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
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
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: "#A4A6B3",
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  signupContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  signupText: {
    fontSize: 16,
    color: "#4A5568",
  },
  signupLink: {
    color: "#3949AB",
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 8,
  },
});
