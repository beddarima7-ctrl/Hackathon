# BlindMind Health: Internal Integration Handbook

This guide is about how our dual engine architecture, privacy features, and zero knowledge cryptographic primitives flow across the system layers.

Hackathon Team Core Contributors
Rafan: Zero-Knowledge Cryptographic Architect & Smart Contract Infrastructure (deploy.ts)

Saiem: Frontend UX Engineer & Core Visual Component Designer

Rima: AI Engine Optimization Specialist & Core Backend System Engineer

## The Data Lifecycle (How the Code Works Practically)
[ User Input ] ---> ( Frontend /reflect POST ) ---> [ FastAPI Backend ]
|
[ Local Keyword Fallback ] <--- ( Network Error? ) <--- [ Cloud API Engine ]
|                                             |
+--------------------> [ Metrics Output ] ----+
|
[ zk_crypto.py Deterministic Salt ]
|
[ SHA-256 Hash Generation ]
|
[ UI State Captured ] <--- ( JSON Response Payload ) <---------+
|
+---> Displays Privacy Badge (On-Device vs Cloud)
|
+---> Maps Scores to Analytics Charts
|
+---> [ Handoff to Midnight Wallet Circuit (deploy.ts) ]

### 1. Ingestion & Dynamic Analysis (`backend/ai_engine.py`)
* The frontend passes raw journal text to the backend via a JSON POST request.
* The system attempts to run a high-fidelity cloud LLM generation inference step. 
* If a network resolution error occurs or a rate-limit is triggered, the engine catches the exception instantly and drops to the **Local Analytical Fallback Engine** within milliseconds. This avoids user-facing 500 crashes and keeps the demo completely stable.

### 2. Cryptographic Isolation (`backend/zk_crypto.py`)
* The raw scores are fed into a deterministic hashing utility. A unique, secure `salt` is computed alongside the values.
* The system hashes the values sequentially (`mood` -> `anxiety` -> `resilience` -> `salt`) into a fixed 64-character hex `commitment_hash`. 
* **The Privacy Rule:** Only the final cryptographic hash and the raw scores are sent back down the pipeline. The raw text is never written to a persistent database or ledger.

### 3. Frontend State Capture & UI Feedback (`frontend/src/`)
* **`api.js` & `useReflection.js`:** Triggers the network request, handles `503 Service Unavailable` errors cleanly, and converts the HTTP stream into localized UI state variables.
* **`PrivacyBadge.jsx`:** Inspects `result.engine_used`. If the engine returned `"local"`, a green privacy shield rendering tells the user their data is isolated on-device.
* **`zkPayload.js`:** Captures the `commitment_hash` and `salt`, formatting them cleanly into a structured immutable payload object ready for the blockchain interface.

---

## Next: Blockchain Ledger Handoff

When the user clicks **"Anchor Anonymously to Midnight Ledger"**, the `App.jsx` component provides the exact execution insertion index:

```javascript
// Location: frontend/src/App.jsx -> handleAnchorToMidnight()
import { hexToBytes32 } from '../../contract/src/deploy.js';

// 1. Convert our hex commitment to the contract's expected format
const commitmentBytes = hexToBytes32(zkPayload.commitmentHash);

// 2. Submit transaction to the Midnight devnode wallet provider
await registerHealthAnchor(providers, commitmentBytes);
