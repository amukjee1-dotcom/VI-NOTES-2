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

  const [focusLostCount, setFocusLostCount] = useState(0);
  const [idleTime, setIdleTime] = useState(0);
  const [warning, setWarning] = useState("");

  const [backspaceCount, setBackspaceCount] = useState(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [burstCount, setBurstCount] = useState(0);

  const lastTime = useRef<number>(Date.now());

  // 🔹 Focus detection
  useEffect(() => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.onFocusLost(() => {
        setFocusLostCount((p) => p + 1);
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
        setIdleTime((p) => p + 1);
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

    if (diff > 1500 && (text.endsWith(".") || text.length === 0)) {
      setHesitationCount((h) => h + 1);
    }

    if (diff < 100) setBurstCount((b) => b + 1);

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

  // 🔥 TEXT ANALYSIS
  const getSentenceVariation = () => {
    const sentences = text.split(/[.!?]/).filter(s => s.trim());
    if (sentences.length < 2) return 0;
    const lengths = sentences.map(s => s.split(" ").length);
    return Math.max(...lengths) - Math.min(...lengths);
  };

  const getVocabularyScore = () => {
    const words = text.toLowerCase().split(/\s+/).filter(w => w);
    const unique = new Set(words);
    return words.length ? unique.size / words.length : 0;
  };

  const getRepetitionScore = () => {
  const words = text.toLowerCase().split(/\s+/);
  const freq: Record<string, number> = {};

  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });

  const values = Object.values(freq) as number[];

  return values.length ? Math.max(...values) : 0;
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

    const times = keystrokes.map(k => k.time);
    const variation = times.length ? Math.max(...times) - Math.min(...times) : 0;

    if (variation < 50) {
      score -= 20;
      flags.push("Constant typing speed");
    }

    if (calculateSpeed() > 15) {
      score -= 20;
      flags.push("Too fast typing");
    }

    if (focusLostCount > 2) {
      score -= 20;
      flags.push("Window switching detected");
    }

    if (idleTime > 3) {
      score -= 15;
      flags.push("High idle time");
    }

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

    const sentVar = getSentenceVariation();
    const vocab = getVocabularyScore();
    const rep = getRepetitionScore();

    if (sentVar < 3) {
      score -= 15;
      flags.push("Low sentence variation");
    }

    if (vocab < 0.4) {
      score -= 15;
      flags.push("Low vocabulary diversity");
    }

    if (rep > 5) {
      score -= 10;
      flags.push("High repetition");
    }

    let label = "✅ Human";
    if (score < 60) label = "⚠️ Suspicious";
    if (score < 40) label = "❌ Likely AI";

    return { score, flags, label };
  };

  const report = getReport();

  const graphData = {
    labels: keystrokes.map((_, i) => i + 1),
    datasets: [
      {
        label: "Keystroke Timing",
        data: keystrokes.map(k => k.time),
        borderColor: "blue"
      }
    ]
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Vi-Notes Report", 20, 20);
    doc.text(`Score: ${report.score}`, 20, 40);
    doc.text(`Status: ${report.label}`, 20, 50);
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
      bursts: burstCount,
      sentenceVar: getSentenceVariation(),
      vocabScore: getVocabularyScore(),
      repetition: getRepetitionScore()
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

      <p>Sentence Variation: {getSentenceVariation()}</p>
      <p>Vocabulary: {getVocabularyScore().toFixed(2)}</p>
      <p>Repetition: {getRepetitionScore()}</p>

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