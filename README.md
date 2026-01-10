🌍 AtmosTrack – PNT‑Anchored Environmental Intelligence & Tokenized Impact
From raw sensor data to token‑ready climate impact – in one integrated pipeline.

AtmosTrack is an end‑to‑end prototype that shows how a single, low‑cost node on a smart campus can evolve from “just another sensor” into a verifiable climate‑impact asset.
It combines:

🛰️ PNT‑anchored sensing (ESP32 + multi‑sensor + GPS + context)
🧠 AI‑based pollution source inference
📊 Real‑time dashboards, map view, and health alerts
♻️ Device‑Hours of Impact → Carbon Cleaning Tokens (CCT)
💼 Polygon‑style minting & retirement UX (simulation)
📩 Recipe‑based CSV exports and LAN‑safe email links

All built as a production‑style stack: ESP32 firmware → Node/Express/Mongo backend → Python AI service → React (Vite) frontend → automation workflows.

⚙️ Core Idea (What AtmosTrack Proves)
“Measurement‑to‑market” for indoor environments.

AtmosTrack demonstrates how:

A PNT‑anchored node measures environmental conditions in specific rooms / corridors.
The system turns those measurements into explainable health insights and AI source labels.
Continuous “clean, stable operation” is quantified as Device‑Hours of Impact (DHI).
DHI is converted into Carbon Cleaning Tokens (CCT) and grouped into daily credit batches, with a Polygon‑style minting & retirement simulation.
The prototype is intentionally scoped to indoor smart‑campus scenarios (labs, classrooms, corridors) and is designed as a demo‑ready system, not a final MRV product.

🧱 High‑Level Architecture
Hardware node (ESP32)
CO₂, VOC proxy, temperature, humidity, IMU (vibration), GPS, purification state
Sends structured JSON payloads over Wi‑Fi at ~5 s cadence
Backend (Node.js + Express + MongoDB)
Ingests sensor payloads, stores readings, computes features & emissions estimates
Maintains DHI and CCT logic, daily credit batches, and minting simulation
Exposes REST APIs + WebSocket stream for live UI updates
Integrates with n8n (or similar) for export subscriptions and CSV email links

AI service (Python)

Receives sliding‑window feature vectors from backend
Returns pollution source labels + confidences
Backend post‑processes labels and explicitly surfaces “Clean” regimes

Frontend (React + Vite)

Dashboard – live tiles + time‑series for CO₂, AQI proxy, comfort, AI label, purifier state
Map View – room‑ / corridor‑level markers, PNT anchoring, quick status hints
Health Alerts – human‑readable cards for stuffy/poor conditions
Carbon Hub – DHI, CCT, daily credit batches, Polygon‑style minting & retirement UX
Data Export – raw & recipe‑based CSV exports, subscription status

🚀 Getting Started (Local Demo)
Prerequisite: This repo does not track .env.
You must create your own .env with local secrets and URIs.

1. Clone the repository
git clone https://github.com/<your-username>/AtmosTrack.git
cd AtmosTrack
2. Backend setup
cd Backend
npm install
Create Backend/.env (example placeholders only):

MONGODB_URI=your_mongodb_uri_here
N8N_SUBSCRIPTION_WEBHOOK=http://localhost:5678/webhook/your-id
# Optional Polygon-style simulation / future on-chain config
#POLYGON_RPC_URL=...
#CCT_CONTRACT_ADDRESS=...
#CCT_OWNER_PRIVATE_KEY=...
Run backend:

npm start
# or
node server.js

3. AI classifier service

cd ai-service   # or wherever your Python service lives
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python ai_server.py
The backend expects the classifier at something like:

http://localhost:8000/classify

4. Frontend setup
cd ../Frontend
npm install
npm run dev
Frontend will usually run at:

http://localhost:5173

5. Optional: Automation (n8n or similar)
Import or create a workflow that accepts a webhook and sends CSV download links via email.
Configure the webhook URL in N8N_SUBSCRIPTION_WEBHOOK in .env.

🔍 What You Can Explore (Without Revealing Internals)
The goal is to showcase capability, not to open‑source every internal detail while patent work is in progress.
Once all services are running and an AtmosTrack node (or simulated payloads) are sending data, you can walk through:

Live Dashboard:
Watch CO₂, AQI proxy, comfort band, AI source labels, and purifier state change over time.

Map View:
See each node as a PNT‑anchored asset (room / corridor), not just a generic device ID.

Health Alerts:
View human‑readable cards that explain when and where air quality is degrading.

Carbon Hub:
Observe how daily readings roll up into DHI, CCT, and credit batches.
Trigger Polygon‑style minting simulation and see batch status change (PENDING → MINTED).
Use the Offset Planner to link emissions (tCO₂e) to required CCT.

Data Export:
Configure export recipes with time ranges, devices, and selected fields.
Generate CSVs and use LAN‑safe links on phone/other laptop to download and inspect.
For placements and demos, this flow lets you tell the story from:

“This is what the node sees in this lab” → “This is what the dashboard tells you” →
“This is how much climate‑positive operation you get” → “Here is how it could be tokenised.”

💡 Why This Project Stands Out
Without over‑explaining internals, a reviewer can see that AtmosTrack:
Connects PNT, IoT, AI, tokenisation, and automation in a single coherent system.
Treats each room or corridor as a location‑aware climate asset, not just a datapoint.
Implements DHI and CCT as live, explorable concepts instead of just formulas in a PDF.
Handles real‑world details like LAN-safe URLs, export automation, and Polygon-style minting UX.

It reflects the mindset of:

“Design like a product, reason like a researcher, implement like an engineer.”

⚠️ Notes on Confidentiality & Patent Direction
This repository intentionally does not include production secrets, private keys, or contract addresses.
The architecture is presented at a conceptual and integration level suitable for technical review and portfolio use.
Detailed AI model training procedures, exact DHI/token calibration choices, and any future on‑chain contract code can be kept private or moved to separate/internal repositories while patent and IP work is ongoing.

🤝 Acknowledgement
This prototype was developed as part of the PNT Lab Internship under the Geo‑Intel Lab, IIT Tirupati Navavishkar I‑Hub Foundation (IITTNiF), with a focus on smart‑campus, PNT‑anchored environmental intelligence and climate/ESG experimentation.
