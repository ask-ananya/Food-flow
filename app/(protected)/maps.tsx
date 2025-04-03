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
import {
  AdvancedMarker,
  APIProvider,
  Map,
  MapCameraChangedEvent,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";

const key = "AIzaSyATau3A4PvELgRx3mwGx9gOxsFqBk4pGjI";

export default function Maps() {
  const [donorList, setDonorList] = useState<any>([]);
  const [recipientList, setRecipientList] = useState<any>([]);
  const [farmerList, setFarmerList] = useState<any>([]);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
      icon: "leaf", // using Ionicons 'leaf' icon
    },
    recipient: {
      background: "#34A853", // full color
      backgroundTint: "rgba(52,168,83,0.2)", // translucent tint
      glyph: "#075D18",
      icon: "people",
    },
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 bg-white max-h-[36rem]">
        <APIProvider
          apiKey={key}
          onLoad={() => console.log("Maps API has loaded.")}
        >
          <Map
            defaultZoom={11}
            defaultCenter={referenceLocation}
            mapId="8f296b347fa8f70b"
          >
            {donorList.map((donor: any) => (
              <AdvancedMarker
                key={donor.id}
                position={{
                  lat: donor.details.location.coordinates.latitude,
                  lng: donor.details.location.coordinates.longitude,
                }}
                onClick={() => {
                  setSelectedMarker(donor.id);
                }}
                clickable={true}
              >
                <Pin
                  background={typeStyles.donor.background}
                  glyphColor={typeStyles.donor.glyph}
                  borderColor={"#000"}
                />
              </AdvancedMarker>
            ))}

            {farmerList.map((farmer: any) => (
              <AdvancedMarker
                key={farmer.id}
                position={{
                  lat: farmer.details.location.coordinates.latitude,
                  lng: farmer.details.location.coordinates.longitude,
                }}
                onClick={() => {
                  setSelectedMarker(farmer.id);
                }}
                clickable={true}
              >
                <Pin
                  background={typeStyles.farmer.background}
                  glyphColor={typeStyles.farmer.glyph}
                  borderColor={"#000"}
                />
              </AdvancedMarker>
            ))}

            {recipientList.map((recipient: any) => (
              <AdvancedMarker
                key={recipient.id}
                position={{
                  lat: recipient.details.location.coordinates.latitude,
                  lng: recipient.details.location.coordinates.longitude,
                }}
                onClick={() => {
                  setSelectedMarker(recipient.id);
                }}
                clickable={true}
              >
                <Pin
                  background={typeStyles.recipient.background}
                  glyphColor={typeStyles.recipient.glyph}
                  borderColor={"#000"}
                />
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>
      </View>

      <View className="w-full h-1 bg-primary rounded-xl" />

      <ScrollView className="p-4 max-h-[24rem]">
        {/* Title with marker icon */}
        <View className="flex-row items-center mb-4">
          <Ionicons
            name="location-outline"
            size={24}
            color="#000"
            style={{ marginRight: 8 }}
          />
          <Text className="text-2xl font-bold">Markers</Text>
        </View>
        {/* Search Bar */}
        <View className="flex-row items-center border border-gray-300 rounded-xl mb-4 p-2">
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
            className="flex-1"
          />
        </View>

        {/* Marker List */}
        {filteredMarkers.length === 0 ? (
          <Text className="text-center text-gray-500">No results found.</Text>
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
                className="flex-row items-center justify-between mb-4 p-4 rounded-xl shadow"
                style={{
                  backgroundColor: typeStyles[marker.type].backgroundTint,
                  borderColor: typeStyles[marker.type].background,
                  borderWidth: 2,
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={typeStyles[marker.type].icon}
                    size={24}
                    color={typeStyles[marker.type].glyph}
                    style={{ marginRight: 8 }}
                  />
                  <View>
                    <Text
                      className="text-lg"
                      style={{
                        fontWeight: "500",
                        color: typeStyles[marker.type].background,
                      }}
                    >
                      {marker.details.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color="#000"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={{ color: "#000" }}>{address}</Text>
                    </View>
                    <View className="flex-row items-center mt-1">
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
    </View>
  );
}
