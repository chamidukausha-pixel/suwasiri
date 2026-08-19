# Suwasiri

Sri Lankan digital health companion ù **Flutter** (iOS & Android) plus the **Sri Lankan GP Care** web clinic portal, both in this repo, on **Firebase**.

## Run

```bash
flutter pub get
flutter run
```

Backend is Firebase (`AppConstants.useDemoBackend = false`). Project: **suwasiri-91824**.

Config files (already in repo):

- `lib/firebase_options.dart`
- `android/app/google-services.json`
- `ios/Runner/GoogleService-Info.plist`

### Auth

- Email / password ù Firebase Auth
- Google ù Firebase + Google Sign-In (add SHA-1 in Console for Android)
- Phone ù temporary OTP `123456` until Phone Auth is wired

Enable **Email/Password** and **Google** under Authentication in the [Firebase Console](https://console.firebase.google.com/project/suwasiri-91824/authentication/providers).

### Firestore rules

```bash
firebase use suwasiri
firebase deploy --only firestore:rules
```

### Web (GP Care clinic portal)

Exact copy of the React / Vite / Express app. Stack stays as-is.

```powershell
cd web
npm install
copy .env.example .env.local
npm run dev
```

See [docs/WEB.md](docs/WEB.md).

## Project docs (source of truth for continuing work)

| Doc | Use |
|-----|-----|
| [docs/STATUS.md](docs/STATUS.md) | What's done / in progress ù **update as you work** |
| [docs/FIREBASE.md](docs/FIREBASE.md) | Project IDs, collections, CLI |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Code map & how to extend |
| [docs/WEB.md](docs/WEB.md) | GP Care web app and mobile/web sync |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Prioritized next features |

## Architecture

```
lib/              # Flutter mobile (do not change unless asked)
  bloc/           # Cubits
  core/           # Theme, constants
  data/           # Models, Firebase repositories, SOS
  localization/   # EN / Sinhala / Tamil
  ui/             # Screens & widgets
web/              # GP Care clinic portal (React + Vite + Express)
```

## Features

- Splash + onboarding + auth (email / OTP / Google)
- Home dashboard, language pill, notifications, SOS 1990
- MOH vaccine hub, health vault + biometrics, telehealth UI
- Doctor appointments, Firestore-backed user health data
