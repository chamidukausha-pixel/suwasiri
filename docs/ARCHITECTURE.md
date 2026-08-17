# Architecture

Flutter app with Cubit/BLoC UI and repository backends.

## Layout

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

## Localization

`AppLocalizations` + `LocaleCubit` (EN / Sinhala / Tamil). New UI strings go through localization, not hard-coded English-only if user-facing.
