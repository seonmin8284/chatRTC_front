import React, { useRef, useState, useEffect } from "react";
import "./App.css";

function App() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState("");
  const ws = useRef(null);
  const mediaRecorder = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket("wss://conference.railway.internal/ws/stt");
    ws.current.onmessage = (e) => setLogs((prev) => [...prev, e.data]);
  }, []);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = (e) => {
      if (ws.current.readyState === 1) {
        e.data.arrayBuffer().then((buf) => ws.current.send(buf));
      }
    };
    mediaRecorder.current.start(1000);
  };

  const stop = () => mediaRecorder.current.stop();

  const summarize = async () => {
    const res = await fetch("https://conference.railway.internal/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: logs.join(" ") }),
    });
    const data = await res.json();
    setSummary(data.summary);
  };

  const download = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meeting.txt";
    a.click();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🎤 회의 실시간 자막</h1>
      <button onClick={start}>🔴 시작</button>
      <button onClick={stop}>⏹️ 정지</button>
      <button onClick={summarize}>🧠 요약</button>
      <button onClick={download}>⬇️ 저장</button>
      <h2>📄 자막</h2>
      <pre>{logs.join("\n")}</pre>
      <h2>📝 요약</h2>
      <pre>{summary}</pre>
    </div>
  );
}

export default App;
