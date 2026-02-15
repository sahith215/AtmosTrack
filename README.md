# 🚀 AtmosTrack – PNT-Anchored Environmental Intelligence & Tokenized Impact 🌍


From raw sensor data to token-ready climate impact – in one integrated pipeline.

AtmosTrack is an end-to-end prototype that shows how a single, low-cost node on a smart campus can evolve from “just another sensor” into a verifiable climate-impact asset.

It combines:

- 🛰️ PNT-anchored sensing (ESP32 + multi-sensor + GPS + context)

- 🧠 AI-based pollution source inference

- 📊 Real-time dashboards, map view, and health alerts

- ♻️ Device-Hours of Impact → Carbon Cleaning Tokens (CCT)

- 💼 Polygon-style minting & retirement UX (simulation)

- 📩 Recipe-based CSV exports and LAN-safe email links

Built as a production-style stack:

ESP32 firmware → Node/Express/Mongo backend → Python AI service → React (Vite) frontend → automation workflows.

---

# ⚙️ Core Idea (What AtmosTrack Proves)

**“Measurement-to-market” for indoor environments.**

AtmosTrack demonstrates how:

- A PNT-anchored node measures environmental conditions in specific rooms / corridors.

- The system turns those measurements into explainable health insights and AI source labels.

- Continuous “clean, stable operation” is quantified as Device-Hours of Impact (DHI).

- DHI is converted into Carbon Cleaning Tokens (CCT) and grouped into daily credit batches.

- A Polygon-style minting & retirement simulation demonstrates lifecycle handling.

The prototype is intentionally scoped to indoor smart-campus scenarios (labs, classrooms, corridors) and is designed as a demo-ready system — not a final MRV product.

---

# 🧱 High-Level Architecture

## 🔹 Hardware Node (ESP32)

- CO₂ sensor

- VOC proxy

- Temperature & humidity

- IMU (vibration)

- GPS (PNT anchoring)

- Purification state

- Sends structured JSON payloads over Wi-Fi (~5 s cadence)

---

## 🔹 Backend (Node.js + Express + MongoDB)

- Ingests sensor payloads

- Stores readings

- Computes features & emissions estimates

- Maintains DHI and CCT logic

- Groups daily credit batches

- Simulates Polygon-style minting

- Exposes REST APIs + WebSocket stream

- Integrates with n8n for export subscriptions & CSV email links

---

## 🔹 AI Service (Python)

- Receives sliding-window feature vectors

- Returns pollution source labels + confidence scores

- Backend post-processes and explicitly surfaces “Clean” regimes

---

## 🔹 Frontend (React + Vite)

- **Dashboard:** Live tiles + time-series for CO₂, AQI proxy, comfort, AI label, purifier state

- **Map View:** Room- / corridor-level markers with PNT anchoring

- **Health Alerts:** Human-readable condition cards

- **Carbon Hub:** DHI, CCT, daily credit batches, minting & retirement UX

- **Data Export:** Raw + recipe-based CSV exports

---

# 🚀 Getting Started (Local Demo)

⚠️ This repository does not track `.env`.

You must create your own `.env` with local secrets and URIs.

---

## 1️. Clone the Repository

```bash
git clone https://github.com/<your-username>/AtmosTrack.git
cd AtmosTrack
```
## 2. Backend setup
```
cd Backend
npm install
```
Create Backend/.env (example placeholders only):
```
MONGODB_URI=your_mongodb_uri_here
N8N_SUBSCRIPTION_WEBHOOK=http://localhost:5678/webhook/your-id
# Optional Polygon-style simulation / future on-chain config
#POLYGON_RPC_URL=...
#CCT_CONTRACT_ADDRESS=...
#CCT_OWNER_PRIVATE_KEY=...
```
Run backend:
```
npm start
# or
node server.js
```
## 🧠 AI Classifier Service
```
cd ai-service   # or wherever your Python service lives
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python ai_server.py
```

The backend expects the classifier at:
```
http://localhost:8000/classify
```
## 💻 Frontend Setup
```
cd ../Frontend
npm install
npm run dev
```

Frontend will usually run at:
```
http://localhost:5173
```
## 🔁 Optional: Automation (n8n or Similar)

- Import or create a workflow that accepts a webhook.

- Configure it to send CSV download links via email.

- Set the webhook URL in N8N_SUBSCRIPTION_WEBHOOK inside .env.

## 🔍 What You Can Explore (Without Revealing Internals)

- The goal is to showcase capability — not to open-source every internal detail while patent work is in progress.

- Once all services are running and an AtmosTrack node (or simulated payloads) is sending data, you can explore:

## 📊 Live Dashboard

- Watch CO₂, AQI proxy, comfort band, AI source labels, and purifier state change over time.

## 🗺️ Map View

- See each node as a PNT-anchored asset (room / corridor), not just a generic device ID.

## 🏥 Health Alerts

- View human-readable cards explaining when and where air quality is degrading.

## ♻️ Carbon Hub

- Observe how daily readings roll up into DHI, CCT, and credit batches.

- Trigger Polygon-style minting simulation and watch batch status change (PENDING → MINTED).

- Use the Offset Planner to link emissions (tCO₂e) to required CCT.

## 📤 Data Export

- Configure export recipes with time ranges, devices, and selected fields.

- Generate CSVs.

- Use LAN-safe links on phone or another laptop to download and inspect.

## ⚠️ Notes on Confidentiality & Patent Direction

This repository does not include production secrets, private keys, or contract addresses.

The architecture is presented at a conceptual and integration level suitable for technical review and portfolio use.

Detailed AI training procedures, DHI/token calibration logic, and any future on-chain contract code can remain private or be moved to internal repositories while patent and IP work is ongoing.ongoing.

## 🤝 Acknowledgement
This prototype was developed as part of the PNT Lab Internship under the Geo‑Intel Lab, IIT Tirupati Navavishkar I‑Hub Foundation (IITTNiF), with a focus on smart‑campus, PNT‑anchored environmental intelligence and climate/ESG experimentation.
