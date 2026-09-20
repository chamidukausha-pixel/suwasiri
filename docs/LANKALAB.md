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

**NEW BILLS** sits next to **LankaLab Portal / Colombo Central Patholab** in the top bar (not beside Sign out). It opens the full-width registration form. The English **Medical tests** table (abbreviation / full form / purpose — no Sinhala) is used to pick assays such as CBC, HbA1c, LFT, KFT, ECG. **Create** opens the printable case bill (investigations, discount, amount in words, Print / PDF / WhatsApp). **Ratelist** is a full editable price list. After Create, the registered patient is listed on **Electronic Result Delivery**. The lab person clicks **Enter results** on that row; the sheet shows every parameter for the selected tests with **unit** and **reference range**, same as the current CBC / KFT entry. **Final** / **Sign off** then move the case to **Operations Overview → Active Lab Orders** and leave the Result Delivery list.

**Lab**, **Finance & Invoices**, **Manage**, and **Settings** are collapsed in the sidebar until you click the main item; subsections then drop down (only one of those menus is open at a time).

**Operations Overview** shows a live analog + digital clock (hours, minutes, seconds, and the date) under the Sign out / profile area.

**Today's reports** has a **month calendar** on the right. Click a date to list that day’s **ongoing** and **completed** reports (date and time on each row). **View** opens the **lab report only** (no bill or payment). From that preview the lab person can **Email doctor** to send the report to the referring clinician. Search by **last name** to list every matching person with first name, or by **date of birth** to list everyone born that day — both searches show all matching reports across dates with date and time. **App** syncs it to that patient’s Suwasiri Vault → Lab reports.

**Today's reports → Enter results** opens the haematology / biochemistry result sheet (CBC with absolute counts, KFT, creatinine interpretations). Differential leukocyte **absolute counts** fill automatically: **Absolute (×10³/µL) = TLC (cumm) × % ÷ 100 ÷ 1000**. NLR = neutrophils % ÷ lymphocytes %. **Save only** keeps the case In progress. **Final** opens the printable report extract (patient header, barcode/QR, haematology table, editable **Interpretations**). **Sign off** marks it **Completed** and opens **Operations Overview → Active Lab Orders**.

**Finance & Invoices** is a sidebar dropdown: **Invoices**, plus Business items (**Daily Business**, Expenses, Due Report, Activities, Referral Business, Business Analysis, Data Export).

**Settings** is a sidebar dropdown: **Lab settings**, **Clinical Trials Portal**, and **GP & Mobile Sync**. **Urgent Live Alerts** is removed from the sidebar.

Daily Business has a **month calendar** on the right. Click a date to see that day’s **total income**, **collection charges**, expenses, net, bills, and **completed reports**. Completing a result (Enter results / Completed) lands that case on the completion date with payment. **View report** shows the bill plus entered results.

**Manage** is a sidebar dropdown: **Employee login** (Active / Blocked list, New employee form, Existing employee, Configure permissions), **Doctor access**, **Employee** directory, **Diagnofy**, and **Browser security**. Edits persist in this browser.

GP Care stays on **http://localhost:3000**. PharmaCloud runs on **http://localhost:3002**. All three can run at the same time. LankaLab Vite HMR uses port **24679** so it does not collide with GP Care (**24678**) or PharmaCloud (**24680**).

## Current backend

LankaLab is **not** fully on Firebase yet. Orders live in `src/data/mockData.ts`. Gemini endpoints are in `server.ts`.

**Live GP Care bags:** Sample Dispatch **Issue** / **Delivered** details (driver, phone, vials, vehicle, lab, issued person, issued date, clinic) appear on **Transit Logistics Monitor → Clinic Sample Collection Log (Central LIS)** in the same card layout. Polls GP Care `http://localhost:3000/api/lankalab-clinic-collections` and also listens to Firestore `clinic_sample_dispatches`.

**Critical → GP Care:** On **Lab Operations Dashboard**, **PENDING** (blue) and **PROCESSING** (green) are colour cards (Critical and Completed KPI cards are removed). Sidebar sections use the same red / green / blue palette. **Active Lab Orders** lists **completed** assays only (no pending count chip). Pending and processing work stays on **Lab → Today's reports**. A technician **Critical** button on a row posts to GP Care `POST /api/lankalab-result-sync` (or `POST /api/lankalab-critical`), opens that patient’s GP Care profile (`http://localhost:3000/?openPatient=…&critical=1`), and marks the chart **red** (`criticalAlert`). If the name is not on file yet, GP Care creates the clinic file. Optional Firestore `clinic_critical_alerts` updates an already-open GP Care session.

**Active Lab Orders actions:** Download and print the report; **Clinic** syncs the result to the requesting GP Care centre (e.g. PrimeCare Medical Centre); **App** writes each selected test into that patient’s Suwasiri **Vault → Lab reports** under the test name (matched by Unique Health ID); **Critical** opens the GP Care file in red under the patient name; **email** and **phone / SMS** share the report (required when critical).

**Settings → Lab settings** holds connected practice software, Colombo Central Patholab, printers, and finance rules. **Settings → Clinical Trials Portal** and **Settings → GP & Mobile Sync** keep the full existing screens. **Electronic Result Delivery** lists registered (not yet completed) patients from **New bills**, with colourful names and the Unique Health ID on the specimen line. Medway wording and Standard / Private / Confidential / Cumulative tabs are removed. **Enter results** opens the result sheet; after **Final** / **Sign off** that case leaves this list and appears on **Operations Overview → Active Lab Orders**. Supplementary add-on tests were removed from Result Delivery.

**Completed on Operations Overview** (and the same Complete / Validate Assay actions) syncs the report to the requesting GP Care medical centre and opens an SMS to that patient’s phone number.
