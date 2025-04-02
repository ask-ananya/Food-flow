import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Layout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarShowLabel: false,

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
        name="history"
        options={{
          tabBarShowLabel: false,

          title: "History",
          tabBarIcon: ({ size, focused, color }) => {
            return (
              <Ionicons
                name={focused ? "time" : "time-outline"}
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
          tabBarShowLabel: false,
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
