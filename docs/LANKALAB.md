# Web — LankaLab Portal

Clinical diagnostics / lab dashboard that runs **in parallel** with the Flutter mobile app, the GP Care clinic portal, and PharmaCloud. Source was copied from `Downloads/lankalab-portal` into [`lankalab/`](../lankalab/). The original Downloads folder is **not** edited.

## Constraints

- Keep the **exact same** stack: React 19, Vite, Express (`server.ts`), Tailwind 4, `@google/genai`, `motion`.
- Do not migrate to Next.js, Flutter web, or another framework.
- Do **not** change Flutter/mobile (`lib/`), GP Care (`web/`), or PharmaCloud (`pharmacloud/`) unless explicitly asked.

## Run

From `lankalab/`:

```powershell
cd lankalab
npm install
copy .env.example .env.local
# set GEMINI_API_KEY in .env.local
npm run dev
```

App URL: **http://localhost:3001** (Express + Vite from `server.ts`).

GP Care stays on **http://localhost:3000**. PharmaCloud runs on **http://localhost:3002**. All three can run at the same time. LankaLab Vite HMR uses port **24679** so it does not collide with GP Care (**24678**) or PharmaCloud (**24680**).

## Current backend

LankaLab is **not** fully on Firebase yet. Orders live in `src/data/mockData.ts`. Gemini endpoints are in `server.ts`.

**Live GP Care bags:** Sample Dispatch **Collected** / **Delivered** details (driver, phone, vials, vehicle, clinic) appear on **Transit Logistics Monitor → Clinic Sample Collection Log (Central LIS)** in the same card layout. Polls GP Care `http://localhost:3000/api/lankalab-clinic-collections` and also listens to Firestore `clinic_sample_dispatches`.
