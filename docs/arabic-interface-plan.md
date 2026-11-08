# Arabic interface: plan for the Microsoft 365 version

The demo already has this Arabic interface (version 2.1.0, `i18n/ar.js`). This plan describes how the same approach carries over to the Microsoft 365 version.

Staff can use EMT TentCare in Arabic or English. Each person chooses their language. The data underneath is always stored in English, so reports, exports and indicators are the same whatever language was used to enter them.

## 1. What is translated and what stays in English

| Type | Example | Stored as | Shown as |
| --- | --- | --- | --- |
| Interface text | Buttons, titles, instructions, error messages | Not stored | The user's language |
| Values chosen from a list | Triage colour, visit outcome, route, sex, emergency category | A fixed English code (for example `red`, `Died`) | Translated on screen (Red → أحمر) |
| Free text | History, notes, a diagnosis typed by hand | As typed | As typed, never translated |
| International medical terms | NEWS2, PEWS, APGAR, GCS, SBAR, ICD-10 codes, drug names | English | English, with a short Arabic explanation next to it |
| Reports and exports | Excel export, WHO EMT MDS report, DHIS2 file, indicators | English | Always English, for WHO, the Health Cluster and donors |

The key rule: the system never stores "أحمر". It stores `red` and shows it in the reader's language.

### Medical terms: English with an Arabic explanation

The term stays exactly as staff learn it in training and in WHO material. The Arabic text explains it; it does not replace it.

| On screen (Arabic interface) |
| --- |
| NEWS2 7 · مؤشر الإنذار المبكر |
| APGAR 9 · تقييم حالة المولود |
| Paracetamol 1 g IV · كل 6 ساعات |
| ICD-10 J18.9 · التهاب رئوي |
| SBAR · ملخص الحالة للتسليم |

Drug names, doses, units and routes are never translated, to avoid errors when a dose is read out or checked against a box.

## 2. Patient name in Arabic

- A new optional field, **Name in Arabic**, next to the English name on registration and on "Identify patient".
- The English name stays required. It is used on the wristband barcode, in exports and in referral letters.
- Search finds a patient by either name.
- The patient header shows both names: the English name first, the Arabic name under it.

## 3. Referral form in English and Arabic

The printed referral to another facility (SBAR and the 13-point WHO transfer checklist) is printed in both languages:

- Every heading and label in English and Arabic side by side (English on the left, Arabic on the right).
- The content entered by staff is printed as written.
- The patient name is printed in both languages when the Arabic name is recorded.
- Other printed documents stay in English: the wristband, the death record, the MDS report.

## 4. How it is built in Microsoft 365

| Part | How |
| --- | --- |
| Language choice | Power Apps reads the user's language with `Language()`. The user can change it in the app settings. |
| Interface text | A **Translations** table in Dataverse (key, English, Arabic). Screens look up their text by key, so wording can be changed without republishing the app. |
| Lists (Choices) | Dataverse choices keep one fixed value and a label in each language. Arabic is added as a second language in the environment, and staff see the Arabic labels automatically. |
| Right to left | Arabic screens use right-to-left layout. Fields that must read left to right stay that way: file number, blood pressure, doses, phone numbers, ICD-10 codes. |
| Numbers and dates | Western digits (0–9) in both languages, which are easier to read for doses and vital signs. Dates as 7 Nov 2026 / ٧ نوفمبر ٢٠٢٦ for the label, with the value in a standard format. |
| Font | Segoe UI (Arabic support built in on Windows and in Power Apps). |
| Reports | Power BI reports, the MDS report and the DHIS2 export read the stored English values, so they do not change. |
| Messages | Teams and Outlook alerts use the receiver's language for the wording and English for medical terms and values. |

## 5. Work and checks

1. Collect every interface text into the Translations table (around 1,200 to 1,500 entries).
2. Translate, then have the clinical text reviewed by an Arabic-speaking doctor and nurse.
3. Add the Arabic labels to all Dataverse choices.
4. Add the "Name in Arabic" field and search on both names.
5. Build the bilingual referral print.
6. Test on phones and tablets in both languages: layout, long words, right-to-left tables, printing.
7. Pilot with staff who prefer Arabic, then adjust the wording.

Nothing about storage changes, so data entered in Arabic and in English can be mixed in the same report from day one.

## 6. Wording

Arabic text follows the style Microsoft uses in its Arabic products, so staff see the same words they know from Teams, Outlook and Windows:

- Commands and buttons use the verbal noun: حفظ، تحرير، إرسال، تسجيل الدخول، إلغاء التأمين.
- Status messages use "تم": تم حفظ التقييم، تم تحديث العلامات الحيوية.
- Instructions use the imperative: اكتب، اختر، حدد، اضغط.
- Microsoft terms: لوحة المعلومات (dashboard), تأمين الشاشة (lock screen), إعادة تعيين (reset), قيد الانتظار (pending), إقرار (acknowledge).
- No diacritics except where a word would be misread.
