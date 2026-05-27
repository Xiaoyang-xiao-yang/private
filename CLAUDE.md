# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TodoList — a full-stack CRUD todo app: React 18 frontend, Node.js/Express backend, MySQL 8 database. Orchestrated via Docker Compose with three services on a shared bridge network.

## Quick Start

```bash
# Full-stack via Docker
docker-compose up --build -d

# Frontend: http://localhost
# Backend API: http://localhost:3001/api/todos
```

Local development (no Docker):
```bash
# Backend (cd backend; set DB_HOST=localhost in .env)
npm install && npm run dev

# Frontend (cd frontend)
npm install && npm start
```

## Commands

| What | Command |
|------|---------|
| Docker up (build + start all) | `docker-compose up --build -d` |
| Docker down (stop all) | `docker-compose down` |
| Docker down + wipe DB | `docker-compose down -v` |
| View all logs | `docker-compose logs -f` |
| Backend start (local) | `cd backend && npm start` |
| Backend dev (nodemon) | `cd backend && npm run dev` |
| Frontend dev server | `cd frontend && npm start` |
| Frontend tests | `cd frontend && npm test` |
| Frontend production build | `cd frontend && npm run build` |

## Architecture

```
Browser (port 80)
  └── Nginx (frontend container)
        ├── /           → static files (React build)
        └── /api/*      → proxy_pass to backend:3001
                              └── Express (backend container)
                                    └── MySQL 8 (mysql container, port 3306)
```

**Backend** (`backend/server.js`): Single-file Express server. Creates the MySQL connection pool with retry logic (waits for MySQL healthcheck). On startup, auto-creates the database and `todos` table if they don't exist (`CREATE DATABASE IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`). REST API at `/api/todos` with full CRUD — the `todos` table has columns: `id`, `title`, `completed` (TINYINT), `created_at`.

**Frontend** (`frontend/src/`): Create React App. Single component `App.js` manages all state locally (no router, no state library). Uses axios to call the backend API. The API base URL defaults to `http://localhost:3001` and can be overridden via `REACT_APP_API_URL` env var. In Docker, Nginx reverse-proxies `/api/` calls so the frontend doesn't need to know the backend address.

**Note:** `backend/db.js` exports a pool module but it is unused — the pool is created inline in `server.js`.

**`.env`** note: the file says `PORT=5000` but `server.js` reads `SERVER_PORT` (defaulting to 3001). Docker Compose injects `SERVER_PORT=3001` via `environment`.
