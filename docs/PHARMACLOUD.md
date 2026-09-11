# Web — Sri Lanka PharmaCloud

Pharmacy / e-health gateway that runs **in parallel** with the Flutter mobile app, the GP Care clinic portal, and the LankaLab portal. Source was copied from `Downloads/sri-lanka-pharmacloud` into [`pharmacloud/`](../pharmacloud/). The original Downloads folder is **not** edited.

## Constraints

- Keep the **exact same** stack: React 19, Vite, Express (`server.ts`), Tailwind 4, `@google/genai`, `motion`.
- Do not migrate to Next.js, Flutter web, or another framework.
- Do **not** change Flutter/mobile (`lib/`), GP Care (`web/`), or LankaLab (`lankalab/`) unless explicitly asked.

## Run

From `pharmacloud/`:

```powershell
cd pharmacloud
npm install
copy .env.example .env.local
# set GEMINI_API_KEY in .env.local
npm run dev
```

App URL: **http://localhost:3002** (Express + Vite from `server.ts`).

Other local apps stay on their own ports so all three web UIs can run at once:

| App | Path | URL | Vite HMR |
|-----|------|-----|----------|
| GP Care | `web/` | http://localhost:3000 | 24678 |
| LankaLab | `lankalab/` | http://localhost:3001 | 24679 |
| **PharmaCloud** | `pharmacloud/` | **http://localhost:3002** | **24680** |

## Current backend

PharmaCloud is **not** on Firebase yet. Inventory, GP Care prescriptions, Suwasiri profiles, bills, suppliers, and online orders live in `src/data/mockData.ts`. Gemini endpoints in `server.ts`:

- `GET /api/health` — gateway status
- `POST /api/ai/medication-analysis` — drug-interaction / allergy / dosage scan
- `POST /api/ai/generate-refill-notification` — trilingual EN / SI / TA refill SMS

## Modules (copied as-is)

| Sidebar | What it does today |
|---------|-------------------|
| Executive Dashboard | Metrics, live clinical feed (mock) |
| Stock & Inventory Ledger | NMRA stock, barcodes, reorder |
| Online Store & E-Pharmacy | Customer orders / delivery (mock) |
| POS Bills & SMS Dispatcher | Counter bills + phone SMS (mock) |
| Barcode / QR Drug Scanner | Scan to deduct stock |
| Suwasiri E-Prescriptions | Incoming GP scripts (mock `GPCarePrescription`) |
| Admin & Shop Owner Portal | Valuation / margins |
| Suwasiri Health Vault | Patient NIC, allergies, chronic list (mock) |
| AI Drug Safety Engine | Gemini medication-analysis |
| Refill Notifications | Trilingual refill composer |
| Regulatory & Compliance | NMRA / PDPA audit UI |

## Sync plan (later — do not merge UIs)

Work all apps in this repo. Align on **shared Firebase data**, not a shared UI.

1. **E-prescriptions** — GP Care / Suwasiri already write Firestore `prescriptions`. PharmaCloud should list those rows as incoming scripts (today they are mock). After the pharmacist **dispenses**, set `sentToPharmacare` (or a dedicated `dispenseStatus`) so Suwasiri moves the line from Vault **E-Prescription** / Call **E-Prescription** into **Issued Medical History**.
2. **Identity** — same Firebase Auth project (`suwasiri-91824`). Pharmacy staff via email membership (same pattern as GP Care). Patients stay on the Suwasiri app.
3. **Suwasiri Health Vault** — Unique Health ID / NIC lookup of `users/{uid}` allergies and chronic conditions before dispense (today mock `SuwasiriPatientProfile`).
4. **Refill SMS** — composer already talks to Gemini; later write a `notifications` row for that patient (EN/SI/TA) like GP Care Recalls SMS.
5. **Do not** rewrite this UI to match Flutter, GP Care, or LankaLab.

**Deploy rules later** when collections or fields are added. See [FIREBASE.md](FIREBASE.md).
