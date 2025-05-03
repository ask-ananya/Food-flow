import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Progress from "react-native-progress";

// Directly set your API keys here using the new format
const WEATHER_API_KEY = "5e415c92fe7b4134be115656250304";
const GEMINI_API_KEY = "AIzaSyDk8chEARt0S8mZbQIhFW7z3KAknaA-TdQ";

// Initialize Gemini AI using the key directly from our constant
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Weather condition to icon and color mapping
const weatherIcons = {
  // Sunny / Clear
  sunny: { icon: "sunny-outline", gradient: ["#FF9500", "#FFCC00"] },
  clear: { icon: "sunny-outline", gradient: ["#FF9500", "#FFCC00"] },

  // Cloudy
  cloudy: { icon: "cloudy-outline", gradient: ["#607D8B", "#90A4AE"] },
  "partly cloudy": {
    icon: "partly-sunny-outline",
    gradient: ["#78909C", "#B0BEC5"],
  },
  overcast: { icon: "cloud-outline", gradient: ["#546E7A", "#78909C"] },

  // Rainy
  rain: { icon: "rainy-outline", gradient: ["#0288D1", "#4FC3F7"] },
  drizzle: { icon: "rainy-outline", gradient: ["#0288D1", "#4FC3F7"] },
  "light rain": { icon: "rainy-outline", gradient: ["#0288D1", "#4FC3F7"] },
  "moderate rain": { icon: "rainy-outline", gradient: ["#0277BD", "#29B6F6"] },
  "heavy rain": {
    icon: "thunderstorm-outline",
    gradient: ["#01579B", "#039BE5"],
  },

  // Stormy
  thunderstorm: {
    icon: "thunderstorm-outline",
    gradient: ["#1A237E", "#3949AB"],
  },
  thunder: { icon: "thunderstorm-outline", gradient: ["#1A237E", "#3949AB"] },

  // Snowy
  snow: { icon: "snow-outline", gradient: ["#78909C", "#CFD8DC"] },
  blizzard: { icon: "snow-outline", gradient: ["#546E7A", "#B0BEC5"] },

  // Foggy
  fog: { icon: "water-outline", gradient: ["#9E9E9E", "#BDBDBD"] },
  mist: { icon: "water-outline", gradient: ["#9E9E9E", "#BDBDBD"] },

  // Default
  default: { icon: "partly-sunny-outline", gradient: ["#3949AB", "#5C6BC0"] },
};

// Get weather icon and gradient based on condition text
const getWeatherStyle = (conditionText) => {
  const lowerCondition = conditionText.toLowerCase();

  // Find the matching condition
  for (const [condition, style] of Object.entries(weatherIcons)) {
    if (lowerCondition.includes(condition)) {
      return style;
    }
  }

  // Return default if no match
  return weatherIcons.default;
};

// Get color based on temperature
const getTempColor = (temp) => {
  if (temp < 0) return "#3F51B5"; // Very cold - blue
  if (temp < 10) return "#2196F3"; // Cold - light blue
  if (temp < 20) return "#4CAF50"; // Cool - green
  if (temp < 30) return "#FF9800"; // Warm - orange
  return "#F44336"; // Hot - red
};

// Get color based on UV index
const getUVColor = (uv) => {
  if (uv < 3) return "#4CAF50"; // Low - green
  if (uv < 6) return "#FF9800"; // Moderate - orange
  if (uv < 8) return "#F44336"; // High - red
  return "#9C27B0"; // Very high - purple
};

// Get color based on humidity
const getHumidityColor = (humidity) => {
  if (humidity < 30) return "#FFEB3B"; // Dry - yellow
  if (humidity < 60) return "#4CAF50"; // Comfortable - green
  return "#2196F3"; // Humid - blue
};

// Get color based on rain chance
const getRainChanceColor = (chance) => {
  if (chance < 20) return "#4CAF50"; // Low chance - green
  if (chance < 50) return "#FF9800"; // Medium chance - orange
  return "#F44336"; // High chance - red
};

// Get wind direction arrow
const getWindDirectionIcon = (direction) => {
  const directions = {
    N: "arrow-up-outline",
    NNE: "arrow-up-outline",
    NE: "arrow-up-outline",
    ENE: "arrow-up-outline",
    E: "arrow-forward-outline",
    ESE: "arrow-forward-outline",
    SE: "arrow-down-outline",
    SSE: "arrow-down-outline",
    S: "arrow-down-outline",
    SSW: "arrow-down-outline",
    SW: "arrow-down-outline",
    WSW: "arrow-back-outline",
    W: "arrow-back-outline",
    WNW: "arrow-back-outline",
    NW: "arrow-up-outline",
    NNW: "arrow-up-outline",
  };

  return directions[direction] || "navigate-outline";
};

export default function Weather() {
  const location = {
    latitude: 40.2685, // Example coordinates for TCNJ
    longitude: -74.7776,
  };
  const [weatherData, setWeatherData] = useState(null);
  const [farmingInsights, setFarmingInsights] = useState("");
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    const fetchWeatherAndInsights = async () => {
      if (location) {
        try {
          // Build the WeatherAPI URL using the constant API key
          const weatherApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${location.latitude},${location.longitude}&days=3&aqi=no&alerts=no`;

          // Use Thingproxy to bypass CORS issues
          const proxyUrl = `https://thingproxy.freeboard.io/fetch/${weatherApiUrl}`;

          const weatherResponse = await fetch(proxyUrl);
          const weather = await weatherResponse.json();
          setWeatherData(weather);
          setLoading(false);

          // Generate farming insights by passing in relevant data to Gemini AI
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const prompt = `Provide farming insights for location (${
            location.latitude
          }, ${location.longitude}) (TCNJ) based on the weather data:
          
Location: ${weather.location.name}, ${weather.location.region}, ${
            weather.location.country
          }
Local Time: ${weather.location.localtime}

Current Weather:
- Temperature: ${weather.current.temp_c}°C (${weather.current.temp_f}°F)
- Feels Like: ${weather.current.feelslike_c}°C (${
            weather.current.feelslike_f
          }°F)
- Condition: ${weather.current.condition.text}
- Humidity: ${weather.current.humidity}%
- Wind: ${weather.current.wind_kph} kph (or ${
            weather.current.wind_mph
          } mph) from ${weather.current.wind_dir}
- Precipitation: ${weather.current.precip_mm}mm
- UV Index: ${weather.current.uv}

Forecast (next 3 days):
${weather.forecast.forecastday
  .map(
    (day) =>
      `Date: ${day.date}, Temp: ${day.day.mintemp_c}°C - ${day.day.maxtemp_c}°C, Rain Chance: ${day.day.daily_chance_of_rain}%`
  )
  .join("\n")}

Based on the above, provide brief farming insights and recommendations (max 3-4 concise points). Format each point with an emoji at the beginning.`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          setFarmingInsights(response.text());
          setInsightsLoading(false);
        } catch (error) {
          console.error("Error fetching data:", error);
          setLoading(false);
          setInsightsLoading(false);
        }
      }
    };

    fetchWeatherAndInsights();
  }, []);

  if (loading || !weatherData) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <LinearGradient
          colors={["#3949AB", "#5C6BC0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="w-full px-4 py-4"
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              className="bg-white/30 rounded-full p-2"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold ml-4">
              Weather & Farming Insights
            </Text>
          </View>
        </LinearGradient>

        <View className="flex-1 items-center justify-center">
          <View className="items-center">
            <Ionicons name="cloud-outline" size={64} color="#3949AB" />
            <Text className="text-xl font-semibold text-gray-700 mt-4">
              Loading Weather Data
            </Text>
            <Progress.Bar
              indeterminate={true}
              width={200}
              color="#3949AB"
              className="mt-4"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Get weather style based on current condition
  const currentCondition = weatherData.current.condition.text;
  const weatherStyle = getWeatherStyle(currentCondition);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" />

      {/* Header with dynamic gradient based on weather */}

      <ScrollView className="flex-1">
        {/* Current Weather Hero Section */}

        <LinearGradient
          colors={weatherStyle.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="w-full px-4 py-6"
        >
          <View className="items-center">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-2xl font-bold flex-1 text-center mt-4">
                Weather & Farming Insights
              </Text>
            </View>
            <Text className="text-white text-lg font-medium">
              {weatherData.location.name}, {weatherData.location.region}
            </Text>
            <Text className="text-white/80 text-sm mb-4">
              {new Date(weatherData.location.localtime).toLocaleString()}
            </Text>

            <Ionicons
              name={weatherStyle.icon}
              size={80}
              color="white"
              className="mb-2"
            />

            <Text className="text-white text-5xl font-bold">
              {weatherData.current.temp_c}°C
            </Text>

            <Text className="text-white text-xl mb-2">
              {weatherData.current.condition.text}
            </Text>

            <Text className="text-white/80">
              Feels like {weatherData.current.feelslike_c}°C
            </Text>
          </View>

          {/* Weather Details Row */}
          <View className="flex-row justify-between mt-6 bg-white/20 rounded-xl p-4">
            <View className="items-center">
              <Ionicons name="water-outline" size={24} color="white" />
              <Text className="text-white text-xs mt-1">Humidity</Text>
              <Text className="text-white font-bold">
                {weatherData.current.humidity}%
              </Text>
            </View>

            <View className="items-center">
              <Ionicons name="speedometer-outline" size={24} color="white" />
              <Text className="text-white text-xs mt-1">Pressure</Text>
              <Text className="text-white font-bold">
                {weatherData.current.pressure_mb} mb
              </Text>
            </View>

            <View className="items-center">
              <Ionicons
                name={getWindDirectionIcon(weatherData.current.wind_dir)}
                size={24}
                color="white"
              />
              <Text className="text-white text-xs mt-1">Wind</Text>
              <Text className="text-white font-bold">
                {weatherData.current.wind_kph} kph
              </Text>
            </View>

            <View className="items-center">
              <Ionicons name="sunny-outline" size={24} color="white" />
              <Text className="text-white text-xs mt-1">UV Index</Text>
              <Text className="text-white font-bold">
                {weatherData.current.uv}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Forecast Tabs */}
        <View className="bg-white rounded-xl mx-4 mt-4 shadow-sm overflow-hidden">
          <View className="flex-row border-b border-gray-200">
            {weatherData.forecast.forecastday.map((day, index) => (
              <TouchableOpacity
                key={day.date}
                className={`flex-1 py-3 ${
                  activeTab === index ? "border-b-2" : ""
                }`}
                style={{ borderBottomColor: weatherStyle.gradient[0] }}
                onPress={() => setActiveTab(index)}
              >
                <Text
                  className={`text-center font-medium ${
                    activeTab === index ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  {index === 0
                    ? "Today"
                    : new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Forecast Content */}
          {weatherData.forecast.forecastday.map((day, index) => (
            <View
              key={`content-${day.date}`}
              className={`p-4 ${activeTab === index ? "block" : "hidden"}`}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Ionicons
                    name={getWeatherStyle(day.day.condition.text).icon}
                    size={36}
                    color={getWeatherStyle(day.day.condition.text).gradient[0]}
                  />
                  <View className="ml-3">
                    <Text className="text-lg font-semibold text-gray-800">
                      {day.day.condition.text}
                    </Text>
                    <Text className="text-gray-600">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-xl font-bold text-gray-800">
                    {day.day.maxtemp_c}°C
                  </Text>
                  <Text className="text-gray-500">{day.day.mintemp_c}°C</Text>
                </View>
              </View>

              {/* Hourly Forecast */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {day.hour
                  .filter((_, i) => i % 3 === 0) // Show every 3 hours
                  .map((hour) => {
                    const hourTime = new Date(hour.time);
                    const hourStyle = getWeatherStyle(hour.condition.text);
                    return (
                      <View
                        key={hour.time}
                        className="items-center mr-4 bg-gray-50 rounded-lg p-3 w-20"
                      >
                        <Text className="text-gray-500 text-xs">
                          {hourTime.getHours()}:00
                        </Text>
                        <Ionicons
                          name={hourStyle.icon}
                          size={24}
                          color={hourStyle.gradient[0]}
                          className="my-2"
                        />
                        <Text className="text-gray-800 font-medium">
                          {hour.temp_c}°C
                        </Text>
                      </View>
                    );
                  })}
              </ScrollView>

              {/* Details Grid */}
              <View className="bg-gray-50 rounded-xl p-4">
                <View className="flex-row flex-wrap justify-between">
                  <View className="w-[48%] bg-white rounded-lg p-3 mb-3">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="rainy-outline"
                        size={20}
                        color={getRainChanceColor(day.day.daily_chance_of_rain)}
                      />
                      <Text className="text-gray-600 text-xs ml-2">
                        Rain Chance
                      </Text>
                    </View>
                    <Text className="text-gray-800 font-bold mt-1">
                      {day.day.daily_chance_of_rain}%
                    </Text>
                  </View>

                  <View className="w-[48%] bg-white rounded-lg p-3 mb-3">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="water-outline"
                        size={20}
                        color={getHumidityColor(day.day.avghumidity)}
                      />
                      <Text className="text-gray-600 text-xs ml-2">
                        Humidity
                      </Text>
                    </View>
                    <Text className="text-gray-800 font-bold mt-1">
                      {day.day.avghumidity}%
                    </Text>
                  </View>

                  <View className="w-[48%] bg-white rounded-lg p-3 mb-3">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="sunny-outline"
                        size={20}
                        color={getUVColor(day.day.uv)}
                      />
                      <Text className="text-gray-600 text-xs ml-2">
                        UV Index
                      </Text>
                    </View>
                    <Text className="text-gray-800 font-bold mt-1">
                      {day.day.uv}
                    </Text>
                  </View>

                  <View className="w-[48%] bg-white rounded-lg p-3 mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="eye-outline" size={20} color="#3949AB" />
                      <Text className="text-gray-600 text-xs ml-2">
                        Visibility
                      </Text>
                    </View>
                    <Text className="text-gray-800 font-bold mt-1">
                      {day.day.avgvis_km} km
                    </Text>
                  </View>
                </View>

                {/* Sunrise/Sunset */}
                <View className="flex-row justify-between mt-2">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="sunny-outline"
                      size={20}
                      className="text-primary mr-2"
                    />

                    <View>
                      <Text className="text-gray-500 text-xs">Sunrise</Text>
                      <Text className="text-gray-800 font-medium">
                        {day.astro.sunrise}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <View>
                      <Text className="text-gray-500 text-xs text-right">
                        Sunset
                      </Text>
                      <Text className="text-gray-800 font-medium">
                        {day.astro.sunset}
                      </Text>
                    </View>
                    <Ionicons
                      name="moon-outline"
                      size={20}
                      className="text-primary ml-2"
                    />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Farming Insights */}
        <View className="bg-white rounded-xl mx-4 my-4 shadow-sm overflow-hidden">
          <LinearGradient
            colors={["#4CAF50", "#81C784"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="px-4 py-3"
          >
            <View className="flex-row items-center p-2">
              <Ionicons name="leaf-outline" size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                FARMING INSIGHTS
              </Text>
            </View>
          </LinearGradient>

          <View className="p-4">
            {insightsLoading ? (
              <View className="items-center py-6">
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text className="text-gray-600 mt-3">
                  Generating farming insights...
                </Text>
              </View>
            ) : (
              <View>
                {farmingInsights.split("\n").map((insight, index) =>
                  insight == "" ? null : (
                    <View
                      key={index}
                      className="mb-3 bg-green-50 rounded-lg p-3"
                    >
                      <Text className="text-gray-800 leading-5">{insight}</Text>
                    </View>
                  )
                )}

                <View className="mt-4 bg-green-100 rounded-lg p-3">
                  <View className="flex-row items-center mb-2">
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color="#4CAF50"
                    />
                    <Text className="text-green-800 font-bold ml-2">
                      AI-Generated Insights
                    </Text>
                  </View>
                  <Text className="text-green-800 text-sm">
                    These insights are generated by AI based on current weather
                    conditions and forecasts. Always use your own judgment and
                    local knowledge when making farming decisions.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
