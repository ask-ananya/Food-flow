'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useGeolocation } from '@/hooks/use-geolocation'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Loader2 } from 'lucide-react'

// Directly set your API keys here using the new format
const WEATHER_API_KEY = "5e415c92fe7b4134be115656250304";
const GEMINI_API_KEY = "AIzaSyBa80AkcHCRJrVLh9YYSKQHyKWMNSKqo1g";

// Initialize Gemini AI using the key directly from our constant
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

interface WeatherData {
  location: {
    name: string
    region: string
    country: string
    lat: number
    lon: number
    localtime: string
  }
  current: {
    last_updated_epoch: number
    last_updated: string
    temp_c: number
    temp_f: number
    is_day: number
    condition: { text: string; icon: string; code: number }
    wind_mph: number
    wind_kph: number
    wind_degree: number
    wind_dir: string
    pressure_mb: number
    pressure_in: number
    precip_mm: number
    precip_in: number
    humidity: number
    cloud: number
    feelslike_c: number
    feelslike_f: number
    vis_km: number
    vis_miles: number
    gust_mph: number
    gust_kph: number
    uv: number
    dewpoint_c: number
    dewpoint_f: number
  }
  forecast: {
    forecastday: Array<{
      date: string
      date_epoch: number
      day: {
        maxtemp_c: number
        maxtemp_f: number
        mintemp_c: number
        mintemp_f: number
        avgtemp_c: number
        avgtemp_f: number
        maxwind_mph: number
        maxwind_kph: number
        totalprecip_mm: number
        totalprecip_in: number
        avgvis_km: number
        avgvis_miles: number
        avghumidity: number
        condition: { text: string; icon: string; code: number }
        daily_will_it_rain: number
        daily_will_it_snow: number
        daily_chance_of_rain: number
        daily_chance_of_snow: number
        uv: number
      }
      astro: {
        sunrise: string
        sunset: string
        moonrise: string
        moonset: string
        moon_phase: string
        moon_illumination: string
      }
      hour: any[]
    }>
  }
}

export default function WeatherPage() {
  const { location, error: locationError } = useGeolocation()
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [farmingInsights, setFarmingInsights] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWeatherAndInsights = async () => {
      if (location) {
        try {
          // Build the WeatherAPI URL using the constant API key
          const weatherApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${location.latitude},${location.longitude}&days=3&aqi=no&alerts=no`

          // Use Thingproxy to bypass CORS issues
          const proxyUrl = `https://thingproxy.freeboard.io/fetch/${weatherApiUrl}`

          const weatherResponse = await fetch(proxyUrl)
          const weather = await weatherResponse.json()
          setWeatherData(weather)

          // Generate farming insights by passing in relevant data to Gemini AI
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
          const prompt = `Provide farming insights for location (${location.latitude}, ${location.longitude}) based on the weather data:
          
Location: ${weather.location.name}, ${weather.location.region}, ${weather.location.country}
Local Time: ${weather.location.localtime}

Current Weather:
- Temperature: ${weather.current.temp_c}°C (${weather.current.temp_f}°F)
- Feels Like: ${weather.current.feelslike_c}°C (${weather.current.feelslike_f}°F)
- Condition: ${weather.current.condition.text}
- Humidity: ${weather.current.humidity}%
- Wind: ${weather.current.wind_kph} kph (or ${weather.current.wind_mph} mph) from ${weather.current.wind_dir}
- Precipitation: ${weather.current.precip_mm}mm
- UV Index: ${weather.current.uv}

Forecast (next 3 days):
${weather.forecast.forecastday.map((day: any) => 
  `Date: ${day.date}, Temp: ${day.day.mintemp_c}°C - ${day.day.maxtemp_c}°C, Rain Chance: ${day.day.daily_chance_of_rain}%`
).join('\n')}

Based on the above, provide brief farming insights and recommendations (max 3-4 concise points).`

          const result = await model.generateContent(prompt)
          const response = await result.response
          setFarmingInsights(response.text())
        } catch (error) {
          console.error('Error fetching data:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchWeatherAndInsights()
  }, [location])

  if (locationError) {
    return <div>Error getting location: {locationError.message}</div>
  }

  if (loading || !weatherData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Detailed Weather & Farming Insights</h1>
      
      {/* Current Weather Card */}
      <Card>
        <CardHeader>Current Weather - {weatherData.location.name}</CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <img
              src={weatherData.current.condition.icon}
              alt={weatherData.current.condition.text}
            />
            <div>
              <p className="text-2xl font-bold">
                {weatherData.current.temp_c}°C ({weatherData.current.temp_f}°F)
              </p>
              <p>{weatherData.current.condition.text}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <p>Feels Like: {weatherData.current.feelslike_c}°C ({weatherData.current.feelslike_f}°F)</p>
            <p>Humidity: {weatherData.current.humidity}%</p>
            <p>Wind: {weatherData.current.wind_kph} kph ({weatherData.current.wind_mph} mph) from {weatherData.current.wind_dir}</p>
            <p>Precipitation: {weatherData.current.precip_mm}mm</p>
            <p>UV Index: {weatherData.current.uv}</p>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Card */}
      <Card>
        <CardHeader>3-Day Forecast</CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weatherData.forecast.forecastday.map((day) => (
              <div key={day.date} className="border-b pb-2">
                <p className="font-semibold">{new Date(day.date).toLocaleDateString()}</p>
                <p>
                  Temperature: {day.day.mintemp_c}°C - {day.day.maxtemp_c}°C
                </p>
                <p>Condition: {day.day.condition.text}</p>
                <p>Rain Chance: {day.day.daily_chance_of_rain}%</p>
                <p>Sunrise: {day.astro.sunrise} | Sunset: {day.astro.sunset}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Farming Insights Card */}
      <Card className="md:col-span-2">
        <CardHeader>Farming Insights</CardHeader>
        <CardContent>
          <div className="prose whitespace-pre-line">
            {farmingInsights}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
