/**
 * @fileOverview Weather service for fetching live rainfall and AQI data.
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
    const aqi = data.list[0].main.aqi; // 1-5
    
    // Map 1-5 scale to labels
    const labels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
    const colors = ["#22C55E", "#EAB308", "#F59E0B", "#F97316", "#EF4444"];
    
    return {
      aqi: aqi * 50, // Mock 0-500 scale for UI
      label: labels[aqi - 1] || "Unknown",
      color: colors[aqi - 1] || "#64748B"
    };
  } catch (err) {
    return { aqi: 50, label: "Good", color: "#22C55E" };
  }
}
