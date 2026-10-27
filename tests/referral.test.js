const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), out = path.join(__dirname, 'output') + '/';
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { let f = path.join(root, q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'image/png' }); r.end(d); }); }).listen(8772);
const results = [];
const check = (name, ok, extra) => { results.push((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); };
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const login = async u => { await p.goto('http://localhost:8772/'); await p.evaluate(() => { if (me) logout(); }); await p.fill('#u', u + '@emttentcare.com'); await p.fill('#pw', 'demo123'); await p.click('form button.primary'); await p.waitForTimeout(150); };
  const btn = t => p.click(`.actions .btn:has-text("${t}")`);
  const btns = () => p.$$eval('.actions .btn', bs => bs.map(x => x.textContent.trim()));
  await p.goto('http://localhost:8772/'); await p.evaluate(() => localStorage.clear());
  await login('doctor');
  // pick an ER patient not discharged and not in ward
  const pid = await p.evaluate(() => S.patients.find(x => x.location === 'ER' && x.state !== 'discharged' && !x.dischargeApproved).id);
  // 1. internal handover needs acceptance
  await p.evaluate(id => go('patient', id), pid);
  await btn('Refer to another tent'); await p.selectOption('#ref', 'OPD'); await p.click('.modal button.primary'); await p.waitForTimeout(100);
  let b1 = await btns();
  check('Referred patient waits for acceptance', b1.some(t => /Accept patient/.test(t)) && !b1.some(t => /Approve discharge/.test(t)) && await p.isVisible('text=has not yet accepted'), b1.join(' | '));
  await btn('Cancel transfer'); await p.waitForTimeout(100);
  check('Cancel transfer returns patient to ER', await p.evaluate(id => pat(id).location === 'ER' && !pat(id).handover, pid));
  // 2. external referral validation and checklist warning
  await btn('Refer to another facility');
  await p.click('.modal button.primary');
  let msg = await p.textContent('.modal .form-msg');
  check('Referral needs facility, reason, mode, assessment', /facility/.test(msg) && /reason/.test(msg) && /mode/.test(msg), msg.slice(0, 140));
  await p.fill('#x-fac', 'Regional Hospital'); await p.fill('#x-fp', 'Dr. Example'); await p.fill('#x-why', 'Needs CT scan');
  await p.selectOption('#x-mode', 'Ground (ambulance)');
  await p.check('#x-A-n'); await p.fill('#x-B-f', 'RR 28'); await p.fill('#x-B-i', 'Oxygen 5 L/min');
  await p.check('#pc1');
  for (let i = 0; i < 11; i++) await p.check('#tc' + i);
  await p.click('.modal button.primary');
  msg = await p.textContent('.modal .form-msg');
  const warned = /12, 13/.test(msg) && await p.evaluate(() => !(S.referrals || []).length);
  await p.screenshot({ path: out + 'p2-referral-form.png', fullPage: true });
  await p.click('.modal button.primary'); await p.waitForTimeout(100);
  check('Unticked checklist items warn, second press saves', warned && await p.evaluate(() => S.referrals.length === 1), msg.slice(0, 140));
  b1 = await btns();
  check('After decision: "has left" action shown', b1.some(t => /has left for Regional Hospital/.test(t)), b1.join(' | '));
  // 3. print view
  await btn('Referral form'); await p.waitForTimeout(100);
  check('Printable SBAR referral sheet', await p.isVisible('.refprint') && /WHO Emergency Care Toolkit/.test(await p.textContent('.refprint')) && /Oxygen 5 L\/min/.test(await p.textContent('.refprint')));
  await p.emulateMedia({ media: 'print' }); await p.screenshot({ path: out + 'p2-print.png', fullPage: true }); await p.emulateMedia({ media: 'screen' });
  await p.evaluate(() => closeModal());
  // 4. departure, arrival, counter-referral
  await btn('has left for'); await p.waitForTimeout(100);
  check('Departure sets outcome Transferred', await p.evaluate(id => pat(id).state === 'discharged' && pat(id).outcome === 'Transferred to another facility', pid));
  await btn('Record arrival'); await p.click('.modal button.primary');
  msg = await p.textContent('.modal .form-msg');
  const needSt = /status/.test(msg);
  await p.click('label[for="ast1"]'); await p.fill('#ar-by', 'Dr. Receiver'); await p.click('.modal button.primary'); await p.waitForTimeout(100);
  check('Arrival requires status; saved as Unstable', needSt && await p.evaluate(() => S.referrals[0].arrivalStatus === 'Unstable'));
  await btn('Counter-referral received');
  await p.check('#cr-c1'); await p.fill('#cr-dx', 'Splenic laceration, repaired'); await p.click('label[for="crf2"]');
  await p.click('.modal button.primary'); await p.waitForTimeout(100);
  check('Counter-referral closes the referral', await p.evaluate(() => S.referrals[0].status === 'closed' && S.referrals[0].counter.followup === '1-2 weeks'));
  await p.screenshot({ path: out + 'p2-file.png', fullPage: true });
  // 5. admission reserves bed, ward accepts, departure sends bed to cleaning
  const pid2 = await p.evaluate(() => S.patients.find(x => ['ER', 'OPD'].includes(x.location) && x.state !== 'discharged' && !x.dischargeApproved && !x.handover).id);
  await p.evaluate(id => go('patient', id), pid2);
  await btn('Admit to ward'); const bed = await p.$eval('#bed', s => s.value); await p.click('.modal button.primary'); await p.waitForTimeout(100);
  check('Cleaning beds not offered for admission', !['5', '18'].includes(bed), 'bed ' + bed);
  await login('nurse');
  await p.screenshot({ path: out + 'p2-ward.png', fullPage: true });
  const resv = await p.textContent(`.beds > :nth-child(${bed})`);
  check('Ward shows reserved bed', /reserved/.test(resv), resv);
  await p.click(`.beds > :nth-child(${bed})`);
  await btn('Patient arrived on ward'); await p.waitForTimeout(100);
  check('Nurse receives the patient on the ward', await p.evaluate(id => !!pat(id).handover.acceptedAt, pid2));
  await p.evaluate(() => go('ward'));
  const nclean = await p.$$eval('.bed.clean', x => x.length);
  await p.click('.bed.clean button >> nth=0'); await p.waitForTimeout(100);
  check('Nurse marks a cleaned bed ready', (await p.$$eval('.bed.clean', x => x.length)) === nclean - 1, nclean + ' cleaning before');
  // 6. excel export includes referrals
  await login('admin');
  const sheets = await p.evaluate(() => { let names = []; const orig = window.xlsx; window.xlsx = s => { names = s.map(x => x[0]); return orig(s); }; try { exportData(); } catch (e) {} window.xlsx = orig; return names; });
  check('Excel export has External referrals sheet', sheets.includes('External referrals'), sheets.join(', '));
  console.log(results.join('\n')); console.log('errors', errs);
  await b.close(); srv.close();
})().catch(e => { console.log(results.join('\n')); console.error('FAIL', e.message.split('\n').slice(0, 5).join('\n')); process.exit(1); });
