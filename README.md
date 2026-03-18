<div align="center">

# GigShield Protection

**AI-Powered Parametric Insurance for India's Gig Delivery Workers**

*When severe weather strikes — claims trigger automatically. No forms. No waiting. No fraud.*

<br/>

[![Status](https://img.shields.io/badge/Status-Active-4CAF50?style=for-the-badge)](https://github.com/Harini09062006/GigShield-Protection)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Hackathon](https://img.shields.io/badge/Guidewire-DEVTrails%202026-0057A8?style=for-the-badge)](https://www.guidewire.com/)

<br/>

[🔍 Problem](#-what-is-gigshield) &nbsp;·&nbsp; [👤 Persona](#-delivery-worker-persona) &nbsp;·&nbsp; [⚙️ Workflow](#%EF%B8%8F-application-workflow) &nbsp;·&nbsp; [🧠 AI/ML](#-aiml-integration-plan) &nbsp;·&nbsp; [📸 Screenshots](#-application-screens) &nbsp;·&nbsp; [👩‍💻 Team](#-team)

</div>

---

<br/>

## 🔍 What is GigShield?

> *"India's 15+ crore gig delivery workers lose ₹12,000+ crore every year to weather disruptions — with zero safety net."*

**GigShield** is a fully automated parametric insurance platform built for **Guidewire DEVTrails 2026**. It protects food delivery workers (Swiggy/Zomato) from income loss caused by external disruptions — with claims that trigger and pay out automatically in under 10 seconds.

- ✅ Workers register once and select a weekly plan
- ✅ AI monitors real-time weather & pollution signals 24/7
- ✅ When a disruption threshold is crossed, a claim **auto-triggers**
- ✅ Payout hits the worker's account in **under 10 seconds**
- ✅ Zero paperwork. Zero manual review. Zero fraud.

> **Coverage Scope:** Loss of Income ONLY. GigShield strictly excludes health, life, accident, and vehicle repair coverage — fully compliant with DEVTrails constraints.

<br/>

---

## 👤 Delivery Worker Persona

**Persona:** Food Delivery Partner — Swiggy / Zomato

| Attribute | Details |
|-----------|---------|
| 👷 Worker Type | Full-time / Part-time food delivery partner |
| 🏙️ Operating Cities | Chennai, Mumbai, Bengaluru, Hyderabad, Delhi |
| 💰 Avg. Daily Earnings | ₹600 – ₹900/day (varies by time slot) |
| ⏰ Peak Hours | Evening 5–9 PM (highest order density) |
| ⚠️ Key Risks | Heavy rain, floods, extreme AQI pollution |
| 📱 Platform | Web (accessible on mobile browser) |

**Why Web over Mobile?**
Delivery workers already use their phones for Swiggy/Zomato apps. A lightweight web app requires no installation, works on low-end devices, and is faster to prototype and iterate — making it ideal for a 6-week hackathon timeline.

<br/>

---

## ❗ The Problem We Solve

| ❌ Traditional Insurance | ✅ GigShield |
|--------------------------|--------------|
| Claims take 3–7 days | Claims process in < 10 seconds |
| Manual document submission | Fully automated triggering |
| Flat payout regardless of earnings | Personalized via Income DNA |
| Designed for salaried employees | Built for gig economy workers |
| High fraud risk | GPS + Weather + Duplicate checks |

<br/>

---

## ⚙️ Application Workflow

### Step-by-Step User Journey
```
👤 Worker Visits GigShield
         ↓
📝 Registration (Name, Phone, Platform, City)
         ↓
💳 Select Weekly Plan (Basic ₹10 / Pro ₹25 / Elite ₹50)
         ↓
🛡️ Policy Activated — Coverage Starts Immediately
         ↓
📡 System Monitors Real-Time Signals 24/7
   (Rainfall mm · AQI Index · Flood Alerts · Curfew Data)
         ↓
⚠️ Disruption Threshold Crossed?
   YES → Claim Auto-Triggers
   NO  → Continue Monitoring
         ↓
🧬 Income DNA Calculates Personalized Loss
   (Base Rate × Time Multiplier × Hours Lost)
         ↓
🔍 Fraud Detection Checks
   (GPS Validation · Weather Confirmation · Duplicate Check)
         ↓
💰 Payout Processed Instantly → Worker's Account
```

### Parametric Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| 🌧️ Heavy Rainfall | > 50mm in 3 hours | Auto-claim initiated |
| 🌊 Flood Alert | Government flood advisory issued | Auto-claim initiated |
| 🌫️ Air Pollution | AQI > 300 (Hazardous) | Auto-claim initiated |
| 🌡️ Extreme Heat | > 45°C for 4+ hours | Auto-claim initiated |
| 🚧 Curfew / Strike | Official curfew declared | Auto-claim initiated |

<br/>

---

## 💰 Weekly Premium Model

GigShield follows a **weekly pricing model** aligned with the gig worker's earnings cycle.

| Plan | Weekly Premium | Max Payout | Best For |
|------|----------------|------------|----------|
| 🟢 **Basic Shield** | ₹10 / week | ₹60 | Occasional workers |
| 🔵 **Pro Shield** ⭐ | ₹25 / week | ₹240 | Regular workers |
| 🟣 **Elite Shield** | ₹50 / week | ₹600 | Full-time workers |

- Plans auto-renew weekly for 4 weeks
- All plans cover: **Heavy Rain · Floods · AQI Pollution · Extreme Heat · Curfews**
- No health, life, accident, or vehicle repair coverage (excluded by design)

<br/>

---

## ⭐ Core Innovation — Income DNA

Instead of flat payouts, GigShield builds a **personalized earning fingerprint** for every worker.
```
Compensation = Base Rate × Time Multiplier × Hours Lost
Final Payout = min(Compensation, Plan Max Payout)
```

| 🕐 Time Slot | Hours | Earning Rate | Multiplier |
|-------------|-------|-------------|------------|
| 🌅 Morning | 6 AM – 10 AM | ₹45/hr | 0.75x |
| ☀️ Afternoon | 12 PM – 4 PM | ₹57/hr | 0.95x |
| 🌆 Evening | 5 PM – 9 PM | ₹78/hr | **1.30x ← Peak** |
| 🌙 Night | 9 PM – 12 AM | ₹51/hr | 0.85x |

> A worker disrupted during **Evening Peak** gets higher compensation than one disrupted at off-peak hours — because their actual income loss is higher. **Fair. Transparent. Automated.**

<br/>

---

## 🧠 AI/ML Integration Plan

### 1. Dynamic Premium Calculation
- ML model adjusts weekly premium based on hyper-local risk factors
- Workers in flood-safe zones get lower premiums
- Predictive weather modelling offers dynamic coverage adjustments

### 2. Income DNA Engine
- Analyses each worker's historical earning patterns across 4 time slots
- Builds a personalized multiplier profile per worker
- Used for accurate, fair compensation calculation

### 3. Intelligent Fraud Detection
| Check | Method |
|-------|--------|
| GPS Validation | Verifies worker was in disrupted zone during event |
| Weather Confirmation | Cross-references claim time with official weather data |
| Duplicate Check | Prevents same event being claimed multiple times |
| Anomaly Detection | Flags unusual claim patterns vs. worker's history |

### 4. Risk Prediction Dashboard (Admin)
- Predicts next week's likely disruption zones
- Shows loss ratios and coverage analytics
- Live Risk Heat Map by city and district

<br/>

---

## 🧩 Guidewire Insurance Suite Alignment

| Guidewire Product | GigShield Module | Description |
|-------------------|-----------------|-------------|
| **PolicyCenter** | Plan Management | Worker subscription, plan selection, and full policy lifecycle |
| **ClaimCenter** | Auto-Claim Engine | Parametric claim triggers based on real-time environmental thresholds |
| **BillingCenter** | Premium Engine | Weekly auto-renewal, payment collection, and billing management |

<br/>

---

## 🖥️ Application Screens

### 🏠 Landing Page
*"Instant Weather Protection for Delivery Workers"* — hero section with Login, Register, and Admin Portal entry points.

<img width="1896" height="709" alt="Landing" src="https://github.com/user-attachments/assets/57b97aed-6591-4e15-8a1b-d92882ca5b10" />

<br/>

### 🔐 Worker Entry Portal
Three-card entry: **Login** · **I'm New Here** · **Admin Portal**

<img width="1784" height="735" alt="Entry" src="https://github.com/user-attachments/assets/90a58d51-c7cf-437e-9f02-1bc3dc3cfaf9" />

<br/>

### 📝 Registration — 3-Step Onboarding
Step 1 → Basic Info (Name, Phone, Platform, City) · Step 2 → Choose Plan · Step 3 → Done & Protected

<img width="1812" height="886" alt="Register" src="https://github.com/user-attachments/assets/6b63b9a9-f169-46de-99df-4a5dd4cda98c" />

<br/>

### 💳 Plan Selection
Side-by-side plan comparison. Pro Shield highlighted as recommended. Live avg. hourly earnings input.

<img width="1578" height="914" alt="Plans" src="https://github.com/user-attachments/assets/0df56f60-765d-44c2-a464-28b02aee68fc" />

<br/>

### 📊 Worker Dashboard
Active plan · AI Risk Prediction · Commitment Status · Earnings Protection Summary with Income DNA rate

<img width="1902" height="909" alt="Dashboard" src="https://github.com/user-attachments/assets/a5638f61-644e-4920-8232-967999f78ffb" />

<br/>

### 🧬 Income DNA Profile
24-hour earning breakdown · Peak Earning Hours chart · Expected weekly earnings: ₹6,111 · Smart upgrade recommendation

<img width="1882" height="905" alt="Income DNA" src="https://github.com/user-attachments/assets/35a2710e-9561-4ee9-a2f7-08c0dfd11ed7" />

<br/>

### 📄 Automated Claims
Trigger: Severe Rainfall (65mm) → Income DNA Verified → GPS Validated → ₹240 **PAID INSTANTLY** ✅

<img width="1692" height="649" alt="Claims" src="https://github.com/user-attachments/assets/84cf6f73-7a7a-4ea0-b488-a9ef9cbcf74d" />

<br/>

### 🤖 AI Support Assistant
Multilingual chatbot (English + regional languages · Voice ON/OFF) with live rain prediction per city

<img width="1913" height="906" alt="Chatbot" src="https://github.com/user-attachments/assets/694453b3-482f-4bde-b8c1-27be8e13ec58" />

<br/>

### 🗺️ Admin Risk Heat Map
Live Risk Heat Intelligence · Color-coded severity · Built on Leaflet + OpenStreetMap

<img width="1898" height="804" alt="Risk Map" src="https://github.com/user-attachments/assets/c76fc7f4-87e4-4ae1-9a98-6be43c07561f" />

<br/>

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Maps | Leaflet + OpenStreetMap |
| AI/ML | Income DNA Engine (custom logic) |
| Weather Data | Mock APIs (real integration in Phase 2) |

<br/>

---

## 🚀 Development Plan

| Phase | Timeline | Theme | Deliverables |
|-------|----------|-------|-------------|
| ✅ **Phase 1** | Mar 4–20 | Ideation & Foundation | README · Prototype · 2-min video |
| 🔜 **Phase 2** | Mar 21–Apr 4 | Automation & Protection | Live weather APIs · Dynamic premium · Claims management |
| 🔜 **Phase 3** | Apr 5–17 | Scale & Optimise | Advanced fraud detection · Mock payment gateway · Final pitch deck |

<br/>

---

## ⚙️ Setup Instructions

**1. Clone the Repository**
```bash
git clone https://github.com/Harini09062006/GigShield-Protection.git
cd GigShield-Protection
```

**2. Install Dependencies**
```bash
npm install
```

**3. Configure Firebase** — Create a `.env` file:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**4. Run the App**
```bash
npm run dev
```

<br/>

---

## 👩‍💻 Team

| Name | Role |
|------|------|
| Harini R | Full Stack Developer |
| Priya R | Database Engineer |
| Vaishnavi | AI/ML Developer |
| Revathi M | Frontend Developer |

<br/>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

<br/>

**GigShield Protection — Guidewire DEVTrails 2026**

*Built for India's 15 crore gig workers — because every rupee of their income matters.*

<br/>

⭐ If this project helped you, please give it a star!

</div>
