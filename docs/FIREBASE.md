# Firebase — Suwasiri

## Project

| Field | Value |
|-------|--------|
| Display name | Suwasiri |
| Project ID | `suwasiri-91824` |
| Project number | `900720308322` |
| Console | https://console.firebase.google.com/project/suwasiri-91824 |
| Alias (CLI) | `suwasiri` (see `.firebaserc`) |
| Storage bucket | `suwasiri-91824.firebasestorage.app` |

## Apps

| Platform | App ID | Config file |
|----------|--------|-------------|
| Android | `1:900720308322:android:b8f00a226b5317ed7f613b` | `android/app/google-services.json` |
| iOS | `1:900720308322:ios:c0ad7813f5c27b387f613b` | `ios/Runner/GoogleService-Info.plist` |
| Web (GP Care) | `1:900720308322:web:6874ced939987e6d7f613b` | `web/src/firebase.ts` + `VITE_FIREBASE_*` |

Dart options: `lib/firebase_options.dart`

## Auth (enable in Console)

1. Authentication → Sign-in method
2. Enable **Email/Password**
3. Enable **Google** (add support email; add Android SHA-1 for device builds)

### App auth behavior

| Method | Implementation |
|--------|----------------|
| Email register / sign-in | Firebase Auth email+password + `users/{uid}` profile |
| Google | `google_sign_in` → Firebase credential |
| Phone | Temporary: OTP `123456` → synthetic email account |

## Firestore collections

Aligned with `firestore.rules` and `FirebaseHealthRepository` / `FirebaseAuthRepository`:

| Collection | Key fields | Owner rule |
|------------|------------|------------|
| `users` | profile map (`name`, `email`, `NIC`, `bloodGroup`, `barcodeNumber`, `healthIntake`, `clinicAllergies`, …) | **read: any signed-in** (GP Care Unique Health ID lookup); write: owner uid **or household** (`{uid}_wife` / `{uid}_child`); **staff update** of `clinicAllergies` / `healthIntake.importantAllergies` so allergies show under the name on Suwasiri Profile |
| `vault` | `patientId`, `title`, `issuedBy`, `date`, `metrics`, `kind` (`lab`), `category` (`Pathology` / `Imaging`), `source` (`gp_care` when a GP files pathology or imaging) | **read: any signed-in** (patient Vault + GP Care Unique Health ID sync of previous lab reports); **create: any signed-in** (GP Care staff write reviewed lab **and imaging** reports so they appear on Suwasiri **Vault → Lab reports**) |
| `vaccinations` | `patientId`, facility, `slot`, `status`, `vaccineName`, `bookedAt`, `recordType` (`booking` / `history`), `source` (`suwasiri_app` / `gp_care`) | household write for bookings; **GP Care staff create/update** when `source == 'gp_care'` (exam-room immunisations → Vault **Vaccine history**); **read: any signed-in** |
| `appointments` | `patientId`, doctor fields, `timeSlot`, `date`, `time`, `token`, `consultMode` (`clinic` / `video`), `hospital`, `hospitalId`, `branchId`, `patientName`, `patientAge`, `patientGender`, `source` (`suwasiri_app` / `gp_care`), `bookedAt`, `queuePlace`, `paymentStatus` (`PENDING` / `PAID` / `SETTLED`), `paymentMethod`, `paidBySuwasiri`, `suwasiriReceiptUrl` (bank-slip download URL) | create: household or GP Care; **read: any signed-in**; update: household or staff |
| `appointment_slots` | Deterministic id `{doctorId}_{yyyy-MM-dd}_{HH-mm}` — locks one doctor+datetime so app and GP Care cannot double-book | read: signed-in; create if missing |
| `clinical_calculations` | One doc per `patientId`: latest vitals + `clinicalCalculations[]` + `observationsHistory[]` from GP Care Clinical Decision Calculators Suite | read/write: any signed-in (doctor save + reopen history) |
| `prescriptions` | `patientId`, `medicine`, `schedule`, `doseBadge`, `sessionId`, `sentToPharmacare` (MediLanka portal flag), `clinicName`, `doctor`, `code`, `source` (`gp_care` when issued from GP Care) | read/create: signed-in (staff issue + patient read); update: household or staff |
| `medical_certificates` | `patientId`, `patientName`, `title`, `doctor`, `body`, `certificateNo`, `source` (`gp_care`) | read/create: signed-in; update: household or staff. App Vault filters by the active patient’s `patientId` |
| `sos_sessions` | `patientId`, lat/lng, `accuracyMeters`, `address`, `shareLiveGps`, `active` | owner write; readable when `shareLiveGps` |
| `notifications` | `title`, `body`, `timestamp`, `type`, `read` | any signed-in (tighten later) |
| `telehealth_sessions` | WebRTC offer/answer + `ice_doctor` / `ice_patient` ICE candidates; subcollection `messages` (in-call chat) | any signed-in (patient app + GP Care doctor) |
| `consultation_notes` | `patientId`, `patientName`, `doctor`, `clinicName`, `title`, `body`, `date`, `appointmentId`, `source` (`gp_care`) | read/create: signed-in; update/delete: household or same patientId. Suwasiri Call + Vault treatment notes + GP Care history |
| `clinic_doctors` | `name`, `specialty` (matches DoctorCatalog categories, e.g. Cardiologist), `hospital`, `address`, `region` (Sri Lankan district), `rosterHours`, `hospitalId`, `branchId`, `active`, `staffId`, `source` (`gp_care`) | signed-in read/write. GP Care Platform Console / Practice Manager publish doctors so the Suwasiri Doctors tab can search by name, clinic, and district |
| `clinic_centers` | `name`, `region`, `address`, `hospitalId`, `active`, `source` (`gp_care`) | signed-in read/write. New medical centres created in Platform Console appear in Suwasiri until doctors are added |
| `clinic_patient_registrations` | `patientId`, `patientName`, `hospitalId`, `hospitalName`, `branchId`, `registration` (full intake form), `source` (`suwasiri_app`) | household write; signed-in read. GP Care **Patient Clinical Records** creates a clinic file from this intake |

## Firebase Storage

| Path | Use | Rule |
|------|-----|------|
| `appointment_receipts/{fileName}` | Manual bank-slip PDF or photo from Suwasiri checkout; GP Care Receipts & Invoices opens the download URL | signed-in read/write; max 8 MB (`storage.rules`) |

Deploy: `firebase deploy --only storage`

## Planned tenancy collections (web RBAC — not deployed yet)

Add these when the GP Care web app is wired to Firebase. Do **not** change the shape of existing `users/{uid}` patient profiles; only add collections and `hospitalId` on clinical docs.

| Collection | Key fields | Rule sketch |
|------------|------------|-------------|
| `hospitals/{hospitalId}` | `name`, `status` (`ACTIVE` / `SUSPENDED`) | Platform Super Admin create/suspend; members read |
| `branches/{branchId}` | `hospitalId`, `name`, `address`, `rooms[]` | Hospital Super Admin of that hospital |
| `roles/{roleId}` | `hospitalId`, `name`, `isSystem`, `enabled`, 16 permission flags | Hospital Super Admin of that hospital |
| `memberships/{id}` | `userId`, `hospitalId`, `roleId`, `branchIds[]`, `active` | `hospitalId` must match an active membership of `auth.uid` |

Clinical collections (`appointments`, `prescriptions`, `vault`, `vaccinations`) should gain `hospitalId`. Staff queries: membership contains hospital. Patient mobile app uses **household** patient ids: main applicant `auth.uid`, family members `{uid}_wife` / `{uid}_child` / … (see `isHouseholdPatient` in `firestore.rules`). SOS stays on the main applicant uid only.

## Family profiles (mobile)

Switch Account on Profile keeps one Firebase Auth session (Chamidu) and swaps the active patient profile. Bookings, video consults, vault, vaccines, and billing use that profile’s `patientId` so Sakuni and Denuk each get a full account under the same login.

## CLI (Windows)

PATH should include:

- `C:\Users\HP\AppData\Roaming\npm`
- `C:\Users\HP\AppData\Local\Pub\Cache\bin`

```powershell
firebase use suwasiri
firebase deploy --only firestore:rules
firebase apps:list --project suwasiri-91824
```

If `firebase` hits a `.ps1` execution-policy error, use `firebase.cmd`.

## Required Console checklist after clone

- [ ] Email/Password auth on
- [ ] Google auth on + SHA fingerprints
- [ ] Firestore database created (rules already deployable)
- [ ] (Optional) Storage bucket rules when uploads land (`firebase deploy --only storage` for bank-slip PDFs)
