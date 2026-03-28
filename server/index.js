const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://anushka:123anus@ac-ccihaw4-shard-00-00.vmgp6ex.mongodb.net:27017,ac-ccihaw4-shard-00-01.vmgp6ex.mongodb.net:27017,ac-ccihaw4-shard-00-02.vmgp6ex.mongodb.net:27017/?ssl=true&replicaSet=atlas-ezqhld-shard-0&authSource=admin&appName=Cluster0")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

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
  sentenceVar: Number,
  vocabScore: Number,
  repetition: Number,
  createdAt: { type: Date, default: Date.now }
});

const Session = mongoose.model("Session", SessionSchema);

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