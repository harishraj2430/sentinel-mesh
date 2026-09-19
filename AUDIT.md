# SENTINEL MESH AUDIT REPORT (Phase 0)

**Date**: 2026-09-19  
**Auditor**: Principal Front-End Engineer & Product Designer & QA Lead  
**Scope**: Sentinel Mesh Forensics / SOC Platform (UI Shell, 3D Core, Graph, Map, Ledger, Modal, Theming)

---

## 1. Global Layout & Viewport Scaling

- **File**: `frontend/src/index.css`, `frontend/src/App.jsx`, `frontend/src/pages/LandingPage.jsx`, `frontend/src/pages/Console.jsx`
- **Lines**: `index.css:59-70`, `LandingPage.jsx:90`, `Console.jsx:52`, `Console.jsx:90`
- **Root Cause**:
  - `Console.jsx:90` uses hardcoded two-column grid `gridTemplateColumns: "360px 1fr"`, which on viewports like `768x1024` or `390x844` causes horizontal overflow.
  - Page shells lack `min-width: 0` and `min-height: 0` on sub-grid containers, risking grid blowouts when code/hash strings or long tables render.
  - App shell does not establish `height: 100dvh` flex/grid hierarchy with container bounds.
- **Remediation**:
  - Establish a responsive grid/flex shell with `min-width: 0` / `min-height: 0` on grid children.
  - Make `Console.jsx` stack gracefully on screens `<= 1024px` (`@media (max-width: 1024px) { grid-template-columns: 1fr; }`).
  - Ensure zero horizontal page scroll across all viewports (1229x691, 1280x720, 1366x768, 1440x900, 1920x1080, 2560x1440, 768x1024, 390x844).

---

## 2. FIX 1 — First Impression & Hero Size (Above the Fold)

- **File**: `frontend/src/components/sections/Hero.jsx`
- **Lines**: `Hero.jsx:23-31`, `Hero.jsx:71-99`, `Hero.jsx:102-120`
- **Root Cause**:
  - H1 font size is set to `clamp(2.8rem, 7.5vw, 6.4rem)` (`Hero.jsx:72, 91`) which reaches over 100px on desktop and creates massive vertical overflow.
  - Two sequential lines of giant H1s (`currentHeadline.line1` and `line2`) plus container minHeight `180px` push CTA buttons down.
  - Section has `paddingTop: "100px"`, telemetry badge `marginBottom: "24px"`, and H1s push the subtitle and CTA buttons well below 768px. At 1366x768, users must scroll down to see CTAs.
- **Remediation**:
  - Clamp H1 to `clamp(30px, 3.6vw + 8px, 60px)`, `line-height: 1.05`, `letter-spacing: -0.02em`, max 2 lines.
  - Clamp sub-paragraph to `clamp(15px, 0.35vw + 14px, 18px)`, `line-height: 1.6`, `max-width: 60ch`.
  - Adjust CTA button heights to `48px - 52px`.
  - Scale H2 to `clamp(24px, 2.2vw + 8px, 40px)` and H3 to `20px - 24px` across all sections.

---

## 3. FIX 2 — Font System Configuration

- **File**: `frontend/src/index.css`, `frontend/index.html`
- **Lines**: `index.css:28-34`, `index.html:10-14`
- **Root Cause**:
  - Fonts are loaded via external Google Fonts CDN (`@import` / `<link>` in `index.html`) with arbitrary font names: `Instrument Serif`, `Syne`, `Rajdhani`, `Orbitron`, `Plus Jakarta Sans`, `JetBrains Mono`.
  - Missing standardized system tokens: `--font-display`, `--font-mono`, `--font-accent`, `--font-brand`, `--font-tech`, `--font-body`.
  - Certain long descriptions and labels use display or tech fonts (`Syne` / `Rajdhani`) instead of `--font-body`.
  - Local font files in `/public/fonts` are not yet provisioned with `@font-face` and fallbacks.
- **Remediation**:
  - Create `/public/fonts` directory and configure `@font-face` declarations with `font-display: swap` and robust fallbacks:
    - `--font-display`: "Researcher", "Syne", sans-serif
    - `--font-mono`: "Coder", "JetBrains Mono", monospace
    - `--font-accent`: "Arfumes", "Instrument Serif", serif
    - `--font-brand`: "XCOPR", "Orbitron", sans-serif
    - `--font-tech`: "Cyber", "Rajdhani", sans-serif
    - `--font-body`: "Geist", "Inter", "Plus Jakarta Sans", system-ui, sans-serif
  - Ensure all paragraphs and body text strictly use `--font-body`.
  - Enforce full ASCII/glyph coverage for IP, hash, and email characters (`. : / - @ _`).

---

## 4. FIX 3 — Complete Light Theme Support

- **File**: `frontend/src/index.css`, `frontend/src/components/ui/ThemeSwitch.jsx`, `frontend/src/components/3d/ThreatCore.jsx`, `frontend/src/components/sections/EvidenceGraph.jsx`, `frontend/src/components/sections/GeoRadarMap.jsx`, `frontend/src/pages/LandingPage.jsx`, `frontend/src/pages/Console.jsx`
- **Lines**:
  - `LandingPage.jsx:90`: hardcoded `style={{ background: "#05070e" }}`
  - `Console.jsx:52`: hardcoded `style={{ background: "#05070e" }}`
  - `EvidenceGraph.jsx:209`: hardcoded `background: "#040711"`
  - `index.css:7-57`: tokens need full expansion to `--bg`, `--surface`, `--surface-2`, `--text`, `--text-dim`, `--border`, `--accent`, `--danger`, `--glass`, `--shadow`, `--grid-line`, `--scrollbar`.
- **Root Cause**:
  - Hardcoded dark hex colors (`#05070e`, `#090d18`, `#040711`) exist in multiple component containers, preventing light mode from displaying clean light surfaces.
  - Three.js canvas clear colors, materials, and particles in `ThreatCore.jsx` do not listen to theme changes live.
- **Remediation**:
  - Refactor all hardcoded hexes to semantic CSS custom properties.
  - Add inline theme initialization script in `<head>` to prevent theme flash.
  - Connect `ThreatCore.jsx` to theme state to dynamically switch particle colors, wireframe opacities, and background tones without page reloads.
  - Ensure light theme uses soft shadows (`box-shadow: 0 4px 20px rgba(0,0,0,0.06)`) and darker high-contrast accent colors (WCAG contrast >= 4.5:1).

---

## 5. FIX 4 — 3D Forensic Email Core Topology (Top Node Hidden When Deconstructed)

- **File**: `frontend/src/components/3d/ThreatCore.jsx`
- **Lines**: `ThreatCore.jsx:209`, `ThreatCore.jsx:273`, `ThreatCore.jsx:329-338`
- **Root Cause**:
  - The container height is capped at `350px` (`ThreatCore.jsx:209`), but camera FOV is `40` with `position: [0, 0, 5.5]` (`ThreatCore.jsx:273`).
  - Node `"MTA-STS & TLS"` has `expandedPos={[0, 1.9, 0]}` (`ThreatCore.jsx:331`).
  - At `Y = 1.9`, plus satellite label offset `position={[0, 0.32, 0]}`, the label center is at `Y = 2.22`.
  - With `FOV 40` at `Z = 5.5`, visible vertical span is `2 * 5.5 * tan(20°) ≈ 4.00` (from `Y = -2.0` to `+2.0`).
  - The top label is clipped or blocked by the top telemetry HUD (`top: 14px`).
- **Remediation**:
  - Implement dynamic `fitCameraToNodes()` computing the 3D bounding sphere of all 7 satellites in both assembled and deconstructed states.
  - Adjust camera Z and position with 15% padding and safe top/bottom margin.
  - Add "Fit view" button and bind the `F` key to trigger animated camera refitting.

---

## 6. FIX 5 — Duplicate Scanning Line Effects

- **File**: `frontend/src/components/sections/ForensicVisualPanels.jsx`, `frontend/src/components/sections/InvestigationSequence.jsx`, `frontend/src/components/sections/Hero.jsx`
- **Lines**:
  - `Hero.jsx:43`: `<div className="scanner-line" />`
  - `ForensicVisualPanels.jsx:139`: `<div className="scanner-line" />`
  - `InvestigationSequence.jsx:126`: `<div className="scanner-line" />`
- **Root Cause**:
  - Multiple `.scanner-line` divs are mounted across different sections, causing visual clashing and redundant GPU render passes.
- **Remediation**:
  - Retain exactly one primary scanner line on the page (within Hero/Viewport).
  - Remove duplicate scan lines in `ForensicVisualPanels.jsx` and `InvestigationSequence.jsx`.
  - Verify clean unmounting with no orphaned animations or listeners.

---

## 7. FIX 6 — Empty File / No File Analysis Bug

- **File**: `frontend/src/components/ui/UploadCard.jsx`, `frontend/src/pages/LandingPage.jsx`, `frontend/src/services/api.js`
- **Lines**: `UploadCard.jsx:10-26`, `LandingPage.jsx:80-83`, `api.js:88-110`
- **Root Cause**:
  - If a user clicks or triggers upload without a file or with an empty 0-byte file, `api.js:107` generates a fallback report based on `file.name` alone without validating content.
  - `UploadCard.jsx` does not disable the analyze button or validate file size/type/content.
- **Remediation**:
  - In `UploadCard.jsx`, validate: `size > 0`, non-whitespace content, extension (.eml, .msg, .txt), max size limit (15MB).
  - If no file is attached, disable the Analyze CTA and show: *"Please attach a valid file to analyse (.eml, .msg, .txt)"*.
  - When a file is removed or invalid, clear report state and reset the file input to allow re-selecting the same file.

---

## 8. FIX 7 — Node Information Panel Clipping & Mobility

- **File**: `frontend/src/components/sections/EvidenceGraph.jsx`
- **Lines**: `EvidenceGraph.jsx:321-367`
- **Root Cause**:
  - The node info box is rendered as an absolutely-positioned child inside the graph node div (`EvidenceGraph.jsx:321`).
  - It has a heavy box border, is constrained by parent container dimensions, and gets clipped by surrounding panels or tab bars.
  - It cannot be dragged, moved, or pinned by the user.
- **Remediation**:
  - Move the inspector panel to a floating React Portal rendered directly on `document.body` with `z-index: 9999`.
  - Style with a lightweight frosted glass design, thin themed scrollbar, and grip handle.
  - Implement draggable behavior via Pointer Events with `setPointerCapture`.
  - Clamp position within viewport on drag and resize. Auto-flip anchor when a new node is selected.
  - Add `Esc` key dismissal and accessible keyboard focus.

---

## 9. FIX 8 — Edge / Arrow Mapping in Evidence Graph During Zoom

- **File**: `frontend/src/components/sections/EvidenceGraph.jsx`
- **Lines**: `EvidenceGraph.jsx:237-260`, `EvidenceGraph.jsx:270-285`
- **Root Cause**:
  - SVG lines use percentage coordinates (`x1="18%" y1="50%"`), while nodes use CSS percentages with `transform: translate(-50%, -50%) scale(...)`.
  - SVG transform uses `transform: scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, whereas nodes apply `scale(${nodeScale})` separately per node.
  - When zooming, node boundaries expand or contract, causing arrowheads to detach from node edges.
- **Remediation**:
  - Unify nodes and edges into a single coordinate system.
  - Use `vector-effect="non-scaling-stroke"` and `markerUnits="userSpaceOnUse"` on arrowheads.
  - Dynamically calculate exact border intersection anchor points for each edge based on node dimensions and zoom factor.

---

## 10. FIX 9 — World Map Replacement & Vector Calibration

- **File**: `frontend/src/components/sections/GeoRadarMap.jsx`
- **Lines**: `GeoRadarMap.jsx:66-82`, `GeoRadarMap.jsx:27-28`
- **Root Cause**:
  - Continents are rendered via a simplified SVG path approximation (`worldMapContinents`), which looks stylized rather than authentic.
  - Missing high-fidelity vector world map asset in `/public/assets/world-map.svg`.
- **Remediation**:
  - Add high-fidelity clean vector world map asset at `/public/assets/world-map.svg` with equirectangular projection.
  - Calibrate marker projection formulas to match coordinate references accurately.
  - Add pan + zoom, marker clustering when zoomed out, and smooth fly-to animation (700ms).

---

## 11. FIX 10 — Google Mail Connect Popup Viewport Sizing

- **File**: `frontend/src/components/ui/GmailConnectModal.jsx`
- **Lines**: `GmailConnectModal.jsx:54-59`, `GmailConnectModal.jsx:77-85`, `GmailConnectModal.jsx:429-430`
- **Root Cause**:
  - Step 4 (mailbox) sets `maxWidth: "980px"` with `minHeight: "480px"`.
  - Modal container lacks `max-height: calc(100dvh - 32px)`, causing vertical overflow on screens like `1229x691` and `1366x768`.
  - The modal inner content does not scroll independently, forcing the user to zoom out to see action buttons.
- **Remediation**:
  - Enforce `max-height: calc(100dvh - 32px)` and `max-width: calc(100vw - 32px)` on all modal steps.
  - Make modal header and footer sticky, with `overflow-y: auto` on inner content.
  - Ensure 100% usability at 100% browser zoom on laptops (1229x691 and 1366x768).

---

## 12. NEW FEATURE — Login Devices & Impossible Travel Analytics

- **File**: `frontend/src/components/sections/GeoRadarMap.jsx`, `frontend/src/services/api.js`, `frontend/src/pages/Console.jsx`
- **Implementation**:
  - Create unified `LoginActivityProvider` supporting:
    - (a) Google Workspace Reports API (Admin SDK) with clear distinction for personal vs. workspace accounts.
    - (b) Email Header Tracing (RFC 822 Received hops) labelled as "Sender path".
    - (c) Sentinel Mesh session fingerprints.
  - Implement Haversine distance / time calculation to detect **Impossible Travel** (threshold > 900 km/h) and trigger SOC alerts.
  - Create interactive Devices Panel with fly-to map navigation and ledger integration.

---

## 13. LEDGER EXPLAINER — UI Copy & Integrity Transparency

- **File**: `frontend/src/components/sections/CaseReport.jsx`
- **Lines**: `CaseReport.jsx:443-455`
- **Implementation**:
  - Add "Why a ledger?" explainer tooltip/card: *"Every incident and login event is sealed into a SHA-256 hash chain. Change any record and every later block stops matching, so evidence tampering is instantly visible."*
  - Use exact technical terminology (immutable hash chain vs. decentralized only if distributed).

---

**End of Audit. Proceeding to surgical fixes.**
