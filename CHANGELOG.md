# Changelog

All notable changes to EMT TentCare. Dates are when the change went live on the demo.

## 2.0.0 · 30 October 2026
Patient safety and clinical modules, after a review against WHO standards for emergency medical teams.

**Patient safety**
- NEWS2 early warning score (simplified paediatric score for children) on every set of vital signs, with an observation chart and the next observation time.
- Alerts centre: early warning, critical results, disease alerts, low stock and protection follow-up. Alerts need acknowledgement with the action taken; response times are measured.
- Prescribing with weight-based child doses, maximum dose, allergy, pregnancy and interaction checks. Medication chart with due and overdue doses and a wristband identity check before each dose.
- Critical lab results with read-back.
- Assessment history: amendments keep the earlier version and the reason.
- Photo and identifying features for unidentified patients; unaccompanied children flagged.

**Clinical modules**
- WHO Surgical Safety Checklist with consent and the operation record.
- Partograph, delivery record with PPH check, and newborn files linked to the mother.
- Nutrition classification from MUAC and oedema.
- ICD-10 codes that suggest the WHO MDS item.
- Disease alerts (EWARN) with isolation, and MDS item 52 ticked automatically.
- Blood transfusion record with a second checker and an ABO/Rh compatibility stop.
- Death record following the WHO medical certificate of cause of death.
- Confidential protection record with logged access.

**Management and security**
- Indicators (M&E) with definitions, and Excel download.
- DHIS2 import file for the MDS report.
- Pharmacy stock with automatic use, low-stock and expiry alerts.
- Audit log and screen lock after 10 minutes.
- Patient file actions grouped (Assess, Treat, Tests, Move and discharge, Records) and a section index for long files.

## 1.5.0 · 27 October 2026
- WHO EMT Minimum Data Set (MDS) daily report for the site manager, built from the patient files: items by age group, daily summary, needs and risks, team details.
- MDS coding section in the clinical assessment form.
- Report downloads as Excel or CSV, prints, and opens an email to the coordination cell.
- Sign-in page: role boxes at the top with short instructions for phone and computer; choosing a role fills in the account and the button says who you will sign in as.
- Compact sign-in page on phones: smaller logo, short role buttons, and the demo notes folded under "About this demo", so everything fits on one screen.
- New TentCare logo, tent mark and app icons.

## 1.4.0 · 27 October 2026
- Feedback form for people trying the demo, sent by email.
- Anonymous visit counts with Cloudflare Web Analytics (no cookies).
- Tidied the repository: `assets/` for icons and branding, `docs/` for the user guide and screenshots, end-to-end tests in `tests/`.

## 1.3.0 · 21–22 October 2026
Clinical forms based on the WHO Emergency Care Toolkit.
- ABCDE primary survey with GCS and FAST, medication and procedure record with allergy warnings, reassessment.
- WHO triage criteria (high-risk red signs and high-risk trauma), dead on arrival, mass casualty mode with temporary IDs.
- Referral to another hospital (SBAR, transfer checklist, printable sheet, arrival status, counter-referral).
- Handover between tents, reserved ward beds and bed cleaning.

## 1.2.0 · 20–21 October 2026
- Microsoft Fluent look as the main design.
- Work-email style demo accounts.
- Review fixes: allergy status, vital sign checks, returning patients (new visit on the same file), discharge approval and confirmed departure.
- Copyright notice and license.

## 1.1.0 · 16 October 2026
- Full patient record, staff and patient attendance, sidebar layout on large screens.
- Mobile redesign with an app bar, More menu and patient action bar.
- New logo and app icons. Excel export instead of JSON.

## 1.0.0 · 15 October 2026
- First version: registration and triage, six tents, lab and X-ray, 50-bed ward, discharge, offline use.
