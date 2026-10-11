// Data layer for the frontend demo.
// Shaped like the future Express + MongoDB API (decision.md §3): same fields,
// same filter params — swap the bodies for fetch() calls when the backend exists.

const STORAGE_KEY = 'tvmv.visits.v1';
const SESSION_KEY = 'tvmv.session.v1';

const CURRENT_USER_ID = 'local-user'; // one local user until auth is real

// decision.md §2B — Visit Memory Schema
const visitDefaults = {
  _id: '',
  userId: CURRENT_USER_ID,
  country: '',
  placeType: '',
  category: '',
  primaryVenue: '',
  alternativeVenues: [],
  rating: 0,
  comments: '',
  photoUrl: '',
  createdAt: null,
};

// decision.md §2A — User Schema (minimal, for the simulated session)
const userDefaults = { uid: CURRENT_USER_ID, email: '', name: '' };

function readList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

// ---- auth (simulated) ----

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

function setSession(user) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

// Mirrors POST /api/auth/sync — replace the body with a fetch() later.
function syncUser({ email, name }) {
  const user = { ...userDefaults, uid: CURRENT_USER_ID, email, name: name || email.split('@')[0] };
  setSession(user);
  return user;
}

function signOut() {
  setSession(null);
}

// ---- visits CRUD (mirrors GET/POST/PUT/DELETE /api/visits) ----

function getAll() {
  return readList(STORAGE_KEY);
}

// Mirrors GET /api/visits?country=&category=&minRating=
function getVisits({ country = '', category = '', minRating = 0 } = {}) {
  return getAll().filter(
    (v) =>
      (!country || v.country.toLowerCase() === country.toLowerCase()) &&
      (!category || v.category.toLowerCase() === category.toLowerCase()) &&
      v.rating >= Number(minRating)
  );
}

function addVisit(data) {
  const visit = {
    ...visitDefaults,
    ...data,
    _id: newId(),
    userId: CURRENT_USER_ID,
    createdAt: new Date().toISOString(),
  };
  writeList(STORAGE_KEY, [...getAll(), visit]);
  return visit;
}

function updateVisit(id, data) {
  const visits = getAll();
  const idx = visits.findIndex((v) => v._id === id);
  if (idx === -1) return null;
  visits[idx] = { ...visits[idx], ...data, _id: id, userId: CURRENT_USER_ID };
  writeList(STORAGE_KEY, visits);
  return visits[idx];
}

function deleteVisit(id) {
  writeList(STORAGE_KEY, getAll().filter((v) => v._id !== id));
}

// ---- demo data (first run only) ----

const SEED_VISITS = [
  {
    country: 'Singapore', placeType: 'Restaurant', category: 'Food',
    primaryVenue: 'Anjappar', alternativeVenues: ['McDonald', 'Raza', 'Zamzam'],
    rating: 5, comments: 'Parotta is good in Anjappar.',
    photoUrl: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=60',
  },
  {
    country: 'Singapore', placeType: 'Nightlife district', category: 'Nightout',
    primaryVenue: 'Clarke Quay', alternativeVenues: ['Zouk'],
    rating: 4, comments: 'Riverside bars, gets crowded after 10pm.',
    photoUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f00389dd6?w=800&q=60',
  },
  {
    country: 'Singapore', placeType: 'Airport', category: 'Food',
    primaryVenue: 'Jewel Changi Food Court', alternativeVenues: [],
    rating: 5, comments: 'Best airport food pick — huge variety, fast.',
    photoUrl: 'https://images.unsplash.com/photo-1555217851-6141535bd771?w=800&q=60',
  },
  {
    country: 'Japan', placeType: 'Mountain trail', category: 'Hiking',
    primaryVenue: 'Mt. Takao Trail 1', alternativeVenues: ['Trail 6'],
    rating: 5, comments: 'Easy summit, great view of Fuji on a clear day.',
    photoUrl: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&q=60',
  },
  {
    country: 'Japan', placeType: 'Market', category: 'Shopping',
    primaryVenue: 'Takeshita Street', alternativeVenues: ['Don Quijote'],
    rating: 3, comments: 'Fun but very crowded on weekends.',
    photoUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=60',
  },
  {
    country: 'UAE', placeType: 'Mall', category: 'Shopping',
    primaryVenue: 'Dubai Mall', alternativeVenues: ['Mall of the Emirates'],
    rating: 4, comments: 'Everything under one roof; aquarium is a bonus.',
    photoUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=60',
  },
  {
    country: 'UAE', placeType: 'Beach', category: 'Travel',
    primaryVenue: 'JBR Beach', alternativeVenues: ['Kite Beach'],
    rating: 4, comments: 'Sunset walk with the skyline behind you.',
    photoUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=60',
  },
  {
    country: 'India', placeType: 'Landmark', category: 'Travel',
    primaryVenue: 'Marina Beach', alternativeVenues: ['Besant Nagar Beach'],
    rating: 3, comments: 'Early morning is the time to go.',
    photoUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=60',
  },
  {
    country: 'India', placeType: 'Stadium', category: 'Sports',
    primaryVenue: 'M. A. Chidambaram Stadium', alternativeVenues: [],
    rating: 5, comments: 'Chepauk atmosphere during an IPL night is unmatched.',
    photoUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=60',
  },
  {
    country: 'Japan', placeType: 'Restaurant', category: 'Food',
    primaryVenue: 'Ichiran Ramen', alternativeVenues: ['Afuri'],
    rating: 5, comments: 'Solo booth ramen; the spicy variant is worth it.',
    photoUrl: 'https://images.unsplash.com/photo-1557872943-3a1e9b9e6b5a?w=800&q=60',
  },
  {
    country: 'Singapore', placeType: 'Park', category: 'Sports',
    primaryVenue: 'East Coast Park', alternativeVenues: [],
    rating: 4, comments: 'Rent a bike and ride the coastline path.',
    photoUrl: 'https://images.unsplash.com/photo-1525617261899-1f7c1deacen?w=800&q=60',
  },
  {
    country: 'UAE', placeType: 'Nightlife district', category: 'Nightout',
    primaryVenue: 'Rooftop Bar, Jumeirah', alternativeVenues: [],
    rating: 5, comments: 'Best nightout spot — skyline view while you sip.',
    photoUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=60',
  },
];

function seedIfEmpty() {
  if (getAll().length === 0) {
    // Stagger createdAt so the grid sorts newest-first meaningfully.
    writeList(
      STORAGE_KEY,
      SEED_VISITS.map((v, i) => ({
        ...visitDefaults,
        ...v,
        _id: newId(),
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      }))
    );
  }
}

// Secure contexts (http://localhost, https) have crypto.randomUUID; file:// doesn't.
function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2);
}

// Single namespace consumed by app.js — swap its insides for fetch() later.
const store = {
  getSession,
  syncUser,
  signOut,
  getAll,
  getVisits,
  addVisit,
  updateVisit,
  deleteVisit,
  seedIfEmpty,
};
