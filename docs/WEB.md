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
2. **Appointments (live)** — after checkout in Suwasiri, the booking is written to Firestore `appointments` under the **active patient name** (Chamidu, Sakuni, Denuk). GP Care staff see that name on the calendar, not a generic “Suwasiri patient” label.
3. **Video consults** — clicking a video-booking name on the lobby or doctor dashboard opens the **Telehealth room** (not the GP Exam Room). The doctor presses **Call start** (Firestore `telehealth_sessions` status `ringing`). The patient gets an **Answer call** UI on Suwasiri **Call** (local + remote video once live). Suwasiri also fires a 5‑minute pre-call reminder notification. Medicines issued in that room write to Firestore immediately and appear under **Call → E-Prescription**.
4. **E-prescriptions (live)** — medicines issued in GP Care (exam room **Sync e-Rx to Suwasiri App**, clinical record, or telehealth) write to Firestore `prescriptions`. They show on Suwasiri **Vault → E-Prescription**. During a video consult they also show on **Call → E-Prescription**. After MediLanka / pharmacy collection they leave those sections and appear under **Vault → Issued Medical History**.
5. **Vaccine history (app → clinic only)** — when the patient taps **Sync Lanka GP Care** in Vault, only vaccine history is written to Firestore `vaccinations`. The GP sees it under Vaccination logs. Labs, notes, and medicines from the app are **not** sent to the doctor.
6. **Medical certificates (live)** — a certificate issued in GP Care is written to Firestore `medical_certificates` for that patient only (e.g. Chamidu). It appears in Suwasiri **Vault → Medical certificates**. Tap to view, download, or send by email. LankaLab portal sync is not used for certificates.
7. **Name click** — clinic bookings open the **GP Exam Room**. Video bookings open the **Telehealth room** so the doctor can call the patient. Header search filters by **patient name** and shows **that patient only** (click the name to open their details).
8. **Lobby queue** — receptionist **Check In Now** updates Lobby Active Queue on the doctor dashboard (including Suwasiri App bookings).
9. **Pathology** — unread reports only; marking a report read lowers the unread patient count. Ordering an investigation notifies **Sample Dispatch Hub**; the receptionist registers their name from the top-bar notification.
10. **Roles** — Platform Super Admin (tenants) + Hospital Super Admin (RBAC/staff/branches) + hospital template roles. Mobile remains the patient companion.
11. **Do not** rewrite the web UI to match Flutter widgets, or the Flutter UI to match the clinic dashboard.

**Deploy rules after pull:** `firebase deploy --only firestore:rules` so staff can read `appointments`, `prescriptions`, `vaccinations`, and `medical_certificates`, issue e-Rx and certificates, and both sides can use `telehealth_sessions`.

## Firebase Auth (web)

Same project as mobile (`suwasiri-91824`). Login: email/password, register, phone OTP stub `123456`, Google — matching the Flutter app.

Staff EMR access is by **email match** against seeded `staffUsers`. Unmatched accounts only see the Patient Portal. Sign out is on the session bar.

Set `VITE_FIREBASE_APP_ID` in `web/.env.local` after registering a Web app in Console. Remaining work: [NEXT.md](NEXT.md).
