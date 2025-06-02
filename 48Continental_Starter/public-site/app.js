/* global mapboxgl */
const ENDPOINT = '/functions/route';   // Cloudflare Function

async function refreshStatus() {
  try {
    const data = await fetch(ENDPOINT).then(r => r.json());

    const currentEl = document.getElementById('current');
    const nextEl = document.getElementById('next');
    const etaEl = document.getElementById('eta');

    // Smoothly update text content
    [currentEl, nextEl, etaEl].forEach(el => {
      el.style.opacity = 0;
    });
    setTimeout(() => {
      currentEl.textContent = data.current;
      nextEl.textContent = data.next;
      etaEl.textContent = new Date(data.eta).toLocaleString();
      [currentEl, nextEl, etaEl].forEach(el => {
        el.style.opacity = 1;
      });
    }, 300);

    updateMap(data.currentLat, data.currentLng);
  } catch (err) {
    console.error('Status update failed', err);
  }
}

setInterval(refreshStatus, 5 * 60 * 1000);
refreshStatus();

/* ---------- Mapbox ---------- */
mapboxgl.accessToken = 'YOUR_MAPBOX_PUBLIC_TOKEN';

let map, marker;
function initMap() {
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-98.5795, 39.8283], // USA center
    zoom: 3
  });
}
function updateMap(lat, lng) {
  if (!map) initMap();
  const lngLat = [lng, lat];
  if (!marker) {
    marker = new mapboxgl.Marker().setLngLat(lngLat).addTo(map);
  } else {
    marker.setLngLat(lngLat);
  }
  map.flyTo({ center: lngLat, zoom: 5 });
}

/* ---------- Dark‑mode toggle ---------- */
const toggleBtn = document.createElement('button');
toggleBtn.textContent = 'Toggle Dark Mode';
toggleBtn.style.position = 'fixed';
toggleBtn.style.top = '1rem';
toggleBtn.style.right = '1rem';
toggleBtn.style.padding = '0.5rem 1rem';
toggleBtn.style.zIndex = '1000';
toggleBtn.style.cursor = 'pointer';
document.body.appendChild(toggleBtn);

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}

// Initialize theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  setTheme(savedTheme);
} else {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark ? 'dark' : 'light');
}

toggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.dataset.theme;
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
});
