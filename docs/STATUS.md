# Suwasiri — project status

Living tracker for implementation. **Update this file when you finish or start a chunk of work.**

## Current mode

| Item | Value |
|------|--------|
| Backend | **Firebase** (`AppConstants.useDemoBackend = false`) |
| Project ID | `suwasiri-91824` |
| Package / bundle | `com.thepatientcare.suwasiri` |
| Auth | Firebase Auth → Firestore `users/{uid}` |
| Health data | Firestore (`vault`, `vaccinations`, `appointments`, `notifications`) |
| Rules deployed | Yes (`firestore.rules` → `firebase deploy --only firestore:rules`) |

## Done

- [x] Firebase Android + iOS apps registered
- [x] `google-services.json` / `GoogleService-Info.plist` / `firebase_options.dart`
- [x] Google Services Gradle plugin
- [x] `FirebaseAuthRepository` (email, phone OTP stub `123456`, Google Sign-In)
- [x] `FirebaseHealthRepository` (Firestore CRUD + static clinic/doctor catalogs)
- [x] App boots via `Firebase.initializeApp` when demo flag is off
- [x] Firestore rules file + deploy
- [x] Demo repos retained only for `AppServices.forTesting`
- [x] Home screen UI rebuilt to product mockups (header, quick actions, upcoming card, vaccination status, health tip)
- [x] Doctors directory UI (search filters, clinics map, fixed doctor result cards)
- [x] Care/Call UI (video stage, Lanka GP Care e-Rx → PharmaCare send, notes, AI co-pilot)
- [x] Firestore `prescriptions` collection + rules
- [x] Medical Vault UI (AI Lab Assistant, LankaLab + GP Care sync cards, chronological timeline)
- [x] Vaccines registry UI (MOH portal sync card, active dengue protocol, status-colored protocol cards)
- [x] Profile UI (communication settings, treatment history timeline, security ID checks, logout)
- [x] Home avatar (C) opens Profile tab; profile photo via camera or gallery (local prefs)
- [x] Book Session → Confirm Appointment (more slots) → Secure Checkout (card / manual bank slip + document/image upload)
- [x] Suwasariya 1990 SOS overlay (dark rescue UI, GPS lock, share-live-GPS consent → Firestore `sos_sessions`)
- [x] Doctors: expanded specialty categories + clinic address with Google/Apple Maps choice after booking
- [x] Doctors: ≥3 dummy clinicians per specialty + specialty dropdown; Book Session keeps full checkout
- [x] Telehealth tab rename (Care → Telehealth); e-Rx shows issued date + clinic; more quick health tips
- [x] Telehealth page always shows full mockup layout (video, live consult, e-Rx, notes, AI — nothing hidden)
- [x] Call tab rename (Telehealth → Call); issued e-Rx shown as dual-copy formal prescription form under E-Prescription
- [x] Call: real device camera on/off for patient PiP; sample reference e-prescription forms on Call screen
- [x] Call: camera auto-on at consult start; E-Rx clinic tap → email / MediLanka sync / PDF download + sample clinics
- [x] Call e-Rx = live session only (clears after MediLanka); Vault Patient Health & Treatment History + Issued Medical History
- [x] Vault: E-Prescription above AI Lab; Issued Medical History with 4 colored categories (medicines/labs/vaccines/notes)
- [x] Vault sample data expanded (e-Rx clinics, labs, vaccines, notes); Call section left unchanged
- [x] Vault always seeds/falls back to sample Rx+labs+vaccines+notes; compact portal cards; Call sample e-Rx restored
- [x] Vaccines: pending/scheduled protocols only; completed → Vault Vaccine History; national booking sheet (all 25 districts, EPI-from-birth immunizations, Private Hospital + LKR prices)
- [x] Profile: removed treatment history; Unique Health ID card (name/age/blood/NIC/barcode); first-login EN/SI/TA health questionnaire (editable in Profile)
- [x] Home: removed doctor categories + My Lab Reports; upcoming maps sync + clinic name; Doctors: all districts → clinics/hospitals → doctors + maps; removed upcoming list; Vault lab AI+download; larger vaccine book CTA; greener Health ID card
- [x] Doctors page always lists doctors (name + hospital/clinic + address); Call View digital e-prescription opens formal form with email / MediLanka / PDF even while draft is updating
- [x] Global yellow Help FAB + AI Help Desk chat (EN/SI/TA): app features, diseases/symptoms, medical certificate upload & explain
- [x] Help Desk symptom chat explains what may be happening and suggests matching specialties + sample doctors (opens Doctors tab)
- [x] Help Desk: typing + voice mic input; ask-anything guidance kept; Doctors cards show specialty category + full details again
- [x] Home: booked doctor sessions on blue card and vaccine bookings on green card; expired slots hide; vaccination status removed
- [x] Sub-pages: Close + X to dismiss sheets; Help Desk EN/සිංහල/தமிழ் for all topics; vaccine search covers MOH offices, government and private hospitals in all 25 districts
- [x] Home: blue card = in-person clinic only; purple card = video consult (also on Call); green = vaccine; expired bookings hide (blank)
- [x] Home/Call show the latest booked doctor per mode (blue = clinic, purple + Call = video); each new booking replaces the previous card automatically
- [x] Home: booked vaccine sessions all appear on one green card (empty if none); child EPI protocol reminders from date of birth
- [x] Home bookings (blue clinic / purple video / green vaccine) hide automatically at local midnight after the slot date
- [x] Profile: family member selector dropdown + dummy wife/child (switches Home/Vault/Vaccines identity)
- [x] Web GP Care copied into `web/` (exact React/Vite/Express stack; Downloads source left untouched)
- [x] Web tenancy: Platform + Hospital Super Admin, multi-hospital isolation, multi-branch staff, RBAC add/remove roles (persisted in `patient_store.json`)
- [x] Web Firebase Auth login (email / Google / phone OTP stub) on `suwasiri-91824`; staff via email membership match
- [x] Platform Super Admin can open Doctor / Reception / Operations modules; committed RBAC hides nav items immediately
- [x] Doctors: clinic-name search + PrimeCare Medical Centre (Dr. Priyantha Silva cardiology, Dr. Anoja Senanayake dermatology) and more named clinics
- [x] Web lobby + doctor dashboard month calendar (current month/time, prev/next month, click a date for that day’s appointments and patient details)
- [x] Suwasiri App bookings sync to GP Care calendar (Firestore `appointments`; clinic + video; patient name/time/doctor on the selected date)
- [x] Clicking a booked name: clinic visit → GP Exam Room; video booking → Telehealth room (doctor can Call start)
- [x] Header search lists matching names under the search box; clicking a name opens that patient’s clinical profile (Consultation SOAP file), not the other history-hub overlay
- [x] Doctor dashboard Colombo clock enlarged; Lobby Active Queue counts receptionist Check In Now
- [x] Pathology shows unread reports; Mark read lowers the unread patient count; Unreviewed tests lists tests under names
- [x] Pathology order notifies receptionist Sample Dispatch Hub (sidebar + top-bar)
- [x] Sample Dispatch Hub lists doctor-ordered specimens only (Quick-Log / Select Patient Profile, status Filters, in-page search, and Test / Investigation Profile chips removed); reception header has no Search Patients / Lab Orders / eRx box
- [x] Sample Dispatch **Notifications** badge equals remaining hub jobs (not leftover unread alerts); finishing a job reduces the count (e.g. 3 → 2)
- [x] After courier dispatch details are saved, that specimen leaves Sample Dispatch Hub (record remains on the patient file)
- [x] Sample-collection **Documents** has **Add document** (Scan / Drag and drop / Browse); files write onto that patient’s GP Exam Room Documents; reception does not get **Open clinical profile**
- [x] Video consults: Telehealth **Call start** (beside Record) opens in-browser camera/mic to the Suwasiri App Call tab — no WhatsApp
- [x] Telehealth-issued medicines sync to Suwasiri **Call → E-Prescription**
- [x] Suwasiri bookings show the real patient name on GP Care (Chamidu / Sakuni / family member)
- [x] GP Care issued e-Rx syncs to Suwasiri Vault E-Prescription (exam room **Sync e-Rx to Suwasiri App** + save consult); MediLanka send moves them to Issued Medical History
- [x] GP Care issued medical certificates sync to that patient’s Suwasiri **Vault → Medical certificates** (view / download / email). LankaLab portal sync removed from certificate history.
- [x] Suwasiri Vault **Sync Lanka GP Care** sends **vaccine history only** to the GP Care vaccination log (not medicines, labs, or notes)
- [x] Profile: accounts menu (My Profile, Account Settings, Billing & Plans, Help Center, Dark Mode, Switch Account for family)
- [x] Family Switch Account: Sakuni / Denuk full patient parity (clinic, video, vault, vaccines, billing) under Chamidu login; household Firestore rules deployed
- [x] Profile: family members can edit details like main applicant; dark mode uses black backgrounds + white text
- [x] Home search bar removed; video consult 5‑min reminder + notification; Call Answer for GP Care ringing; Vault Previous Medical History folders; unique family member profiles
- [x] Previous medical photos: tap to view + pinch zoom; Switch Account opens member profile; appointments/vaccines write member patientName for GP Care
- [x] Home doctor bookings (clinic + video) hide 1 hour after slot; Call page dual pane patient|doctor; works per family switch
- [x] GP Care Clinical Calculators: search registered patient, click name for current details, edit/save; history reloads in the suite
- [x] Recalls & Reminders live on Receptionist / Front Desk; SMS/email via registered phone/email; completing a recall drops the active count (e.g. 5 → 4)
- [x] Reception **Book scheduler appointment slot**: drag working doctors, sage dates, coral times, 6‑month window; in-person → Suwasiri Home **blue** card, video → **purple** card; doctor + receptionist calendars show the name on that date
- [x] Patient Clinical Records lives on Receptionist & Front Desk; Unique Health ID **Sync to Portal** loads the live Suwasiri file, then **Save to Patient Clinical Records** adds it to this clinic. App new-patient registration at the clinic also appears on that list.
- [x] **Check walk-in availability** uses the same sage/coral 6‑month scheduler; if the session is full, reception can add up to 5 walk-ins at the end of the list; Lobby ⬆️⬇️ reorders the queue
- [x] Telehealth right rail is the clinical consultation room (not Active GP room); View Clinical Hub opens history and syncs to that patient’s Suwasiri file
- [x] Telehealth e-Rx: view, download, and print after medicines are issued; still writes Suwasiri Call E-Prescription
- [x] Unique Health ID Sync to Portal is clinic-scoped. Lookup/save uses that person’s Unique Health ID and name (Manel stays Manel; household members who share an email are not merged). Never save the Auth placeholder “Patient”.
- [x] Platform Console / Practice Manager: medical centre **logo** and doctor **photo** (add / change / remove) sync to Suwasiri booking. Practice Manager add/remove doctors appear or disappear on Staff & Practitioners. MBS items mapped to medical certificate / repeat prescription / review results / video consultation publish to Firestore `clinic_fee_schedules` (including `global`). Home and booking show **only that private fee**. Purple Auto-Select Mon–Fri removed from weekly rosters.
- [x] Reception **Delete** / **Block** on Patient Clinical Records needs a comment and is sent to **Operations & Governance** (Platform Console) as a notification. Super Admin approves or rejects there. The file stays until approved.
- [x] Receipts & Invoices: **Cash Settle** on booked (and issued) invoices writes a clinic bill and Firestore `paymentStatus: SETTLED` / `paymentMethod: Cash` so status shows **Settled**. Suwasiri app card/debit or manual bank slip writes `paidBySuwasiri` so status shows **Paid by Suwasiri App**. Reception clicks a PDF or photo slip to view it. Age and gender sit under the patient name on Lobby, Patient Clinical Records, Unique Health ID sync, and invoices (from the clinic file or the booking).
- [x] Sample Dispatch Hub delete with yes/no confirm; Team Secure Chat is shared by all clinic staff
- [x] Telehealth: day’s video bookings only; click name → Active Clinical Consultation Room; Call start from 2 minutes before the slot
- [x] Telehealth e-Rx matches GP Exam Room (formulary + Sinhala meal timing); attached prescription image removed
- [x] Recalls: complete a recall drops All Active and category counts and persists
- [x] Receipts & Invoices: month calendar filters to that day’s booked patients; view/download Suwasiri slips
- [x] Platform Console: click hospital to add doctor/receptionist/nurse/staff (linked to Practice Manager, RBAC, login)
- [x] Practice Manager: weekly roster days and hours, editable after save
- [x] Security & RBAC: Super Admin assigns staff to other branches
- [x] Clinical audit trail: consult/lab activity + medicines/labs inspector + month calendar
- [x] Formulary Select hides that drug from recommendations (exam room + telehealth)
- [x] Sample Collections: full specimen categories + receptionist PATHOLOGY_ORDER alert + Sample Dispatch Hub
- [x] Clinical calculators save vitals/details onto that patient’s visit history
- [x] Telehealth: click booked name fills Active Clinical Consultation Room (replaces generic “Patient”); View Clinical Hub opens that file
- [x] Receipts & Invoices: calendar date lists that day’s booked patients; the billing panel scrolls; unpaid invoices are highlighted (amber / overdue red) and listed first
- [x] Platform Console: new medical centre + doctor (with specialty) sync to Suwasiri Doctors (`clinic_centers` / `clinic_doctors`). Patients search clinic or doctor name, then book available vs booked times. **Remove (resigned)** deletes the doctor from GP Care and hides them on Suwasiri.
- [x] Doctor Dashboard: Appointments / Waiting / Telehealth colourful cards stay on the doctor page (do not open receptionist Lobby); Completed Consultations uses a matching green gradient; Pathology, Recalls, Documents, Clinical Alerts, Lobby Active Queue, and Check In removed
- [x] GP Exam Room: Clinical Record tabs (Summary through Billing) sit under the patient name; View Clinical Hub banner and vitals-notes box removed; e-Rx panel kept below
- [x] GP Exam Room: colourful left-nav boxes (no Summary / Medications / My Health Record); click opens that section on the right; allergies and other file updates show under the patient name and persist; doctor can book from Appointments onto the clinic calendar
- [x] GP Exam Room: clicked booking name (e.g. Chamidu) is shown on the file; Consultation is first (drag-drop reorder); Medical History + Diagnoses live inside Consultation; SOAP reason comes from the Suwasiri booking; consult/calculator/diagnosis writes Date, Issued doctor, Medical clinic; Copilot Advisor and Known Sensitivities panels removed
- [x] GP Exam Room: Insert Calculator Score and pink calculator rail removed; Clinical Calculators sit in the teal header corner; SOAP uses stacked click-to-scroll boxes (no Quick Template); Observations & BMI left-nav removed; Pathology/Imaging have history + request; Documents/Referrals print-email-phone; referral sample templates; appointment booking includes payment method
- [x] GP Exam Room: Consultation encounter line is the current booking (date, time, reason); modality and fee stay as booked; Medical History Appointment link lists previous dates/times and loads that visit’s SOAP; Billing removed from left nav; clinical pane is height-capped through Appointments with inner scroll
- [x] GP Exam Room: Consultation SOAP is Subjective + Diagnoses (writes to Medical History) + Plan; Assessment and Objective note boxes removed
- [x] Suwasiri Doctors: HotDoc-style flow — category → **Practices** list (inline tomorrow slots) → clinic hub → doctor profile → existing/new patient → booking checkout (available + booked times, GP Care Firestore sync)
- [x] New patient at clinic: 6-section registration questionnaire (EN/SI/TA) before booking; saves to Firestore `users.clinicRegistrations` + `healthIntake`; syncs vaccines, allergies, pathology & imaging to GP Care
- [x] Booking checkout: Pay at counter, Online Debit/Card, and Manual Bank Slip (receipt photo) sync to GP Care invoices; available times include today and Practice Manager roster hours
- [x] Suwasiri CTAs use liquid pill buttons in trust blue
- [x] Doctor Dashboard: cyan round **Clinical Shift Checklist** is draggable; the side-column checklist card was removed
- [x] GP Care sidebar: **AI Clinical Suite** (Medical Scribe / Executive Summary / Clinical Assistant) and the standalone **Clinical Calculators** page removed; calculators remain in the GP Exam Room header
- [x] GP Care e-prescription view: doctor **digital signature** + **SLMC digital stamp** (exam room seal and telehealth view/print)
- [x] Doctor portal patient names show a highlighted **sex · age** badge underneath (Dashboard, GP Exam Room, Pathology, Documents, Telehealth)
- [x] Clinical Shift Checklist FAB only on doctor portal tabs (Dashboard, GP Exam Room, Pathology, Telehealth)
- [x] Document Management sidebar page removed; **Add document** (Scan / Drag and drop / Browse) lives on the patient profile **Documents** section
- [x] Doctor Dashboard: **GP Exam Room (Standby)** shortcut removed
- [x] Pathology page: colourful **Unread Pathology** card only (critical / unreviewed / total KPI cards and the Test / Investigation Profile chip strip removed; order-modal investigation dropdown kept)
- [x] Pathology: **Inspect Full Record** removed; **View** opens the report; **Completed** files it under exam-room Pathology history and syncs to Suwasiri Vault Lab reports; **Critical / Alert** red-flags the patient and notifies Front Desk Recalls (Call + in-person / video rebook)
- [x] Pathology & Diagnoses seeds unread sample reports (6 clinic patients: TSH/FBC, ACR, CRP/Dengue, HbA1c, LFT, Troponin/U&E) so the unread inbox is populated
- [x] Telehealth: video consult name opens the exam-room **patient profile** beside the call (Consultation SOAP + clinical sections); **Live Consultation Notes** removed; the profile pane has its own scrollbar so the video stays still
- [x] Telehealth lists **today’s video consults for that doctor** under the Virtual Exam Room heading; a patient file opens only after clicking a name in that list; if there is no video appointment, no profile is shown
- [x] Doctor Dashboard: queue place cannot be changed (no ⬆️⬇️ / Manage Places); Record overlay removed from the queue; **Completed** finishes a consult and writes SOAP/diagnoses/meds/docs onto that patient’s profile (the extra completed-patient list under the green card is removed — those visits stay in the appointment queue)
- [x] Lobby Patient queue is a scrollable list; reception **Up / Down** changes that patient’s place (saved as `queuePlace`); no #1 / #2 / #3 place dropdown; **Check In Now** shows **Waiting in lobby** plus **Call to GP Exam Room** (status only — does not open the exam room); **Active Exam Room** is a status label only; reception cannot open the patient clinical profile from Lobby, Patient Clinical Records, Unique Health ID sync, or Sample Dispatch File ID
- [x] Sample Dispatch Hub: **Register my name** removed; **Delivered** still opens courier Sample Collections + Documents only (no Open clinical profile for reception)
- [x] GP Exam Room Pathology history: **View** report + **Save note** on each filed result
- [x] Super Admin / clinicians click a name on Patient Clinical Records to open the GP Exam Room profile (reception still cannot)
- [x] Platform Console **Operations & Governance**: add employees and **Remove (resigned)**
- [x] Practice Manager MBS & Private Fees: inline edit, add MBS item, bulk-billable column removed
- [x] Security & RBAC: Super Admin can edit MFA / password / session / backup / retention; light colourful tabs
- [x] Reports & Analytics: month calendar; This Month / Last Quarter / YTD 2026 filters the results panel; export Excel, Notepad, PDF; click a date for collected, outstanding, invoices, and completed consults
- [x] GP Exam Room **Appointments**: during a consult the doctor books a follow-up on **their own** available/booked times (other clinic doctors are hidden). Confirm writes Firestore `appointments` for that Suwasiri patient (Home **blue** / **purple**) **and** the clinic appointment store so reception / doctor calendars show the name on that date. Works when the signed-in clinician is not in the published doctor roster.
- [x] GP Exam Room **Allergies**: doctor can **add, edit, and delete** each allergy (or **Clear all** → NKDA). Saves on the clinic file and Suwasiri Unique Health ID (clinicAllergies; empty delete does not fall back to old intake allergies)
- [x] GP Exam Room Consultation is one **Doctor notes** field (Subjective, medical issues this visit, and Plan & Management removed)
- [x] Reception Recalls & Reminders In person / Video book writes Firestore `appointments` for that Suwasiri patient (Home **blue** / **purple**) and shows on the GP Care calendar that date
- [x] Booked vs available times stay in sync under each doctor: Suwasiri Doctors booking, GP Care **Book Active Appointment**, exam-room **Appointments**, and Lobby **Check walk-in availability**. Catalog **Dr. Chamidu Rathnayake** (`d-chamidu-rathnayake`) and Platform Console **Dr. Chamidu Kaushal Rathnayake** (`d-chamidu-kaushal-rathnayake`) are the same clinician — Denuk’s 6 Sep 2026 slot shows as **Booked** for that doctor on GP Care and as **BOOKED** when Sakuni (or anyone) opens the same doctor/day in the app. Clicking a doctor name shows that grid immediately (not hidden behind slot-sync). Lobby **Book Appointment** removed — book from Book Active Appointment or the patient file.
- [x] Unique Health ID: receptionist **Sync to Portal** loads the live Suwasiri file; **Save to Patient Clinical Records** writes that file onto this clinic’s Patient Clinical Records list (name, age, gender, NIC, labs, vaccines). New-patient registration in the Suwasiri app (`clinic_patient_registrations`) also creates that clinic file automatically.
- [x] GP Care **Patient Portal** removed (patients use the Suwasiri app; unmatched Firebase emails are blocked from the clinic EMR)

## In progress / next

- [ ] Confirm Auth providers enabled in Console: Email/Password, Google
- [ ] Create Firestore DB indexes if queries fail (esp. `notifications` `orderBy timestamp`)
- [ ] Seed or empty-state UX when vault/appointments are empty (no demo seed in Firebase mode)
- [ ] Real Firebase Phone Auth (replace synthetic email OTP)
- [ ] Google Sign-In: add Android SHA-1/SHA-256 in Firebase Console
- [ ] FCM push (`firebase_messaging` is in pubspec, not wired in UI yet)
- [ ] Firebase Storage for vault file uploads (`fileUrl`)
- [ ] Tighten `notifications` rules to owner-scoped (`userId == auth.uid`)
- [ ] Deploy updated `firestore.rules` (vault **read** for Unique Health ID lab sync + GP Care immunisations + allergy merge + `clinic_centers`) if not already: `firebase deploy --only firestore:rules`
- [ ] Telehealth/Call: live WebRTC to GP Care is wired (STUN); a TURN server may be needed on some mobile networks
- [ ] Web + mobile sync: appointments (including **payment status / bank slips** and **patientAge / patientGender**), Unique Health ID lookup, telehealth notes/chat, e-Rx, medical certificates, clinical calculator snapshots, GP Care–published `clinic_doctors`, **exam-room consult notes / immunisations / allergies / pathology / imaging / certificates**, and GP Care–issued e-Rx (Vault vs Call by session) are on Firestore; Vault → GP Care sync is **vaccine history only**. Remaining GP EMR charts still use the web JSON store. Tenancy/RBAC is in the web JSON store; tenancy collections are documented, not deployed.

## Known caveats

1. **Phone OTP** still accepts code `123456` and creates/signs in via `$phone@phone.suwasiri.lk`.
2. **Clinics / doctors / vaccine protocols** are curated in-code lists plus Firestore `clinic_doctors` published from GP Care Platform Console.
3. **Widget tests** must use `AppServices.forTesting`, not `bootstrap()`.
4. PowerShell may need `firebase.cmd` if script policy blocks `firebase.ps1`.
5. Bank-slip PDFs need Storage rules live: `firebase deploy --only storage`.

## Doc map

| File | Purpose |
|------|---------|
| [FIREBASE.md](FIREBASE.md) | Project IDs, collections, CLI commands |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Code layout, where to change things |
| [ROADMAP.md](ROADMAP.md) | Prioritized upcoming work |
| [NEXT.md](NEXT.md) | Ordered next implementation (Auth Console, tenancy Firestore, clinical sync) |
| [WEB.md](WEB.md) | GP Care web app (`web/`), run commands, mobile/web sync |
| [../README.md](../README.md) | How to run the apps |
