const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 MongoDB
mongoose.connect("YOUR_MONGODB_URL")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// 🔹 Schema
const SessionSchema = new mongoose.Schema({
  content: String,
  keystrokes: Array,
  pasteEvents: Number,
  avgSpeed: Number,
  pauses: Number,
  score: Number,
  flags: [String],
  label: String,
  focusLost: Number,
  idleEvents: Number,
  backspaces: Number,
  hesitations: Number,
  bursts: Number,
  createdAt: { type: Date, default: Date.now }
});

const Session = mongoose.model("Session", SessionSchema);

// 🔹 Routes
app.post("/save", async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.json({ message: "Saved" });
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/sessions", async (req, res) => {
  const data = await Session.find();
  res.json(data);
});

app.listen(5000, () => console.log("Server running on 5000"));