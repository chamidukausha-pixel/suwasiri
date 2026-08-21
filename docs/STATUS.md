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
- [x] Video consults appear in GP Care Telehealth from slot time; doctor + patient join a live WebRTC call (app camera/mic ↔ browser camera/mic)
- [x] Suwasiri bookings show the real patient name on GP Care (Chamidu / Sakuni / family member)
- [x] GP Care issued e-Rx syncs to Suwasiri Vault E-Prescription and Call E-Prescription; MediLanka send moves them to Issued Medical History
- [x] Profile: accounts menu (My Profile, Account Settings, Billing & Plans, Help Center, Dark Mode, Switch Account for family)
- [x] Family Switch Account: Sakuni / Denuk full patient parity (clinic, video, vault, vaccines, billing) under Chamidu login; household Firestore rules deployed

## In progress / next

- [ ] Confirm Auth providers enabled in Console: Email/Password, Google
- [ ] Create Firestore DB indexes if queries fail (esp. `notifications` `orderBy timestamp`)
- [ ] Seed or empty-state UX when vault/appointments are empty (no demo seed in Firebase mode)
- [ ] Real Firebase Phone Auth (replace synthetic email OTP)
- [ ] Google Sign-In: add Android SHA-1/SHA-256 in Firebase Console
- [ ] FCM push (`firebase_messaging` is in pubspec, not wired in UI yet)
- [ ] Firebase Storage for vault file uploads (`fileUrl`)
- [ ] Tighten `notifications` rules to owner-scoped (`userId == auth.uid`)
- [ ] Telehealth/Call: live WebRTC to GP Care is wired (STUN); a TURN server may be needed on some mobile networks
- [ ] Web + mobile sync: appointments + telehealth signaling are on shared Firestore; remaining clinical charts still use the web JSON store. Tenancy/RBAC is in the web JSON store; tenancy collections are documented, not deployed.

## Known caveats

1. **Phone OTP** still accepts code `123456` and creates/signs in via `$phone@phone.suwasiri.lk`.
2. **Clinics / doctors / vaccine protocols** are curated in-code lists, not Firestore collections.
3. **Widget tests** must use `AppServices.forTesting`, not `bootstrap()`.
4. PowerShell may need `firebase.cmd` if script policy blocks `firebase.ps1`.

## Doc map

| File | Purpose |
|------|---------|
| [FIREBASE.md](FIREBASE.md) | Project IDs, collections, CLI commands |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Code layout, where to change things |
| [ROADMAP.md](ROADMAP.md) | Prioritized upcoming work |
| [NEXT.md](NEXT.md) | Ordered next implementation (Auth Console, tenancy Firestore, clinical sync) |
| [WEB.md](WEB.md) | GP Care web app (`web/`), run commands, mobile/web sync |
| [../README.md](../README.md) | How to run the apps |
