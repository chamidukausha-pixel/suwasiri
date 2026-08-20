# Web — Sri Lankan GP Care

Clinic EMR / GP dashboard that runs **in parallel** with the Flutter mobile app. Source was copied from `Downloads/sri-lankan-gp-care` into [`web/`](../web/). The original Downloads folder is **not** edited.

## Constraints

- Keep the **exact same** stack: React 19, Vite, Express (`server.ts`), Tailwind 4, `@google/genai`.
- Do not migrate to Next.js, Flutter web, or another framework.
- Do not change the Flutter/mobile app unless explicitly asked.

## Run

From `web/`:

```powershell
cd web
npm install
copy .env.example .env.local
# set GEMINI_API_KEY in .env.local
npm run dev
```

App URL: `http://localhost:3000` (Express + Vite from `server.ts`).

## Current backend

The web app is **not** on Firebase yet. `server.ts` persists mock clinic data to `patient_store.json` (gitignored) and calls Gemini for AI features.

Mobile already uses Firebase (`suwasiri-91824`) collections in [FIREBASE.md](FIREBASE.md).

## Roles, Super Admin, and hospital isolation

Tenancy lives in `web/src/tenancy.ts` and is stored with the clinical JSON (`hospitals`, `branches`, `roles`, `staffUsers`, `memberships`, `staffDirectory`).

**Isolation:** Hospital is the tenant boundary. PrimeCare (Colombo + Kandy branches) never sees Southern Coast Hospitals charts. Staff (e.g. Dr. Silva) can hold **memberships** in both; they switch hospital in the session bar and only see that hospital’s patients.

**Session bar:** pick hospital, then branch. Demo people:

- Nimal Fernando / Chamidu Kausha — Platform Super Admin (all modules, all hospitals; pick a hospital to work in EMR)
- Ms. Sandamali Jayasekara — Hospital Super Admin (PrimeCare: all hospital modules + RBAC / branches / staff)
- Dr. Priyantha Silva — Doctor at PrimeCare (both branches) **and** Southern Coast
- Mr. Thusitha Perera — Receptionist, Colombo only
- Ms. Dilani Wickramasinghe — Hospital Super Admin (Southern Coast)

**RBAC:** Security & RBAC matrix is per hospital. Super Admin toggles the 16 permission flags, **add** custom roles (clone a template), **disable** system templates, and **remove** custom roles with no staff assigned. **Commit & Save RBAC Policy** persists immediately: the sidebar hides modules the role cannot open. Example: Nurse with only View Clinical Notes + View Billing sees Patient Clinical Records, documents, and billing — nothing else.

**Practice Manager → Locations** is Branch CRUD. Staff directory assigns a role and a list of branches.

**Lobby & Doctor Dashboard calendar:** a compact month calendar sits on the **right side** of those two screens only (not on other modules). Click a date to load that day’s queue. Arrows move month forward/back; **Today** returns to the current month.

## Future Firestore (do not change mobile `users/{uid}` — only add collections)

See [FIREBASE.md](FIREBASE.md) planned tenancy collections. Platform Super Admin can open every GP Care module and switch hospital/branch. Patient mobile vault stays owner-scoped (`patientId == uid`). GP EMR charts stay hospital-local.

## Sync plan (mobile + web)

Work both apps in this repo. Align on shared data, not a shared UI framework.

1. **Identity** — same Firebase Auth users (`users/{uid}`) so a patient on mobile is the same person a GP sees on web.
2. **Appointments (live)** — after checkout in Suwasiri, the booking is written to Firestore `appointments`. GP Care (signed-in staff) listens to that collection and merges it with the clinic diary. Click a calendar date (e.g. 30 August 2026) to see the patient, doctor, time, clinic vs video, and a **Suwasiri App** badge.
3. **Video consults** — video bookings appear in **Telehealth** from the slot time until the doctor starts the call. Doctor (GP Care) and patient (Suwasiri Call tab) join the same `telehealth_sessions/{appointmentId}` WebRTC room — camera and mic in the browser and the app, no extra devices.
4. **Roles** — Platform Super Admin (tenants) + Hospital Super Admin (RBAC/staff/branches) + hospital template roles. Mobile remains the patient companion.
5. **Do not** rewrite the web UI to match Flutter widgets, or the Flutter UI to match the clinic dashboard.

**Deploy rules after pull:** `firebase deploy --only firestore:rules` so staff can read `appointments` and both sides can use `telehealth_sessions`.

## Firebase Auth (web)

Same project as mobile (`suwasiri-91824`). Login: email/password, register, phone OTP stub `123456`, Google — matching the Flutter app.

Staff EMR access is by **email match** against seeded `staffUsers`. Unmatched accounts only see the Patient Portal. Sign out is on the session bar.

Set `VITE_FIREBASE_APP_ID` in `web/.env.local` after registering a Web app in Console. Remaining work: [NEXT.md](NEXT.md).
