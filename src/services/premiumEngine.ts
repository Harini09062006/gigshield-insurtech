/**
 * @fileOverview Dynamic Premium Calculation Engine for GigShield.
 * Calculates weekly costs based on geographical risk zones and real-time 5-day weather forecasts.
 */

export interface PremiumResult {
  original: number;
  adjusted: number;
  reasons: string[];
  rainDays: number;
  riskZone: "HIGH" | "MEDIUM" | "LOW";
  savings: number;
}

const HIGH_RISK_CITIES = ["Chennai", "Mumbai", "Kolkata", "Kochi", "Howrah"];
const LOW_RISK_CITIES = ["Jaipur", "Pune", "Delhi"];

/**
 * Calculates a dynamic premium based on city risk zones and 5-day rainfall forecasts.
 * 
 * @param basePremium The starting weekly premium for the selected plan.
 * @param city The worker's primary operating city.
 * @returns A promise resolving to the detailed premium breakdown.
 */
export async function calculateDynamicPremium(
  basePremium: number,
  city: string
): Promise<PremiumResult> {
  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;
  const reasons: string[] = [];
  let rainDays = 0;
  let riskZone: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";

  // Step 3: Determine City Risk Zone
  if (HIGH_RISK_CITIES.some(c => c.toLowerCase() === city.toLowerCase())) {
    riskZone = "HIGH";
  } else if (LOW_RISK_CITIES.some(c => c.toLowerCase() === city.toLowerCase())) {
    riskZone = "LOW";
  }

  try {
    if (!API_KEY) {
      throw new Error("Meteorological API key missing.");
    }

    // Step 1: Fetch 5-day forecast
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        city
      )},IN&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Weather service unreachable.");
    }

    const data = await response.json();

    // Step 2: Count rainy intervals (> 5mm) as a proxy for risk frequency
    // Each item represents a 3-hour window
    rainDays = data.list.filter(
      (item: any) => (item.rain?.["3h"] || 0) > 5
    ).length;

    let adjusted = basePremium;

    // Step 4: Apply City Risk Adjustment
    if (riskZone === "HIGH") {
      adjusted += 3;
      reasons.push("High-risk location premium (+₹3)");
    } else if (riskZone === "LOW") {
      adjusted -= 2;
      reasons.push("Low-risk location discount (-₹2)");
    }

    // Step 5: Apply Forecast Adjustment
    if (rainDays > 4) {
      adjusted += 2;
      reasons.push("High rainfall forecast surcharge (+₹2)");
    } else if (rainDays < 2) {
      adjusted -= 1;
      reasons.push("Low rainfall forecast discount (-₹1)");
    }

    if (reasons.length === 0) {
      reasons.push("Standard market rate applied");
    }

    return {
      original: basePremium,
      adjusted: Math.max(1, adjusted), // Ensure premium never drops to 0
      reasons,
      rainDays,
      riskZone,
      savings: basePremium - adjusted,
    };
  } catch (error) {
    // Error Handling: Return standard rate if external data fails
    return {
      original: basePremium,
      adjusted: basePremium,
      reasons: ["Standard rate applied (Forecast unavailable)"],
      rainDays: 0,
      riskZone,
      savings: 0,
    };
  }
}
