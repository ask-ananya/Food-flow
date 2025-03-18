import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Controller, useWatch } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";
import { StyleSheet } from "react-native";

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const OperatingHoursSection = ({
  control,
  userType,
}: {
  control: any;
  userType: "donor" | "recipient";
}) => {
  const baseField = userType === "donor" ? "donorDetails" : "recipientDetails";

  return (
    <View>
      <Text style={styles.sectionSubtitle}>Operating Hours</Text>
      {days.map((day) => {
        const isAvailable = useWatch({
          control,
          name: `${baseField}.operatingHours.${day}.available`,
        });

        return (
          <View key={day} style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayText}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </Text>

              <Controller
                control={control}
                name={`${baseField}.operatingHours.${day}.available`}
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    style={[
                      styles.dayToggleButton,
                      value && styles.dayToggleButtonActive,
                    ]}
                    onPress={() => {
                      onChange(!value);
                    }}
                  >
                    <Text style={styles.dayToggleButtonText}>
                      {value ? "Available" : "Closed"}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            {isAvailable && (
              <View style={styles.hoursInputContainer}>
                <View style={styles.timeInputWrapper}>
                  <Text style={styles.timeLabel}>Open</Text>
                  <Controller
                    control={control}
                    name={`${baseField}.operatingHours.${day}.open`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.timeInput}
                        placeholder="9:00 AM"
                        placeholderTextColor="#A0AEC0"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                </View>

                <View style={styles.timeInputWrapper}>
                  <Text style={styles.timeLabel}>Close</Text>
                  <Controller
                    control={control}
                    name={`${baseField}.operatingHours.${day}.close`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.timeInput}
                        placeholder="5:00 PM"
                        placeholderTextColor="#A0AEC0"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

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
