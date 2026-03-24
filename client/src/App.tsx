import { useState, useRef } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [keystrokes, setKeystrokes] = useState<number[]>([]);
  const [pasteCount, setPasteCount] = useState(0);
  const [pauses, setPauses] = useState(0);

  const lastTime = useRef<number>(Date.now());

  // 🔹 Handle typing
  const handleKeyDown = () => {
    const now = Date.now();
    const diff = now - lastTime.current;

    if (diff > 2000) {
      setPauses((prev) => prev + 1);
    }

    setKeystrokes((prev) => [...prev, diff]);
    lastTime.current = now;
  };

  // 🔹 Detect paste
  const handlePaste = () => {
    setPasteCount((prev) => prev + 1);
  };

  // 🔹 Calculate speed
  const calculateSpeed = () => {
    if (keystrokes.length === 0) return 0;

    const totalTime = keystrokes.reduce((a, b) => a + b, 0);
    const seconds = totalTime / 1000;

    if (seconds === 0) return 0;

    return Number((text.length / seconds).toFixed(2));
  };

  // 🔥 NEW: Advanced Report Logic
  const getReport = () => {
    let score = 100;
    let flags: string[] = [];

    // Paste check
    if (pasteCount > 2) {
      score -= 30;
      flags.push("Too many paste actions");
    }

    // Pause check
    if (pauses < 2) {
      score -= 20;
      flags.push("Very few pauses (too smooth)");
    }

    // Typing variation
    const variation =
      keystrokes.length > 0
        ? Math.max(...keystrokes) - Math.min(...keystrokes)
        : 0;

    if (variation < 50) {
      score -= 20;
      flags.push("Constant typing speed (non-human)");
    }

    // Speed check
    const speed = calculateSpeed();
    if (speed > 15) {
      score -= 20;
      flags.push("Unusually high typing speed");
    }

    let label = "✅ Human";
    if (score < 60) label = "⚠️ Suspicious";
    if (score < 40) label = "❌ Likely AI";

    return { score, flags, label };
  };

  const report = getReport();

  // 🔹 Save session
  const saveSession = async () => {
    try {
      const data = {
        content: text,
        keystrokes,
        pasteEvents: pasteCount,
        avgSpeed: calculateSpeed(),
        pauses,
        score: report.score,
        flags: report.flags,
        label: report.label,
      };

      await axios.post("http://localhost:5000/save", data);
      alert("Session Saved with Report!");
    } catch (error) {
      console.error(error);
      alert("Error saving session");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", textAlign: "center" }}>
      <h1>Vi-Notes ✍️</h1>

      <textarea
        rows={15}
        cols={80}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="Start writing..."
        style={{ padding: "10px", fontSize: "16px" }}
      />

      <div style={{ marginTop: "15px" }}>
        <p><b>Keystrokes:</b> {keystrokes.length}</p>
        <p><b>Paste Count:</b> {pasteCount}</p>
        <p><b>Pauses:</b> {pauses}</p>
        <p><b>Speed:</b> {calculateSpeed()} chars/sec</p>

        <hr />

        <h3>Authenticity Report</h3>
        <p><b>Score:</b> {report.score}/100</p>
        <p><b>Status:</b> {report.label}</p>

        <p><b>Flags:</b></p>
        <ul>
          {report.flags.length === 0 ? (
            <li>No suspicious activity</li>
          ) : (
            report.flags.map((f, i) => <li key={i}>{f}</li>)
          )}
        </ul>
      </div>

      <button
        onClick={saveSession}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Save Session
      </button>
    </div>
  );
}

export default App;