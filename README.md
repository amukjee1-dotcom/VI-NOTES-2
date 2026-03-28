# ✍️ Vi-Notes  
### Writing Authenticity Verification System

---

## 📌 Project Overview

Vi-Notes is a **real-time writing authenticity verification system** that detects whether content is written by a human or generated/assisted by AI.

The system analyzes:
- Typing behavior  
- Keystroke patterns  
- Writing rhythm  
- Linguistic features  

to generate an **authenticity score with detailed evidence**.

---

## 🚀 Key Features

### ✍️ Writing Interface
- Distraction-free editor
- Real-time input monitoring

### ⌨️ Behavioral Analysis
- Keystroke timing tracking  
- Typing speed calculation  
- Pause detection  
- Backspace (correction) tracking  
- Typing bursts detection  
- Hesitation before sentences  

### 🖥️ Desktop Monitoring (Electron)
- Detects window switching (focus loss)  
- Tracks idle time  
- Real-time warnings for suspicious behavior  

### 📊 Text Analysis (NLP-based)
- Sentence length variation  
- Vocabulary diversity  
- Word repetition detection  

### 🔍 AI Detection Logic
- Identifies unnatural typing patterns  
- Detects pasted content  
- Flags AI-like writing behavior  
- Cross-verifies typing + text patterns  

### 📈 Visualization
- Keystroke timing graph  

### 📄 Report Generation
- Authenticity score  
- Suspicious activity flags  
- Downloadable PDF report  

### 🗄️ Data Storage
- MongoDB database  
- Stores writing sessions and reports  

---

## 🧠 Detection Methods

Vi-Notes combines **behavioral and textual analysis**:

### Behavioral Signals
- Natural pauses  
- Variable typing speed  
- Editing patterns  
- Window switching detection  

### Textual Signals
- Sentence variation  
- Vocabulary diversity  
- Repetition patterns  

### Cross-Verification
- Detects text without keystroke data  
- Flags constant typing patterns  
- Identifies mismatch between behavior and content  

---

## 🛠️ Technologies Used

### Frontend
- React  
- TypeScript  

### Backend
- Node.js  
- Express.js  

### Desktop Application
- Electron  

### Database
- MongoDB  

### Libraries
- Chart.js (graph visualization)  
- jsPDF (report generation)  

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/amukjee1-dotcom/VI-NOTES-2.git
cd VI-NOTES-2