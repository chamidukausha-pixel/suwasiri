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

**Practice Manager → Locations** is Branch CRUD. Staff directory assigns a role and a list of branches. Weekly roster assigns working **days and hours** (e.g. Dr. Silva Mon/Wed/Fri 16:00–18:00); save and edit later.

**Lobby & Doctor Dashboard calendar:** a compact month calendar sits on the **right side** of those two screens only (not on other modules). Click a date to load that day’s queue. Arrows move month forward/back; **Today** returns to the current month.

**Receipts & Invoices** and **Clinical Audit Trail** use the same month calendar. Click a date to show only that day’s booked patients (invoices) or that day’s consult/lab activity (audit). Reception can view/download Suwasiri bank slips on invoices.

**Telehealth** lists **video bookings for the selected clinic date only**. Click the patient name to load **Active Clinical Consultation Room**. **Call start** unlocks **2 minutes before** the slot (9:30 → 9:28, not 9:27). e-Rx matches the GP Exam Room formulary (category pills, meal timing in Sinhala). Attached prescription image is removed.

**Recalls:** completing a recall drops All Active and that category count, removes the row, and persists.

**Platform Console:** click a hospital name (e.g. PrimeCare Medical Group) to add Doctor / Receptionist / Nurse / other staff. They get a membership so they appear in Practice Manager, Security & RBAC, and login.

**Security & RBAC:** Super Admin can assign staff to other branches (and Platform SA to other hospitals’ branches).

## Future Firestore (do not change mobile `users/{uid}` — only add collections)

See [FIREBASE.md](FIREBASE.md) planned tenancy collections. Platform Super Admin can open every GP Care module and switch hospital/branch. Patient mobile vault stays owner-scoped (`patientId == uid`). GP EMR charts stay hospital-local.

## Sync plan (mobile + web)

Work both apps in this repo. Align on shared data, not a shared UI framework.

1. **Identity** — same Firebase Auth users (`users/{uid}`) so a patient on mobile is the same person a GP sees on web.
2. **Appointments (live)** — after checkout in Suwasiri, the booking is written to Firestore `appointments` under the **active patient name** (Chamidu, Sakuni, Denuk). GP Care staff see that name on the calendar, not a generic “Suwasiri patient” label.
3. **Video consults** — clicking a video-booking name on the lobby or doctor dashboard opens the **Telehealth room** (not the GP Exam Room). Telehealth lists **that day’s video bookings only**. The doctor presses **Call start** from **2 minutes before** the slot (Firestore `telehealth_sessions` status `ringing`). The patient gets an **Answer call** UI on Suwasiri **Call** (local + remote video once live). Suwasiri also fires a 5‑minute pre-call reminder notification. Medicines issued in that room write to Firestore immediately and appear under **Call → E-Prescription**.
4. **E-prescriptions (live)** — medicines issued in GP Care (exam room **Sync e-Rx to Suwasiri App**, clinical record, or telehealth) write to Firestore `prescriptions`. They show on Suwasiri **Vault → E-Prescription**. During a video consult they also show on **Call → E-Prescription**. After MediLanka / pharmacy collection they leave those sections and appear under **Vault → Issued Medical History**.
5. **Vaccine history (app → clinic only)** — when the patient taps **Sync Lanka GP Care** in Vault, only vaccine history is written to Firestore `vaccinations`. The GP sees it under Vaccination logs. Labs, notes, and medicines from the app are **not** sent to the doctor.
6. **Medical certificates (live)** — a certificate issued in GP Care is written to Firestore `medical_certificates` for that patient only (e.g. Chamidu). It appears in Suwasiri **Vault → Medical certificates**. Tap to view, download, or send by email. LankaLab portal sync is not used for certificates.
7. **Name click** — clinic bookings open the **GP Exam Room**. Video bookings open the **Telehealth room** so the doctor can call the patient. Header search filters by **patient name** and shows **that patient only** (click the name to open their details).
8. **Lobby queue** — receptionist **Check In Now** updates Lobby Active Queue on the doctor dashboard (including Suwasiri App bookings).
9. **Pathology** — unread reports only; marking a report read lowers the unread patient count. Ordering an investigation notifies **Sample Dispatch Hub**; the receptionist registers their name from the top-bar notification.
10. **Roles** — Platform Super Admin (tenants) + Hospital Super Admin (RBAC/staff/branches) + hospital template roles. Mobile remains the patient companion. **Receptionist** owns Recalls & Reminders (SMS/email on registered contact, rebook via the Book scheduler).
11. **Reception booking (live)** — Front Desk **Book** opens the Book scheduler (drag doctors, 6‑month dates, sage/coral layout). Confirm writes Firestore `appointments` with `consultMode` `clinic` or `video`. The patient’s Suwasiri Home shows **blue** (in person) or **purple** (video). On the booked date, doctor dashboard and receptionist lobby list that patient under the assigned doctor.
12. **Clinical calculators** — doctor searches a registered patient, clicks the name, edits vitals/details, and saves. The snapshot stays on that patient’s Clinical Decision Calculators Suite history (Firestore `clinical_calculations` + clinic file).
13. **Do not** rewrite the web UI to match Flutter widgets, or the Flutter UI to match the clinic dashboard.
14. **Walk-in availability** — **Check walk-in** opens the sage/coral 6‑month scheduler (today included). If there are no free slots, reception may add up to **5 walk-ins at the end of that session**. Lobby Schedule still lets reception change queue place (⬆️⬇️ and the place dropdown).
15. **Telehealth consult (live)** — Doctor **Call start** (from 2 minutes before the slot) opens GP room camera; the Suwasiri Call tab opens the patient camera. Both see and hear each other (WebRTC). The right rail is the **Active Clinical Consultation Room**. Drug search & e-Rx match the exam-room formulary. **View Clinical Hub** opens that patient’s history. After issuing medicines the doctor can **view, download, and print** the prescription; items already sync to Suwasiri **Call → E-Prescription**.
16. **Unique Health ID** — Reception types the card number (e.g. Chamidu `SW3C6F5B5A27`, Sakuni `SW6CF9340271`) and **Sync to Portal**. That file appears **only at the clinic that synced it** (e.g. PrimeCare). Another hospital must enter the ID and sync again. Reception **Delete** / **Block** needs a comment; Hospital Super Admin approves it.

**Deploy rules after pull:** `firebase deploy --only firestore:rules` so staff can read `appointments`, `prescriptions`, `vaccinations`, `medical_certificates`, `clinical_calculations`, `consultation_notes`, and `users` (signed-in read; household write for family Unique Health IDs), issue e-Rx and certificates, and both sides can use `telehealth_sessions` (including `messages`).

## Firebase Auth (web)

Same project as mobile (`suwasiri-91824`). Login: email/password, register, phone OTP stub `123456`, Google — matching the Flutter app.

Staff EMR access is by **email match** against seeded `staffUsers`. Unmatched accounts only see the Patient Portal. Sign out is on the session bar.

Set `VITE_FIREBASE_APP_ID` in `web/.env.local` after registering a Web app in Console. Remaining work: [NEXT.md](NEXT.md).
