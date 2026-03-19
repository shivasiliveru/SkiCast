/**
 * SKICAST — app.js
 * Shared JavaScript for all pages (Today, Forecast, World)
 */

// ── CONFIG ──────────────────────────────────────────────────
const API_KEY  = '80ae76a4e36d7fdb1f3a5d1cfb3d0e0e';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const ICON_URL = code => `https://openweathermap.org/img/wn/${code}@2x.png`;

const WORLD_CITIES = [
  { name: 'Hyderabad', country: 'IN' },
  { name: 'Delhi',     country: 'IN' },
  { name: 'London',    country: 'GB' },
  { name: 'New York',  country: 'US' },
  { name: 'Tokyo',     country: 'JP' },
  { name: 'Dubai',     country: 'AE' },
  { name: 'Sydney',    country: 'AU' },
  { name: 'Paris',     country: 'FR' },
];

// ── STATE ───────────────────────────────────────────────────
let toastTimer      = null;
let themeBadgeTimer = null;

// ── WEATHER THEME ENGINE ─────────────────────────────────────
const WEATHER_THEMES = {
  thunderstorm: {
    heroFrom: '#0d0d1a', heroTo: '#5a1a9a',
    cardFrom: '#1a0a2e', cardTo: '#7a2ab0',
    bg: '#f0edf8', accent: '#9b59b6',
    highlight: 'rgba(155,89,182,.18)',
    label: 'Thunderstorm', icon: 'fa-bolt',
  },
  drizzle: {
    heroFrom: '#2c4a6e', heroTo: '#6b9dbf',
    cardFrom: '#1e3a5e', cardTo: '#4a80a8',
    bg: '#eef4fa', accent: '#3498db',
    highlight: 'rgba(52,152,219,.18)',
    label: 'Drizzle', icon: 'fa-cloud-drizzle',
  },
  rain: {
    heroFrom: '#0f2a4a', heroTo: '#1e5a8a',
    cardFrom: '#0a2040', cardTo: '#1a4a78',
    bg: '#e8f2fa', accent: '#2471a3',
    highlight: 'rgba(36,113,163,.18)',
    label: 'Rain', icon: 'fa-cloud-rain',
  },
  snow: {
    heroFrom: '#5b9ec9', heroTo: '#ddf0ff',
    cardFrom: '#4a8ab5', cardTo: '#a0cde8',
    bg: '#f0f8ff', accent: '#5dade2',
    highlight: 'rgba(93,173,226,.18)',
    label: 'Snow', icon: 'fa-snowflake',
  },
  atmosphere: {
    heroFrom: '#5a6b7c', heroTo: '#9aafc0',
    cardFrom: '#4a5d70', cardTo: '#8099b0',
    bg: '#f2f4f6', accent: '#7f8c8d',
    highlight: 'rgba(127,140,141,.18)',
    label: 'Foggy', icon: 'fa-smog',
  },
  clear_day: {
    heroFrom: '#e8870a', heroTo: '#7dc8f5',
    cardFrom: '#c47a08', cardTo: '#f0b84a',
    bg: '#fffbf0', accent: '#e67e22',
    highlight: 'rgba(230,126,34,.18)',
    label: 'Sunny', icon: 'fa-sun',
  },
  clear_night: {
    heroFrom: '#0f0c29', heroTo: '#302b63',
    cardFrom: '#0d0d1a', cardTo: '#302060',
    bg: '#f0eef8', accent: '#7b68ee',
    highlight: 'rgba(123,104,238,.18)',
    label: 'Clear Night', icon: 'fa-moon',
  },
  few_clouds: {
    heroFrom: '#2d6a9f', heroTo: '#78b5d8',
    cardFrom: '#1e5080', cardTo: '#5090c0',
    bg: '#f0f5fa', accent: '#4fa3e0',
    highlight: 'rgba(79,163,224,.18)',
    label: 'Partly Cloudy', icon: 'fa-cloud-sun',
  },
  cloudy: {
    heroFrom: '#4b6a85', heroTo: '#8aadc2',
    cardFrom: '#3d5a72', cardTo: '#6a90a8',
    bg: '#eef2f6', accent: '#5b8db5',
    highlight: 'rgba(91,141,181,.18)',
    label: 'Cloudy', icon: 'fa-cloud',
  },
};

function getTheme(id, icon) {
  const isNight = icon && icon.endsWith('n');
  if (id >= 200 && id < 300) return WEATHER_THEMES.thunderstorm;
  if (id >= 300 && id < 400) return WEATHER_THEMES.drizzle;
  if (id >= 500 && id < 600) return WEATHER_THEMES.rain;
  if (id >= 600 && id < 700) return WEATHER_THEMES.snow;
  if (id >= 700 && id < 800) return WEATHER_THEMES.atmosphere;
  if (id === 800)             return isNight ? WEATHER_THEMES.clear_night : WEATHER_THEMES.clear_day;
  if (id === 801 || id === 802) return WEATHER_THEMES.few_clouds;
  return WEATHER_THEMES.cloudy;
}

function applyWeatherTheme(id, iconCode) {
  const t    = getTheme(id, iconCode);
  const root = document.documentElement;
  root.style.setProperty('--theme-hero-from',  t.heroFrom);
  root.style.setProperty('--theme-hero-to',    t.heroTo);
  root.style.setProperty('--theme-card-from',  t.cardFrom);
  root.style.setProperty('--theme-card-to',    t.cardTo);
  root.style.setProperty('--theme-bg',         t.bg);
  root.style.setProperty('--theme-accent',     t.accent);
  root.style.setProperty('--theme-highlight',  t.highlight);
  document.body.setAttribute('data-weather', t.label.toLowerCase().replace(' ', '-'));

  let badge = document.getElementById('weather-theme-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'weather-theme-badge';
    badge.className = 'weather-theme-badge';
    document.body.appendChild(badge);
  }
  badge.innerHTML = `<i class="fas ${t.icon}"></i>&nbsp; ${t.label}`;
  badge.classList.add('visible');
  clearTimeout(themeBadgeTimer);
  themeBadgeTimer = setTimeout(() => badge.classList.remove('visible'), 2800);
}

// ── HELPERS ─────────────────────────────────────────────────
function showLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('active');
}
function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.remove('active');
}

function showToast(msg, type = '') {
  clearTimeout(toastTimer);
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ` ${type}` : '');
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3500);
}

function formatTime(unixTs, offset = 0) {
  const d = new Date((unixTs + offset) * 1000);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}
function formatHour(unixTs, offset = 0) {
  const d = new Date((unixTs + offset) * 1000);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: 'UTC' });
}
function formatDay(unixTs, offset = 0) {
  const d = new Date((unixTs + offset) * 1000);
  return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}
function formatDate(unixTs = Date.now() / 1000, offset = 0) {
  const d = new Date((unixTs + offset) * 1000);
  return d.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  });
}
function formatFullDateTime(unixTs, offset = 0) {
  const d = new Date((unixTs + offset) * 1000);
  return d.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC'
  });
}
function round(val) { return Math.round(val); }

// ── API CALLS ────────────────────────────────────────────────
async function fetchByCity(city) {
  const res = await fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
  if (!res.ok) throw new Error(res.status === 404 ? `City "${city}" not found` : 'Weather data unavailable');
  return res.json();
}
async function fetchByCoords(lat, lon) {
  const res = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
  if (!res.ok) throw new Error('Could not get weather for your location');
  return res.json();
}
async function fetchForecast(cityOrCoords) {
  let url;
  if (typeof cityOrCoords === 'string') {
    url = `${BASE_URL}/forecast?q=${encodeURIComponent(cityOrCoords)}&appid=${API_KEY}&units=metric`;
  } else {
    url = `${BASE_URL}/forecast?lat=${cityOrCoords.lat}&lon=${cityOrCoords.lon}&appid=${API_KEY}&units=metric`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Forecast data unavailable');
  return res.json();
}

// ── RENDER: CURRENT WEATHER ───────────────────────────────────
function renderCurrentWeather(data) {
  const tz  = data.timezone;
  const now = Math.floor(Date.now() / 1000);
  const $ = id => document.getElementById(id);

  $('cw-city').textContent      = data.name;
  $('cw-country').textContent   = data.sys.country;
  $('cw-date').textContent      = formatDate(now, tz);
  $('cw-temp').textContent      = round(data.main.temp) + '°C';
  $('cw-icon').src              = ICON_URL(data.weather[0].icon);
  $('cw-icon').alt              = data.weather[0].description;
  $('cw-condition').textContent = data.weather[0].description;
  $('cw-humidity').textContent  = data.main.humidity + '%';
  $('cw-wind').textContent      = round(data.wind.speed * 3.6) + ' km/h';
  $('cw-feels').textContent     = round(data.main.feels_like) + '°C';
  $('cw-pressure').textContent  = data.main.pressure + ' hPa';
  $('cw-visibility').textContent = ((data.visibility || 0) / 1000).toFixed(1) + ' km';
  $('cw-sunrise').textContent   = formatTime(data.sys.sunrise, tz);
  $('last-updated').textContent = 'Updated at ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  $('cw-placeholder').classList.add('hidden');
  $('cw-content').classList.remove('hidden');

  applyWeatherTheme(data.weather[0].id, data.weather[0].icon);
}

// ── RENDER: HOURLY FORECAST ───────────────────────────────────
function renderHourly(forecastData) {
  const list = forecastData.list.slice(0, 10);
  const tz   = forecastData.city.timezone;
  const strip = document.getElementById('hourly-strip');
  const ph    = document.getElementById('hourly-placeholder');
  if (!strip) return;

  strip.innerHTML = list.map((item, i) => `
    <div class="hourly-card ${i === 0 ? 'now' : ''}">
      <div class="hc-time">${i === 0 ? 'Now' : formatHour(item.dt, tz)}</div>
      <div class="hc-icon"><img src="${ICON_URL(item.weather[0].icon)}" alt="${item.weather[0].description}" /></div>
      <div class="hc-temp">${round(item.main.temp)}°</div>
    </div>
  `).join('');

  if (ph) ph.classList.add('hidden');
  strip.classList.remove('hidden');
}

// ── RENDER: 7-DAY FORECAST ────────────────────────────────────
function renderWeekly(forecastData) {
  const tz   = forecastData.city.timezone;
  const list = forecastData.list;
  const grid = document.getElementById('weekly-grid');
  const ph   = document.getElementById('weekly-placeholder');
  if (!grid) return;

  const days = {};
  list.forEach(item => {
    const d      = new Date((item.dt + tz) * 1000);
    const dayKey = d.toISOString().slice(0, 10);
    if (!days[dayKey]) days[dayKey] = [];
    days[dayKey].push(item);
  });

  grid.innerHTML = Object.entries(days).slice(0, 7).map(([, items], i) => {
    const mid  = items.reduce((best, curr) => {
      const bHr = new Date(best.dt_txt).getUTCHours();
      const cHr = new Date(curr.dt_txt).getUTCHours();
      return Math.abs(bHr - 12) < Math.abs(cHr - 12) ? best : curr;
    });
    const high = Math.max(...items.map(it => it.main.temp_max));
    const low  = Math.min(...items.map(it => it.main.temp_min));
    const day  = i === 0 ? 'Today' : formatDay(mid.dt, tz);
    return `
      <div class="weekly-card">
        <div class="wc-day">${day}</div>
        <div class="wc-icon"><img src="${ICON_URL(mid.weather[0].icon)}" alt="${mid.weather[0].description}" /></div>
        <div class="wc-desc">${mid.weather[0].description}</div>
        <div class="wc-temps">
          <span class="wc-high">${round(high)}°</span>
          <span class="wc-low">${round(low)}°</span>
        </div>
      </div>
    `;
  }).join('');

  if (ph) ph.classList.add('hidden');
  grid.classList.remove('hidden');
}

// ── RENDER: SLOT CARD (Date/Time Picker result) ───────────────
function renderSlotCard(slot, tz, cityName, countryCode) {
  const wrap = document.getElementById('slot-result');
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="slot-card">
      <div class="slot-header">
        <div class="slot-datetime">
          <i class="fas fa-calendar-clock"></i>
          ${formatFullDateTime(slot.dt, tz)}
        </div>
        <div class="slot-location">${cityName}, ${countryCode}</div>
      </div>
      <div class="slot-body">
        <div class="slot-main">
          <div class="slot-temp">${round(slot.main.temp)}°C</div>
          <div class="slot-icon-wrap">
            <img src="${ICON_URL(slot.weather[0].icon)}" alt="${slot.weather[0].description}" />
            <div class="slot-condition">${slot.weather[0].description}</div>
          </div>
        </div>
        <div class="slot-stats">
          <div class="slot-stat">
            <span class="stat-icon"><i class="fas fa-thermometer-half"></i></span>
            <div><div class="stat-label">Feels Like</div><div class="stat-val">${round(slot.main.feels_like)}°C</div></div>
          </div>
          <div class="slot-stat">
            <span class="stat-icon"><i class="fas fa-droplet"></i></span>
            <div><div class="stat-label">Humidity</div><div class="stat-val">${slot.main.humidity}%</div></div>
          </div>
          <div class="slot-stat">
            <span class="stat-icon"><i class="fas fa-wind"></i></span>
            <div><div class="stat-label">Wind</div><div class="stat-val">${round(slot.wind.speed * 3.6)} km/h</div></div>
          </div>
          <div class="slot-stat">
            <span class="stat-icon"><i class="fas fa-eye"></i></span>
            <div><div class="stat-label">Visibility</div><div class="stat-val">${((slot.visibility || 0) / 1000).toFixed(1)} km</div></div>
          </div>
        </div>
      </div>
      <p class="slot-note"><i class="fas fa-info-circle"></i> Nearest available 3-hour forecast interval</p>
    </div>
  `;
  wrap.classList.remove('hidden');
  applyWeatherTheme(slot.weather[0].id, slot.weather[0].icon);
}

// ── RENDER: WORLD CITIES ──────────────────────────────────────
async function renderWorldCities() {
  const grid = document.getElementById('world-grid');
  if (!grid) return;

  grid.innerHTML = WORLD_CITIES.map(() => '<div class="world-card skeleton"></div>').join('');

  const results = await Promise.allSettled(WORLD_CITIES.map(c => fetchByCity(`${c.name},${c.country}`)));

  grid.innerHTML = results.map((res, i) => {
    if (res.status === 'rejected') {
      return `<div class="world-card">
        <div class="ww-city">${WORLD_CITIES[i].name}</div>
        <div class="ww-country">${WORLD_CITIES[i].country}</div>
        <div class="ww-desc" style="color:#e53e3e;margin-top:.5rem">Data unavailable</div>
      </div>`;
    }
    const d = res.value;
    return `
      <div class="world-card" onclick="goToCity('${d.name}')">
        <div class="ww-city">${d.name}</div>
        <div class="ww-country">${d.sys.country}</div>
        <div class="ww-main">
          <div class="ww-temp">${round(d.main.temp)}°</div>
          <div class="ww-icon"><img src="${ICON_URL(d.weather[0].icon)}" alt="${d.weather[0].description}" /></div>
        </div>
        <div class="ww-desc">${d.weather[0].description}</div>
        <div class="ww-stats">
          <div class="ww-stat"><i class="fas fa-droplet"></i> <span>${d.main.humidity}%</span></div>
          <div class="ww-stat"><i class="fas fa-wind"></i> <span>${round(d.wind.speed * 3.6)} km/h</span></div>
        </div>
      </div>
    `;
  }).join('');
}

// Navigate to Today page with a specific city
function goToCity(cityName) {
  window.location.href = `index.html?city=${encodeURIComponent(cityName)}`;
}

// ── DATE/TIME SLOT LOOKUP ─────────────────────────────────────
function findClosestSlot(list, targetTs) {
  return list.reduce((best, curr) =>
    Math.abs(curr.dt - targetTs) < Math.abs(best.dt - targetTs) ? curr : best
  );
}

async function lookupSlotWeather(dtValue, city) {
  if (!city) { showToast('Please search for a city first', 'error'); return; }
  showLoading();
  try {
    const forecast = await fetchForecast(city);
    const targetTs = Math.floor(new Date(dtValue).getTime() / 1000);
    const slot     = findClosestSlot(forecast.list, targetTs);
    renderSlotCard(slot, forecast.city.timezone, forecast.city.name, forecast.city.country);
    document.getElementById('slot-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    showToast(err.message || 'Could not load forecast for this time', 'error');
  } finally {
    hideLoading();
  }
}

// ── LOAD FUNCTIONS ────────────────────────────────────────────
async function loadCity(city) {
  if (!city || !city.trim()) return;
  showLoading();
  try {
    const [weather, forecast] = await Promise.all([fetchByCity(city), fetchForecast(city)]);
    renderCurrentWeather(weather);
    renderHourly(forecast);
    localStorage.setItem('skicast_city', weather.name);
    document.getElementById('current-weather')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`Weather loaded for ${weather.name}, ${weather.sys.country}`);
  } catch (err) {
    showToast(err.message || 'Failed to fetch weather data', 'error');
  } finally {
    hideLoading();
  }
}

async function loadByLocation(lat, lon) {
  showLoading();
  try {
    const [weather, forecast] = await Promise.all([fetchByCoords(lat, lon), fetchForecast({ lat, lon })]);
    renderCurrentWeather(weather);
    renderHourly(forecast);
    localStorage.setItem('skicast_city', weather.name);
    showToast(`Weather loaded for ${weather.name}, ${weather.sys.country}`);
  } catch (err) {
    showToast(err.message || 'Location weather unavailable', 'error');
  } finally {
    hideLoading();
  }
}

async function loadForecastPage(city) {
  if (!city) return;
  showLoading();
  try {
    const forecast = await fetchForecast(city);
    renderWeekly(forecast);
    localStorage.setItem('skicast_city', forecast.city.name);

    // Update page city label
    const label = document.getElementById('forecast-city-label');
    if (label) label.textContent = `${forecast.city.name}, ${forecast.city.country}`;

    showToast(`7-day forecast loaded for ${forecast.city.name}`);
  } catch (err) {
    showToast(err.message || 'Failed to load forecast', 'error');
  } finally {
    hideLoading();
  }
}

// ── SEARCH HANDLER (page-aware) ───────────────────────────────
function handleSearch(inputEl) {
  const city = inputEl?.value?.trim();
  if (!city) { showToast('Please enter a city name', 'error'); return; }
  inputEl.value = '';
  const page = document.body.dataset.page;
  if (page === 'forecast') {
    loadForecastPage(city);
  } else if (page === 'world') {
    goToCity(city);
  } else {
    loadCity(city);
  }
}

// ── GEOLOCATION ───────────────────────────────────────────────
function requestLocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation not supported by your browser', 'error');
    return;
  }
  const btn = document.getElementById('location-btn');
  if (btn) btn.innerHTML = '<i class="fas fa-satellite-dish"></i> Detecting...';
  showLoading();
  navigator.geolocation.getCurrentPosition(
    pos => {
      if (btn) btn.innerHTML = '<span class="loc-icon"><i class="fas fa-location-dot"></i></span> Use My Location';
      loadByLocation(pos.coords.latitude, pos.coords.longitude);
    },
    () => {
      hideLoading();
      if (btn) btn.innerHTML = '<span class="loc-icon"><i class="fas fa-location-dot"></i></span> Use My Location';
      showToast('Location access denied. Please search manually.', 'error');
    }
  );
}

// ── SHARED NAVBAR INIT ────────────────────────────────────────
function initNavbar() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger) hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  document.querySelectorAll('.mobile-menu a').forEach(a =>
    a.addEventListener('click', () => mobileMenu?.classList.remove('open'))
  );

  const navInput = document.getElementById('nav-search-input');
  const navBtn   = document.getElementById('nav-search-btn');
  if (navBtn) navBtn.addEventListener('click', () => handleSearch(navInput));
  if (navInput) navInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(navInput); });

  const mobInput = document.getElementById('mobile-search-input');
  const mobBtn   = document.getElementById('mobile-search-btn');
  if (mobBtn) mobBtn.addEventListener('click', () => handleSearch(mobInput));
  if (mobInput) mobInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(mobInput); });

  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) navbar.style.boxShadow = window.scrollY > 10 ? '0 4px 20px rgba(26,111,173,.12)' : '';
  });
}

// ── PAGE: TODAY init ──────────────────────────────────────────
function initToday() {
  initNavbar();
  const heroInput = document.getElementById('hero-search-input');
  const heroBtn   = document.getElementById('hero-search-btn');
  const locBtn    = document.getElementById('location-btn');
  if (heroBtn) heroBtn.addEventListener('click', () => handleSearch(heroInput));
  if (heroInput) heroInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(heroInput); });
  if (locBtn) locBtn.addEventListener('click', requestLocation);

  // Auto-load city from URL param or localStorage
  const params   = new URLSearchParams(window.location.search);
  const cityParam = params.get('city');
  const savedCity = localStorage.getItem('skicast_city');

  if (cityParam) {
    loadCity(cityParam);
  } else if (savedCity) {
    loadCity(savedCity);
  } else {
    navigator.geolocation?.getCurrentPosition(
      pos => loadByLocation(pos.coords.latitude, pos.coords.longitude),
      () => {}
    );
  }
}

// ── PAGE: FORECAST init ───────────────────────────────────────
function initForecast() {
  initNavbar();

  // City search on forecast page
  const fcInput = document.getElementById('forecast-search-input');
  const fcBtn   = document.getElementById('forecast-search-btn');
  if (fcBtn) fcBtn.addEventListener('click', () => {
    const city = fcInput?.value?.trim();
    if (!city) { showToast('Enter a city name', 'error'); return; }
    fcInput.value = '';
    loadForecastPage(city);
  });
  if (fcInput) fcInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const city = fcInput.value.trim();
      if (city) { fcInput.value = ''; loadForecastPage(city); }
    }
  });

  // Date/Time picker
  const dtPicker = document.getElementById('dt-picker');
  const dtBtn    = document.getElementById('dt-lookup-btn');
  if (dtPicker) {
    const now = new Date();
    const max = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    dtPicker.min = now.toISOString().slice(0, 16);
    dtPicker.max = max.toISOString().slice(0, 16);
    // Default: 6 hours from now
    dtPicker.value = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString().slice(0, 16);
  }
  if (dtBtn) dtBtn.addEventListener('click', () => {
    const city = localStorage.getItem('skicast_city');
    if (!dtPicker?.value) return;
    lookupSlotWeather(dtPicker.value, city);
  });

  // Load saved city
  const savedCity = localStorage.getItem('skicast_city');
  if (savedCity) loadForecastPage(savedCity);
}

// ── PAGE: WORLD init ──────────────────────────────────────────
function initWorld() {
  initNavbar();
  renderWorldCities();
}

// ── AUTO-INIT ─────────────────────────────────────────────────
const _page = document.body.dataset.page;
if      (_page === 'today')    initToday();
else if (_page === 'forecast') initForecast();
else if (_page === 'world')    initWorld();
