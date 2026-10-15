# Emergency Field Hospital

A patient flow system for a six-tent field hospital, built to keep working when the internet doesn't.

**Try it:** https://mahassira.github.io/emergency-field-hospital/

I worked in Gaza with International Medical Corps when we set up a field hospital during the war. This is a demo of the kind of system I wish we'd had from day one: one patient file that follows the person from the registration tent to the ward.

## Demo accounts

All passwords are `demo123`.

| Username | Role | What to try |
| --- | --- | --- |
| `reception` | Registration clerk | Register a patient, pick a triage colour, send them to a tent |
| `doctor` | Physician | See the queue, write a note, order an X-ray, refer, admit |
| `lab` | Lab & X-ray | Enter results that go straight back to the patient's file |
| `nurse` | Ward nurse | 50-bed ward map, discharge patients |
| `admin` | Site manager | Dashboard for the whole hospital |

## The tents

1. Registration & Triage
2. Emergency
3. Outpatient Clinics
4. Maternity & Delivery
5. Operating Theatre
6. Inpatient Ward (50 beds)

Plus a Lab & X-ray unit that serves all of them.

## Offline

It installs on a phone or tablet like an app ("Add to Home Screen") and keeps working with no connection. Everything is saved on the device. In a real deployment, the export would sync to a central server when the network comes back.

## Built with

Plain HTML, CSS and JavaScript, a service worker for offline use, and AI-assisted development (Claude).

---

Demo only. Every patient and staff member is fictional. Not a medical device, and not for real patient care.
