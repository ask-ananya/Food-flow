import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Layout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="weather"
        options={{
          tabBarShowLabel: true,

          title: "Weather",
          tabBarIcon: ({ size, focused, color }) => {
            return (
              <Ionicons
                name={focused ? "sunny" : "sunny-outline"}
                size={27}
                color="#303F9F"
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          title: "Maps",
          tabBarShowLabel: true,
          tabBarIcon: ({ size, focused, color }) => {
            return (
              <Ionicons
                name={focused ? "location" : "location-outline"}
                size={27}
                color="#303F9F"
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          tabBarShowLabel: true,

          title: "Home",
          tabBarIcon: ({ size, focused, color }) => {
            return (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={27}
                color="#303F9F"
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          tabBarShowLabel: true,

          title: "Marketplace",
          tabBarIcon: ({ size, focused, color }) => {
            return (
              <Ionicons
                name={focused ? "storefront" : "storefront-outline"}
                size={27}
                color="#303F9F"
              />
            );
          },
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarShowLabel: true,
          tabBarIcon: ({ size, focused, color }) => {
            return (
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={27}
                color="#303F9F"
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="details"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
