/**
 * @fileOverview Weather service for fetching live rainfall data.
 * Uses OpenWeatherMap API to get precipitation levels for worker cities.
 */

const API_KEY = "be5f61ff6b261dedfa89e321d466a063";

/**
 * Fetches current rainfall in mm for a specific city.
 * @param city The name of the city to query.
 * @returns Rainfall in mm for the last 1 hour. Defaults to 0 if data is unavailable.
 */
export async function getCityRainfall(city: string): Promise<number> {
  if (!city) return 0;
  
  try {
    // We add ',IN' to prioritize Indian cities since GigShield is targeted at the Indian workforce
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
      console.warn(`Weather API error: ${response.statusText}`);
      return 0;
    }

    const data = await response.json();
    
    // OpenWeatherMap returns rain as an object with '1h' or '3h' volume in mm
    // If it's not currently raining, the 'rain' property is often omitted
    return data.rain?.['1h'] || 0;
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    return 0;
  }
}
