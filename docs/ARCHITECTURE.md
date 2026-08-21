# Architecture

This repo holds **two apps** developed in parallel:

| App | Path | Stack |
|-----|------|--------|
| **Mobile (Suwasiri)** | repo root (`lib/`, `android/`, `ios/`) | Flutter + Cubit/BLoC |
| **Web (Sri Lankan GP Care)** | [`web/`](../web/) | React 19 + Vite + Express + Tailwind — **do not change this stack** |

The web app currently uses a local JSON store + Gemini for most EMR charts. **Appointments, e-prescriptions, vaccinations, and telehealth signaling** now use the same Firebase project (`suwasiri-91824`). GP Care → app: e-Rx. App → GP Care: vaccine history only. See [WEB.md](WEB.md).

Do not change Flutter/mobile code unless explicitly asked.

## Mobile layout

```
lib/
  main.dart                 # bootstrap → SuwasiriApp
  firebase_options.dart     # platform FirebaseOptions (suwasiri-91824)
  core/
    constants/app_constants.dart   # useDemoBackend MUST stay false
    theme/
  bloc/                     # AuthCubit, LocaleCubit, NotificationCubit, SosCubit, VaccineCubit, VaultCubit, ScheduleCubit
  data/
    models/                 # UserProfile, VaultReport, Appointment, …
    repositories/
      auth_repository.dart           # interface
      firebase_auth_repository.dart  # production
      demo_auth_repository.dart      # tests only
      health_repository.dart
      firebase_health_repository.dart
      demo_health_repository.dart
    services/
      app_services.dart     # bootstrap() → Firebase; forTesting() → demo
      sos_service.dart
  localization/
  ui/                       # screens by feature
```

## Dependency direction

```
UI → Cubits → AuthRepository / HealthRepository → Firebase / Demo
```

Never call Firestore/Auth from widgets. Add methods on the repository interface, implement in Firebase repo, then expose via the existing Cubit (or a new one).

## Bootstrap

1. `main()` → `AppServices.bootstrap()`
2. If `useDemoBackend == false` (production): `Firebase.initializeApp` + Firebase repos
3. Providers: `AppServices`, `HealthRepository`, feature Cubits
4. Routes: `/` splash → onboarding → auth → register-profile → `/main`

## Adding a feature (checklist)

1. Model in `lib/data/models/` (+ `toMap` / `fromMap` if persisted)
2. Method on `HealthRepository` or `AuthRepository`
3. Implement in `Firebase*Repository` (and demo only if tests need it)
4. Update `firestore.rules` if new collection/fields need ACL → deploy
5. Cubit state + UI
6. Note progress in `docs/STATUS.md` and `docs/ROADMAP.md`

## Auth profile completeness

`UserProfile.isProfileComplete` gates NIC + DOB + blood group + mandatory health questionnaire
(basic identity + safety fields). First login routes to `HealthIntakeScreen` (`/register-profile`).
Questionnaire labels are EN / Sinhala / Tamil via `HealthIntakeL10n` (follows app locale).
Stable `barcodeNumber` is generated once from uid + NIC and shown on Profile Unique Health ID card.

## Home / Call schedule

`ScheduleCubit` holds live appointments. Home **blue** card = latest in-person (`ConsultMode.clinic`) booking; Home **purple** card and Call = latest video (`ConsultMode.video`) booking. Each new checkout replaces that mode’s card via `bookedAt` + `recordBooking`.

Home **green** card lists **every** confirmed vaccine booking still in its calendar day (`ScheduleState.upcomingVaccines`) in a **single** section. No bookings → the green section is hidden. After checkout, `recordVaccineBooking` updates Home immediately.

Clinic, video, and vaccine Home cards stay visible until **local midnight after the booking date** (e.g. 21 Aug 10:30 → hides at 22 Aug 00:00), then drop off automatically.

## Childhood EPI reminders

For patients under 10, `VaccineCatalog.protocolsFor` builds Sri Lanka EPI due dates from `UserProfile.effectiveDateOfBirth` (calendar months from birth). Upcoming and recently overdue doses appear on the Vaccines tab as protocol reminders. Ages 10+ keep the adult/travel protocol list. Booked doses are marked scheduled when the immunization name matches.

## Vault AI Lab

`LabAssistantReplies.review` builds a **monolingual** explanation of the open lab report (Sinhala only, English only, or Tamil only). Vault chips `explain by Sinhala Language` / `explain by English language` / `explain by Tamil language` pick the language. Recommended catalog doctors are tappable and open `showBookingCheckoutFlow`.

## Localization

`AppLocalizations` + `LocaleCubit` (EN / Sinhala / Tamil). New UI strings go through localization, not hard-coded English-only if user-facing.

## Web layout

Exact copy of the GP Care clinic portal. Do not rename packages, swap Vite/React/Express, or rewrite the UI.

```
web/
  src/
    App.tsx                 # clinic dashboard + session (hospital/branch/role)
    tenancy.ts              # hospitals, branches, role templates, memberships
    types.ts                # includes Hospital, Branch, RoleDefinition, StaffMembership
    components/             # hubs, Security & RBAC, Practice Manager, Platform console
    sync/                   # Firestore: appointments, e-Rx, patient chart, telehealth WebRTC
    utils/
  server.ts                 # Express + Vite + Gemini; patient_store.json + /api/tenancy/*
  package.json
```
