# Roadmap

Prioritized next work. Move items to **Done** in [STATUS.md](STATUS.md) when shipped.

## P0 — unblock real users

1. Enable **Email/Password** (+ **Google**) in Firebase Auth Console
2. Add Android **SHA-1 / SHA-256** for Google Sign-In debug/release keystores
3. Empty states for vault / appointments when Firestore has no docs
4. Owner-scoped **notifications** rules (`userId` field + rules)

## P1 — harden Firebase data

1. Composite indexes as Console prompts them (notifications by timestamp; vault by patientId+date)
2. Seed optional starter vault docs on first profile complete (or keep empty)
3. Move clinic/doctor catalogs to Firestore (optional admin collection)
4. Wire `firebase_messaging` for vaccine / appointment reminders

## P2 — replace simulations

1. Real Phone Auth (Firebase) instead of OTP `123456`
2. Vault PDF/image upload via Firebase Storage
3. Telehealth/Call: real signaling / video provider (e-Rx formal form + PharmaCare handoff already in UI)
4. Live PharmaCare API (replace notification-only portal handoff)
5. Payment tokens → real gateway if required

## P3 — product polish

1. Offline persistence (`FirebaseFirestore.enablePersistence` / cache settings)
2. Crashlytics / Analytics
3. CI: `flutter test` + analyze on PR
4. App Store / Play listing assets
5. Home empty-state polish when no appointments (currently soft card)

## Do not regress

- Do not set `AppConstants.useDemoBackend = true` for shipping builds
- Do not call Firebase from UI widgets
- Keep package id `com.thepatientcare.suwasiri` in sync with Firebase apps
