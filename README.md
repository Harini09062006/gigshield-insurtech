# 🛡️ GigShield InsurTech — DEVTrails 2026 Phase 3 Final Submission

## AI-Powered Parametric Insurance for Gig Delivery Workers

**Guidewire DEVTrails 2026 | Phase 3 — Scale & Optimize**

---

## 🌐 Live Deployment

* Application: https://gigshield-insurtech.vercel.app

---

## 👨‍💻 Team Innovatrix

* Hari — Lead Engineer (AI/ML, Architecture, Integrations)
* Priya R — Frontend Developer (UI, Dashboard, Chatbot Interface)
* Vaishnavi — Backend & Data Engineer (Firestore, APIs, Fraud Detection)
* Revathi M — Product & QA (Testing, Demo Flow, Documentation)

---

# 📌 1. Project Overview

GigShield is a production-grade AI-powered parametric insurance platform designed specifically for gig delivery workers in India.

Gig workers operate in highly unpredictable environments where external disruptions such as heavy rainfall, extreme heat, pollution spikes, or traffic congestion can directly impact their ability to work. Unlike salaried employees, they have no fallback income when such disruptions occur.

GigShield addresses this gap by introducing an automated insurance system that protects worker income in real time.

Unlike traditional insurance systems that rely on manual claim filing and verification, GigShield uses:

* Real-time environmental data
* AI-based risk prediction
* Automated parametric triggers

to detect disruptions and trigger payouts instantly.

This removes delays, reduces friction, and ensures that workers receive compensation when they need it the most.

---

# 🚀 2. Phase 3 Objective — Scale & Optimize

Phase 3 focuses on transforming GigShield from a functional prototype into a scalable, intelligent, and production-ready platform.

Key goals achieved in this phase:

* Transition from rule-based logic to true machine learning
* Introduce Explainable AI for transparency
* Replace all mock data with live API integrations
* Build an interactive risk heatmap
* Develop a hybrid AI chatbot for user support
* Strengthen fraud detection with multi-layer validation
* Improve system performance, scalability, and reliability

---

# 🔄 3. Phase 2 → Phase 3 Transformation

| Phase 2 (Automation) | Phase 3 (Optimization)                  |
| -------------------- | --------------------------------------- |
| Rule-based triggers  | ML-based decision engine                |
| Static thresholds    | Dynamic probability scoring             |
| No explainability    | Explainable AI (XAI)                    |
| Mock data            | Live API data                           |
| Basic UI             | Advanced analytics dashboards           |
| No chatbot           | Hybrid AI chatbot                       |
| Limited fraud checks | Multi-layer intelligent fraud detection |

---

# 🧠 4. Innovation DNA

GigShield’s core innovation is built around four tightly integrated components:

---

## 4.1 Train-Once Machine Learning Model

GigShield uses a TensorFlow.js-based neural network model that is trained once and reused across sessions.

### Key Characteristics:

* Input Features:

  * Weather severity
  * Traffic congestion
  * Air quality index
  * Geographic zone risk
  * Historical claim rate

* Model Architecture:

  * Dense Layer (16 neurons)
  * Dense Layer (8 neurons)
  * Sigmoid Output Layer

* Output:

  * Risk probability (0 to 1)

### Unique Implementation:

* Model is stored in IndexedDB after training
* No retraining on page reload
* Ensures production-like consistency
* No rule-based fallback — all decisions use ML

---

## 4.2 Explainable AI (XAI)

To address transparency, GigShield includes an Explainable AI module.

### Features:

* Feature contribution analysis (SHAP-style)
* Confidence intervals for predictions
* Human-readable explanations
* Persistent audit logs stored in Firestore

### Example Explanation:

"Heavy rainfall contributed 42% to the risk score, making it the primary factor in claim approval."

This ensures both workers and insurers understand how decisions are made.

---

## 4.3 Real-Time External API Integration

All system decisions are powered by live data.

### Integrated APIs:

* OpenWeatherMap → Weather conditions
* Google Maps → Traffic and congestion
* WAQI → Air quality index
* Firebase → Historical claims data

### Impact:

* Eliminates mock data
* Ensures real-world reliability
* Enables dynamic risk scoring

---

## 4.4 Hybrid AI Chatbot — GigAssist

GigAssist is designed to support workers who may not be familiar with insurance systems.

### Architecture:

Layer 1: FAQ Engine

* Keyword matching
* Predefined responses
* Fast and efficient

Layer 2: LLM Fallback

* Handles complex queries
* Context-aware responses
* Personalized interactions

### Features:

* Bilingual support (English + Tamil)
* Context injection (policy, claims, risk score)
* Claim assistance workflow
* Chat history persistence
* Controlled responses (no hallucination)

---

# 🗺️ 5. Real-Time Risk Heatmap

GigShield includes an interactive heatmap that visualizes risk across geographic zones.

### Key Concepts:

* Zones created using H3 geospatial indexing
* Each zone assigned an ML-based risk score
* Updated dynamically using live API data

### Color Coding:

* Green → Low Risk
* Orange → Medium Risk
* Red → High Risk

### Functionalities:

* Real-time updates
* Zone-level insights
* Historical claim overlays
* Click-to-view detailed risk breakdown

### Dual Usage:

Worker View:

* Helps workers avoid high-risk areas

Admin View:

* Identifies claim concentration
* Enables policy adjustments

---

# 🔒 6. Fraud Detection System

GigShield implements a multi-layer fraud detection system.

### Detection Layers:

1. GPS location validation
2. Device fingerprinting
3. Account age verification
4. Behavioral pattern analysis
5. Order history validation
6. Duplicate claim detection
7. Weather verification
8. Network fraud detection

### Additional Techniques:

* Velocity checks
* Anomaly detection models
* Historical comparison

### Outcome:

* High fraud detection accuracy
* Reduced false positives
* Reliable claim validation

---

# ⚙️ 7. System Architecture

## ML Risk Pipeline

1. Data collection from APIs
2. Feature normalization
3. ML model inference
4. XAI explanation generation
5. Decision making
6. Payout execution
7. Data logging

---

## Design Principles

* Zero mock data policy
* No fallback logic
* Additive architecture (Phase 2 untouched)
* Real-time processing
* High reliability

---

# 📊 8. Feature Overview

## Worker Dashboard

* Earnings protection tracking
* AI premium calculation
* Automated claim triggering
* XAI explanation panel
* Heatmap visualization
* Chatbot assistance
* Claim history

---

## Admin Dashboard

* Loss ratio monitoring
* Fraud analytics
* Predictive insights
* Risk zone management
* XAI audit logs

---

# 🛠️ 9. Technology Stack

## Frontend

* React
* TypeScript
* Tailwind CSS
* Next.js

## Backend

* Firebase Firestore
* Firebase Authentication
* Cloud Functions

## AI/ML

* TensorFlow.js
* Explainable AI engine

## APIs

* OpenWeatherMap
* Google Maps
* WAQI

## Payments

* Razorpay

## Deployment

* Vercel
* GitHub Actions

---

# 💰 10. Business Model

GigShield uses a weekly subscription-based pricing model.

| Plan  | Cost | Coverage |
| ----- | ---- | -------- |
| Basic | ₹10  | Limited  |
| Pro   | ₹25  | Standard |
| Elite | ₹50  | Full     |

---

# 📈 11. Impact

GigShield creates real-world impact by:

* Protecting gig worker income
* Reducing financial instability
* Supporting families
* Promoting financial inclusion

---

# 🧪 12. Demo Instructions

1. Open application
2. Register as a worker
3. Select a plan
4. Simulate disruption
5. Observe automatic claim
6. View payout

---

# 🎯 13. Key Achievements

* Fully functional AI insurance system
* Real-time automated claims
* Explainable AI integration
* Multi-layer fraud detection
* Live data-driven decision making
* Scalable architecture

---

# 🔮 14. Future Scope

* Expansion to additional gig sectors
* Improved ML model accuracy
* Deeper platform integrations
* Regulatory alignment
* Advanced predictive analytics

---

# 🏁 15. Conclusion

GigShield demonstrates how AI can be applied to solve real-world financial problems in a practical and scalable way.

By combining machine learning, real-time data, and automation, the platform provides a reliable safety net for gig workers.

The system is designed not just as a prototype, but as a foundation for a real-world product capable of making a meaningful impact.

---

**GigShield — Because one bad day shouldn’t cost a week’s income.**
