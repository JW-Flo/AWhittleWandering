/* global mapboxgl */
const ENDPOINT = '/functions/route';   // Cloudflare Function

// Show loading spinner
function showLoading(id) {
  const el = document.getElementById(id);
  el.textContent = '';
  const spinner = document.createElement('span');
  spinner.className = 'spinner';
  el.appendChild(spinner);
}

// Hide loading spinner
function hideLoading(id, text) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.classList.add('fade-in');
  setTimeout(() => el.classList.remove('fade-in'), 1000);
}

async function refreshStatus() {
  try {
    ['current', 'next', 'eta'].forEach(id => showLoading(id));
    const data = await fetch(ENDPOINT).then(r => r.json());

    hideLoading('current', data.current);
    hideLoading('next', data.next);
    hideLoading('eta', new Date(data.eta).toLocaleString());

    updateMap(data.currentLat, data.currentLng);
  } catch (err) {
    ['current', 'next', 'eta'].forEach(id => {
      const el = document.getElementById(id);
      el.textContent = 'Error loading data';
      el.classList.add('error');
    });
    console.error('Status update failed', err);
  }
}

setInterval(refreshStatus, 5 * 60 * 1000);
refreshStatus();

/* ---------- Mapbox ---------- */
mapboxgl.accessToken = 'YOUR_MAPBOX_PUBLIC_TOKEN';

// Map loading spinner
const mapContainer = document.getElementById('map');
const mapSpinner = document.createElement('div');
mapSpinner.className = 'spinner map-spinner';
mapContainer.appendChild(mapSpinner);

let map, marker;
function initMap() {
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-98.5795, 39.8283], // USA center
    zoom: 3
  });
  map.on('load', () => {
    mapSpinner.style.display = 'none';
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

/* ---------- Lightbox for photo gallery ---------- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightbox.setAttribute('aria-hidden', 'false');
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImg.src = '';
  lightboxImg.alt = '';
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

// Attach click handlers to gallery items
const galleryItems = document.querySelectorAll('.gallery-item');
galleryItems.forEach(item => {
  item.addEventListener('click', () => openLightbox(item.src, item.alt));
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(item.src, item.alt);
    }
  });
});

/* ---------- Trip logs management ---------- */
const logList = document.getElementById('log-list');
const logForm = document.getElementById('log-form');

let logs = [];

function renderLogs() {
  logList.innerHTML = '';
  logs.forEach((log, index) => {
    const entry = document.createElement('article');
    entry.className = 'log-entry';
    entry.innerHTML = `
      <h3>${log.title}</h3>
      <p>${log.content}</p>
      <button aria-label="Delete log" data-index="${index}">&times;</button>
    `;
    logList.appendChild(entry);
  });

  // Attach delete handlers
  logList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = e.target.getAttribute('data-index');
      logs.splice(idx, 1);
      renderLogs();
    });
  });
}

logForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = logForm.title.value.trim();
  const content = logForm.content.value.trim();
  if (title && content) {
    logs.push({ title, content });
    renderLogs();
    logForm.reset();
  }
});

renderLogs();

/* ---------- Smooth scrolling and keyboard navigation ---------- */
// Smooth scrolling for nav links
const navLinks = document.querySelectorAll('nav#main-nav a');
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      target.focus({ preventScroll: true });
    }
  });
});

// Keyboard navigation enhancements
document.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    document.body.classList.add('user-is-tabbing');
  }
});

// Remove focus outline when not tabbing
window.addEventListener('mousedown', () => {
  document.body.classList.remove('user-is-tabbing');
});

/* ---------- Tab switching and comment posting ---------- */
// Tab switching logic
const tabs = document.querySelectorAll('.tabs button');
const tabPanels = document.querySelectorAll('main > section[role="tabpanel"]');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => {
      t.setAttribute('aria-selected', 'false');
      document.getElementById(t.getAttribute('aria-controls')).hidden = true;
    });
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(tab.getAttribute('aria-controls')).hidden = false;
    document.getElementById(tab.getAttribute('aria-controls')).focus();
  });
});

// Comment posting logic
const commentForm = document.getElementById('comment-form');
const commentList = document.getElementById('comment-list');

let comments = [];

function renderComments() {
  commentList.innerHTML = '';
  comments.forEach((comment, idx) => {
    const li = document.createElement('li');
    li.textContent = comment;
    commentList.appendChild(li);
  });
}

commentForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = commentForm['comment-text'].value.trim();
  if (text) {
    comments.push(text);
    renderComments();
    commentForm.reset();
  }
});

renderComments();
