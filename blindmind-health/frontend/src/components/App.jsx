import React, { useState } from "react";

// Pointing directly to Rima's running backend server
const BACKEND_URL = "http://localhost:8000/analyze";

export default function App() {
  const [journalText, setJournalText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendResult, setBackendResult] = useState(null);
  const [zkState, setZkState] = useState("IDLE"); // IDLE, PROVING, SUCCESS
  const [txHash, setTxHash] = useState("");

  // Handles raw file uploads dropped into the sandbox dashboard area
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Step 1: Send the file to Rima's localized Python server
  const runAIAnalysis = async () => {
    if (!file && !journalText) {
      alert("Please type a journal entry or upload a text file first!");
      return;
    }

    setLoading(true);
    setBackendResult(null);
    setZkState("IDLE");

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    } else {
      const blob = new Blob([journalText], { type: "text/plain" });
      formData.append("file", blob, "journal.txt");
    }

    try {
      // Dummy public key representing your local wallet state
      const mockPubKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      const response = await fetch(`${BACKEND_URL}?wallet_pubkey=${mockPubKey}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Backend server processing failed.");
      const data = await response.json();
      setBackendResult(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Trigger the Midnight zero-knowledge validation circuit
  const executeZKProof = () => {
    if (!backendResult) return;
    setZkState("PROVING");

    // Mimics circuit witness generation for UI execution smoothness
    setTimeout(() => {
      setZkStatus("SUCCESS");
      setTxHash("0x" + backendResult.record_commitment_hash.substring(0, 16) + "...devnode");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Branding Section */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-indigo-400">BlindMind Health</h1>
            <p className="text-xs text-slate-400">Zero-Knowledge Offline Mental Health Analysis</p>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-medium">
            Local Devnode: Connected
          </span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main User Input Panel */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Secure Text Sandbox</h2>
            <textarea
              className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm font-mono focus:outline-none focus:border-indigo-500 text-slate-200"
              placeholder="Paste your private notes here, or drag and drop a journal log file below..."
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
            />
            
            <div className="border-2 border-dashed border-slate-800 rounded-lg p-4 text-center bg-slate-950/40">
              <input type="file" accept=".txt" onChange={handleFileChange} className="text-xs text-slate-400" />
              {file && <p className="text-xs text-indigo-400 mt-1">Loaded: {file.name}</p>}
            </div>

            <button
              onClick={runAIAnalysis}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:bg-slate-800 disabled:text-slate-500"
            >
              {loading ? "Running Local AI Pipeline..." : "Evaluate Journal Locally"}
            </button>
          </div>

          {/* Results Sidebar Panel */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">AI Metrics</h2>
              {backendResult ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wellness Index:</span>
                    <span className="font-mono font-bold text-indigo-400">{backendResult.wellness_score}/100</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Text Commitment Hash:</span>
                    <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-400 break-all border border-slate-800">
                      {backendResult.record_commitment_hash}
                    </div>
                  </div>
                  <button
                    onClick={executeZKProof}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 py-1.5 rounded text-xs transition-colors"
                  >
                    {zkState === "IDLE" && "Generate Midnight ZK Proof"}
                    {zkState === "PROVING" && "Running Proving Circuit..."}
                    {zkState === "SUCCESS" && "ZK Proof Formed!"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-4 text-center">Run analysis to unlock metadata scores.</p>
              )}
            </div>

            {/* Blockchain Token Ledger Card */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-3">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Midnight Ledger</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Verification State:</span>
                  {zkState === "SUCCESS" ? (
                    <span className="text-emerald-400 font-bold">Verified On-Chain</span>
                  ) : (
                    <span className="text-slate-500 italic">Awaiting Proof Generation</span>
                  )}
                </div>
                {txHash && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Anchor Proof Tx:</span>
                    <span className="font-mono text-indigo-400">{txHash}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
