import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import React, { useEffect, useState } from "react";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { router, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

const key = "AIzaSyATau3A4PvELgRx3mwGx9gOxsFqBk4pGjI"; // Not needed for react-native-maps

export default function Maps() {
  const [donorList, setDonorList] = useState([]);
  const [farmerList, setFarmerList] = useState([]);
  const [recipientList, setRecipientList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // listen for keyboard appearance
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    loadPublicDonors();
    loadPublicRecipients();
    loadPublicFarmers();
  }, []);

  const loadPublicDonors = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_type", "donor");
      if (error) throw error;
      setDonorList(data);
    } catch (error) {
      console.error("Error loading public donors:", error);
    }
  };

  const loadPublicFarmers = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_type", "farmer");
      if (error) throw error;
      setFarmerList(data);
    } catch (error) {
      console.error("Error loading public farmers:", error);
    }
  };

  const loadPublicRecipients = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_type", "recipient");
    if (error) throw error;
    setRecipientList(data);
  };

  // Haversine formula to calculate distance (in miles)
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Estimate driving time (in minutes) assuming an average speed of 40 mph
  const getDriveTime = (distance) => {
    const speed = 40; // mph
    const timeInHours = distance / speed;
    return Math.round(timeInHours * 60);
  };

  // Reference location (using the map's default center)
  const referenceLocation = { lat: 40.5169, lng: -74.4063 };

  // Combine all markers with a type property
  const markers = [
    ...donorList.map((marker) => ({ ...marker, type: "donor" })),
    ...farmerList.map((marker) => ({ ...marker, type: "farmer" })),
    ...recipientList.map((marker) => ({ ...marker, type: "recipient" })),
  ];

  // Filter markers based on search query (by name or address)
  const filteredMarkers = markers.filter((marker) => {
    const name = marker.details.name.toLowerCase();
    const address =
      `${marker.details.location.street} ${marker.details.location.city}`.toLowerCase();
    return (
      name.includes(searchQuery.toLowerCase()) ||
      address.includes(searchQuery.toLowerCase())
    );
  });
  const mapFlex = keyboardVisible ? 0.6 : 0.6;
  // Color and icon mapping based on marker type
  const typeStyles = {
    donor: {
      background: "#EA4335", // full color
      backgroundTint: "rgba(234,67,53,0.2)", // translucent tint
      glyph: "#960A0A",
      icon: "storefront",
    },
    farmer: {
      background: "#FFA500", // full color
      backgroundTint: "rgba(255,165,0,0.2)", // translucent tint
      glyph: "#874C0A",
      icon: "leaf",
    },
    recipient: {
      background: "#34A853", // full color
      backgroundTint: "rgba(52,168,83,0.2)", // translucent tint
      glyph: "#075D18",
      icon: "people",
    },
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "white" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Map Section */}
      <Animated.View style={{ flex: mapFlex }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: 40.5169,
            longitude: -74.4063,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {donorList.map((donor: any) => (
            <Marker
              key={donor.id}
              coordinate={{
                latitude: donor.details.location.coordinates.latitude,
                longitude: donor.details.location.coordinates.longitude,
              }}
              onPress={() => setSelectedMarker(donor.id)}
            >
              <View
                style={{
                  backgroundColor: typeStyles.donor.background,
                }}
                className="rounded-full p-2"
              >
                <Ionicons
                  name={typeStyles.donor.icon}
                  size={16}
                  color="white"
                />
              </View>
            </Marker>
          ))}
          {farmerList.map((farmer: any) => (
            <Marker
              key={farmer.id}
              coordinate={{
                latitude: farmer.details.location.coordinates.latitude,
                longitude: farmer.details.location.coordinates.longitude,
              }}
              onPress={() => setSelectedMarker(farmer.id)}
            >
              <View
                style={{
                  backgroundColor: typeStyles.farmer.background,
                }}
                className="rounded-full p-2"
              >
                <Ionicons
                  name={typeStyles.farmer.icon}
                  size={16}
                  color="white"
                />
              </View>
            </Marker>
          ))}
          {recipientList.map((donor: any) => (
            <Marker
              key={donor.id}
              coordinate={{
                latitude: donor.details.location.coordinates.latitude,
                longitude: donor.details.location.coordinates.longitude,
              }}
              onPress={() => setSelectedMarker(donor.id)}
            >
              <View
                style={{
                  backgroundColor: typeStyles.recipient.background,
                }}
                className="rounded-full p-2"
              >
                <Ionicons
                  name={typeStyles.recipient.icon}
                  size={16}
                  color="white"
                />
              </View>
            </Marker>
          ))}
        </MapView>
      </Animated.View>

      {/* Divider */}
      <View
        style={{
          width: "100%",
          height: 4,
          backgroundColor: "#4760c9",
          borderRadius: 8,
          marginVertical: 8,
        }}
      />

      {/* Marker List Section */}
      <ScrollView style={{ padding: 16, maxHeight: 240 }}>
        {/* Title with marker icon */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Ionicons
            name="location-outline"
            size={24}
            color="#000"
            style={{ marginRight: 8 }}
          />
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Locations</Text>
        </View>
        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "gray",
            borderRadius: 12,
            marginBottom: 16,
            padding: 8,
          }}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color="gray"
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search markers..."
            style={{ flex: 1 }}
          />
        </View>

        {/* Marker List */}
        {filteredMarkers.length === 0 ? (
          <Text style={{ textAlign: "center", color: "gray" }}>
            No results found.
          </Text>
        ) : (
          filteredMarkers.map((marker) => {
            const lat = marker.details.location.coordinates.latitude;
            const lng = marker.details.location.coordinates.longitude;
            const distance = haversineDistance(
              referenceLocation.lat,
              referenceLocation.lng,
              lat,
              lng
            );
            const driveTime = getDriveTime(distance);
            const address = `${marker.details.location.street}, ${marker.details.location.city}`;
            return (
              <View
                key={marker.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: typeStyles[marker.type].backgroundTint,
                  borderColor: typeStyles[marker.type].background,
                  borderWidth: 2,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name={typeStyles[marker.type].icon}
                    size={24}
                    color={typeStyles[marker.type].glyph}
                    style={{ marginRight: 8 }}
                  />
                  <View>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "500",
                        color: typeStyles[marker.type].background,
                      }}
                    >
                      {marker.details.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 4,
                      }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color="#000"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={{ color: "#000" }}>{address}</Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 4,
                      }}
                    >
                      <Ionicons
                        name="car-sport-outline"
                        size={16}
                        color="#000"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={{ color: "#000" }}>
                        {distance.toFixed(1)} miles away – approx {driveTime}{" "}
                        min drive
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
