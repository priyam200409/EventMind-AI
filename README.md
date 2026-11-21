# EventMind AI — Autonomous Enterprise Event Orchestration Engine (India Edition)

Production-grade multi-agent AI platform built with **Next.js (TypeScript)**, **Vercel AI SDK**, **Gemini 3.8 Flash / 3.5 Flash-Lite**, **Zod**, and **GitHub Actions CI/CD**.

## Core Architecture & Engineering Highlights
- **ReAct Tool-Calling Agents:** Autonomous Procurement and LiveOps agents execute `Reason → Act → Observe` loops invoking real TypeScript tools (`searchIndianVendors`, `calculateCateringAndGst`, `auditScheduleConflicts`, `dispatchWhatsAppAlert`) with live telemetry traces.
- **Generator-Critic Self-Correction Loop:** Programmatically audits IST conference schedules for room overlaps, speaker double-bookings, and capacity overflows, forcing automatic schedule self-healing until `0 Conflicts Verified`.
- **Indian Enterprise Tax & Dietary Compliance:** Native INR (`₹`) lakh/crore formatting, itemized **18% GST (`9% CGST + 9% SGST`)** ledgers, and regional dietary plate allocations (**Pure Veg, Jain-Certified, Non-Veg**) across Bengaluru, Mumbai, Delhi NCR, and Hyderabad.
- **Human-in-the-Loop (HITL) Governance Gates:** Automatically pauses high-value POs (`≥92%` budget utilization or `≥₹20,00,000`) and major live schedule mutations (`≥250` impacted delegates) for explicit operator sign-off.
- **LiveOps Chaos Mode & Executive Reporting:** Simulates localized disruptions (ORR traffic gridlock, Mumbai monsoon waterlogging, IGI fog delays), prepares WhatsApp Business + SMS broadcasts, computes Indian enterprise ROEI attribution, and exports downloadable Markdown Run-of-Show & GST reports.

## Local Setup & Automated Verification
```bash
npm install
cp .env.example .env.local # Set GOOGLE_GENERATIVE_AI_API_KEY
npx tsc --noEmit
npm test
npm run dev