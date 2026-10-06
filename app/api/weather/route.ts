/**
 * A REAL PAID WEATHER API — live data from open-meteo.com, settled on-chain.
 *
 * Same x402 flow as the starter kit, but the payment is now an EIP-3009
 * authorization the facilitator actually submits to the USDC contract:
 * every call moves 0.01 USDC from the agent's wallet to the API owner,
 * and the response carries the basescan tx hash.
 *
 * All outbound calls go through safeFetchJson (https + host allowlist), so
 * user input only ever shapes the query of an allowlisted origin.
 */
import { paidApi, safeFetchJson } from "@/lib/x402";

// WMO weather interpretation codes (open-meteo uses these).
const WMO: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

type GeoHit = { name: string; country: string; latitude: number; longitude: number };
type CurrentWx = {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  weather_code: number;
  wind_speed_10m: number;
};

export const GET = paidApi({
  price: "0.01",
  payerLimit: 10,
  handler: async ({ url }) => {
    const city = url.searchParams.get("city")?.trim() || "Unknown";

    // 1. resolve the city to coordinates (request/response properly parsed)
    const geo = (await safeFetchJson("geocoding-api.open-meteo.com", "/v1/search", {
      name: city,
      count: "1",
      language: "en",
      format: "json",
    })) as { results?: GeoHit[] };
    const hit = geo.results?.[0];
    if (!hit) throw new Error(`No place found for "${city}".`);

    // 2. live current conditions for those coordinates
    const wx = (await safeFetchJson("api.open-meteo.com", "/v1/forecast", {
      latitude: String(hit.latitude),
      longitude: String(hit.longitude),
      current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
    })) as { current?: CurrentWx };
    const cur = wx.current;
    if (!cur) throw new Error("Weather service returned no current conditions.");

    return {
      city: hit.name,
      country: hit.country,
      temperatureC: cur.temperature_2m,
      feelsLikeC: cur.apparent_temperature,
      condition: WMO[cur.weather_code] ?? `unknown (code ${cur.weather_code})`,
      humidity: cur.relative_humidity_2m,
      windKph: cur.wind_speed_10m,
      source: "open-meteo.com — live data",
    };
  },
});
