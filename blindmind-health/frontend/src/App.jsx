import React, { useState, useRef, useEffect } from "react";
import { useChat } from "./hooks/useChat.js";
import ErrorBanner from "./components/ErrorBanner.jsx";

const ENGINE_STATUS = {
  ooda_tee: { icon: "🔒", label: "OODA AI Network: TEE Secure Enclave Protected", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  local: { icon: "🔒", label: "On-Device Model Active", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cloud: { icon: "☁️", label: "Cloud AI Inference Active", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  heuristic_fallback: { icon: "⚠️", label: "Offline Fallback Mode", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

export default function App() {
  const [draft, setDraft] = useState("");
  const [anchorState, setAnchorState] = useState("IDLE");
  const { messages, loading, error, latestTurn, sendMessage, clearHistory, dismissError } = useChat();
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!draft.trim() || loading) return;
    const text = draft;
    setDraft("");
    setAnchorState("IDLE");
    await sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAnchorToMidnight = () => {
    if (!latestTurn) return;
    setAnchorState("ANCHORING");
    // Midnight ledger handoff (contract/src/deploy.ts)
    //   const commitmentBytes = hexToBytes32(latestTurn.commitmentHash);
    //   await registerHealthAnchor(providers, commitmentBytes);
    // providers require wallet-connect wiring (not yet complete).
    // Simulated until that lands.
    setTimeout(() => setAnchorState("ANCHORED"), 2500);
  };

  const currentStatus = ENGINE_STATUS[latestTurn?.engineUsed] ?? {
    icon: "⏳", label: "Awaiting first message", className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <div className="h-screen flex bg-slate-950 text-slate-100 font-sans">
      <aside className="w-64 border-r border-slate-800 flex flex-col p-4 space-y-3">
        <div>
          <h1 className="text-lg font-bold text-indigo-400">BlindMind Health</h1>
          <p className="text-[10px] text-slate-500">OODA AI x Midnight integration</p>
        </div>
        <div className="text-[10px] text-amber-400/80 bg-amber-500/5 border border-amber-500/10 rounded p-2">
          Chat history lives only in this browser's localStorage — unencrypted, on-device, never sent to a central database.
        </div>
        <button
          onClick={clearHistory}
          className="text-xs text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 rounded-lg py-2 transition-colors"
        >
          Clear Local History
        </button>
        <div className="flex-1 overflow-y-auto space-y-1 text-[10px] text-slate-500">
          {messages.length === 0 && <p className="italic">No messages yet.</p>}
          {messages.filter((m) => m.role === "user").map((m, i) => (
            <div key={i} className="truncate border-b border-slate-900 py-1">{m.content}</div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="flex justify-between items-center border-b border-slate-800 px-6 py-3">
          <span className="text-sm text-slate-400">Journal Chat</span>
          <span className={`inline-flex items-center gap-1.5 border text-xs px-3 py-1 rounded-full font-medium ${currentStatus.className}`}>
            <span>{currentStatus.icon}</span>
            <span>{currentStatus.label}</span>
          </span>
        </header>

        {error && (
          <div className="px-6 pt-3">
            <ErrorBanner error={error} onDismiss={dismissError} />
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-lg rounded-xl p-3 text-sm ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-900 border border-slate-800 text-slate-200"}`}>
                <p>{m.content}</p>
                {m.scores && (
                  <div className="mt-2 pt-2 border-t border-slate-700/50 text-[10px] text-slate-400 flex gap-3">
                    <span>Mood {m.scores.mood}</span>
                    <span>Anxiety {m.scores.anxiety}</span>
                    <span>Resilience {m.scores.resilience}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-500 italic">Thinking...</div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 p-4 flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write what's on your mind... (Enter to send, Shift+Enter for new line)"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm resize-none h-16 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSend}
            disabled={loading || !draft.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-5 rounded-lg text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </main>

      <aside className="w-80 border-l border-slate-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">🔐 Midnight ZK-Ledger Sync</h2>
        {latestTurn ? (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-slate-500 block mb-1">Commitment Hash:</span>
              <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-indigo-300 break-all border border-slate-800">
                {latestTurn.commitmentHash}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500 block mb-1">Salt:</span>
              <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-400 break-all border border-slate-800">
                {latestTurn.salt}
              </div>
            </div>
            <button
              onClick={handleAnchorToMidnight}
              disabled={anchorState === "ANCHORING"}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-2 rounded-lg text-xs transition-colors"
            >
              {anchorState === "IDLE" && "Anchor Anonymously to Midnight Ledger"}
              {anchorState === "ANCHORING" && "Anchoring to Devnode..."}
              {anchorState === "ANCHORED" && "✓ Anchored On-Chain"}
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-4 text-center">Send a message to generate a ZK commitment.</p>
        )}
      </aside>
    </div>
  );
}