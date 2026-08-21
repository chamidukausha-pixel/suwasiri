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
| `users` | profile map (`name`, `email`, `NIC`, `bloodGroup`, `barcodeNumber`, `healthIntake`, …) | `users/{uid}` = auth uid |
| `vault` | `patientId`, `title`, `issuedBy`, `date`, `metrics` | household: `uid` or `uid_*` |
| `vaccinations` | `patientId`, facility, `slot`, `status`, `vaccineName`, `bookedAt` | write if household patient |
| `appointments` | `patientId`, doctor fields, `timeSlot`, `date`, `time`, `token`, `consultMode` (`clinic` / `video`), `hospital`, `hospitalId`, `branchId`, `patientName`, `source` (`suwasiri_app`), `bookedAt` | create: household; **read: any signed-in** (GP Care staff); update: household or staff |
| `prescriptions` | `patientId`, `medicine`, `schedule`, `doseBadge`, `sessionId`, `sentToPharmacare` (MediLanka portal flag), `clinicName`, `doctor`, `code`, `source` (`gp_care` when issued from GP Care) | read/create: signed-in (staff issue + patient read); update: household or staff |
| `sos_sessions` | `patientId`, lat/lng, `accuracyMeters`, `address`, `shareLiveGps`, `active` | owner write; readable when `shareLiveGps` |
| `notifications` | `title`, `body`, `timestamp`, `type`, `read` | any signed-in (tighten later) |
| `telehealth_sessions` | WebRTC offer/answer + `ice_doctor` / `ice_patient` ICE candidates | any signed-in (patient app + GP Care doctor) |

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
- [ ] (Optional) Storage bucket rules when uploads land
