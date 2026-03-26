import { useState, useRef, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

function App() {
  const [text, setText] = useState("");
  const [keystrokes, setKeystrokes] = useState<any[]>([]);
  const [pasteCount, setPasteCount] = useState(0);
  const [pauses, setPauses] = useState(0);

  // 🔥 Step 1
  const [focusLostCount, setFocusLostCount] = useState(0);
  const [idleTime, setIdleTime] = useState(0);
  const [warning, setWarning] = useState("");

  // 🔥 Step 2
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [burstCount, setBurstCount] = useState(0);

  const lastTime = useRef<number>(Date.now());

  // 🔹 Focus detection
  useEffect(() => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.onFocusLost(() => {
        setFocusLostCount((prev) => prev + 1);
        setWarning("⚠️ Window switched!");
      });

      (window as any).electronAPI.onFocusGained(() => {
        setWarning("");
      });
    }
  }, []);

  // 🔹 Idle detection
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - lastTime.current;

      if (diff > 3000) {
        setIdleTime((prev) => prev + 1);
        setWarning("⚠️ Idle detected!");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 🔹 Key tracking
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let diff;

    if ((window as any).electronAPI) {
      diff = (window as any).electronAPI.captureKey();
    } else {
      const now = Date.now();
      diff = now - lastTime.current;
      lastTime.current = now;
    }

    if (diff > 2000) setPauses((p) => p + 1);

    // 🔥 Hesitation
    if (diff > 1500 && (text.endsWith(".") || text.length === 0)) {
      setHesitationCount((h) => h + 1);
    }

    // 🔥 Burst
    if (diff < 100) {
      setBurstCount((b) => b + 1);
    }

    // 🔥 Backspace
    if (e.key === "Backspace") {
      setBackspaceCount((b) => b + 1);
    }

    const type =
      e.key === "Backspace"
        ? "delete"
        : e.key.length === 1
        ? "char"
        : "other";

    setKeystrokes((prev) => [...prev, { time: diff, type }]);
  };

  const handlePaste = () => setPasteCount((p) => p + 1);

  const calculateSpeed = () => {
    if (!keystrokes.length) return 0;
    const total = keystrokes.reduce((s, k) => s + k.time, 0);
    return Number((text.length / (total / 1000)).toFixed(2));
  };

  // 🔥 REPORT
  const getReport = () => {
    let score = 100;
    let flags: string[] = [];

    if (pasteCount > 2) {
      score -= 30;
      flags.push("Too many pastes");
    }

    if (pauses < 2) {
      score -= 20;
      flags.push("Too smooth typing");
    }

    const times = keystrokes.map((k) => k.time);
    const variation =
      times.length > 0 ? Math.max(...times) - Math.min(...times) : 0;

    if (variation < 50) {
      score -= 20;
      flags.push("Constant typing speed");
    }

    if (calculateSpeed() > 15) {
      score -= 20;
      flags.push("Too fast typing");
    }

    // 🔥 Step 1
    if (focusLostCount > 2) {
      score -= 20;
      flags.push("Window switching detected");
    }

    if (idleTime > 3) {
      score -= 15;
      flags.push("High idle time");
    }

    // 🔥 Step 2
    if (backspaceCount < 2) {
      score -= 15;
      flags.push("No corrections");
    }

    if (hesitationCount < 1) {
      score -= 10;
      flags.push("No hesitation");
    }

    if (burstCount > keystrokes.length * 0.7) {
      score -= 15;
      flags.push("Too continuous typing");
    }

    let label = "✅ Human";
    if (score < 60) label = "⚠️ Suspicious";
    if (score < 40) label = "❌ Likely AI";

    return { score, flags, label };
  };

  const report = getReport();

  // 📊 Graph
  const graphData = {
    labels: keystrokes.map((_, i) => i + 1),
    datasets: [
      {
        label: "Keystroke Timing",
        data: keystrokes.map((k) => k.time),
        borderColor: "blue",
      },
    ],
  };

  // 📄 PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Vi-Notes Report", 20, 20);
    doc.text(`Score: ${report.score}`, 20, 40);
    doc.text(`Status: ${report.label}`, 20, 50);
    doc.text(`Focus Lost: ${focusLostCount}`, 20, 60);
    doc.text(`Idle: ${idleTime}`, 20, 70);
    doc.save("report.pdf");
  };

  const saveSession = async () => {
    await axios.post("http://localhost:5000/save", {
      content: text,
      keystrokes,
      pasteEvents: pasteCount,
      avgSpeed: calculateSpeed(),
      pauses,
      score: report.score,
      flags: report.flags,
      label: report.label,
      focusLost: focusLostCount,
      idleEvents: idleTime,
      backspaces: backspaceCount,
      hesitations: hesitationCount,
      bursts: burstCount
    });

    alert("Saved!");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Vi-Notes</h1>

      <textarea
        rows={15}
        cols={80}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />

      <p>Score: {report.score}</p>
      <p>{report.label}</p>

      <p>Focus Lost: {focusLostCount}</p>
      <p>Idle: {idleTime}</p>
      <p>Backspace: {backspaceCount}</p>
      <p>Hesitation: {hesitationCount}</p>
      <p>Burst: {burstCount}</p>

      {warning && <p style={{ color: "red" }}>{warning}</p>}

      <ul>
        {report.flags.map((f, i) => <li key={i}>{f}</li>)}
      </ul>

      <Line data={graphData} />

      <button onClick={saveSession}>Save</button>
      <button onClick={downloadPDF}>Download PDF</button>
    </div>
  );
}

export default App;