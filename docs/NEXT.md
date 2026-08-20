# What to implement next

Ordered after **web Firebase Auth** (same project as mobile: `suwasiri-91824`). Do not change Flutter unless asked. Keep the web stack (React + Vite + Express).

## 0. Finish Auth Console (required for login to work)

Web app **Suwasiri GP Care** is already registered (`1:900720308322:web:6874ced939987e6d7f613b`). Still do:

1. Enable **Email/Password** and **Google** under Authentication → Sign-in method.
2. Auth → Settings → **Authorized domains**: keep `localhost`; add the production host later.
3. Create staff accounts (Console → Users, or **Register** on the GP Care login) with these emails:

| Email | Role |
|-------|------|
| `chamidukausha@gmail.com` | Platform Super Admin |
| `nimal.fernando@suwasiri.lk` | Platform Super Admin (seed) |
| `manager@primecare.lk` | Hospital Super Admin (PrimeCare) |
| `dr.silva@primecare.lk` | Doctor (PrimeCare + Southern Coast) |
| `reception@primecare.lk` | Receptionist (Colombo) |
| `admin@southerncoast.lk` | Hospital Super Admin (Southern) |

A Firebase user **without** a matching staff email only gets the **Patient Portal** (same `users/{uid}` profile as mobile).

---

## 1. Staff invitations (next product slice)

Hospital Super Admin should create staff without sharing a demo password list:

- Invite by email → membership + role + branches
- First login binds `memberships.userId` to Firebase `uid`
- Disable / reassign staff
- Stop treating seed emails as the only way to get EMR access

## 2. Firestore tenancy (replace `patient_store.json` for roles)

Add collections (already sketched in [FIREBASE.md](FIREBASE.md)):

- `hospitals`, `branches`, `roles`, `memberships`
- Update `firestore.rules`: caller’s membership `hospitalId` must match; Platform Super Admin only for tenant create/suspend
- Do **not** change mobile `users/{uid}` shape — only add collections

## 3. Hospital-scoped clinical data on Firestore

Move GP EMR charts off the Express JSON store:

- Tag `appointments`, `prescriptions`, vault/labs, vaccinations with `hospitalId` (+ `branchId`)
- Staff read/write inside their hospital; Hospital A cannot read Hospital B
- Keep mobile owner rules (`patientId == auth.uid`) for the patient companion
- Same person can be a patient on mobile and staff on web (different membership vs personal vault)

## 4. Tighten Auth

- Real **Phone Auth** (replace OTP `123456` / synthetic `*@phone.suwasiri.lk`) on web **and** mobile together
- Google: Web authorized domains + Android SHA-1/SHA-256 (mobile)
- Custom claims or `platformRole` on a staff profile doc (so Platform Super Admin is not email-list based)

## 5. Then product functions (web EMR, still this stack)

1. Persist RBAC/custom roles in Firestore (already in the UI)
2. Live appointments / queue per branch — **Suwasiri App bookings already sync** to the GP Care calendar and Telehealth room
3. e-Rx + vault/labs shared with the mobile patient
4. Telehealth: in-app / in-browser WebRTC is wired (TURN if calls fail behind strict NAT)
5. Billing isolation per hospital/branch
6. Firebase Storage for documents / lab PDFs
7. FCM for recalls and appointment reminders

## 6. Do not do

- Do not rewrite web as Flutter web or Next.js
- Do not merge the two UIs
