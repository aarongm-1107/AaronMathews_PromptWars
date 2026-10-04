# BlindSpot 🎯
> **"See what you're missing."**

An AI-powered cognitive reasoning auditor built for the **PromptWars Hackathon** under the challenge theme **"The Blind Spot"**.

---

## 🌟 The Core Problem
When making important decisions, people frequently anchor on the information most visible to them. They overlook silent assumptions, rely on unproven causal predictions as if they were facts, and miss contradictions between their stated priorities and their chosen leaning.

### 🛡️ Fundamental Product Principle
**BlindSpot does NOT make the decision for you.**
It never outputs *"You should choose X"* or ranks options as a recommendation. Instead, BlindSpot acts as an adversarial cognitive auditor—examining **how** you are choosing, stress-testing your logic, and illuminating the blind spots before you commit.

---

## 🔬 What BlindSpot Audits

| Audit Pillar | What It Discovers |
| :--- | :--- |
| **A. Assumption Audit** | Identifies unexamined premises accepted as fact without empirical verification. |
| **B. Missing Material Information** | Uncovers critical omitted facts that could flip the entire decision calculus. |
| **C. Reasoning Conflicts** | Detects internal tensions between stated priorities and chosen leaning. |
| **D. Second-Order Effects** | Traces non-linear downstream ripple effects across short, medium, and long-term horizons. |
| **E. Time-Horizon Biases** | Highlights present bias, immediate excitement vs. delayed compounding friction. |
| **F. Perspective Shifts** | Simulates 4 lenses: **Future Self (3 years out)**, **Affected Stakeholders**, **Neutral Observer**, and **Skeptical Red Team**. |
| **G. Evidence vs. Belief** | Deconstructs user claims into **Facts**, **Beliefs**, **Inferences**, and **Assumptions**. |
| **H. High-Value Questions** | Generates probing inquiry questions and concrete verification actions. |

---

## 🚀 Featured Demo Scenario
The application features a 1-click preset selector including the primary hackathon scenario:
- **6-Month Tech Internship vs. On-Time Graduation:** A third-year CS student weighing an off-cycle Series B startup offer against taking a formal academic leave of absence.
  - Automatically identifies academic prerequisite lock-in, mentorship availability reality, cohort severance, and unstated assumptions.
- Additional presets: **Leaving Big Tech for Pre-Seed AI Startup** & **Monolith to Microservices Rewrite**.

---

## 🛠️ Architecture & Tech Stack
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Curated Vanilla CSS Design System with dark mode, glowing accents, glassmorphic cards, responsive mobile layout, and micro-animations.
- **AI Engine:**
  - Server-side analysis via `@google/genai` targeting Google Gemini (`gemini-2.5-flash` / `gemini-3.8-flash`).
  - Zero-configuration fallback: Context-grounded heuristic epistemic parser ensures the app functions completely out-of-the-box for evaluators without an immediate API key.
- **Zero Client Leakage:** API keys are strictly kept server-side in environment variables (`.env.local`).
- **Repository Size:** Under 150 KB (excluding dependencies), well within the <10 MB hackathon constraint.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
```bash
cp .env.example .env.local
# Add your Google Gemini API key if desired:
# GEMINI_API_KEY=your_key_here
```
*(If omitted, BlindSpot automatically uses its embedded semantic reasoning audit engine so you can evaluate the full UX immediately).*

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```
