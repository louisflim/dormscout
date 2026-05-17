# DormScout Installation & Setup Guide

React + Spring Boot + Groq AI chatbot (**DormBot**).

## Prerequisites

| Tool | Notes |
|------|--------|
| Java JDK 17+ | Required for Spring Boot |
| Maven | Use bundled `./mvnw` / `mvnw.cmd` (no separate install) |
| Node.js 18+ | For the React frontend |
| npm | Included with Node.js |
| MySQL 8+ | Local server / MySQL Workbench |
| Git | To clone the repository |

## Project structure

```
dormscout/
├── frontend/          # React app (port 3000)
├── backend/           # Spring Boot API (port 8080)
└── SETUP_GUIDE.md
```

## 1. Database setup

### 1.1 Create the database

In MySQL Workbench:

```sql
CREATE DATABASE IF NOT EXISTS db_dormscout;
```

### 1.2 Column sizes for images (LONGTEXT)

Start the backend **once** so Hibernate creates tables, then run:

`backend/scripts/alter-longtext-columns.sql`

Or run manually:

```sql
USE db_dormscout;
ALTER TABLE listings MODIFY COLUMN images LONGTEXT;
ALTER TABLE listings MODIFY COLUMN description LONGTEXT;
ALTER TABLE users MODIFY COLUMN profile_image LONGTEXT;
```

New installs also get `LONGTEXT` from the JPA entities after a restart.

## 2. Backend setup

### 2.1 Groq API key

1. Sign up at [console.groq.com](https://console.groq.com) (free tier).
2. Create an API key (starts with `gsk_`).

### 2.2 Local secrets (`application-local.properties`)

Copy the example file (gitignored):

```powershell
cd backend
copy src\main\resources\application-local.properties.example src\main\resources\application-local.properties
```

Edit `backend/src/main/resources/application-local.properties`:

```properties
MYSQL_PASSWORD=yourMysqlRootPassword
GROQ_API_KEY=gsk_yourGroqKeyHere
```

Never commit real keys in `application.properties`.

### 2.3 Run the backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

API base: `http://localhost:8080/api`

## 3. Frontend setup

### 3.1 Install dependencies

```powershell
cd frontend
npm install
```

### 3.2 Proxy (required for dev chatbot)

Confirm in `frontend/package.json`:

```json
"proxy": "http://localhost:8080"
```

This forwards `/api/*` from `npm start` to Spring Boot.

### 3.3 Run (development)

```powershell
npm start
```

App: `http://localhost:3000`

## 4. Production build (presentations)

Avoid CRA dev overlays; use a static build:

```powershell
cd frontend
npm run build
npm install -g serve
serve -s build -l 3000
```

In another terminal, run the backend (`.\mvnw.cmd spring-boot:run`).

Open `http://localhost:3000`. The chatbot calls `http://localhost:8080/api/chat/completions` directly in production (no dev proxy).

Optional override: `REACT_APP_CHAT_API_URL=http://localhost:8080/api/chat/completions`

## 5. DormBot (AI chatbot)

| Detail | Value |
|--------|--------|
| UI name | DormBot |
| Provider | Groq |
| Model | `llama-3.1-8b-instant` |
| Endpoint | `POST /api/chat/completions` |
| Visibility | Logged-in users only |
| API key | Backend only (`GROQ_API_KEY` / `groq.api.key` in local properties) |

## 6. Pre-presentation checklist

- [ ] MySQL running; `db_dormscout` exists
- [ ] `application-local.properties` has `MYSQL_PASSWORD` and `GROQ_API_KEY`
- [ ] Backend on `http://localhost:8080`
- [ ] Frontend on `http://localhost:3000` (dev or `serve` build)
- [ ] LONGTEXT columns applied (if uploading large images)
- [ ] Chatbot tested while logged in

## 7. Common errors

| Error | Fix |
|-------|-----|
| Access denied for user root (using password: NO) | Set `MYSQL_PASSWORD` in `application-local.properties` |
| Could not resolve placeholder `GROQ_API_KEY` | Set `GROQ_API_KEY` or `groq.api.key` in local properties |
| Data too long for column `images` | Run `backend/scripts/alter-longtext-columns.sql` |
| Chatbot: Couldn't connect (production build) | Backend must be running; URL is `http://localhost:8080/api/chat/completions` |
| 404 on `/api/chat/completions` | Ensure `ChatController` exists under `com.dormscout.backend.controller` |
| Chatbot not visible | Must be logged in (component returns null when logged out) |
| `GROQ_API_KEY is not configured` | Add key to `application-local.properties` and restart backend |

## API base URL

REST client config: `frontend/src/utils/api.js` → `http://localhost:8080/api`
