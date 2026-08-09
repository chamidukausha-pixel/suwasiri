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
| `users` | profile map (`name`, `email`, `NIC`, …) | `users/{uid}` = auth uid |
| `vault` | `patientId`, `title`, `issuedBy`, `date`, `metrics` | `patientId == uid` |
| `vaccinations` | `patientId`, facility, `slot`, `status` | write if `patientId == uid` |
| `appointments` | `patientId`, doctor fields, `timeSlot`, `token` | `patientId == uid` |
| `prescriptions` | `patientId`, `medicine`, `schedule`, `doseBadge`, `sessionId`, `sentToPharmacare` (MediLanka portal flag), `clinicName`, `issuedAt` | `patientId == uid` |
| `sos_sessions` | `patientId`, lat/lng, `accuracyMeters`, `address`, `shareLiveGps`, `active` | owner write; readable when `shareLiveGps` |
| `notifications` | `title`, `body`, `timestamp`, `type`, `read` | any signed-in (tighten later) |

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
