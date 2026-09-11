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
3. Telehealth/Call: GP Care doctor start sets `status: ringing`; Suwasiri shows Answer + local/remote video; 5‑min video reminder via ScheduleCubit
4. Vault: Previous Medical History folders (gallery/camera + notes) per family patient id
4. Live PharmaCloud / MediLanka handoff (in-repo portal at `pharmacloud/` — still mock; later Firestore `prescriptions`)
5. Payment tokens → real gateway if required

## P3 — product polish

1. Offline persistence (`FirebaseFirestore.enablePersistence` / cache settings)
2. Crashlytics / Analytics
3. CI: `flutter test` + analyze on PR
4. App Store / Play listing assets
5. Home empty-state polish when no appointments (currently soft card)

## Parallel web (GP Care)

Keep `web/` as the exact React/Vite/Express clinic portal. Do not change Flutter unless asked.

1. Document mapping of web models → Firestore collections ([WEB.md](WEB.md)) — tenancy collections listed in [FIREBASE.md](FIREBASE.md)
2. Wire web `server.ts` / client to Firebase Auth + Firestore (`suwasiri-91824`) without changing the UI framework
3. Shared appointments (live): Suwasiri App bookings show as **booked times** under that doctor on GP Care **Book Active Appointment**, including when the app catalog id and the Platform Console slug differ (Chamidu Rathnayake / Chamidu Kaushal Rathnayake). Receptionist Book scheduler writes clinic/video slots to the same `appointments` collection (Home blue/purple). Receipts **Cash Settle** / app pay / bank-slip PDFs and **age/gender under the name** sync on those appointments. Remaining GP EMR charts still use the web JSON store.
4. Role-aware access: Platform Super Admin can open every web module; Hospital Super Admin same within a tenant; committed RBAC hides staff nav. Mobile stays patient-only.

## Parallel web (LankaLab)

Keep `lankalab/` as the exact React/Vite/Express lab portal. Do not change Flutter or GP Care (`web/`) unless asked. Do not edit `Downloads/lankalab-portal`.

1. Copy is in-repo; Gemini AI analyze / consult / parse-report still use `server.ts` + mock orders
2. Local URL is **http://localhost:3001** (GP Care stays on **3000**; PharmaCloud on **3002**)
3. Sample Dispatch bags from GP Care **Collected** / **Delivered** (driver, phone, vials, vehicle, clinic) show on Transit Logistics Clinic Sample Collection Log. Remaining: Unique Health ID barcode lookup, `vault` lab-report push — [LANKALAB.md](LANKALAB.md)

## Parallel web (PharmaCloud)

Keep `pharmacloud/` as the exact React/Vite/Express pharmacy gateway. Do not change Flutter, GP Care (`web/`), or LankaLab (`lankalab/`) unless asked. Do not edit `Downloads/sri-lanka-pharmacloud`.

1. Copy is in-repo; Gemini medication-analysis / refill SMS still use `server.ts` + mock inventory and e-Rx
2. Local URL is **http://localhost:3002** (GP Care **3000**, LankaLab **3001**)
3. Later (when asked): live Firestore `prescriptions` inbox, Unique Health ID / allergy check, dispense → Suwasiri Issued Medical History — [PHARMACLOUD.md](PHARMACLOUD.md)

## Do not regress

- Do not set `AppConstants.useDemoBackend = true` for shipping builds
- Do not call Firebase from UI widgets
- Keep package id `com.thepatientcare.suwasiri` in sync with Firebase apps
