# ✍️ Vi-Notes

Vi-Notes is a writing authenticity verification system that detects whether content is written by a human or AI using behavioral analysis.

## 🚀 Features
- Real-time writing editor
- Keystroke tracking (typing speed, pauses)
- Paste detection
- Authenticity scoring (0–100)
- Suspicious activity flags
- MongoDB cloud storage

## 🧠 Detection Logic
- Typing rhythm analysis
- Pause patterns
- Paste frequency
- Speed variation
- Editing behavior

## 🛠 Tech Stack
- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: MongoDB Atlas

## ▶️ How to Run

### Backend
cd server  
node index.js  

### Frontend
cd client  
npm install  
npm run dev  

## 📊 Output
- Authenticity Score
- Status (Human / Suspicious / AI)
- Flags explaining reasoning

## 🎯 Project Goal
To verify human-written content and detect AI-generated text using behavioral patterns.