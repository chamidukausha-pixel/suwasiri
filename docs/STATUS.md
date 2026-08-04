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

## In progress / next

- [ ] Confirm Auth providers enabled in Console: Email/Password, Google
- [ ] Create Firestore DB indexes if queries fail (esp. `notifications` `orderBy timestamp`)
- [ ] Seed or empty-state UX when vault/appointments are empty (no demo seed in Firebase mode)
- [ ] Real Firebase Phone Auth (replace synthetic email OTP)
- [ ] Google Sign-In: add Android SHA-1/SHA-256 in Firebase Console
- [ ] FCM push (`firebase_messaging` is in pubspec, not wired in UI yet)
- [ ] Firebase Storage for vault file uploads (`fileUrl`)
- [ ] Tighten `notifications` rules to owner-scoped (`userId == auth.uid`)
- [ ] Telehealth: still simulated UI — needs real backend later

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
| [../README.md](../README.md) | How to run the app |
