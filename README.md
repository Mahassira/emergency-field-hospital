<p align="center"><img src="logo.png" alt="EMT TentCare" width="320"></p>

# EMT TentCare

Emergency medical tents: know every patient's status. A patient flow system for a six-tent field hospital, built to keep working when the internet doesn't.

**Try it:** https://mahassira.github.io/emergency-field-hospital/

I worked in Gaza with International Medical Corps when we set up a field hospital during the war. This is a demo of the kind of system I wish we'd had from day one: one patient file that follows the person from the registration tent to the ward.

## Demo accounts

All passwords are `demo123`.

| Work email | Role | What to try |
| --- | --- | --- |
| `reception@emttentcare.com` | Registration clerk | Register a patient, pick a triage colour, send them to a tent |
| `doctor@emttentcare.com` | Physician | See the queue, fill in the clinical assessment, order an X-ray, refer, admit, approve discharge |
| `lab@emttentcare.com` | Lab & X-ray | Enter results that go straight back to the patient's file |
| `nurse@emttentcare.com` | Ward nurse | 50-bed ward map, vitals and nursing notes, confirm a patient has left |
| `admin@emttentcare.com` | Site manager | Dashboard for the whole hospital, staff attendance, export everything to Excel |

## The tents

1. Registration & Triage
2. Emergency
3. Outpatient Clinics
4. Maternity & Delivery
5. Operating Theatre
6. Inpatient Ward (50 beds)

Plus a Lab & X-ray unit that serves all of them.

## The patient file

<p align="center"><img src="docs/screen-patient-file.png" alt="Patient file" width="820"></p>

One file per patient, filled in by each tent along the way:

- **Registration and vitals:** admission date, name, age, gender (including pregnant), condition, allergies, blood pressure, heart rate, respiratory rate, oxygen saturation, temperature, height, weight and MUAC.
- **Clinical assessment:** history, system examined, physical findings, diagnosis, emergency category (trauma, medical, obstetric and so on), sexual and reproductive health services, medication given on site, procedures, blood transfusion and the patient's response.
- **Lab and imaging:** tests and X-ray or ultrasound requests, with results sent back to the file.
- **Outcome:** visit outcome, medication to take home, referral and referral note, outcome note and a follow-up date.
- **Care team:** assigned doctor, assigned tent and bed, and when the file was last updated.

## Referral and handover

Based on the WHO Emergency Care Toolkit (Acute Referral Form, Acute Transfer Checklist and Counter-Referral Form). This is not an official WHO form.

- **Between tents:** a patient sent to another tent shows as "Not yet accepted" until a doctor there presses **Accept patient**. An admission reserves a bed, and the ward confirms with **Patient arrived on ward**.
- **To another facility:** the doctor fills the referral in SBAR order with an ABCDE check, precautions and the 13-item transfer checklist. Any unticked item gives a warning to contact a senior clinician. The form prints as one sheet that goes with the patient.
- **After the transfer:** record when the patient left, the arrival time and status (Stable, Unstable, Dead), then the counter-referral from the receiving facility.
- **Ward beds:** a bed goes to "Cleaning" when a patient leaves, and the nurse marks it ready. The Excel export has an "External referrals" sheet.

## Triage and mass casualties

- **Triage criteria:** the registration form lists the high-risk red signs and high-risk trauma from the WHO trauma form (Emergency Care Toolkit). Any red sign suggests Red, and any high-risk trauma suggests at least Yellow. An adult pulse under 50 or over 150 ticks its sign automatically. Choosing a lower colour gives a warning, and if the clerk keeps it, the file records it as clinical judgement.
- **Dead on arrival** is a triage choice. The patient is recorded but not sent to a tent.
- **Mass casualty mode:** reception or admin starts it with an incident name. Every user then sees a red banner with counts by colour. Registration drops to triage colour, sex and age group. Each patient gets a temporary ID (MCI-001…), and Red and Yellow go to Emergency, Green to Outpatients. Staff can find the patient by the temporary ID and press **Identify patient** later. The file number stays the same.
- New visit outcomes: **Left without being seen** and **Died**.

## Emergency assessment

- **Primary survey (ABCDE):** the doctor records A to E, plus FAST ultrasound and the mechanism and intent of injury, following the WHO trauma form. Each letter must be ticked Normal or have a finding. GCS is added up as you type; GCS 8 or less, low glucose or a positive FAST give a warning. The latest survey shows in the patient file and fills the ABCDE part of an external referral.
- **Medication or procedure given:** drug, dose, route and time, or a procedure and time. If the drug matches a known allergy (including penicillin-type antibiotics), or allergies are not yet known, a warning appears first.
- **Reassess:** the doctor or ward nurse records Improving / The same / Worse, vital signs, AVPU, pain score and the triage colour now. "Worse" without a higher colour gives a warning.
- The discharge form shows the vital signs at disposition. The Excel export has sheets for primary surveys, medication and procedures, and reassessments.

## Attendance

<p align="center"><img src="docs/screen-attendance-phone.png" alt="Attendance on a phone" width="300"> &nbsp; <img src="docs/screen-er-phone.png" alt="Emergency queue on a phone" width="300"></p>

- **Staff:** doctors, nurses, midwives, lab staff, registration and support staff check in and out of their shift. The registration desk and the site manager see at a glance who is on duty, who arrived late, who is absent and who is on leave.
- **Patients:** who is in each tent right now, and which follow-up visits were attended or missed.

## Runs inside the Microsoft 365 environment

<p align="center"><img src="docs/ms-power-platform.jpg" alt="Microsoft Power Platform" width="640"></p>

The full version is designed to run entirely inside the hospital's or organisation's own Microsoft 365 work environment. Nothing sits on an outside server: the app, the data and the reports all live in the organisation's own tenant, alongside the Microsoft tools staff already use.

**Sign in with the work email.** Staff use their Microsoft work account (Microsoft Entra ID). No separate usernames or passwords, and access ends automatically when someone leaves the organisation. Only people the IT team adds to the environment can open the app.

<p align="center"><img src="docs/ms-add-user.jpg" alt="Adding a user to the environment" width="320"> &nbsp; <img src="docs/ms-security-roles.jpg" alt="Assigning security roles" width="320"></p>

**Security roles decide who does what.** Registration, doctor, lab, nurse and site manager are security roles in Microsoft Dataverse. A lab technician can enter results but cannot discharge a patient, and the manager sees everything.

**Every action recorded against a work email.** Each registration, assessment, test, referral, admission, discharge and staff check-in is stamped with the staff member's organisational email, so the patient file and the attendance record are a complete audit trail.

**Connected to the core Microsoft apps.**

<p align="center"><img src="docs/ms-connectors.jpg" alt="Microsoft connectors" width="640"></p>

| Microsoft app | What it does in TentCare |
| --- | --- |
| Dataverse | Database for patients, tests, beds, staff, attendance and the activity log |
| Outlook | Emails referral letters, follow-up reminders and the daily summary |
| Teams | Alerts the ward when a bed is needed or a red case arrives |
| SharePoint | Stores scanned documents, consent forms and X-ray images |
| Excel | Exports for the health cluster and donor reports |
| Power BI | Live dashboards for management: patients, beds, outcomes, staff attendance |
| Power Automate | Runs the alerts, reminders and approvals between them |
| Office 365 Users | Pulls each staff member's name, job title and manager from the directory |

**Still offline-first.** Tablets and phones keep working with no internet and sync to Dataverse when the connection comes back.

The live demo link above does not connect to Microsoft services. It saves everything on your own device.

<p align="center"><img src="docs/screen-dashboard.png" alt="Site manager dashboard" width="820"></p>

## Offline

It installs on a phone or tablet like an app ("Add to Home Screen") and keeps working with no connection. Everything is saved on the device. In a real deployment, the export would sync to a central server when the network comes back.

## Built with

Plain HTML, CSS and JavaScript, a service worker for offline use.

---

Demo only. Every patient and staff member is fictional. Not a medical device, and not for real patient care.

© 2026 Mahassira. All rights reserved.
