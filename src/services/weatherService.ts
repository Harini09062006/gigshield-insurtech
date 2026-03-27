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

/**
 * Fetches current weather for a specific city.
 */
export async function getCityRainfall(city: string): Promise<number> {
  if (!city) return 0;
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) return 0;
    const data = await response.json();
    return data.rain?.['1h'] || data.rain?.['3h'] || 0;
  } catch (error) {
    return 0;
  }
}

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
