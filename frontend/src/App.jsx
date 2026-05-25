import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  // =========================
  // 1. STATE MANAGEMENT CORE
  // =========================
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("Bug Reproduction");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);

  // =========================
  // ACTIVE EVENT
  // =========================
  const activeEvent = events[0];

  // =========================
  // 3. METRIC CALCULATIONS
  // =========================
  const totalSavedHours = useMemo(() => {
    return (events.length * 14.5).toFixed(1);
  }, [events]);

  const infraCost = activeEvent?.cost || "$0.00";
  const latency = activeEvent?.latency || "14ms";

  // =========================
  // LOG HELPER
  // =========================
  const addLog = (message) => {
    const time = new Date().toLocaleTimeString();

    setLogs((prev) => [
      `${time} ${message}`,
      ...prev.slice(0, 14),
    ]);
  };

  // =========================
  // 2. WEBSOCKET SUBSCRIBER
  // =========================
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      addLog("WEBSOCKET_CONNECTED");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "processing") {
        setIsProcessing(true);
        addLog("WEBHOOK_RECEIVED");
      }

      if (data.status === "completed") {
        setEvents((prev) => [data, ...prev]);
        setIsProcessing(false);
        addLog("TRIAGE_COMPLETED");
      }
    };

    ws.onerror = () => {
      addLog("SOCKET_ERROR");
    };

    ws.onclose = () => {
      addLog("WEBSOCKET_CLOSED");
    };

    return () => ws.close();
  }, []);

  // =========================
  // 2. MACRO SIMULATOR INGRESS
  // =========================
  const runSimulation = async () => {
    try {
      setIsProcessing(true);

      addLog("SIMULATION_STARTED");

      const payload = {
        repo: "monorepo-core",
        issue_number: 482,
        title: "Memory leak in user dashboard",
        body: "Heap growth after route navigation",
      };

      await fetch("http://localhost:8000/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      addLog("SIMULATION_FAILED");
      setIsProcessing(false);
    }
  };

  // =========================
  // 4. TAB CONTENT DICTIONARY
  // =========================
  const tabContent = {
    "Executive Summary":
      activeEvent?.summary ||
      "Agent summary will appear here.",

    "Label Suggestions":
      activeEvent?.labels?.join(", ") ||
      "No labels generated.",

    "Bug Reproduction":
      activeEvent?.repro ||
      "Waiting for reproduction strategy.",

    "Codebase Grounding":
      activeEvent?.analysis ||
      "Codebase analysis pending.",

    "PR Review":
      activeEvent?.analysis ||
      "PR review pending.",

    "Newcomer Onboarding":
      activeEvent?.onboarding ||
      "No onboarding notes yet.",
  };

  const tabs = Object.keys(tabContent);

  return (
    <div className="min-h-screen bg-[#050816] text-white flex font-mono">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[240px] border-r border-white/10 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded bg-cyan-500 flex items-center justify-center font-bold">
              RG
            </div>

            <div>
              <h1 className="text-xl font-bold">
                RepoGuard Copilot
              </h1>

              <p className="text-xs text-cyan-400">
                NVIDIA Nemotron-3 Super
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              "Control Center",
              "Vulnerabilities",
              "AI Lab",
              "Audit Logs",
              "Settings",
            ].map((item) => (
              <div
                key={item}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <button className="border border-cyan-500 text-cyan-400 rounded-xl p-3 hover:bg-cyan-500/10">
          Upgrade Plan
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-6 overflow-hidden">
        {/* NAVBAR */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-cyan-400">
              WEBHOOK ACTIVE
            </p>

            <h2 className="text-2xl font-bold mt-1">
              Control Center
            </h2>
          </div>

          <button
            onClick={runSimulation}
            disabled={isProcessing}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black px-5 py-3 rounded-xl font-bold transition"
          >
            {isProcessing
              ? "Running..."
              : "Run Simulation"}
          </button>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Incoming Alerts"
            value={events.length}
            accent="text-red-400"
          />

          <MetricCard
            title="Saved Hours"
            value={`${totalSavedHours}h`}
            accent="text-cyan-400"
          />

          <MetricCard
            title="Infra Cost"
            value={infraCost}
            accent="text-green-400"
          />

          <MetricCard
            title="Latency Index"
            value={latency}
            accent="text-yellow-400"
          />
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-[320px_1fr_320px] gap-5 h-[calc(100vh-210px)]">
          {/* ALERTS */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">
                Incoming Alerts
              </h3>

              <div className="bg-red-500 text-xs px-2 py-1 rounded">
                {events.length} NEW
              </div>
            </div>

            <div className="space-y-4">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="bg-[#0d1224] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-cyan-500 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-cyan-400">
                      #{event.issue || 482}
                    </p>

                    <span className="text-xs text-white/50">
                      now
                    </span>
                  </div>

                  <h4 className="font-bold mb-3">
                    {event.title ||
                      "Memory leak in dashboard"}
                  </h4>

                  <div className="flex gap-2 flex-wrap">
                    {event.labels?.map((label, i) => (
                      <span
                        key={i}
                        className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {!events.length && (
                <div className="text-white/40 text-sm">
                  No incoming events yet.
                </div>
              )}
            </div>
          </div>

          {/* NOTEBOOK */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            {/* TABS */}
            <div className="flex border-b border-white/10 overflow-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-4 whitespace-nowrap border-b-2 transition ${
                    activeTab === tab
                      ? "border-cyan-400 text-cyan-400"
                      : "border-transparent text-white/60"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* CONTENT BODY */}
            <div className="flex-1 p-6 overflow-auto">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 h-full">
                <pre className="whitespace-pre-wrap text-sm leading-7 text-green-300">
                  {typeof tabContent[activeTab] ===
                  "string"
                    ? tabContent[activeTab]
                    : JSON.stringify(
                        tabContent[activeTab],
                        null,
                        2
                      )}
                </pre>
              </div>
            </div>
          </div>

          {/* TELEMETRY */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">
                Live Telemetry
              </h3>

              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            </div>

            <div className="space-y-3 text-sm">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="border-b border-white/5 pb-2 text-cyan-300"
                >
                  {log}
                </div>
              ))}

              {!logs.length && (
                <div className="text-white/40">
                  Waiting for telemetry...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// =========================
// METRIC CARD
// =========================
function MetricCard({
  title,
  value,
  accent,
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-sm text-white/50 mb-2">
        {title}
      </p>

      <h3 className={`text-4xl font-bold ${accent}`}>
        {value}
      </h3>
    </div>
  );
}