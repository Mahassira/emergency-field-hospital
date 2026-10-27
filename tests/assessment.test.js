const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), out = path.join(__dirname, 'output') + '/';
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { let f = path.join(root, q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'image/png' }); r.end(d); }); }).listen(8776);
const results = [];
const check = (name, ok, extra) => { results.push((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); };
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const login = async u => { await p.goto('http://localhost:8776/'); await p.evaluate(() => { if (me) logout(); }); await p.fill('#u', u + '@emttentcare.com'); await p.fill('#pw', 'demo123'); await p.click('form button.primary'); await p.waitForTimeout(150); };
  const btn = t => p.click(`.actions .btn:has-text("${t}")`);
  const msg = () => p.textContent('.modal .form-msg');
  await p.goto('http://localhost:8776/'); await p.evaluate(() => localStorage.clear());
  await login('doctor');
  // seeded example shows in the file
  const lina = await p.evaluate(() => S.patients.find(x => x.name === 'Lina Abed').id);
  await p.evaluate(id => go('patient', id), lina);
  check('Seeded primary survey and medication shown', /Primary survey/.test(await p.textContent('main')) && /Hydrocortisone/.test(await p.textContent('main')));
  await p.screenshot({ path: out + 'p6-file.png', fullPage: true });
  // new patient
  const pid = await p.evaluate(() => S.patients.find(x => x.location === 'ER' && x.state === 'waiting' && !x.surveys).id);
  await p.evaluate(id => go('patient', id), pid);
  await btn('Primary survey');
  await p.click('.modal button.primary');
  let m = await msg();
  check('Empty survey: every letter needs Normal or a finding', /A: tick Normal/.test(m) && /E: tick Normal/.test(m), m.slice(0, 120));
  await p.check('#A-ok'); await p.check('#af1');
  await p.check('#B-ok'); await p.check('#C-ok'); await p.check('#E-ok');
  await p.fill('#g-e', '2'); await p.fill('#g-v', '2');
  await p.click('.modal button.primary'); m = await msg();
  check('Normal with abnormal finding, and partial GCS, are errors', /A is ticked Normal/.test(m) && /all three parts/.test(m), m.slice(0, 160));
  await p.uncheck('#af1'); await p.uncheck('#A-ok'); await p.check('#af1'); await p.check('#ai1');
  await p.fill('#g-m', '4'); await p.check('input[name=avpu][value="Pain"]'); await p.fill('#d-glu', '50');
  await p.selectOption('#m-mech', 'Blast or explosion'); await p.selectOption('#m-int', 'Legal process, political unrest or war');
  const gt = await p.textContent('#g-t');
  await p.click('.modal button.primary'); m = await msg();
  check('GCS 8 and glucose 50 warn before saving', gt === 'GCS 8' && /GCS 8/.test(m) && /Glucose 50/.test(m), gt + ' | ' + m.slice(0, 160));
  await p.screenshot({ path: out + 'p6-survey.png', fullPage: true });
  await p.click('.modal button.primary'); await p.waitForTimeout(100);
  const sv = await p.evaluate(id => { const q = pat(id); return { n: (q.surveys || []).length, st: q.state, lines: surveyLines(q.surveys[0]).map(x => x.join(' ')) }; }, pid);
  check('Survey saved, patient now in care', sv.n === 1 && sv.st === 'in-care' && /GCS 8 \(E2 V2 M4\)/.test(sv.lines.join('|')), sv.lines.join(' | '));
  // medication with allergy check
  await p.evaluate(id => { const q = pat(id); q.allergyStatus = 'known'; q.allergies = 'Penicillin'; save(); render(); }, pid);
  await btn('Medication or procedure given');
  await p.fill('#md-n', 'Amoxicillin'); await p.fill('#md-d', '500 mg'); await p.selectOption('#md-r', 'By mouth');
  await p.click('.modal button.primary'); m = await msg();
  check('Amoxicillin warns for penicillin allergy', /allergic to Penicillin/.test(m), m.slice(0, 120));
  await p.fill('#md-n', 'Paracetamol'); await p.fill('#md-d', '1 g');
  await p.click('.modal button.primary'); await p.waitForTimeout(100);
  await btn('Medication or procedure given'); await p.click('label[for="mk-p"]'); await p.fill('#md-n', 'Wound irrigation'); await p.click('.modal button.primary'); await p.waitForTimeout(100);
  check('Medication and procedure recorded with time', await p.evaluate(id => pat(id).mar.length === 2 && pat(id).mar[1].kind === 'proc', pid));
  // reassess worse without raising triage warns, then raise
  const tri0 = await p.evaluate(id => pat(id).triage, pid);
  await btn('Reassess');
  await p.click('label[for="rc2"]'); await p.fill('#v-hr', '128');
  await p.click('.modal button.primary'); m = await msg();
  const warnedWorse = tri0 === 'red' || /patient is worse/.test(m);
  await p.selectOption('#ra-tri', 'red'); await p.click('.modal button.primary'); await p.waitForTimeout(100);
  const ra = await p.evaluate(id => ({ t: pat(id).triage, n: pat(id).reassess.length, hr: pat(id).vitals.hr }), pid);
  check('Worse without higher colour warns; reassessment updates triage and vitals', warnedWorse && ra.t === 'red' && ra.n === 1 && ra.hr === '128', JSON.stringify(ra));
  await p.screenshot({ path: out + 'p6-file2.png', fullPage: true });
  // referral form prefilled from survey
  await btn('Refer to another facility');
  const pre = await p.evaluate(() => ({ a: $('#x-A-f').value, d: $('#x-D-f').value, dn: $('#x-D-n').checked, tx: $('#x-tx').value }));
  check('External referral prefilled from survey and medication', /Stridor/.test(pre.a) && /GCS 8/.test(pre.d) && /Paracetamol 1 g/.test(pre.tx), JSON.stringify(pre).slice(0, 200));
  await p.evaluate(() => closeModal());
  // discharge shows vitals at disposition
  await btn('Approve discharge');
  check('Discharge form shows vitals at disposition', /Vital signs at disposition/.test(await p.textContent('.modal')));
  await p.evaluate(() => closeModal());
  // nurse can give medication and reassess on ward, not do survey
  await login('nurse');
  await p.click('.bed.occ >> nth=0');
  const nb = await p.$$eval('.actions .btn', bs => bs.map(x => x.textContent.trim()));
  check('Nurse: medication and reassess yes, primary survey no', nb.some(t => /Medication or procedure/.test(t)) && nb.some(t => /Reassess/.test(t)) && !nb.some(t => /Primary survey/.test(t)), nb.join(' | '));
  // export
  await login('admin');
  const sheets = await p.evaluate(() => { let n = []; const o = window.xlsx; window.xlsx = s => { n = s.map(x => x[0]); return o(s); }; try { exportData(); } catch (e) {} window.xlsx = o; return n; });
  check('Excel has Primary surveys, Medication & procedures, Reassessments', ['Primary surveys', 'Medication & procedures', 'Reassessments'].every(x => sheets.includes(x)), sheets.join(', '));
  console.log(results.join('\n')); console.log('errors', errs);
  await b.close(); srv.close();
})().catch(e => { console.log(results.join('\n')); console.error('FAIL', e.message.split('\n').slice(0, 5).join('\n')); process.exit(1); });
