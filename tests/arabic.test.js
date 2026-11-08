// Arabic interface: language screen first, right-to-left layout, Microsoft-style wording,
// and data that stays in English whatever the interface language.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const srv = http.createServer((q, r) => { let f = path.join(ROOT, q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'image/png' }); r.end(d); }); }).listen(8790);
const out = path.join(__dirname, 'output'); fs.mkdirSync(out, { recursive: true });
const res = []; const check = (n, ok, x) => res.push((ok ? 'PASS ' : 'FAIL ') + n + (x ? ' — ' + x : ''));

(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8790/'); await p.evaluate(() => localStorage.clear()); await p.goto('http://localhost:8790/');

  check('Language screen comes first', await p.isVisible('.lp-btn[lang="ar"]') && await p.isVisible('.lp-btn[lang="en"]'));
  await p.click('.lp-btn[lang="ar"]'); await p.waitForTimeout(100);
  check('Right-to-left and Arabic', await p.evaluate(() => document.documentElement.dir === 'rtl' && document.documentElement.lang === 'ar'));
  check('Sign-in page in Arabic', (await p.textContent('#app')).includes('تسجيل الدخول'));
  check('Choice is remembered', await p.evaluate(() => localStorage.getItem('tentcare_lang') === 'ar'));

  // Microsoft-style wording: commands as verbal nouns, status messages with "تم", no extra diacritics.
  const style = await p.evaluate(() => ({
    save: t('Save'), edit: t('Edit'), dash: t('Dashboard'), vitals: t('Vitals updated'), lock: t('Lock screen'),
    harakat: Object.values(window.TC_AR).filter(v => /[ٌ-ْ]/.test(v)).length
  }));
  check('Commands and status messages follow Microsoft style', style.save === 'حفظ' && style.edit === 'تحرير' && style.dash === 'لوحة المعلومات' && style.vitals.startsWith('تم ') && style.lock === 'تأمين الشاشة', JSON.stringify(style));
  check('No extra diacritics', style.harakat === 0, style.harakat + ' entries');

  // Register a patient with the Arabic interface.
  await p.fill('#u', 'reception@emttentcare.com'); await p.fill('#pw', 'demo123'); await p.click('form button.primary'); await p.waitForTimeout(150);
  check('Registration form in Arabic', (await p.textContent('#app')).includes('تسجيل'));
  await p.fill('#r-name', 'Arabic Test'); await p.fill('#r-name-ar', 'اختبار عربي'); await p.fill('#r-age', '30');
  await p.click('label[for="s-m"]'); await p.fill('#r-cc', 'Headache'); await p.click('label[for="al-k"]'); await p.fill('#r-all', 'Penicillin');
  await p.click('label[for="t-green"]'); await p.click('label[for="d-OPD"]');
  await p.evaluate(() => document.querySelector('form [type=submit], form button.primary').click()); await p.waitForTimeout(200);
  const saved = await p.evaluate(() => { const x = S.patients.find(q => q.name === 'Arabic Test'); return x && { sex: x.sex, cc: x.complaint, tri: x.triage, loc: x.location, ar: x.nameAr, al: allergyText(x) }; });
  check('Data is saved in English', saved && saved.sex === 'M' && saved.cc === 'Headache' && saved.tri === 'green' && saved.loc === 'OPD' && /Penicillin/.test(saved.al) && !/[\u0600-\u06FF]/.test(saved.al), JSON.stringify(saved));
  check('Arabic name is kept as typed', saved && saved.ar === 'اختبار عربي');

  // Every drop-down keeps an English value behind the Arabic label.
  const opts = await p.evaluate(() => { go('patient', S.patients[0].id); if (typeof rxForm === 'function') rxForm(S.patients[0].id);
    return [...document.querySelectorAll('option')].filter(o => /[؀-ۿ]/.test(o.textContent) && /[؀-ۿ]/.test(o.value)).map(o => o.value); });
  check('Drop-down values stay in English', opts.length === 0, opts.slice(0, 5).join(', '));
  await p.evaluate(() => closeModal());

  // Exports stay in English.
  const csv = await p.evaluate(async () => { let blob = null; const keep = mdsDownload; mdsDownload = bl => { blob = bl; };
    try { dhis2Csv(dayKey()); } finally { mdsDownload = keep; } return blob ? await blob.text() : ''; });
  check('DHIS2 export has no Arabic interface text', csv && !/[؀-ۿ]/.test(csv.replace(/اختبار عربي/g, '')));

  await p.screenshot({ path: out + '/arabic-phone.png' });
  await p.evaluate(() => setLang('en')); await p.waitForTimeout(100);
  check('Switching back to English', await p.evaluate(() => document.documentElement.dir === 'ltr') && !(await p.textContent('#app')).includes('تسجيل الدخول'));

  console.log(res.join('\n')); console.log('errors', errs);
  if (res.some(r => r.startsWith('FAIL')) || errs.length) process.exitCode = 1;
  await b.close(); srv.close();
})();
