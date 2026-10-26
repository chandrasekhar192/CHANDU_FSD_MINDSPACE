# MindSpace — Mood Tracker & Wellness Journal

MindSpace is a full-stack personal wellness application designed to foster mindfulness, emotional self-awareness, and supportive daily routines. Built using **React (Vite)**, **Node.js (Express)**, and **MongoDB**, MindSpace enables users to log emotional check-ins, compose private reflective journals, and cultivate consistent habits within a calming, accessible dashboard.

> **Notice:** MindSpace is a personal wellness tool intended for self-reflection and habit tracking. It does not provide medical diagnoses, clinical treatment, or psychological care, and is not a substitute for professional healthcare.

---

## Table of Contents

1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Architecture & Design](#architecture--design)
4. [Screens & Pages](#screens--pages)
5. [Database Models](#database-models)
6. [API Endpoint Summary](#api-endpoint-summary)
7. [Local Prerequisites](#local-prerequisites)
8. [Installation & Setup](#installation--setup)
9. [Local Development Commands](#local-development-commands)
10. [Environment Variables](#environment-variables)
11. [Testing](#testing)
12. [MongoDB Atlas Configuration](#mongodb-atlas-configuration)
13. [Render Deployment Guide](#render-deployment-guide)
14. [Security & Data Privacy](#security--data-privacy)
15. [Known Limitations](#known-limitations)

---

## 1. Features

- **JWT Authentication & Session Management**: Secure user registration, credential verification, and bearer token session restoration stored safely in browser `sessionStorage`.
- **Mood Tracking**: Log multiple entries per day with emoji-based controls, 1–10 intensity slider, predefined activity tags, energy levels, and optional notes.
- **Visual Analytics**: Interactive Recharts-powered daily average mood progression line charts and mood frequency distribution bar charts over 7-day and 30-day timeframes.
- **Wellness Journal**: Full CRUD private journaling with real-time text search, mood associations, dynamic tagging, and multi-line content formatting.
- **Habit Builder**: Daily routine tracker with idempotent one-click completion toggling, 7-day streak history visualization, and active/inactive habit management.
- **Wellness Dashboard**: Central overview showing today's mood count, journal status, habit completion percentage, weekly mood trend, and recent check-in feed.
- **Responsive Layout**: Designed with a persistent sidebar on desktop and a slide-out hamburger navigation on mobile devices.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router DOM v6
- **Charts**: Recharts
- **Styling**: Vanilla CSS with reusable design tokens (CSS variables)
- **Data Fetching**: Fetch API with centralized bearer token injection and 401 interceptors

### Backend
- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Database**: MongoDB (Atlas in production / MongoMemoryServer in tests)
- **ODM**: Mongoose 8
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Validation**: `express-validator` & Mongoose schema validations
- **CORS**: Configurable origin middleware with preflight handling

---

## 3. Architecture & Design

MindSpace is architected as an independently deployable decoupled client-server application:

```
FSD PROJECT/
├── client/                     # Frontend Single Page Application (Vite + React)
│   ├── public/
│   │   └── _redirects          # SPA client-side routing rewrite for Render
│   ├── src/
│   │   ├── components/         # Reusable components (Buttons, Cards, Inputs, Modals)
│   │   │   ├── common/
│   │   │   ├── layout/         # AppLayout, Sidebar, MobileNav
│   │   │   ├── mood/           # MoodSelector, MoodBadge, MoodCard
│   │   │   └── charts/         # MoodLineChart, MoodDistributionChart
│   │   ├── contexts/           # AuthContext (JWT session restoration, login, logout)
│   │   ├── pages/              # Landing, Login, Register, Dashboard, Mood, Journal, Habits, Settings
│   │   ├── services/           # Centralized API service with Bearer auth injection
│   │   ├── styles/             # Modular CSS stylesheets and color variables
│   │   ├── utils/              # Date formatting (UTC policy), constants, mood scores
│   │   ├── App.jsx             # Router and ProtectedRoute declarations
│   │   └── main.jsx            # DOM root mounting
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend REST API (Node.js + Express + Mongoose)
│   ├── config/                 # Database connection logic
│   ├── controllers/            # Request handlers for auth, moods, journal, habits, dashboard, insights
│   ├── middleware/             # JWT auth verification, error handler, input validators
│   ├── models/                 # Mongoose schemas: User, MoodEntry, JournalEntry, Habit, HabitCompletion
│   ├── routes/                 # Express route definitions under /api
│   ├── tests/                  # In-memory automated tests with Jest & Supertest
│   ├── utils/                  # Date helpers (UTC midnight policy) and numerical score mappings
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Express application entry point
│
├── .gitignore                  # Git exclusions for dependencies, builds, and secrets
└── README.md                   # Project documentation
```

### Date Handling Policy
To prevent inconsistent date parsing and unexpected shifts caused by local/UTC timezone differences, **all date-based grouping and daily records use UTC midnight dates** (`YYYY-MM-DDT00:00:00.000Z`).

---

## 4. Screens & Pages

| Page | Route | Description |
|---|---|---|
| **Landing** | `/` | Welcoming product overview, core feature highlights, and sign-in shortcuts. |
| **Login** | `/login` | Email and password authentication with client-side validation. |
| **Register** | `/register` | Account onboarding with password confirmation matching. |
| **Dashboard** | `/dashboard` | Today's stats, quick actions, weekly mood line chart, and recent check-ins. |
| **Mood Tracker** | `/mood` | Mood check-in form with intensity, activities, energy level, and editable entry feed. |
| **Mood History** | `/mood-history`| 7-day and 30-day analytics, daily average score line chart, and distribution breakdown. |
| **Wellness Journal**| `/journal` | Searchable list of journal reflections with tags and mood indicators. |
| **New Journal** | `/journal/new` | Full editor with title, body, mood association, and dynamic tag management. |
| **Journal Detail** | `/journal/:id` | Focused view of a single entry with edit and permanent delete options. |
| **Habits** | `/habits` | Habit creator, today completion toggle, and 7-day history progress dots. |
| **Settings** | `/settings` | Profile details, session status, wellness disclaimer, and logout action. |

---

## 5. Database Models

### User (`server/models/User.js`)
- `name` (String, required, max 50 chars)
- `email` (String, required, unique, lowercase, trimmed)
- `password` (String, required, hashed via bcrypt, excluded by default `select: false`)
- `createdAt`, `updatedAt` (Timestamps)

### MoodEntry (`server/models/MoodEntry.js`)
- `userId` (ObjectId, ref: User, required, indexed)
- `mood` (String, enum: `['great', 'good', 'okay', 'low', 'bad']`, required)
- `intensity` (Number, 1–10, required)
- `note` (String, max 500 chars)
- `activities` (Array of Strings: `exercise`, `meditation`, `reading`, `socializing`, `work`, `hobby`, `nature`, `music`, `cooking`, `gaming`, `travel`, `rest`)
- `energyLevel` (Number, 1–5, optional)
- `entryDate` (Date, UTC midnight date, required)
- Compound Index: `{ userId: 1, entryDate: -1 }`

### JournalEntry (`server/models/JournalEntry.js`)
- `userId` (ObjectId, ref: User, required, indexed)
- `title` (String, required, max 200 chars)
- `content` (String, required, max 5000 chars)
- `mood` (String, enum: `['great', 'good', 'okay', 'low', 'bad']`, optional)
- `tags` (Array of Strings, max 10 tags, max 30 chars each)
- Compound Index: `{ userId: 1, createdAt: -1 }`

### Habit (`server/models/Habit.js`)
- `userId` (ObjectId, ref: User, required, indexed)
- `name` (String, required, max 100 chars)
- `description` (String, max 300 chars)
- `isActive` (Boolean, default: true)
- Index: `{ userId: 1 }`

### HabitCompletion (`server/models/HabitCompletion.js`)
- `userId` (ObjectId, ref: User, required)
- `habitId` (ObjectId, ref: Habit, required)
- `completionDate` (Date, UTC midnight, required)
- `completed` (Boolean, default: true)
- Compound Unique Index: `{ userId: 1, habitId: 1, completionDate: 1 }` (guarantees idempotency)

---

## 6. API Endpoint Summary

All API routes are prefixed under `/api`:

### Health Check
- `GET /api/health` — Returns service health status and timestamp.

### Authentication
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`, `passwordConfirm`).
- `POST /api/auth/login` — Authenticate and receive a JWT (`email`, `password`).
- `GET /api/auth/me` — Retrieve current authenticated profile (Protected).

### Mood Tracking (All Protected)
- `POST /api/moods` — Record a mood entry.
- `GET /api/moods` — List mood entries (supports `startDate`, `endDate`, `mood`, `page`, `limit`).
- `GET /api/moods/:id` — Retrieve a single mood entry.
- `PUT /api/moods/:id` — Update an owned mood entry.
- `DELETE /api/moods/:id` — Delete an owned mood entry.

### Journal (All Protected)
- `POST /api/journal` — Create a journal reflection (`title`, `content`, `mood`, `tags`).
- `GET /api/journal` — List journal entries (supports text `search`, `mood`, `page`, `limit`).
- `GET /api/journal/:id` — Retrieve a single entry.
- `PUT /api/journal/:id` — Update an owned entry.
- `DELETE /api/journal/:id` — Permanently delete an entry.

### Habits & Completions (All Protected)
- `POST /api/habits` — Create a new routine (`name`, `description`).
- `GET /api/habits` — List habits (supports `?active=true`).
- `PUT /api/habits/:id` — Update habit details or toggle active state.
- `DELETE /api/habits/:id` — Delete habit and all related completion records.
- `GET /api/habits/completions` — List completions within a date range (`startDate`, `endDate`).
- `PUT /api/habits/:habitId/completion` — Idempotently record or undo completion for a date (`date`, `completed`).

### Dashboard & Analytics (All Protected)
- `GET /api/dashboard/summary` — Overview metrics: today's counts, weekly moods, recent check-ins.
- `GET /api/insights/moods?period=week|month` — Mood distribution, counts, and daily average score timeline.

---

## 7. Local Prerequisites

Ensure the following tools are installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Local instance running at `mongodb://localhost:27017` or a MongoDB Atlas URI)

---

## 8. Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/mindspace.git
cd mindspace
```

### 2. Install Server Dependencies
```bash
cd server
npm install
```

### 3. Install Client Dependencies
```bash
cd ../client
npm install
```

---

## 9. Local Development Commands

### Start Backend API Server
From the `server` directory:
```bash
# Starts the server on port 5000 with file watching
npm run dev

# Or start in standard production mode
npm start
```
The backend API will be reachable at `http://localhost:5000`. Test the health check at `http://localhost:5000/api/health`.

### Start Frontend Development Server
From the `client` directory:
```bash
npm run dev
```
The Vite development server will start at `http://localhost:5173`. Open your browser and navigate to this address.

---

## 10. Environment Variables

### Backend Configuration (`server/.env`)
Create a file named `.env` in the `server` directory:
```env
MONGODB_URI=mongodb://localhost:27017/mindspace
JWT_SECRET=your_super_secret_jwt_key_replace_in_production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

### Frontend Configuration (`client/.env`)
Create a file named `.env` in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

> **Warning:** Never commit `.env` files with actual secrets to version control. Both `.env` files are excluded by `.gitignore`.

---

## 11. Testing

MindSpace includes automated test suites powered by **Jest**, **Supertest**, and **mongodb-memory-server** (an in-memory MongoDB engine requiring no external database connection).

To run the automated tests:
```bash
cd server
npm test
```

### Verified Test Suites
- **`auth.test.js`**: User registration, duplicate email rejection, invalid password handling, password confirmation validation, login verification, JWT token checks, and cross-user data isolation.
- **`moods.test.js`**: Mood creation, multiple entries per day, invalid mood enum rejection, retrieval scoped to user, owned entry updates, cross-user modification rejection, and deletion.
- **`journal.test.js`**: Journal creation, search by title and content, pagination, entry updating, deletion, and cross-user access restrictions.
- **`habits.test.js`**: Habit creation, daily completion toggling, idempotency on duplicate completion requests, cross-user habit protection, and cascading completion deletion.
- **`insights.test.js`**: Empty state handling with zero records, daily average mood score computation, UTC date grouping, and multi-user data isolation.

**Current Test Status:** 5 suites passed, 47 out of 47 tests passed.

---

## 12. MongoDB Atlas Configuration

To connect MindSpace to a cloud-hosted MongoDB Atlas database:

1. **Create an Atlas Account**: Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. **Build a Cluster**: Select the **M0 Free Tier** cluster and select your preferred cloud region.
3. **Create Database User**:
   - Navigate to **Security** → **Database Access**.
   - Click **Add New Database User**.
   - Choose **Password Authentication**, configure a username (e.g. `mindspace_user`), and generate a strong password.
   - Assign the role **Read and write to any database**.
4. **Configure Network Access**:
   - Navigate to **Security** → **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) so Render web services can connect.
5. **Obtain Connection String**:
   - Navigate to **Databases** → Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the URI string:
     ```
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/mindspace?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials.

---

## 13. Render Deployment Guide

MindSpace is designed to be deployed on **Render** as two independently hosted services:
1. A **Web Service** for the Node.js Express backend.
2. A **Static Site** for the React Vite frontend.

### Deployment Order

```
[1. Configure MongoDB Atlas] 
              │
              ▼
[2. Deploy Backend Web Service] 
              │
              ▼
[3. Verify Backend Health Endpoint]
              │
              ▼
[4. Deploy Frontend Static Site with Backend URL]
              │
              ▼
[5. Set Frontend Origin in Backend CLIENT_URL]
              │
              ▼
[6. Verify Full Application End-to-End]
```

---

### Step 1: Deploy Backend Web Service on Render

1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository containing the MindSpace code.
4. Fill in the service configuration:
   - **Name**: `mindspace-api`
   - **Region**: Choose the region closest to your MongoDB Atlas cluster.
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Scroll down to **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (Render assigns PORT automatically, fallback 5000) |
   | `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster.mongodb.net/mindspace?retryWrites=true&w=majority` |
   | `JWT_SECRET` | A secure, randomly generated 64-character secret string |
   | `CLIENT_URL` | Temporarily set to `http://localhost:5173` (updated in Step 3) |
6. Click **Create Web Service**.
7. Once deployed, verify by visiting `https://your-backend-name.onrender.com/api/health`. You should see `{"status":"ok", ...}`.

---

### Step 2: Deploy Frontend Static Site on Render

1. Click **New +** → **Static Site**.
2. Connect the same GitHub repository.
3. Fill in the static site configuration:
   - **Name**: `mindspace-wellness`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. In **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://your-backend-name.onrender.com/api` |
5. Click **Create Static Site**.
6. The `public/_redirects` file (`/* /index.html 200`) ensures client-side routing works smoothly across page reloads.

---

### Step 3: Connect Frontend Origin in Backend

1. Copy the assigned URL of your frontend static site (e.g., `https://mindspace-wellness.onrender.com`).
2. Go back to your Backend Web Service on Render → **Environment**.
3. Update the `CLIENT_URL` variable to your frontend URL:
   ```
   CLIENT_URL=https://mindspace-wellness.onrender.com
   ```
4. Click **Save Changes**. The backend will automatically restart with the new CORS origin policy.

> **Note on Render Free Tier:** Render free web services spin down after 15 minutes of inactivity. When spinning up from idle, the initial request may take 30–50 seconds. Subsequent requests will be fast.

---

## 14. Security & Data Privacy

- **Password Hashing**: User passwords are encrypted with `bcryptjs` using a cost factor of 10 prior to persistence.
- **Token Security**: Tokens are passed exclusively via the `Authorization: Bearer <token>` header and stored in `sessionStorage` (cleared automatically when the browser tab is closed).
- **Resource Ownership Scoping**: Every database operation (moods, journal entries, habits, completions) verifies the requesting user's ID against the resource's owner. Users cannot view or modify another user's data by manipulating URL parameters.
- **Information Leak Prevention**: The global error handler intercepts all unhandled errors, suppressing stack traces, database URIs, and internal system details in production mode.
- **Input Validation**: Request bodies are sanitized and validated against length and enum constraints using `express-validator` and Mongoose schema definitions.

---

## 15. Known Limitations

- **Email Delivery**: MindSpace does not currently send transactional emails for password resets or email verification; all account actions occur within the app.
- **Rich Media**: Journals and mood check-ins do not currently support image or audio attachments.
- **Offline Sync**: MindSpace requires an active internet connection to communicate with the REST API.
