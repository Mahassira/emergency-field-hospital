const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), out = path.join(__dirname, 'output') + '/';
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { let f = path.join(root, q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'image/png' }); r.end(d); }); }).listen(8771);
const results = [];
const check = (name, ok, extra) => { results.push((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); };
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const login = async u => { await p.goto('http://localhost:8771/'); await p.evaluate(() => { if (me) logout(); }); await p.fill('#u', u + '@emttentcare.com'); await p.fill('#pw', 'demo123'); await p.click('form button.primary'); await p.waitForTimeout(150); };
  await p.goto('http://localhost:8771/'); await p.evaluate(() => localStorage.clear());
  await login('reception');
  const count = () => p.evaluate(() => S.patients.length);
  const n0 = await count();
  // 1. impossible vitals rejected
  await p.fill('#r-name', 'Test Vitals'); await p.fill('#r-age', '30'); await p.click('label[for="s-m"]'); await p.fill('#r-cc', 'Cough');
  await p.click('label[for="al-u"]'); await p.click('label[for="t-green"]');
  await p.fill('#v-bp', 'abc'); await p.fill('#v-hr', '-1'); await p.fill('#v-spo2', '150');
  await p.click('text=Register and send');
  let msg = await p.textContent('.form-msg');
  check('BP abc / pulse -1 / SpO2 150 rejected', (await count()) === n0 && /BP must/.test(msg) && /Pulse/.test(msg) && /SpO₂/.test(msg), msg.slice(0, 120));
  // 2. no triage default
  await p.goto('http://localhost:8771/'); await p.waitForTimeout(100);
  const triChecked = await p.evaluate(() => !!document.querySelector('input[name=triage]:checked'));
  check('No triage colour selected by default', !triChecked);
  await p.fill('#r-name', 'Test Triage'); await p.fill('#r-age', '30'); await p.fill('#r-cc', 'Cough'); await p.click('label[for="al-u"]');
  await p.click('text=Register and send');
  msg = await p.textContent('.form-msg');
  check('Registration blocked without triage', (await count()) === n0 && /triage/i.test(msg));
  // 3. unusual value warns, second press saves
  await p.click('label[for="t-yellow"]'); await p.fill('#v-spo2', '82');
  await p.click('text=Register and send');
  msg = await p.textContent('.form-msg');
  const warned = /unusual/.test(msg) && (await count()) === n0;
  await p.click('text=Register and send'); await p.waitForTimeout(150);
  check('Unusual SpO2 82 warns first, saves on confirm', warned && (await count()) === n0 + 1);
  // 4. unknown allergy shown as unknown
  await p.click('.modal >> text=Done');
  const info = await p.textContent('.infobar').catch(() => '');
  const careAll = await p.evaluate(() => [...document.querySelectorAll('.kv>div')].find(d => d.textContent === 'Allergies').nextElementSibling.textContent);
  check('Empty allergy stays Unknown (not None known)', /Allergies unknown/.test(info) && /Unknown/.test(careAll), careAll);
  await p.screenshot({ path: out + 'p1-unknown-allergy.png' });
  // 5. duplicate registration -> new visit on same file
  await p.evaluate(() => go('register'));
  const jana = await p.evaluate(() => { const q = S.patients.find(x => x.name === 'Jana Smith'); return { id: q.id, age: q.age }; });
  await p.fill('#r-name', 'jana  smith'); await p.fill('#r-age', String(jana.age)); await p.click('label[for="s-f"]'); await p.fill('#r-cc', 'Arm still painful');
  await p.click('label[for="al-u"]'); await p.click('label[for="t-green"]'); await p.click('label[for="d-OPD"]');
  await p.click('text=Register and send'); await p.waitForTimeout(150);
  const dupe = await p.isVisible('text=Possible existing patient');
  await p.screenshot({ path: out + 'p1-duplicate.png' });
  await p.click('text=Same person: start a new visit'); await p.waitForTimeout(150);
  await p.click('.modal >> text=Done');
  const j = await p.evaluate(id => { const q = pat(id); return { n: S.patients.length, visit: q.visitNo, prev: q.visits.length, allergy: q.allergyStatus, state: q.state }; }, jana.id);
  const vl = await p.textContent('.visitline');
  check('Duplicate detected and new visit opened on same file', dupe && j.n === n0 + 1 && j.visit === 2 && j.prev === 1 && j.state === 'waiting' && /V2/.test(vl), JSON.stringify(j) + ' ' + vl);
  check('Known allergy kept on returning patient (Unknown at desk does not erase it)', j.allergy === 'known');
  await p.screenshot({ path: out + 'p1-visit2.png', fullPage: true });
  // 6. nurse permissions on a ward patient
  await login('nurse');
  await p.click('.bed.occ >> nth=0');
  const nurseBtns = await p.$$eval('.actions .btn', bs => bs.map(x => x.textContent.trim()));
  check('Nurse cannot edit diagnosis or approve discharge', !nurseBtns.some(t => /Clinical assessment|Approve discharge|Refer/.test(t)) && nurseBtns.some(t => /Nursing note/.test(t)), nurseBtns.join(' | '));
  const wardPid = await p.evaluate(() => view.id);
  // 7. doctor: discharge with medication requires meds
  await login('doctor');
  await p.evaluate(id => go('patient', id), wardPid);
  await p.click('.actions .btn:has-text("Approve discharge")');
  await p.click('label[for="out0"]'); await p.fill('#dis-meds', '');
  await p.click('.modal button[value="approve"]');
  msg = await p.textContent('.modal .form-msg');
  check('"Discharged with medication" needs the medication', /Write the medication/.test(msg));
  await p.fill('#dis-meds', 'Amoxicillin 500 mg by mouth, every 8 hours, 7 days');
  await p.click('.modal button[value="approve"]'); await p.waitForTimeout(100);
  const st1 = await p.evaluate(id => ({ s: pat(id).state, bed: pat(id).bed, ap: !!pat(id).dischargeApproved }), wardPid);
  check('Doctor approval does not free the bed yet', st1.ap && st1.s === 'admitted' && st1.bed);
  await login('nurse');
  await p.evaluate(id => go('patient', id), wardPid);
  await p.click('.actions .btn:has-text("Confirm departure")'); await p.click('.modal button.primary'); await p.waitForTimeout(100);
  const st2 = await p.evaluate(id => ({ s: pat(id).state, bed: pat(id).bed, free: S.beds.includes(id) }), wardPid);
  check('Nurse confirms departure, bed freed', st2.s === 'discharged' && !st2.bed && !st2.free);
  // 8. pending results need an owner
  await login('doctor');
  const pend = await p.evaluate(() => { const o = S.orders.find(x => x.status === 'requested' && pat(x.pid).state !== 'discharged' && pat(x.pid).location !== 'WARD'); return o && o.pid; });
  await p.evaluate(id => go('patient', id), pend);
  await p.click('.actions .btn:has-text("Approve discharge")');
  const hasPend = await p.isVisible('#dis-owner');
  await p.click('label[for="out1"]'); await p.click('.modal button[value="approve"]');
  msg = await p.textContent('.modal .form-msg');
  check('Pending results must have an owner before discharge', hasPend && /pending results/.test(msg));
  await p.screenshot({ path: out + 'p1-pending.png' });
  // 9. follow-up attended opens a new visit
  await p.evaluate(() => closeModal());
  await login('admin');
  await p.evaluate(() => { attTab = 'patients'; go('attend'); });
  await p.click('.fu button:has-text("Attended") >> nth=0');
  const nv = await p.isVisible('text=Start a new visit');
  check('Follow-up "Attended" opens a new visit form', nv);
  console.log(results.join('\n')); console.log('errors', errs);
  await b.close(); srv.close();
})().catch(e => { console.log(results.join('\n')); console.error('FAIL', e.message.split('\n').slice(0, 5).join('\n')); process.exit(1); });
