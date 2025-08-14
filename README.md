# Chrome Productivity Tracker (Task-4)

Tracks time on websites, classifies domains, stores data in a backend, and shows a weekly dashboard.

## Stack
- Chrome Extension (Manifest V3)
- Backend: Node.js + Express + MongoDB (Mongoose)
- Dashboard: React (Vite)

## Quick Start

### 1) Backend
```bash
cd server
cp .env.example .env
# edit .env for MongoDB + CORS origins
npm install
npm run dev
