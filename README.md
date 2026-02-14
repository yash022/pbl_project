# MPMS — Major Project Management System

> Full-stack PBL workflow platform for **Manipal University Jaipur** (MUJ).  
> Built with **React + Tailwind CSS** (frontend) and **Node.js + Express** (backend).  
> **No database required** — all data lives in memory via a pre-seeded mock store.

---

## Features

| Module | Student | Mentor | PBL Faculty | Admin |
|---|---|---|---|---|
| Authentication | ✅ | ✅ | ✅ | ✅ |
| Mentor Allocation | Send requests, withdraw | Accept / reject | — | View, freeze |
| Project & Tasks | View project, update tasks | CRUD tasks, assign | — | — |
| Meetings | View attendance | Schedule, mark attendance | — | — |
| Announcements | View | Post | — | — |
| Diary | Submit daily entries | Verify entries | — | — |
| Internal Evaluation | — | Submit marks | — | Lock/unlock |
| Presentations | View slot | — | Create events, evaluate | Lock/unlock |
| Admin Panel | — | — | — | User mgmt, freeze, exports |

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Lucide Icons
- **Backend:** Express 4, JWT (access + refresh), bcrypt, helmet, rate-limit
- **Data:** In-memory JavaScript objects (no MongoDB / Postgres needed)

---

## Project Structure

```
pbl/
├── package.json          # monorepo scripts (concurrently)
├── apps/
│   ├── api/              # backend
│   │   ├── src/
│   │   │   ├── index.js          # Express entry
│   │   │   ├── config.js         # secrets, env
│   │   │   ├── data/store.js     # mock data
│   │   │   ├── middleware/auth.js # JWT + RBAC
│   │   │   └── routes/           # 8 route files
│   │   └── package.json
│   └── web/              # frontend
│       ├── src/
│       │   ├── main.jsx / App.jsx
│       │   ├── lib/api.js
│       │   ├── context/AuthContext.jsx
│       │   ├── components/        # Layout, ProtectedRoute
│       │   └── pages/
│       │       ├── student/  (6 pages)
│       │       ├── mentor/   (6 pages)
│       │       ├── faculty/  (4 pages)
│       │       └── admin/    (4 pages)
│       ├── vite.config.js
│       └── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js ≥ 18**
- **npm ≥ 9**

### Install

```bash
cd pbl
npm run install:all
```

This runs `npm install` in the root, `apps/api`, and `apps/web`.

### Run (development)

```bash
npm run dev
```

This starts **both** servers concurrently:

| Service | URL |
|---|---|
| Backend API | http://localhost:5000 |
| Frontend | http://localhost:5173 |

The Vite dev server proxies `/api/*` to the backend automatically.

### Run separately

```bash
npm run dev:api    # backend only
npm run dev:web    # frontend only
```

---

## Demo Accounts

All passwords use the MUJ email domain `@jaipur.manipal.edu`.

| Role | Email | Password |
|---|---|---|
| Admin | admin@jaipur.manipal.edu | Admin@123 |
| Mentor | rahul.sharma@jaipur.manipal.edu | Mentor@123 |
| Mentor | priya.verma@jaipur.manipal.edu | Mentor@123 |
| Student | yash.sehgal@jaipur.manipal.edu | Student@123 |
| Student | ananya.gupta@jaipur.manipal.edu | Student@123 |
| Student | rohan.kumar@jaipur.manipal.edu | Student@123 |
| Faculty | deepak.mishra@jaipur.manipal.edu | Faculty@123 |

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Description |
|---|---|---|
| POST | /register | Register new user |
| POST | /login | Login → access token + refresh cookie |
| POST | /refresh | Refresh access token |
| POST | /logout | Clear refresh cookie |
| GET | /me | Current user info |

### Mentors (`/api/mentors`)
| Method | Path | Description |
|---|---|---|
| GET | / | List mentors with slots |
| POST | /request | Student sends mentor request |
| GET | /requests | View requests (by role) |
| PATCH | /requests/:id | Accept/reject request |

### Projects (`/api/projects`)
| Method | Path | Description |
|---|---|---|
| GET | / | List user's projects |
| GET | /:id | Project details |
| PATCH | /:id | Update project |
| GET | /:id/tasks | List tasks (with filters) |
| POST | /:id/tasks | Create task |
| PATCH | /:id/tasks/:tid | Update task |
| POST | /:id/tasks/:tid/comments | Add task comment |
| GET | /:id/activity | Activity log |

### Meetings (`/api/meetings`)
| Method | Path | Description |
|---|---|---|
| POST | /:pid/meetings | Schedule meeting |
| GET | /:pid/meetings | List meetings |
| PATCH | /meetings/:mid/attendance | Mark attendance |
| POST | /:pid/announcements | Post announcement |
| GET | /:pid/announcements | List announcements |

### Diary (`/api/diary`)
| Method | Path | Description |
|---|---|---|
| POST | /:pid/diary | Submit diary entry |
| GET | /:pid/diary | List diary entries |
| PATCH | /diary/:did/verify | Mentor verify entry |

### Evaluation (`/api/evaluation`)
| Method | Path | Description |
|---|---|---|
| POST | /:pid/evaluate | Submit internal marks |
| GET | /:pid/marks | View marks |
| PATCH | /admin/lock | Admin toggle lock |

### Presentations (`/api/presentations`)
| Method | Path | Description |
|---|---|---|
| POST | /events | Create event (faculty) |
| GET | /events | List events |
| POST | /events/:eid/slots | Generate slots |
| GET | /events/:eid/slots | List slots |
| PATCH | /slots/:sid/assign | Assign project to slot |
| POST | /slots/:sid/evaluate | Evaluate presentation |
| PATCH | /admin/lock-presentations | Admin toggle lock |

### Admin (`/api/admin`)
| Method | Path | Description |
|---|---|---|
| GET | /users | List all users |
| PATCH | /users/:id/role | Change user role |
| PATCH | /mentor-profile/:id | Edit mentor profile |
| POST | /freeze | Set freeze (target/frozen) |
| PATCH | /freeze | Toggle freeze (key: bool) |
| GET | /freeze-settings | Current freeze state |
| GET | /export/allocation | CSV export |
| GET | /export/internal-marks | CSV export |
| GET | /export/presentation-marks | CSV export |
| GET | /export/final-report | CSV export |

---

## MUJ Branding

| Token | Hex | Usage |
|---|---|---|
| `muj-orange` | #E4542E | Primary action color |
| `muj-charcoal` | #231F20 | Text, sidebar |
| `muj-beige` | #F6F4F1 | Background |
| Font | Lato | Google Fonts |

---

## License

Academic project — Manipal University Jaipur.
