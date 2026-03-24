const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB Atlas connection
mongoose.connect(
  "mongodb://anushka:123anus@ac-ccihaw4-shard-00-00.vmgp6ex.mongodb.net:27017,ac-ccihaw4-shard-00-01.vmgp6ex.mongodb.net:27017,ac-ccihaw4-shard-00-02.vmgp6ex.mongodb.net:27017/vinotes?ssl=true&replicaSet=atlas-ezqhld-shard-0&authSource=admin&retryWrites=true&w=majority"
)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

// ✅ Updated Schema
const SessionSchema = new mongoose.Schema({
  content: String,
  keystrokes: Array,
  pasteEvents: Number,
  avgSpeed: Number,
  pauses: Number,
  score: Number,
  flags: [String],
  label: String,
  createdAt: { type: Date, default: Date.now }
});

const Session = mongoose.model("Session", SessionSchema);

// ✅ Save session
app.post("/save", async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.json({ message: "Saved Successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// ✅ Get sessions
app.get("/sessions", async (req, res) => {
  const data = await Session.find();
  res.json(data);
});

app.listen(5000, () => console.log("Server running on 5000"));