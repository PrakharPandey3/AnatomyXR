# AnatomyXR — Interactive 3D Anatomy Lab

AnatomyXR is a full-stack learning prototype for exploring selected heart structures in an interactive 3D scene, reading concise anatomy notes, completing quizzes, and saving learning progress. It is designed as an end-term software project with complete workflows rather than a static landing page.

Live Demo: https://anatomy-xr.vercel.app/


## Problem statement
Medical and anatomy learners often switch between static diagrams, notes, and quizzes. AnatomyXR brings a small set of interactive structure exploration and practice workflows into one browser-based learning lab.

## Target users
- Medical and allied-health students learning foundational heart anatomy
- Anatomy educators preparing introductory learning activities
- Curious learners exploring how the heart's chambers and major vessels relate

## Key workflows
1. **Explore:** rotate and zoom the 3D illustration, select a chamber or vessel, search structures, and inspect its function and key facts.
2. **Learn:** open the Heart Foundations quiz, answer five questions, submit them for server-side scoring, and read explanations.
3. **Save:** create an account, log in with a secure HTTP-only cookie, bookmark structures, and retain quiz attempts in MongoDB.
4. **Review:** use the personal dashboard to see saved structures, number of quiz attempts, and average score.

## Tech stack
- **Frontend:** React, Vite, CSS, React Three Fiber, Three.js, @react-three/drei, Axios, Lucide React
- **Backend:** Node.js, Express, Mongoose, MongoDB
- **Security:** bcrypt password hashing, JWT in an HTTP-only cookie, Helmet, CORS allowlist, rate limiting, server-side validation
- **Deployment suggestion:** frontend on Vercel or Netlify; backend on Render; database on MongoDB Atlas

## Architecture
```text
Browser (React)
  ├─ Anatomy explorer (React Three Fiber / Three.js)
  ├─ Quiz UI and dashboard
  └─ Axios requests with credentials
          │ HTTPS + HTTP-only session cookie
          ▼
Express REST API
  ├─ /api/auth       registration, login, logout, current user
  ├─ /api/structures structure catalogue and detail
  ├─ /api/quizzes    quiz catalogue, quiz questions, submissions
  ├─ /api/bookmarks  authenticated bookmark toggle
  └─ /api/dashboard authenticated summary and history
          │ Mongoose
          ▼
MongoDB
  └─ users, password hashes, bookmarks, quiz attempts
```

The first anatomy catalogue and quiz definitions are maintained as version-controlled application data. User-specific state (accounts, bookmarks, quiz attempts) is persisted in MongoDB. The 3D model is procedural in this prototype; the geometry itself is not stored in the database.

## Project structure
```text
anatomyxr/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/       # Auth and anatomy workflows
│   │   ├── middleware/auth.js # Session verification
│   │   ├── models/User.js
│   │   ├── routes/            # REST endpoints
│   │   ├── utils/anatomyData.js
│   │   └── server.js
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/        # 3D heart and auth modal
│   │   ├── lib/api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   └── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Requirements
- Node.js 20 or newer recommended
- npm
- A MongoDB instance (local MongoDB or MongoDB Atlas)

## Run locally

### 1. Configure the backend
```bash
cd backend
cp .env.example .env
```
Set `MONGODB_URI` to your MongoDB connection string and set `JWT_SECRET` to a long random value (at least 32 characters). Keep `.env` private and never commit it.

### 2. Configure the frontend
In a second terminal:
```bash
cd frontend
cp .env.example .env
```
The default API URL is `http://localhost:5000/api`.

### 3. Install and run
From the project root:
```bash
npm install
npm run install:all
npm run dev
```
Or run each application separately:
```bash
# Terminal 1
cd backend && npm install && npm run dev

# Terminal 2
cd frontend && npm install && npm run dev
```
Open <http://localhost:5173>. The backend health check is <http://localhost:5000/api/health>.

> If your shell does not support `cp`, manually duplicate each `.env.example` file as `.env` and edit it.

## Environment variables

### Backend
| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port; defaults to `5000` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Random secret, minimum 32 characters |
| `CLIENT_URL` | Yes for deployment | Exact frontend origin allowed by CORS |
| `NODE_ENV` | No | Set to `production` in deployment |

### Frontend
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes for deployment | Backend base URL ending in `/api` |

## API overview

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Create account and session |
| POST | `/api/auth/login` | No | Create session |
| POST | `/api/auth/logout` | No | Clear session cookie |
| GET | `/api/auth/me` | Yes | Current account |
| GET | `/api/structures` | No | List structures |
| GET | `/api/structures/:id` | No | Structure detail |
| GET | `/api/quizzes` | No | Quiz catalogue |
| GET | `/api/quizzes/:id` | No | Quiz questions without answer keys |
| POST | `/api/quizzes/:id/submit` | Yes | Validate and score answers server-side; persist attempt |
| PUT | `/api/bookmarks/:id` | Yes | Toggle a structure bookmark |
| GET | `/api/dashboard` | Yes | Learning summary and saved structures |

## Deployment notes

### MongoDB Atlas
1. Create a database and a database user with a strong password.
2. Restrict network access to your deployment provider where possible.
3. Copy the connection string into the backend deployment's `MONGODB_URI` environment variable.

### Backend on Render
1. Create a new Web Service from the Git repository.
2. Set the root directory to `backend`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, and `NODE_ENV=production` in the service environment.
6. Set `CLIENT_URL` to the exact deployed frontend origin. Use HTTPS for both frontend and backend. Production cookie settings use `Secure` and `SameSite=None` to allow cross-origin frontend/backend deployments.

### Frontend on Vercel or Netlify
1. Import the repository.
2. Set the root directory to `frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add `VITE_API_URL` pointing to the deployed backend URL followed by `/api`.
6. Redeploy after setting environment variables.

After deployment, test registration, login, bookmark persistence, quiz submission, logout, and login again from a private/incognito browser window. Confirm that the frontend origin in `CLIENT_URL` exactly matches the deployed frontend origin. Browser third-party cookie policies can affect cross-site cookies, so keep frontend and API on HTTPS and test in the actual target browsers.

## Reliability and security decisions
- Passwords are hashed with bcrypt; raw passwords are never stored.
- JWT is stored in an HTTP-only cookie rather than browser local storage.
- Quiz answer keys are not returned to the client before submission; scoring is performed on the server.
- Protected routes require a valid session and load the current user from MongoDB.
- Inputs for registration and quiz submission are validated. API requests are rate-limited, and Helmet adds common security headers.
- API failures return readable messages and the frontend has loading, empty, and error states.
- Do not use real patient data. This project is an educational prototype, not a regulated medical product.

## Known limitations / future work
- Replace the procedural heart illustration with an anatomically accurate, optimized and correctly licensed 3D asset with individually selectable mesh labels.
- Add more anatomical systems and an explicit structure-to-mesh mapping.
- Add instructor-created quizzes and shared guided sessions.
- Add automated backend tests and end-to-end tests.
- Add accessibility testing for 3D interactions and a keyboard-driven alternative to selecting meshes.
- Consider CSRF protection and stricter deployment cookie/origin configuration before treating this prototype as a production service.

## Demo video plan (3–5 minutes)
1. (0:00–0:25) Introduce the learner problem and AnatomyXR's purpose.
2. (0:25–1:20) Rotate/zoom the 3D heart, select structures, search, and toggle layers.
3. (1:20–2:00) Open a structure and explain the function and key facts.
4. (2:00–2:50) Register/log in, bookmark a structure, and refresh to show persistence.
5. (2:50–3:40) Complete the quiz, show server-scored feedback and the saved dashboard result.
6. (3:40–4:00) Briefly show the architecture, README, and deployed app.

## Submission details template
- **Project Name:** AnatomyXR — Interactive 3D Anatomy Lab
- **Student Name:** [Your name]
- **Problem Statement:** Anatomy learners often use disconnected static diagrams and quizzes. AnatomyXR combines interactive 3D structure exploration with practice and persistent learning progress.
- **GitHub Repository:** [Add your repository URL]
- **Deployed Application:** [Add your deployment URL]
- **Demo Video:** [Add your demo URL]
- **Tech Stack:** React, Vite, React Three Fiber, Three.js, Node.js, Express, MongoDB, Mongoose
- **Major Features:** Interactive 3D heart illustration, searchable structure catalogue, structure details, server-scored quiz, secure authentication, bookmarks, persistent learning dashboard.
