import { View, Text, Switch } from "react-native";
import { Controller } from "react-hook-form";
import { TextInput } from "react-native";

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
  const toggleField = "available";
  const toggleLabel = "Available";

  return (
    <View className="space-y-4">
      <Text className="text-lg font-semibold text-gray-900">
        Operating Hours
      </Text>
      {days.map((day) => (
        <View key={day} className="space-y-2">
          <Text className="capitalize text-sm font-medium text-gray-700">
            {day}
          </Text>
          <View className="flex-row items-center space-x-4">
            <View className="flex-1">
              <Controller
                control={control}
                name={`${baseField}.operatingHours.${day}.open`}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="p-2 border rounded"
                    placeholder="Open time"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name={`${baseField}.operatingHours.${day}.close`}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="p-2 border rounded"
                    placeholder="Close time"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
            <Controller
              control={control}
              name={`${baseField}.operatingHours.${day}.${toggleField}`}
              render={({ field: { onChange, value } }) => (
                <View className="flex-row items-center space-x-2">
                  <Text>{toggleLabel}</Text>
                  <Switch value={value} onValueChange={onChange} />
                </View>
              )}
            />
          </View>
        </View>
      ))}
    </View>
  );
};
