# SENTINEL MESH — CURRENT ARCHITECTURE MAP (Pre-Extension Audit)

Generated: 2026-09-20  
Project: Sentinel Mesh (SIH 106)  
Location: `C:\Users\Admin\sentinel-mesh`

---

## 1. Current Folder Structure

```
sentinel-mesh/
├── backend/
│   ├── app/
│   │   ├── geoip/
│   │   │   └── tracer.py             # MaxMind GeoIP / routing IP hop tracing
│   │   ├── headers/
│   │   │   └── forensics.py          # Header parsing, SPF/DKIM/DMARC/ARC/MTA-STS
│   │   ├── ingestion/
│   │   │   └── parser.py             # EML / RFC 822 email parser
│   │   ├── intel/
│   │   │   ├── attachments.py        # Attachment scanner & static forensics
│   │   │   └── urls.py               # URL extractor, defanger & lookalike detection
│   │   ├── nlp/
│   │   │   └── classifier.py         # Heuristic psychological urgency / BEC / phishing scoring
│   │   ├── report/
│   │   │   └── builder.py            # 12-scanner report aggregator & threat scoring
│   │   ├── __init__.py
│   │   └── main.py                   # FastAPI application & endpoints
│   ├── domain/
│   │   └── intel.py
│   ├── evidence/
│   │   ├── graph.py                  # Threat correlation graph (NetworkX)
│   │   └── hashing.py                # In-memory BlockchainEvidenceVault (SHA-256)
│   ├── pdf_report/
│   │   └── generator.py              # ReportLab PDF generator
│   ├── sample_emails/                # Sample test EML fixtures
│   ├── tests/                        # Backend unit test suites
│   ├── .env                          # Backend env (currently empty)
│   ├── package.json                  # Backend toolchain scripts
│   └── requirements.txt              # Pinned Python dependencies
├── frontend/
│   ├── public/
│   │   ├── assets/                   # World map tactical rasters & vector assets (< 4.2 MB)
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── 3d/                   # ThreatCore, GeoGlobe, EnvelopeCore, NeonGrid, TrustGates
│   │   │   ├── sections/             # Hero, CaseReport, EvidenceGraph, GeoRadarMap, Verdict, etc.
│   │   │   └── ui/                   # Navbar, UploadCard, GmailConnectModal, ThemeSwitch, etc.
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── Console.jsx           # SOC Operations Console
│   │   │   └── LandingPage.jsx       # Investigation & Hero landing page
│   │   ├── services/
│   │   │   └── api.js                # Axios HTTP client with fallback simulation
│   │   ├── App.jsx                   # React Router root
│   │   ├── index.css                 # Global cyber/SOC design system & tokens
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json                  # React 19 + Vite 8 dependencies
│   └── vite.config.js
├── tests/                            # Playwright E2E tests
├── AUDIT.md                          # Frontend/UI Phase 0 audit report
├── cinematic.html                    # Standalone cinematic visualization
├── package.json
└── .gitignore
```

---

## 2. Frontend Technology
- **Framework**: React 19.2.8 (`react`, `react-dom`)
- **Bundler & Dev Server**: Vite 8.3.0 (`@vitejs/plugin-react`)
- **3D Graphics & WebGL**: Three.js (`three` 0.186.0), React Three Fiber (`@react-three/fiber` 9.7.0), Drei (`@react-three/drei` 10.7.8), Postprocessing (`@react-three/postprocessing` 3.1.1)
- **Motion & Physics**: Framer Motion 13.3.0, GSAP 3.15.0, AnimeJS 4.5.0, Lenis 1.3.26
- **Routing**: `react-router-dom` 7.18.4
- **Icons & Styling**: `lucide-react` 1.46.0, Custom CSS Tokens (`--bg`, `--surface`, `--accent`, `--danger`)
- **API Client**: Axios 1.20.0 with dual port fallback (`127.0.0.1:8000` / `8001`) and offline client simulation

---

## 3. Backend Technology
- **Language**: Python 3.12+
- **Web Framework**: FastAPI 0.141.1, Starlette 1.6.0, Uvicorn 0.53.0
- **Data Validation**: Pydantic 2.13.5 (`pydantic_core` 2.46.5)
- **Forensic Libraries**:
  - `dkimpy` 1.1.8 (DKIM signature validation)
  - `dnspython` 2.8.0 (DNS queries for SPF, MX, DMARC, MTA-STS)
  - `python-whois` 0.9.6 (Domain age and registrar attribution)
  - `tldextract` 5.3.2 (Domain and lookalike extraction)
  - `networkx` 3.6.1 (Forensic graph topology)
  - `reportlab` 5.0.1 (Forensic PDF report generation)

---

## 4. Database Technology
- **Current State**: In-memory only (`BlockchainEvidenceVault` in `backend/evidence/hashing.py`).
- **Target State (Extension)**: Supabase PostgreSQL with append-only ledger trigger, RLS policies, and seamless in-memory fallback.

---

## 5. Current AI Provider / Model
- **Language/NLP Classifier**: Rule-based heuristic pattern matching (`backend/app/nlp/classifier.py`):
  - `URGENCY_PATTERNS`: regex for time-pressure psychological triggers.
  - `CREDENTIAL_PATTERNS`: regex for credential harvesting.
  - `FINANCIAL_BEC_PATTERNS`: regex for wire transfer and payroll diversion.
- **Forensic Synthesizer**: Rule-based template synthesizer in `backend/app/report/builder.py` generating `ai_forensic_analyst` summaries based on deterministic scanner flags.
- **Status**: No external paid LLM required; deterministic checks remain purely deterministic.

---

## 6. Existing 12 Threat Detection Methods
Located in `backend/app/report/builder.py`:
1. `01. Envelope & Header Sanity Inspection`
2. `02. Return-Path & Reply-To Divergence`
3. `03. SPF Record Validation & IP Match`
4. `04. DKIM Signature Cryptographic Verification`
5. `05. DMARC Alignment & Policy Enforcement`
6. `06. URL Extraction, Defanging & Reputation`
7. `07. Received Relay Hop Chain Resolution`
8. `08. ASN & Network Profiling`
9. `09. Approximate IP Geolocation`
10. `10. AI Psychological NLP & BEC Analysis`
11. `11. Attachment Static Forensics`
12. `12. Threat Correlation & Ledger Anchoring`

---

## 7. Existing API Routes
- `GET /api/health` -> Engine status, version, and threat intel status.
- `GET /api/sample-cases` -> 4 sample forensic case definitions (BEC, Phishing, Malware, Clean).
- `POST /api/sample-cases/{case_id}/analyze` -> Deep analysis of sample case.
- `POST /api/analyze` -> Multipart EML/MSG file upload analysis.
- `POST /api/scan/email` -> JSON text/raw EML scan endpoint.

---

## 8. Existing Evidence Storage
- Handled in `backend/evidence/hashing.py`:
  - `EvidenceRecord`: stores `evidence_id`, `case_id`, `evidence_type`, `sha256_hash`, `timestamp`, `investigator_id`, `previous_hash`, `metadata`, `block_number`.
  - In-memory list `chain` inside `BlockchainEvidenceVault`.

---

## 9. Existing Authentication
- Currently absent (anonymous SOC console session).
- Planned: Modular JWT-based multi-user authentication (`investigator`, `analyst`, `admin`) with guest/demo mode fallback.

---

## 10. Existing Blockchain Implementation
- Class `BlockchainEvidenceVault` in `backend/evidence/hashing.py`:
  - Genesis block creation (`GENESIS`).
  - SHA-256 hash chaining (`previous_hash`).
  - Proof of work simulation (`_mine_block`).
  - Chain verification (`verify_chain`).
  - Evidence tampering check (`verify_evidence`).

---

## 11. Existing Environment Variables
- `backend/.env`: currently unpopulated.
- Target variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`, `JWT_SECRET`, `PORT`.

---

## 12. Dependency List
- Backend: `fastapi`, `uvicorn`, `pydantic`, `dnspython`, `dkimpy`, `python-whois`, `tldextract`, `networkx`, `reportlab`, `requests`, `python-dotenv`.
- Frontend: `react`, `react-dom`, `vite`, `@react-three/fiber`, `@react-three/drei`, `three`, `framer-motion`, `gsap`, `axios`, `lucide-react`, `react-router-dom`.

---

## 13. Exact Integration Points for New Modules
- New routes mounted under `/api/v2/*`:
  - `/api/v2/auth/*`
  - `/api/v2/investigations/*`
  - `/api/v2/threat-intelligence/*`
  - `/api/v2/evidence/*`
  - `/api/v2/blockchain/*`
  - `/api/v2/gmail/*`
  - `/api/v2/extension/*`
- Existing routes remain 100% backward-compatible.

---

## 14. Files That Must NOT Be Modified / Broken
- Core detectors: `app/headers/forensics.py`, `app/nlp/classifier.py`, `app/intel/urls.py`, `app/intel/attachments.py`, `app/geoip/tracer.py`, `app/ingestion/parser.py`.
- Response structure of `/api/analyze` and `/api/sample-cases`.
- Existing 3D visual models and landing page components.
