# FinLit Simulator – Minimal Offline Financial Literacy PWA

**An ultra-lightweight, voice-first, behavior-driven financial literacy app built with pure vanilla JavaScript.**  
Targeted at rural users (farmers, women, students, young adults) in low-connectivity areas like rural India.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Size: ~80KB gzipped](https://img.shields.io/badge/bundle-%7E80KB-brightgreen)](https://github.com/yourusername/finlit-simulator)
[![Offline-First](https://img.shields.io/badge/Offline%E2%80%90First-Yes-blue)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers)

## ✨ Why This Exists

Traditional financial education fails to change behavior.  
This app uses **realistic simulations** where user choices trigger immediate consequences (e.g., skipping savings → crop failure distress).  

Key goals:
- Fully functional **offline** (critical for rural 2G/3G areas)
- **Voice-first** interface (Web Speech API) for low-literacy users
- Persona-tailored scenarios (farmer, student, women, young adult)
- ≥3 financial themes per micro-scenario (budgeting + insurance + fraud, etc.)
- <100 KB gzipped → loads instantly on low-end Android phones

No frameworks. No build tools. No backend for MVP.

## 🚀 Features

- Offline-first PWA (installable, works without internet)
- Deterministic client-side financial simulation engine
- Voice input/output via browser Speech API (Tamil/English + fallback audio)
- Persona selection → tailored stories & visuals
- Simple gamification: resilience score + narrative unlocks
- Local persistence (IndexedDB / localStorage)
- Hand-written tiny service worker (~1 KB)

## 🏗️ Architecture (Minimal)

```mermaid
graph TD
    User((User)) -->|Tap / Voice| A[Single HTML + CSS UI<br>Large buttons • Persona selector]

    A --> B[Vanilla JS Core (~30-50 KB)<br>Simulation Engine<br>Decision → Consequence logic<br>Multi-theme scenarios]

    B --> C[Gamification Lite<br>Level flags • Narrative text<br>Resilience score]

    B --> D[Local Storage<br>IndexedDB or localStorage<br>Persona • Progress • State]

    E[Service Worker (~1 KB)<br>Cache: HTML/JS/CSS/JSON/audio<br>Offline by default] -.->|Serves| A
    E -.->|Serves| B

    style A fill:#f0f8ff,stroke:#4682b4
    style B fill:#fffacd,stroke:#daa520
    style C fill:#90ee90,stroke:#228b22
    style D fill:#e6e6fa,stroke:#4b0082
    style E fill:#d3d3d3,stroke:#696969























Overall Efficiency & Trade-offs
Web / PWA Efficiency (before Capacitor wrapper)

Extremely high:
Bundle size: ~40–100 KB gzipped (first load) → instant on 2G/3G rural networks
Runtime: Native browser performance (no framework overhead)
Memory/CPU: Very low — ideal for low-end Android (1–2 GB RAM, Android Go)
Offline: 100% functional (service worker + IndexedDB)
Load time: <1–2 seconds on slow connections after cache


Native Android App Efficiency (after adding Capacitor)

APK size: Typically 5–12 MB for a minimal vanilla JS app like yours (based on real-world examples from Capacitor users with <500 KB web assets).
Overhead comes mostly from: Android WebView (~Chrome engine), native boilerplate, permissions handling, and Capacitor bridge.
Your tiny web files add almost nothing extra.
Compare: Pure native Android "Hello World" is ~2–5 MB; Capacitor minimal apps are in the 5–15 MB range (much smaller than heavy Ionic/React Native apps at 20–50+ MB).

Performance:
Excellent on mid/low-end devices — WebView is highly optimized in modern Android (Android 10+).
Voice (Web Speech API) works reliably.
Offline simulation/gamification: Zero latency (all client-side).
Slight overhead vs pure native: ~5–15% slower startup/JS execution due to WebView bridge, but negligible for your simulation-heavy (not animation-heavy) app.

Battery / Resource use: Low — no heavy animations, minimal network calls, client-side only.
Development efficiency: Very high — keep editing vanilla files → npx cap sync android → test/build. No need to learn Kotlin/Java or rewrite logic.
Distribution: Easy APK sideloading for rural users; can submit to Play Store (small size helps with approvals & downloads on limited data).

Trade-offs Summary

Pros of Capacitor addition: True native app (icon on home screen, offline install, potential Play Store reach), access to future native features (e.g., notifications), better perceived trust in rural India vs "just a website".
Cons: APK ~50–100× larger than web bundle (but still small at 5–12 MB), minor native overhead vs pure web/PWA.
Verdict for your use case: Excellent balance — maintains rural-ready lightness while unlocking native distribution. Perfect for hackathon MVP and real-world rural financial literacy impact in Tamil Nadu / India.
