# 📜 Quest Booking System

Welcome, traveler, to the **Quest Booking System** — a medieval-fantasy themed platform for organizing your party's epic adventures!

This project features a fully custom Dungeons & Dragons aesthetic with immersive UI elements, including parchment backgrounds, magical loading screens, and custom quest logs.

---

## ✨ Features

- **🏰 D&D Themed UI**: Parchment textures, medieval fonts (`Cinzel`), gold rune-glow hover effects, and a spinning magic circle loading screen.
- **📅 Interactive Calendar**: A beautifully styled calendar grid showing available dates, unbookable days, and past history.
- **📜 Quest Log Detail**: View the daily quests logged by your party using a custom scroll-style modal.
- **⚔️ Quest Reservation**: Secure your time of battle with a "Register Quest" modal.
- **🔥 Rewrite Fate**: Edit your previously booked quests.
- **🗑️ Cancel Quest**: Delete quests with a custom blood-red confirmation dialog.
- **🛡️ Time Magic (Rules)**: Bookings must be made at least 3 days in advance. Past dates are locked away in the annals of history.

---

## 🛠️ Tech Stack

### Frontend (The Scroll of Viewing)
- **Next.js 15 (React)** — App Router
- **TypeScript**
- **Vanilla CSS Modules** for custom D&D styling

### Backend (The Guild Server)
- **Node.js + Express**
- **SQLite3** for persistent quest data storage
- RESTful API architecture
- CORS enabled for frontend communication

---

## 🚀 How to Run Locally

To cast this spell on your own local device, you'll need two runtimes: one for the Guild Server and one for the Scroll of Viewing.

### 1. Start the Guild Server (Backend)

Open a terminal in the root project folder and navigate to the `server` directory:
```bash
cd server
npm install
node server.js
```
*The server will awaken on `http://localhost:3001`.*

### 2. Open the Scroll of Viewing (Frontend)

Open a second terminal and navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
*The scroll will unfurl at `http://localhost:3002`.*

---

## 🎲 May the dice be ever in your favor...
