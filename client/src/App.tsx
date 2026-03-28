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

  // Focus detection (Electron)
  useEffect(() => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.onFocusLost(() => {
        setFocusLostCount(p => p + 1);
        setWarning("⚠️ Window switched!");
      });

      (window as any).electronAPI.onFocusGained(() => {
        setWarning("");
      });
    }
  }, []);

  // Idle detection
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - lastTime.current;
      if (diff > 3000) {
        setIdleTime(p => p + 1);
        setWarning("⚠️ Idle detected!");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const now = Date.now();
    const diff = now - lastTime.current;
    lastTime.current = now;

    if (diff > 2000) setPauses(p => p + 1);
    if (diff > 1500 && (text.endsWith(".") || text.length === 0)) {
      setHesitationCount(h => h + 1);
    }
    if (diff < 100) setBurstCount(b => b + 1);
    if (e.key === "Backspace") setBackspaceCount(b => b + 1);

    const type =
      e.key === "Backspace"
        ? "delete"
        : e.key.length === 1
        ? "char"
        : "other";

    setKeystrokes(prev => [...prev, { time: diff, type }]);
  };

  const handlePaste = () => setPasteCount(p => p + 1);

  const calculateSpeed = () => {
    if (!keystrokes.length) return 0;
    const total = keystrokes.reduce((s, k) => s + k.time, 0);
    return Number((text.length / (total / 1000)).toFixed(2));
  };

  // Text Analysis
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

  // Report
  const getReport = () => {
    let score = 100;
    let flags: string[] = [];

    if (pasteCount > 2) { score -= 30; flags.push("Too many pastes"); }
    if (pauses < 2) { score -= 20; flags.push("Too smooth typing"); }

    const times = keystrokes.map(k => k.time);
    const variation = times.length ? Math.max(...times) - Math.min(...times) : 0;
    if (variation < 50) { score -= 20; flags.push("Constant typing speed"); }

    if (calculateSpeed() > 15) { score -= 20; flags.push("Too fast typing"); }
    if (focusLostCount > 2) { score -= 20; flags.push("Window switching detected"); }
    if (idleTime > 3) { score -= 15; flags.push("High idle time"); }
    if (backspaceCount < 2) { score -= 15; flags.push("No corrections"); }
    if (hesitationCount < 1) { score -= 10; flags.push("No hesitation"); }
    if (burstCount > keystrokes.length * 0.7) { score -= 15; flags.push("Too continuous typing"); }

    if (getSentenceVariation() < 3) { score -= 15; flags.push("Low sentence variation"); }
    if (getVocabularyScore() < 0.4) { score -= 15; flags.push("Low vocabulary diversity"); }
    if (getRepetitionScore() > 5) { score -= 10; flags.push("High repetition"); }

    let label = "✅ Human";
    if (score < 60) label = "⚠️ Suspicious";
    if (score < 40) label = "❌ Likely AI";

    return { score, flags, label };
  };

  const report = getReport();

  const graphData = {
    labels: keystrokes.map((_, i) => i + 1),
    datasets: [{
      label: "Typing Pattern",
      data: keystrokes.map(k => k.time),
      borderColor: "#6c63ff"
    }]
  };

  const downloadPDF = () => {
  const doc = new jsPDF();

  doc.setFont("helvetica", "normal");

  const cleanLabel = report.label.replace(/[^a-zA-Z0-9\s]/g, "");

  // Title
  doc.setFontSize(20);
  doc.text("Vi-Notes Authenticity Report", 20, 20);

  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);

  // =========================
  //  Typed Content
  // =========================
  doc.setFontSize(16);
  doc.text("Typed Content:", 20, 40);

  doc.setFontSize(11);

  const contentText = text || "No content provided";

  const wrappedContent = doc.splitTextToSize(contentText, 160);
  doc.text(wrappedContent, 20, 50);

  // =========================
  //  Status & Score
  // =========================
  let y = 50 + wrappedContent.length * 6 + 10;

  doc.setFontSize(14);
  doc.text(`Status: ${cleanLabel}`, 20, y);
  doc.text(`Score: ${report.score} / 100`, 20, y + 10);

  // =========================
  //  Issues
  // =========================
  y += 30;

  doc.setFontSize(16);
  doc.text("Issues:", 20, y);

  doc.setFontSize(12);

  const issuesText =
    report.flags.length > 0
      ? report.flags.join(" | ")
      : "No suspicious behavior detected";

  const wrappedIssues = doc.splitTextToSize(issuesText, 160);
  doc.text(wrappedIssues, 20, y + 10);

  // =========================
  //  Activity
  // =========================
  y = y + 10 + wrappedIssues.length * 8 + 10;

  doc.setFontSize(16);
  doc.text("Activity Summary:", 20, y);

  doc.setFontSize(12);

  const activityText = `Focus Lost: ${focusLostCount} | Idle: ${idleTime} | Backspace: ${backspaceCount} | Hesitation: ${hesitationCount} | Burst: ${burstCount} | Sentence Var: ${getSentenceVariation()} | Vocab: ${getVocabularyScore().toFixed(
    2
  )} | Repetition: ${getRepetitionScore()}`;

  const wrappedActivity = doc.splitTextToSize(activityText, 160);
  doc.text(wrappedActivity, 20, y + 10);

  // =========================
  //  Summary
  // =========================
  y = y + 10 + wrappedActivity.length * 8 + 10;

  const summary = `Summary: ${cleanLabel} with score ${
    report.score
  }. ${
    report.flags.length > 0
      ? "Detected issues include " + report.flags.join(", ")
      : "No suspicious patterns detected"
  }.`;

  const wrappedSummary = doc.splitTextToSize(summary, 160);
  doc.text(wrappedSummary, 20, y);

  // Footer
  doc.setFontSize(10);
  doc.text("Generated by Vi-Notes", 20, 280);

  doc.save("Vi-Notes-Report.pdf");
};
  const saveSession = async () => {
    await axios.post("https://vi-notes-backend-qldz.onrender.com/save", {
      content: text,
      keystrokes,
      score: report.score,
      label: report.label,
      flags: report.flags
    });
    alert("Saved!");
  };

  return (
    <div style={{
      fontFamily: "Segoe UI",
      background: "#f4f6fb",
      minHeight: "100vh",
      padding: "20px"
    }}>

      <h1 style={{ textAlign: "center", color: "#6c63ff" }}>
        ✍️ Vi-Notes
      </h1>

      {/* Editor */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px"
      }}>
        <textarea
          rows={10}
          style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
      </div>

      {/* RESULT */}
      <div style={{
        background: "#eef2ff",
        padding: "15px",
        borderRadius: "12px",
        marginBottom: "20px"
      }}>
        <p style={{ fontWeight: "bold", fontSize: "18px" }}>
          {report.label} | Score: {report.score}
        </p>

        <p style={{ color: "#e63946", marginTop: "8px" }}>
          ⚠️ Issues → {
            report.flags.length > 0
              ? report.flags.join(" | ")
              : "No suspicious behavior detected"
          }
        </p>

        <p style={{ marginTop: "10px", color: "#555" }}>
          📊 Activity →
          Focus Lost: {focusLostCount} |
          Idle: {idleTime} |
          Backspace: {backspaceCount} |
          Hesitation: {hesitationCount} |
          Burst: {burstCount} |
          Sentence Var: {getSentenceVariation()} |
          Vocab: {getVocabularyScore().toFixed(2)} |
          Repetition: {getRepetitionScore()}
        </p>
      </div>

      {/* Graph */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px"
      }}>
        <Line data={graphData} />
      </div>

      <br />

      <button onClick={saveSession}>Save</button>
      <button onClick={downloadPDF}>PDF</button>

      {warning && <p style={{ color: "red" }}>{warning}</p>}
    </div>
  );
}

export default App;