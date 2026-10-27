
const form = document.getElementById("form");
const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("searchBtn");
const statusBox = document.getElementById("status");
const currentWeather = document.getElementById("currentWeather");
const forecastBox = document.getElementById("forecast");

const GEO_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

const weatherCodes = {
  0: { label: "Clear", icon: "☀️" },
  1: { label: "Mostly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Cloudy", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Foggy", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌦️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌧️" },
  82: { label: "Heavy showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Heavy thunderstorm", icon: "⛈️" }
};

function getWeatherInfo(code) {
  return weatherCodes[code] || {
    label: "Unknown conditions",
    icon: "🌡️"
  };
}

async function findCity(name) {
  const url = `${GEO_API}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("City search service is not responding.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found. Please try another city.");
  }

  const city = data.results[0];

  return {
    name: city.name,
    country: city.country || "",
    latitude: city.latitude,
    longitude: city.longitude
  };
}

async function getWeather(latitude, longitude) {
  const url =
    `${WEATHER_API}?latitude=${latitude}` +
    `&longitude=${longitude}` +
    "&current=temperature_2m,weather_code" +
    "&daily=temperature_2m_max,temperature_2m_min,weather_code" +
    "&forecast_days=5&timezone=auto";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not load weather. Please try again.");
  }

  return response.json();
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function renderCurrentWeather(city, weather) {
  currentWeather.replaceChildren();

  const current = weather.current;
  const info = getWeatherInfo(current.weather_code);

  const card = createElement("div", "current-card", "");
  const title = createElement(
    "h2",
    "",
    `${city.name}, ${city.country}`
  );
  const icon = createElement("div", "forecast-icon", info.icon);
  const temperature = createElement(
    "p",
    "current-temp",
    `${Math.round(current.temperature_2m)}°C`
  );
  const description = createElement(
    "p",
    "weather-description",
    info.label
  );

  const details = createElement("div", "current-details", "");
  details.append(
    createElement(
      "span",
      "",
      `Today's high: ${Math.round(weather.daily.temperature_2m_max[0])}°C`
    ),
    createElement(
      "span",
      "",
      `Today's low: ${Math.round(weather.daily.temperature_2m_min[0])}°C`
    )
  );

  card.append(title, icon, temperature, description, details);
  currentWeather.append(card);
}

function renderForecast(weather) {
  forecastBox.replaceChildren();

  weather.daily.time.forEach((date, index) => {
    const info = getWeatherInfo(weather.daily.weather_code[index]);

    const card = createElement("article", "forecast-card", "");
    const day = new Date(`${date}T12:00:00`).toLocaleDateString(
      "en-US",
      { weekday: "short", month: "short", day: "numeric" }
    );

    const heading = createElement("h3", "", day);
    const icon = createElement("div", "forecast-icon", info.icon);
    const condition = createElement(
      "p",
      "forecast-condition",
      info.label
    );
    const high = createElement(
      "p",
      "temperatures",
      `↑ ${Math.round(weather.daily.temperature_2m_max[index])}°C`
    );
    const low = createElement(
      "p",
      "low-temp",
      `↓ ${Math.round(weather.daily.temperature_2m_min[index])}°C`
    );

    card.append(heading, icon, condition, high, low);
    forecastBox.append(card);
  });
}

function showError(message) {
  statusBox.textContent = message;
  statusBox.className = "status error";
}

async function searchWeather(cityName) {
  const name = cityName.trim();

  if (!name) {
    showError("Please enter a city name.");
    cityInput.focus();
    return;
  }

  searchBtn.disabled = true;
  searchBtn.textContent = "Loading...";
  statusBox.className = "status";
  statusBox.textContent = "Loading weather...";
  currentWeather.replaceChildren();
  forecastBox.replaceChildren();

  try {
    const city = await findCity(name);
    const weather = await getWeather(
      city.latitude,
      city.longitude
    );

    renderCurrentWeather(city, weather);
    renderForecast(weather);

    statusBox.textContent = "Weather updated successfully.";
    localStorage.setItem("lastCity", city.name);
  } catch (error) {
    showError(
      error instanceof TypeError
        ? "Network problem. Check your internet connection and try again."
        : error.message
    );
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = "Search";
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  searchWeather(cityInput.value);
});

const lastCity = localStorage.getItem("lastCity");

if (lastCity) {
  cityInput.value = lastCity;
  searchWeather(lastCity);
}
