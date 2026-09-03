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

**RBAC:** Security & RBAC matrix is per hospital. Super Admin toggles the 16 permission flags, **add** custom roles (clone a template), **disable** system templates, and **remove** custom roles with no staff assigned. **Commit & Save RBAC Policy** persists immediately: the sidebar hides modules the role cannot open. Example: Nurse with only View Clinical Notes + View Billing sees Patient Clinical Records and billing — nothing else.

**Practice Manager → Locations** is Branch CRUD. Staff directory assigns a role and a list of branches. Weekly roster assigns working **days and hours** (e.g. Dr. Silva Mon/Wed/Fri 16:00–18:00); save and edit later.

**Lobby & Doctor Dashboard calendar:** a compact month calendar sits on the **right side** of those two screens only (not on other modules). On the **Doctor Dashboard**, Appointments / Waiting / Telehealth tiles scroll to that day’s list on the same page — they do **not** open Reception Lobby Schedule. Click a date on the side calendar to load that day’s queue. Arrows move month forward/back; **Today** returns to the current month.

**Receipts & Invoices** and **Clinical Audit Trail** use the same month calendar. Click a date to show that day’s booked patients in a **scrollable** invoice table (like Appointments & Lobby Queue), or that day’s consult/lab activity (audit). Unpaid / not-settled rows are highlighted (amber, overdue red) and listed first. Reception can view/download Suwasiri bank slips on invoices. Booked rows without an issued invoice are listed; Cash Settle / Sync Suwasiri apply only to real invoice IDs.

**Telehealth** lists **video bookings for the selected clinic date only**. Click the patient name to load **Active Clinical Consultation Room** with that booking’s name, age, ID, and allergies (replacing the generic “Patient” label). **View Clinical Hub** opens that file. **Call start** unlocks **2 minutes before** the slot (9:30 → 9:28, not 9:27). e-Rx matches the GP Exam Room formulary (category pills, meal timing in Sinhala). Selecting a drug removes it from the recommendation list.

**Recalls:** completing a recall drops All Active and that category count, removes the row, and persists.

**Platform Console:** **Operations & Governance** — create a medical centre with a Sri Lankan **district**, then click a hospital name to add Doctor / Receptionist / Nurse / other staff, or **Remove (resigned)** so they leave Practice Manager and clinic login. **Doctors require a specialty** (Cardiologist, Dermatologist, … matching the Suwasiri Doctors tab). After save they appear in Practice Manager, Security & RBAC, login, and on the Suwasiri app (search by doctor name, clinic name, and district) so patients can book.

**Security & RBAC:** Super Admin can assign staff to other branches (and Platform SA to other hospitals’ branches). Super Admin can edit MFA, password rules, session timeout, backup RPO/RTO, and retention years. The module uses light colourful tabs.

**Practice Manager → MBS & Private Fees:** Super Admin / Practice Manager can edit item codes and fees, **Add MBS Item**, and save. The bulk-billable column is removed.

**Reports & Analytics:** KPI totals and the daily panel use live Receipts & Invoices plus completed consultations. **This Month / Last Quarter / YTD 2026** filters the results panel below. Export **Excel** (CSV), **Notepad** (.txt), or **PDF** (print). A Doctor Dashboard-style month calendar sits on the right; click a date for collected, outstanding, invoiced, and completed consults that day.

## Future Firestore (do not change mobile `users/{uid}` — only add collections)

See [FIREBASE.md](FIREBASE.md) planned tenancy collections. Platform Super Admin can open every GP Care module and switch hospital/branch. Patient mobile vault stays owner-scoped (`patientId == uid`). GP EMR charts stay hospital-local.

## Sync plan (mobile + web)

Work both apps in this repo. Align on shared data, not a shared UI framework.

1. **Identity** — same Firebase Auth users (`users/{uid}`) so a patient on mobile is the same person a GP sees on web.
2. **Appointments (live)** — after checkout in Suwasiri, the booking is written to Firestore `appointments` under the **active patient name** (Chamidu, Sakuni, Denuk). GP Care staff see that name on the calendar, not a generic “Suwasiri patient” label.
3. **Video consults** — clicking a video-booking name on the lobby or doctor dashboard opens the **Telehealth room** (not the GP Exam Room). Telehealth lists **that day’s video bookings only**. The doctor presses **Call start** from **2 minutes before** the slot (Firestore `telehealth_sessions` status `ringing`). The patient gets an **Answer call** UI on Suwasiri **Call** (local + remote video once live). Suwasiri also fires a 5‑minute pre-call reminder notification. Medicines issued in that room write to Firestore immediately and appear under **Call → E-Prescription**.
4. **E-prescriptions (live)** — medicines issued in GP Care **GP Exam Room** write to Firestore `prescriptions` and show on Suwasiri **Vault → E-Prescription**. Medicines issued in **Telehealth** use the video appointment id and show on Suwasiri **Call → E-Prescription** (that session only). After MediLanka / pharmacy collection they leave those sections and appear under **Vault → Issued Medical History**.
5. **Vaccine history** — when the patient taps **Sync Lanka GP Care** in Vault, vaccine history is written to Firestore `vaccinations` for the GP. When the doctor **records an immunisation** on the patient profile, that dose is written with `source: gp_care` and appears on Suwasiri **Vault → Vaccine history**.
6. **Clinical file (live)** — from the GP Care patient profile:
   - **Consultation Completed** SOAP → Suwasiri **Vault → Doctor notes & treatment** (`consultation_notes`)
   - **Immunisation** recorded by the doctor → **Vault → Vaccine history** (`vaccinations`, `source: gp_care`)
   - **Allergies** → under the name on Suwasiri **Profile** Unique Health ID card (`users.clinicAllergies`)
   - **Pathology** (hub **Completed** or exam-room Save note) and **Imaging** requests → **Vault → Lab reports** (`vault`, category Pathology / Imaging)
   - **Issue medical certificate** on Documents → **Vault → Medical certificates**
   Patient **Sync Lanka GP Care** still sends vaccine history from the app to the GP.
7. **Name click** — clinic bookings on the queue open the **GP Exam Room**. Video bookings open the **Telehealth room**. Header search lists matching names **under the search box**; clicking a name opens that patient’s **clinical profile** (the same Consultation SOAP file with left clinical sections). It does not open the separate history-hub overlay.
8. **Lobby queue** — receptionist **Check In Now** still lives on Reception Schedule and keeps **Waiting in lobby**. After check-in, **Call to GP Exam Room** (or **Call to Telehealth** for video) marks the patient **IN EXAM ROOM** without opening the exam room. **Active Exam Room** on Lobby is a status label only. Doctors cannot open Lobby Schedule or change queue places. The Doctor Dashboard no longer shows Lobby Active Queue, Clinical Alerts, Pathology/Recalls/Documents tiles, Check In, **GP Exam Room (Standby)**, or a **Record** overlay. Queue numbers are display-only. **Completed** on a consult (exam room or in-queue) files SOAP and clinical updates onto that patient’s profile. Finished visits stay in the day’s appointment queue (no second completed list). A **cyan Clinical Shift Checklist** round button appears only on the doctor portal (**Dashboard, GP Exam Room, Pathology, Telehealth**); drag to move, click to open the shift task list.
9. **Pathology** — colourful **Unread Pathology** count only. Seeded sample unread reports (Fatima, Arjuna, Anura, Rohan, Sunethra, Mahesh) populate the inbox. **Inspect Full Record** is removed. **View** opens the report. **Completed** drops it from this inbox, files it under GP Exam Room **Pathology history**, and writes it to Suwasiri **Vault → Lab reports**. **Critical / Alert** flags the patient profile in red and creates a HIGH **Pathology Follow-up** recall on Front Desk Recalls & Reminders so reception can **Call** and rebook **in person** or **video**. Ordering an investigation (dropdown in the order modal) notifies **Sample Dispatch Hub**.
10. **Roles** — Platform Super Admin (tenants) + Hospital Super Admin (RBAC/staff/branches) + hospital template roles. Mobile remains the patient companion. **Receptionist** owns Recalls & Reminders (SMS/email on registered contact, rebook via the Book scheduler).
11. **Reception booking (live)** — Front Desk **Book Active Appointment**, Lobby **Book Appointment**, **Patient Portal** Book, and **Recalls** open the Book scheduler with **only doctors who work at the signed-in medical centre** (PrimeCare does not list Southern Coast clinicians). Pick a doctor: **available** times are selectable; **booked** times from the Suwasiri App and from GP Care (reception or doctor) list the patient and cannot be double-booked. Clicking a date on the **clinic calendar** shows that doctor’s available and booked times for the same Firestore `appointments`. Confirm writes `consultMode` `clinic` or `video`. Home shows **blue** / **purple**. **Patient profile → Appointments** lets a signed-in doctor book again using **only their own** slots (no other clinic doctors). **Online Public Booking** is removed.
12. **Clinical calculators** — the standalone sidebar page is removed. Calculators stay on **GP Exam Room** (header button). Saving from there still writes to visit history and Firestore `clinical_calculations`.
13. **Do not** rewrite the web UI to match Flutter widgets, or the Flutter UI to match the clinic dashboard.
14. **Walk-in availability** — **Check walk-in** opens the sage/coral 6‑month scheduler (today included). If there are no free slots, reception may add up to **5 walk-ins at the end of that session**. Lobby Schedule **Up / Down** (and Top) change the patient’s queue place; booked time stays the same. The **Patient queue** list scrolls in its own box. After **Check In Now**, the row shows **Waiting in lobby** and **Call to GP Exam Room** (status only). **Active Exam Room** is display-only and does not open GP Exam Room. Reception does **not** open the doctor portal from Lobby. From **Patient Clinical Records**, Reception and Super Admin may open the patient file but **without** the live encounter / modality / fee bar and without Active Clinical Consultation e-Rx.
15. **Telehealth consult (live)** — Doctor **Call start** (from 2 minutes before the slot) opens GP room camera; the Suwasiri Call tab opens the patient camera. Both see and hear each other (WebRTC). **Today’s available video consultations** for that doctor sit **under** Telehealth Virtual Exam Room. Click a booked name to fill **Active Clinical Consultation Room** on the **right of the video** with the GP Exam Room patient profile. If the doctor has **no video appointment** that day, **no patient file** is shown. That profile **scrolls on its own** so the video call does not move. **Live Consultation Notes & Clinical Impressions** is removed (notes live in Consultation SOAP). Drug search & e-Rx sit under the profile in the same scroll pane. After issuing medicines the doctor can **view, download, and print** the prescription with **digital signature + SLMC stamp**; items already sync to Suwasiri **Call → E-Prescription**.
16. **Unique Health ID** — Reception types the card number (e.g. Chamidu `SW3C6F5B5A27`, Sakuni `SW6CF9340271`) and **Sync to Portal**. GP Care looks up that live Suwasiri `users` file plus Vault labs and vaccine history, **shows the details in the Unique Health ID box**, and **saves the file to Patient Clinical Records at this clinic**. Dummy barcode patients (wrong name for the same ID) are replaced by the live file. Another hospital must enter the ID and sync again. Reception **Delete** / **Block** needs a comment; Hospital Super Admin approves it. Sync does **not** open the doctor clinical profile for reception.
17. **Clinic doctors** — Platform Console adds a medical centre (with district) and a doctor with specialty; Firestore `clinic_centers` / `clinic_doctors` lists them on Suwasiri **Doctors**. Patients search by clinician name (e.g. Priyantha Silva, Chamidu Rathnayake), clinic name (e.g. PrimeCare Medical Centre - Colombo Central), and all 25 districts. Practice Manager roster hours publish onto the same doctor so the app only offers those times. Bookings write Firestore `appointments` + `appointment_slots` so GP Care calendars show the same date/time. Checkout offers **Pay at counter**, **Online Debit/Card**, and **Manual Bank Slip** (slip image on the invoice).
18. **Sample Collections** — doctor picks any specimen category; the order appears on Sample Dispatch Hub. The hub lists dispatch rows only (no Quick-Log / Select Patient Profile, no status Filters, no Test / Investigation Profile chip strip, no **Register my name**). The **Notifications** badge equals remaining **PENDING** jobs on Sample Dispatch (not leftover unread alerts). **Collected** (or Delete) reduces the count to match what is left (e.g. 3 → 2). Reception **Delivered** opens that patient’s file with **Sample Collections** and **Documents** only (no **Open clinical profile**). After **Enter Courier Dispatch Details** and handover, that specimen **leaves Sample Dispatch** (it stays on the patient file). **Add document** (Scan / Drag and drop / Browse) files onto the same clinical profile as GP Exam Room → Documents. Reception does not see the header **Search Patients, Lab Orders, or eRx** box. The header **Notifications** bar is **Receptionist / Front Desk only** (not on the doctor portal).
19. **GP Exam Room** — colourful section boxes sit on the **left** under the patient name. **Consultation** has one **Doctor notes** field (Completed syncs to Suwasiri Vault). Allergies can be added, edited, or deleted. A specialist **Referral** notifies the patient in the Suwasiri app. Pathology history lets the doctor **View** the report and **Save note**.
20. **Documents** — there is no standalone Document Management page. On the patient clinical profile, **Documents** shows **Issue medical certificate** (syncs to Suwasiri Vault) and **Add document** (Scan from scanner/camera, or Drag and drop / Browse). Files are stored on that patient’s `clinicalDocuments` and listed under Documents history.

**Deploy rules after pull:** `firebase deploy --only firestore:rules` so staff can read `appointments`, `prescriptions`, `vaccinations` (and **write clinic immunisations** with `source: gp_care`), `medical_certificates`, `clinical_calculations`, `consultation_notes`, `clinic_doctors`, `clinic_centers`, `vault` (signed-in **read** of lab reports for Unique Health ID sync; GP Care can **create** reviewed lab **and imaging** reports), and `users` (signed-in read; household write for family Unique Health IDs; staff may merge `clinicAllergies`), issue e-Rx and certificates, and both sides can use `telehealth_sessions` (including `messages`).

## Firebase Auth (web)

Same project as mobile (`suwasiri-91824`). Login: email/password, register, phone OTP stub `123456`, Google — matching the Flutter app.

Staff EMR access is by **email match** against seeded `staffUsers`. Unmatched accounts only see the Patient Portal. Sign out is on the session bar.

Set `VITE_FIREBASE_APP_ID` in `web/.env.local` after registering a Web app in Console. Remaining work: [NEXT.md](NEXT.md).
