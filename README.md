# Hackathon Project

# 🛡️ BlindMind Health

An open-source, zero-knowledge mental health tracking companion built for the **Midnight Blockchain Network Hackathon**. BlindMind Health enables users to analyze their daily mental wellness metrics through localized AI insights without sacrificing their fundamental right to financial and behavioral data privacy.

## ✨ Core Features
* **Dual-Engine Privacy Pipeline:** Seamless fallback architecture utilizing secure cloud models and resilient on-device heuristic analytical engines.
* **Zero-Knowledge Architecture:** Generates secure data commitments and cryptographic salts client-side to guarantee raw scores remain private.
* **Resilient State Management:** Adaptive interface layers with dynamic visual state tracking and robust hardware error catching banners.

---

## 🚀 Quickstart Guide

### 1. Backend Setup
Navigate to the backend directory, configure your environmental variables, and run the ASGI development server:

```powershell
# Navigate to codebase directory
cd blindmind-health/backend

# Initialize local environment variables
$env:HF_API_TOKEN="your_huggingface_api_token_here"

# Start the active compiler layer
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Navigate to the web sandbox workspace
cd frontend

# Install package dependencies
npm install

# Run the local frontend compiler
npm run dev

🛠️ Technology Stack
Blockchain Layer: Midnight Network ZK-Smart Contracts (Compact language framework)

Backend Application Platform: Python 3.11+, FastAPI, Uvicorn Relativity Engine

Frontend Application Client: React, Vite Engine, Tailwind CSS layout modules

Cryptographic Primitives: SHA-256 Hashing, Client Salt Injections
