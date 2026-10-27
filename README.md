<p align="center"><img src="assets/brand/logo.png" alt="EMT TentCare" width="300"></p>

<h1 align="center">EMT TentCare</h1>

<p align="center">
  Patient flow for a six-tent emergency field hospital, built to keep working when the internet doesn't.<br>
  <a href="https://mahassira.github.io/emergency-field-hospital/"><b>Live demo</b></a> ·
  <a href="docs/EMT-TentCare-User-Guide.pdf">User guide (PDF)</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

---

## Why I built this

I worked with International Medical Corps (IMC) at its field hospital in Gaza, which first opened in January 2024. In the first days of any field hospital the same problems come back: paper files get lost between tents, doctors don't know if a result is back, nobody can say how many ward beds are free, managers count patients by hand for donors and the Health Cluster, and the internet keeps dropping.

Field hospitals will keep being set up in emergencies and conflict zones, often within days and with weak or no internet. They need a system that is ready on day one, works online and offline, and is prepared before the crisis rather than built during it. A ready system also gives donors and management the numbers they ask for, without extra work for the clinical team.

EMT TentCare is a working demo of that system: one patient file that follows the person from the registration tent to the ward, and a clear picture of the whole hospital for the site manager.

## Try the demo

Open the [live demo](https://mahassira.github.io/emergency-field-hospital/) and sign in with any of these accounts. The password for all of them is `demo123`.

| Work email | Role | What to try |
| --- | --- | --- |
| `reception@emttentcare.com` | Registration clerk | Register a patient, use the WHO triage criteria, start mass casualty mode |
| `doctor@emttentcare.com` | Doctor | Queue, ABCDE primary survey, assessment, tests, referral, discharge |
| `lab@emttentcare.com` | Lab & X-ray | Enter results that go straight back to the patient's file |
| `nurse@emttentcare.com` | Ward nurse | 50-bed ward map, receive patients, reassess, confirm departures |
| `admin@emttentcare.com` | Site manager | Dashboard, staff attendance, export everything to Excel |

All patients and staff are fictional. The demo saves everything on your own device and does not connect to any server. Please do not enter real patient data.

<p align="center"><img src="docs/images/screen-dashboard.png" alt="Site manager dashboard" width="820"></p>

## What it does

**Registration and triage**
- One file per patient, with a file number (FH-0026) and a printable wristband.
- Allergy status (unknown, none known, or the allergy), vital signs with checks for impossible or unusual values.
- High-risk red signs and high-risk trauma from the WHO trauma form suggest the triage colour. Choosing a lower colour is recorded as clinical judgement.
- Returning patients keep their file number and get a new visit (FH-0004-V2).
- Mass casualty mode: three taps per patient, temporary IDs (MCI-001), a red banner for all staff, and "Identify patient" later.

**Clinical care**
- Tent queues sorted by triage colour and waiting time.
- ABCDE primary survey with GCS, FAST and mechanism of injury.
- Medication and procedures recorded with time, with an allergy warning.
- Reassessment that can raise the triage colour.
- Lab and X-ray requests with results sent back to the file.

**Moving patients**
- Referral between tents needs the receiving tent to accept the patient.
- Ward admission reserves a bed until the nurse confirms arrival; beds go to cleaning after a patient leaves.
- Referral to another hospital in SBAR format with the 13-point WHO transfer checklist, a printable referral sheet, arrival status and counter-referral.
- Discharge in two steps: the doctor approves, the nurse or doctor confirms the patient has actually left.

**Management**
- Live dashboard, staff and patient attendance, follow-up visits.
- Excel export built in the browser, so it works offline.
- In-app feedback form for people trying the demo.

<p align="center"><img src="docs/images/screen-patient-file.png" alt="Patient file" width="820"></p>

<p align="center"><img src="docs/images/screen-er-phone.png" alt="Emergency queue on a phone" width="280"> &nbsp; <img src="docs/images/screen-attendance-phone.png" alt="Attendance on a phone" width="280"></p>

## Clinical forms

The referral, transfer and trauma forms follow the [WHO Emergency Care Toolkit](https://www.who.int/teams/integrated-health-services/clinical-services-and-systems/emergency-and-critical-care/emergency-care-toolkit). EMT TentCare is not an official WHO tool and is not endorsed by WHO or IMC. The triage rules and forms should be reviewed by an organisation's clinical leads before any real use.

## Works offline

The first time the link is opened, a service worker saves the app on the device. After that it opens and works with no connection, and it can be installed like an app (Add to Home Screen). In the demo, data stays in the browser on that device.

## The real version: Microsoft 365

<p align="center"><img src="docs/images/ms-power-platform.jpg" alt="Microsoft Power Platform" width="640"></p>

The full version is designed to run entirely inside the organisation's own Microsoft 365 tenant. Nothing sits on an outside server.

- **Sign-in with work accounts** (Microsoft Entra ID), two-step sign-in, and access that ends when someone leaves.
- **Security roles in Dataverse** decide who does what. A lab technician can enter results but cannot discharge a patient.
- **Every action is recorded** against the staff member's work email, giving a complete audit trail.
- **Offline on phones and tablets** with Power Apps, syncing to Dataverse when the connection returns.

<p align="center"><img src="docs/images/ms-add-user.jpg" alt="Adding a user to the environment" width="320"> &nbsp; <img src="docs/images/ms-security-roles.jpg" alt="Assigning security roles" width="320"></p>

| Microsoft app | What it does in TentCare |
| --- | --- |
| Power Apps | The app staff use on phones, tablets and computers |
| Dataverse | Patients, visits, tests, beds, staff, attendance and the activity log |
| Power Automate | Alerts, escalation of unanswered calls, reminders and daily reports |
| Outlook and Teams | Notifications to staff, without patient details |
| SharePoint | X-ray images, referral letters and scanned documents |
| Power BI | Dashboards for management and M&E, with totals only |
| Intune and Purview | Device protection, sensitivity labels, audit and retention |

Chapter 22 of the [user guide](docs/EMT-TentCare-User-Guide.pdf) covers the build, security and monitoring and evaluation in detail.

<p align="center"><img src="docs/images/ms-connectors.jpg" alt="Microsoft connectors" width="640"></p>

## Project structure

```
index.html              the whole app: screens, styles and logic in one file
sw.js                   service worker for offline use
manifest.webmanifest    install as an app
assets/brand/           logo and tent mark
assets/icons/           app and browser icons
docs/                   user guide (PDF) and screenshots
tests/                  end-to-end tests (Playwright)
fluent/                 redirect kept for an older link
```

## Running it locally

No build step and no dependencies for the app itself.

```bash
git clone https://github.com/Mahassira/emergency-field-hospital.git
cd emergency-field-hospital
npm start            # serves the folder at http://localhost:8080
```

## Tests

The tests open the app in a real browser at phone, tablet and computer sizes and walk through registration, triage, assessment, referral, ward and discharge.

```bash
npm install
npx playwright install chromium
npm test
```

## Roadmap

- Build the real version in Power Apps and Dataverse, starting with registration, queues and the patient file.
- Official patient messages (calls, SBAR handover, critical results) with email alerts and an emergency alert for all staff.
- Arabic interface.
- A clinical review of the WHO-based forms by the organisation's doctors.
- A field pilot with 5 to 10 staff, including offline use.

## Privacy

The demo stores data only in your browser. It counts visits anonymously with Cloudflare Web Analytics, without cookies or personal data. Feedback is only sent if you choose to send it from your own email.

## Author

**Mohammed Abu Hassira**
mahassira@outlook.com · [github.com/Mahassira](https://github.com/Mahassira)

Feedback and ideas are welcome, either through the feedback button in the demo or by email.

## License

© 2026 Mahassira. All rights reserved. See [LICENSE](LICENSE). Demo only: not a medical device and not for real patient care.
