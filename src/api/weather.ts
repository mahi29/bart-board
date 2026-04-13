const WEATHER_API_BASE = 'https://api.open-meteo.com/v1/forecast';
const SAN_RAMON_CA_COORDINATES = {
  latitude: 37.7799,
  longitude: -121.978
};

export type WeatherSnapshot = {
  temperature: number;
  high: number;
  low: number;
  description: string;
  icon: string;
  rainChance?: number;
};

type WeatherResponse = {
  current: {
    temperature_2m: number;
    weather_code: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: number[];
  };
};

function describeWeather(code: number): { description: string; icon: string } {
  if (code === 0) {
    return { description: 'Sunny', icon: '☀️' };
  }
  if (code <= 3) {
    return { description: 'Partly cloudy', icon: '⛅' };
  }
  if (code <= 48) {
    return { description: 'Foggy', icon: '🌫️' };
  }
  if (code <= 67) {
    return { description: 'Rainy', icon: '🌧️' };
  }
  if (code <= 77) {
    return { description: 'Snow', icon: '❄️' };
  }
  if (code <= 82) {
    return { description: 'Showers', icon: '🌦️' };
  }
  if (code <= 86) {
    return { description: 'Snow showers', icon: '🌨️' };
  }

  return { description: 'Stormy', icon: '⛈️' };
}

export async function fetchWeather(): Promise<WeatherSnapshot> {
  const url = new URL(WEATHER_API_BASE);
  url.searchParams.set('latitude', String(SAN_RAMON_CA_COORDINATES.latitude));
  url.searchParams.set('longitude', String(SAN_RAMON_CA_COORDINATES.longitude));
  url.searchParams.set('current', 'temperature_2m,weather_code');
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('precipitation_unit', 'inch');
  url.searchParams.set('timezone', 'America/Los_Angeles');
  url.searchParams.set('forecast_days', '1');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Weather request failed');
  }

  const data = (await response.json()) as WeatherResponse;
  const weatherDetails = describeWeather(data.current.weather_code);

  return {
    temperature: Math.round(data.current.temperature_2m),
    high: Math.round(data.daily.temperature_2m_max[0]),
    low: Math.round(data.daily.temperature_2m_min[0]),
    description: weatherDetails.description,
    icon: weatherDetails.icon,
    rainChance: data.daily.precipitation_probability_max?.[0]
  };
}
