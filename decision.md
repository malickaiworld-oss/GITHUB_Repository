Act as a Full-Stack Web Developer. Build a full-stack web application named "Travel & Visit Memory Vault" where users can log, recall, and filter memories from past trips, with data stored securely in MongoDB.

---

### 1. TECH STACK
- Frontend: HTML5, Tailwind CSS, Vanilla JavaScript (or React)
- Backend: Node.js with Express.js
- Database: MongoDB (via Mongoose)
- Authentication: Firebase Auth / Passport.js supporting Email/Password and Google Sign-In, linked to user-specific MongoDB records.

---

### 2. MONGODB DATA SCHEMA (Mongoose Models)

Create two main Mongoose schemas:

A. User Schema:
- firebaseUid / googleId (String, Unique)
- email (String)
- name (String)
- createdAt (Timestamp)

B. Visit Memory Schema:
- userId (ObjectId referencing User / String)
- country: String (e.g., "Singapore")
- placeType: String (e.g., "Airport", "Nightlife district")
- category: String (e.g., "Food", "Sports", "Hiking", "Travel", "Nightout", "Shopping")
- primaryVenue: String (e.g., "Anjappar")
- alternativeVenues: [String] (e.g., ["McDonald", "Raza", "Zamzam"])
- rating: Number (1 to 5)
- comments: String (e.g., "parotta is good in Anjappar")
- photoUrl: String
- createdAt: { type: Date, default: Date.now }

---

### 3. BACKEND API ENDPOINTS (Node/Express)
- POST /api/auth/sync: Sync user profile on login.
- GET /api/visits: Fetch all visits for the logged-in user (with query filters for Country, Category, and Minimum Rating).
- POST /api/visits: Add a new visit memory.
- PUT /api/visits/:id: Update an existing visit memory.
- DELETE /api/visits/:id: Delete a visit memory.

---

### 4. FRONTEND FEATURES & UI COMPONENTS
1. AUTHENTICATION PAGE / MODAL:
   - Login / Sign up with Email & Password.
   - "Sign in with Google" button.

2. DASHBOARD / MEMORY VAULT:
   - Top Search & Filter Bar: Filter by Country, Category (Food, Nightout, Shopping, etc.), and minimum Rating.
   - Smart Recommendation Highlights: Automatically spotlights top-rated places (e.g., Best Airport Food pick based on ratings, Best Nightout spot).
   - Add/Edit Visit Modal: Form matching your exact table layout (Country, Place type, Category, Venue name + alternatives, Rating stars, Comments, Photo link).
   - Visit Cards Grid: Clean cards displaying images, country badges, category badges, star ratings, and review notes.

Please provide the project structure and complete code for backend server (server.js, models, routes) and frontend dashboard.