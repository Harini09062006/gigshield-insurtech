/**
 * @fileOverview Weather service for fetching live rainfall, temperature, and AQI data.
 * Uses OpenWeatherMap API to get precipitation and pollution levels.
 */

const API_KEY = "be5f61ff6b261dedfa89e321d466a063";

export interface WeatherData {
  temp: number;
  rainfall: number;
  humidity: number;
  condition: string;
}

export interface AQIData {
  aqi: number;
  label: string;
  color: string;
}

export interface CityRiskData extends WeatherData {
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  aqiLabel: string;
  riskLevel: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
  riskColor: string;
  riskEmoji: string;
  percent: number;
}

export const CITIES_LIST = [
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Delhi", lat: 28.7041, lng: 77.1025 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Howrah", lat: 22.5958, lng: 88.2636 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Kochi", lat: 9.9312, lng: 76.2673 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 }
];

/**
 * Fetches full weather details by coordinates.
 */
export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error("Weather failed");
    const data = await response.json();
    return {
      temp: Math.round(data.main.temp),
      rainfall: data.rain?.['1h'] || 0,
      humidity: data.main.humidity,
      condition: data.weather[0].main
    };
  } catch (err) {
    return { temp: 30, rainfall: 0, humidity: 60, condition: 'Clear' };
  }
}

/**
 * Fetches only rainfall for a specific city name.
 */
export async function getCityRainfall(city: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error("Weather failed");
    const data = await response.json();
    return data.rain?.['1h'] || 0;
  } catch (err) {
    console.error(`Failed to fetch rainfall for ${city}:`, err);
    return 0;
  }
}

/**
 * Fetches AQI data by coordinates.
 */
export async function getAQIByCoords(lat: number, lon: number): Promise<AQIData> {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    if (!response.ok) throw new Error("AQI failed");
    const data = await response.json();
    const aqiValue = data.list[0].main.aqi; // 1-5
    
    const labels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
    const colors = ["#22C55E", "#EAB308", "#F59E0B", "#F97316", "#EF4444"];
    
    return {
      aqi: aqiValue,
      label: labels[aqiValue - 1] || "Unknown",
      color: colors[aqiValue - 1] || "#64748B"
    };
  } catch (err) {
    return { aqi: 1, label: "Good", color: "#22C55E" };
  }
}

export function calculateRisk(rainfall: number) {
  if (rainfall > 50) return { level: 'EXTREME', color: '#EF4444', emoji: '🔴', percent: 100 };
  if (rainfall > 30) return { level: 'HIGH', color: '#F59E0B', emoji: '🟠', percent: Math.round((rainfall/50)*100) };
  if (rainfall > 10) return { level: 'MEDIUM', color: '#EAB308', emoji: '🟡', percent: Math.round((rainfall/50)*100) };
  if (rainfall > 0) return { level: 'LOW', color: '#22C55E', emoji: '🟢', percent: Math.round((rainfall/50)*100) };
  return { level: 'SAFE', color: '#64748B', emoji: '⚫', percent: 0 };
}
