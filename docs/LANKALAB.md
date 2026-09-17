# Web — LankaLab Portal

Clinical diagnostics / lab dashboard that runs **in parallel** with the Flutter mobile app, the GP Care clinic portal, and PharmaCloud. Source was copied from `Downloads/lankalab-portal` into [`lankalab/`](../lankalab/). The original Downloads folder is **not** edited.

## Constraints

- Keep the **exact same** stack: React 19, Vite, Express (`server.ts`), Tailwind 4, `@google/genai`, `motion`.
- Do not migrate to Next.js, Flutter web, or another framework.
- Do **not** change Flutter/mobile (`lib/`), GP Care (`web/`), or PharmaCloud (`pharmacloud/`) unless explicitly asked.

## Run

From `lankalab/`:

```powershell
cd lankalab
npm install
copy .env.example .env.local
# set GEMINI_API_KEY in .env.local
npm run dev
```

App URL: **http://localhost:3001** (Express + Vite from `server.ts`).

**NEW BILLS** opens the full-width registration form. **Create** opens the printable case bill (investigations, discount, amount in words, Print / PDF / WhatsApp). **Ratelist** is a full editable price list.

**Lab**, **Business**, and **Manage** are collapsed in the sidebar until you click the main item; subsections then drop down (only one of those three is open at a time).

**Today's reports → Enter results** opens the haematology / biochemistry result sheet (CBC with absolute counts, KFT, creatinine interpretations). Differential leukocyte **absolute counts** fill automatically: **Absolute (×10³/µL) = TLC (cumm) × % ÷ 100 ÷ 1000**. NLR = neutrophils % ÷ lymphocytes %. **Save only** keeps the case In progress. **Final** opens the printable report extract (patient header, barcode/QR, haematology table, editable **Interpretations**). **Sign off** marks it **Completed** and opens **Operations Overview → Active Lab Orders**.

**Business** remains a separate dropdown: Daily Business, Expenses, Due Report, Activities, Referral Business, Business Analysis, Data Export.

Daily Business totals and tables follow the **selected date** (previous/next arrows, date picker, or **Previous day bills**). The amount column ends with a running total. **View bill** opens a printable pathology bill (investigations, paid in words, Print / PDF / WhatsApp).

**Manage** is a sidebar dropdown: **Employee login** (Active / Blocked list, New employee form, Existing employee, Configure permissions), **Doctor access**, **Employee** directory, **Diagnofy**, and **Browser security**. Edits persist in this browser.

GP Care stays on **http://localhost:3000**. PharmaCloud runs on **http://localhost:3002**. All three can run at the same time. LankaLab Vite HMR uses port **24679** so it does not collide with GP Care (**24678**) or PharmaCloud (**24680**).

## Current backend

LankaLab is **not** fully on Firebase yet. Orders live in `src/data/mockData.ts`. Gemini endpoints are in `server.ts`.

**Live GP Care bags:** Sample Dispatch **Issue** / **Delivered** details (driver, phone, vials, vehicle, lab, issued person, issued date, clinic) appear on **Transit Logistics Monitor → Clinic Sample Collection Log (Central LIS)** in the same card layout. Polls GP Care `http://localhost:3000/api/lankalab-clinic-collections` and also listens to Firestore `clinic_sample_dispatches`.

**Critical → GP Care:** On **Lab Operations Dashboard**, **PENDING TESTS** (amber), **SAMPLES IN TRANSIT** (teal), and **COMPLETED TESTS** (green) are colour cards. **Active Lab Orders** lists **completed** assays only. Pending, processing, and critical work stays on **Lab → Today's reports**. A technician **Critical** button posts to GP Care `POST /api/lankalab-result-sync` (or `POST /api/lankalab-critical`), opens that patient’s GP Care profile (`http://localhost:3000/?openPatient=…&critical=1`), and marks the chart **red** (`criticalAlert`). If the name is not on file yet, GP Care creates the clinic file. Optional Firestore `clinic_critical_alerts` updates an already-open GP Care session.

**Active Lab Orders actions:** Download and print the report; **Clinic** syncs the result to the requesting GP Care centre (e.g. PrimeCare Medical Centre); if the report is **not** critical, **App** writes Suwasiri **Vault → Lab reports**; **Critical** opens the GP Care file in red under the patient name; **email** and **phone / SMS** share the report (required when critical).

**Settings** holds connected practice software, Colombo Central Patholab, printers, and finance rules. **Electronic Result Delivery → Completed** marks that assay complete, removes **only that completed** result from the delivery worklist, and opens **Operations Overview → Active Lab Orders**. Supplementary add-on tests were removed from Result Delivery.

**Completed on Operations Overview** (and the same Complete / Validate Assay actions) syncs the report to the requesting GP Care medical centre and opens an SMS to that patient’s phone number.
