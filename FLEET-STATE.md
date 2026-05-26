# AGENT55-OS — FLEET STATE
*Unified memory for chat-COO interface. Updated: 2026-05-26.*

---

## 1. IDENTITY & OWNER
- **System:** Agent55-OS Fleet Orchestrator
- **Owner:** Dr. Anas Qaisi, ENT Specialist, Amman, Jordan
- **Owner Email:** qaisianas@gmail.com
- **Company Email:** mail.agent55@gmail.com
- **Strategic Goal:** Germany GmbH software scaling
- **Current Sprint:** SPRINT-001 (Alpha Prototype)
- **Sprint Target:** 2026-05-31 (6 days remaining)

---

## 2. SYSTEM ARCHITECTURE
- **CTO (Claude)** — Technical architecture. Subagent: `cto_architect`
- **CEO (Gemini)** — Strategic steering. Subagent: `ceo_strategist`
- **Engineer (GitHub file ops)** — File writes. Subagent: `engineer_builder`
- **Agent55 Replica** — Tasks/planning/research/communication. Subagent: `agent55_replica`

**Entry Point:** Fleet-55 orchestrator acts as intake/classifier.
- Tasks/planning/research/communication/advice → `agent55_replica`
- Technical/build requests → `cto_architect`
- Deadlock/milestone/executive → `ceo_strategist`
- File execution/GitHub commits → `engineer_builder`

---

## 3. SPRINT-001 — DR. HISHAM'S CLINIC
- **Tenant ID:** `hisham`
- **Physician:** Dr. Hisham El-Qaisi
- **Clinic:** The Specialized First Clinic
- **Location:** Jordan Hospital, Amman, Jordan
- **Address:** 54 Ibn Khaldoun Street, Amman
- **Phone:** +962 79 552 1527
- **Hours:** Sat–Thu, 10:30–14:30
- **Services:** Endoscopic Sinus Surgery, Tonsillectomy, UPPP, Tympanoplasty, Mastoidectomy
- **Status:** ACTIVE, target 2026-05-31
- **Site:** https://dr-hisham-clinic-five.vercel.app

---

## 4. INFRASTRUCTURE (UPDATED — MAY 26, 2026)
- **GitHub Org (company):** `agent55-hq`
- **Personal Org (legacy R&D):** `centralcommand55`
- **Clinic Repo:** `agent55-hq/dr-hisham-clinic`
- **Vercel Project:** `dr-hisham-clinic-five`
- **Production URL:** https://dr-hisham-clinic-five.vercel.app
- **Fleet-55 Write Access:** CONFIRMED on `agent55-hq`
- **CI/CD:** `.github/workflows/deploy.yml` — auto-deploy on push to main
- **Tenant Config:** `tenants/hisham/config.json`

---

## 5. COMPANY SETUP COMPLETED
- GitHub org `agent55-hq` created under owner personal account
- Company email: `mail.agent55@gmail.com`
- LangSmith Fleet GitHub App installed on `agent55-hq` with full repo access
- Clinic repo transferred to `agent55-hq/dr-hisham-clinic`
- Vercel auto-deploy configured with GitHub Actions (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID secrets)

---

## 6. CRITICAL DECISIONS
1. CTO = Claude (not Gemini)
2. Entry point = Fleet-55 classifier (not hardcoded CTO)
3. Cloud LangGraph bridge = PARKED for future
4. Execution proxy = GitHub Actions CI/CD → Vercel CLI
5. Org = `agent55-hq` (not `agent55-os` due to collision)
6. Physician name: "El-Qaisi" vs "Qaisi" — PENDING owner decision
7. SPRINT-001 status: ACTIVE — deployment live

---

## 7. PLATFORM ISSUE
LangSmith Fleet builder ↔ chat memory divergence. Builder writes `/memories/AGENTS.md`, chat does not read it. Bug reported to support. Workaround: this state document syncs context.

---

## 8. PENDING ACTIONS
- Physician name consistency — owner decision
- Multi-tenant matrix for SPRINT-002/003 (yazeed, yousef)
- Upgrade GitHub Team when revenue starts
- Custom domain for clinic site
- Disable Vercel Deployment Protection for public access verification

---

## 9. LIVE ENDPOINTS
- LangGraph Cloud: `https://agent55-7fb311f3bf0d5d5bacfd866a7d40d04b.us.langgraph.app`
- Assistant ID: `e63752de-ec68-55ce-884d-502e8399003d`
- LangSmith Project: `agent55`
- LangSmith Deployment: `d59399ca-1df9-4656-a5b2-f2b3246566dd`
- GitHub Clinic Repo: `agent55-hq/dr-hisham-clinic` (current)
- Vercel Clinic (NEW): `https://dr-hisham-clinic-five.vercel.app`

---

## 10. TENANT CONFIG
```json
{
  "tenant_id": "hisham",
  "domain": "dr-hisham-clinic-five.vercel.app",
  "brand": {"primary_color": "#b8935a", "logo_path": null},
  "deployment": {"vercel_project_id": "prj_4WN5VzNezJrvKu4OsKHCvPfLWC1K", "environment": "production"},
  "compliance": {"region": "EU-FRANKFURT", "data_residency": "gdpr"},
  "sprint": "SPRINT-001",
  "target_date": "2026-05-31"
}
```

---

*Updated: 2026-05-26*
