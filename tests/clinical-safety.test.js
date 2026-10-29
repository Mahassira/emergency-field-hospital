// Clinical safety and clinical modules: early warning scores, alerts, prescribing, stock, critical results,
// record history, WHO Surgical Safety Checklist, labour and delivery, nutrition, disease alerts, protection,
// blood transfusion, death record, screen lock, indicators and exports.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const srv = http.createServer((q, r) => { let f = path.join(root, q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'image/png' }); r.end(d) }) }).listen(8783);
const out = path.join(__dirname, 'output'); fs.mkdirSync(out, { recursive: true });
const res = []; const check = (n, ok, x) => res.push((ok ? 'PASS ' : 'FAIL ') + n + (x ? ' — ' + x : ''));
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true })).newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8783/'); await p.evaluate(() => localStorage.clear()); await p.goto('http://localhost:8783/');
  const as = async r => { await p.evaluate(r => { me = Object.assign({ username: r }, USERS[r]); render(); }, r); };
  const id = n => p.evaluate(n => S.patients.find(x => x.name === n).id, n);
  const open = async n => { const i = await id(n); await p.evaluate(i => go('patient', i), i); return i; };
  const msg = async () => { await p.waitForTimeout(60); return (await p.textContent('.modal .form-msg')) || ''; };
  const submit = async () => { await p.click('.modal form button.btn.primary, .modal form button.btn.danger'); await p.waitForTimeout(80); };
  await as('admin');

  // 1. NEWS2 and paediatric score
  const sc = await p.evaluate(() => [
    ews({ age: 40 }, { rr: 24, spo2: 93, o2: true, bp: '108/66', hr: 108, avpu: 'Alert', temp: 38.6 }),
    ews({ age: 40 }, { rr: 16, spo2: 97, bp: '122/78', hr: 80, avpu: 'Alert', temp: 36.9 }),
    ews({ age: 40 }, { rr: 7, spo2: 97, bp: '122/78', hr: 80, avpu: 'Alert', temp: 36.9 }),
    ews({ age: 4 }, { rr: 27, spo2: 98, hr: 120, avpu: 'Alert', temp: 37 })].map(e => [e.type, e.score, e.level]));
  check('NEWS2 high, zero and single-parameter 3', sc[0].join() === 'NEWS2,9,high' && sc[1].join() === 'NEWS2,0,none' && sc[2].join() === 'NEWS2,3,lowmed', JSON.stringify(sc));
  check('Children get the paediatric score', sc[3][0] === 'PEWS' && sc[3][1] === 0, JSON.stringify(sc[3]));

  // 2. deterioration on the ward: nurse records vitals, alert goes up, doctor acknowledges
  await as('nurse'); const fadi = await open('Fadi Qassem');
  await p.evaluate(i => vitalsForm(i), fadi);
  for (const [k, v] of [['#v-bp', '92/60'], ['#v-hr', '124'], ['#v-rr', '26'], ['#v-spo2', '93'], ['#v-temp', '38.9']]) await p.fill(k, v);
  await p.selectOption('#v-avpu', 'Alert'); await submit(); if (await p.isVisible('.modal')) await submit();
  const al = await p.evaluate(i => (S.alerts || []).find(a => a.pid === i && a.type === 'ews' && !a.ack), fadi);
  check('High score raises an alert', !!al && /NEWS2 1[0-9] · High/.test(al.title), al && al.title);
  check('Nurse sees the alert but cannot acknowledge', await p.isVisible('.palerts') && !(await p.isVisible('.palerts button:has-text("Acknowledge")')));
  await as('doctor'); await p.evaluate(i => go('patient', i), fadi);
  check('Doctor bell shows open alerts', Number(await p.textContent('.bell .bdg')) >= 1);
  await p.click('.palerts button:has-text("Acknowledge")'); await submit();
  check('Acknowledging needs the action taken', /action taken/.test(await msg()));
  await p.fill('#ak-n', 'Reviewed, fluids and antibiotics started'); await submit();
  check('Alert acknowledged with response time', await p.evaluate(i => { const a = S.alerts.find(x => x.pid === i && x.type === 'ews'); return !!(a.ack && a.ack.mins >= 0 && a.ack.by === 'Dr. Khaled Nasser'); }, fadi));
  check('Observation chart shows the scores', (await p.textContent('#sec-obs')).includes('NEWS2'));

  // 3. prescribing: child dose, missing weight, interactions
  const layla = await open('Layla Mansour');
  await p.evaluate(i => prescribeForm(i), layla); await p.fill('#rx-drug', 'Ibuprofen'); await p.dispatchEvent('#rx-drug', 'input');
  check('Child dose shown from weight', /Child dose for 32 kg/.test(await p.textContent('#rx-hint')) && /160–320 mg/.test(await p.textContent('#rx-hint')), (await p.textContent('#rx-hint')).slice(0, 80));
  await p.fill('#rx-dose', '800'); await p.selectOption('#rx-route', 'By mouth'); await p.selectOption('#rx-freq', 'Every 8 hours'); await submit();
  check('Overdose for a child warns', /above the child dose/.test(await msg()));
  await p.fill('#rx-dose', '300'); await p.dispatchEvent('#rx-dose', 'input'); await submit(); if (await p.isVisible('.modal')) await submit();
  check('Child prescription saved', await p.evaluate(i => pat(i).rx.some(r => r.drug === 'Ibuprofen' && r.dose === 300), layla));
  const karim = await open('Karim Zaqout');
  await p.evaluate(i => { pat(i).vitals.weight = ''; prescribeForm(i); }, karim); await p.fill('#rx-drug', 'Paracetamol'); await p.fill('#rx-dose', '500'); await p.selectOption('#rx-route', 'By mouth'); await p.selectOption('#rx-freq', 'Every 6 hours'); await submit();
  check('Child without weight is blocked', /Weigh the child first/.test(await msg())); await p.evaluate(() => closeModal());
  const ziad = await open('Ziad Hijazi');
  await p.evaluate(i => prescribeForm(i), ziad); await p.fill('#rx-drug', 'Diazepam'); await p.fill('#rx-dose', '5'); await p.selectOption('#rx-route', 'IV'); await p.selectOption('#rx-freq', 'Once (stat)'); await submit();
  check('Opioid and benzodiazepine interaction warns', /benzodiazepine/.test(await msg())); await p.evaluate(() => closeModal());

  // 4. giving a dose from the chart lowers the stock
  await as('nurse'); const kh = await open('Khalil Mansour');
  const before = await p.evaluate(() => S.stock.find(s => s.id === 'SK-01').qty);
  await p.click('#sec-med .rx.over button:has-text("Give")'); await submit();
  check('Giving needs the wristband check', /wristband/.test(await msg()));
  await p.check('#md-id'); await submit(); if (await p.isVisible('.modal')) await submit();
  const after = await p.evaluate(() => S.stock.find(s => s.id === 'SK-01').qty);
  check('1000 mg uses two 500 mg tablets', before - after === 2, `${before} → ${after}`);
  check('Dose linked to the prescription', await p.evaluate(i => pat(i).mar.slice(-1)[0].rxId.startsWith('RX-'), kh));

  // 5. critical result
  await as('lab'); const omar = await id('Omar Najjar');
  await p.evaluate(i => { S.orders.push({ id: 'OR-T1', pid: i, enc: i + '-V1', group: 'Laboratory', test: 'Potassium', status: 'requested', result: '', from: 'ER', at: nowISO(), doneAt: null }); resultForm('OR-T1'); }, omar);
  await p.fill('#res', 'K 6.9 mmol/L'); await p.check('#res-crit'); await submit();
  check('Critical result raises a high alert', await p.evaluate(() => S.alerts.some(a => a.type === 'critical' && a.oid === 'OR-T1' && a.level === 'high')));
  await as('doctor'); await p.evaluate(i => go('patient', i), omar);
  await p.click('.palerts button:has-text("Acknowledge")'); await p.fill('#ak-n', 'Calcium gluconate and ECG'); await submit();
  check('Critical result needs read-back', /read the result back/.test(await msg()));
  await p.check('#ak-rb'); await submit();
  check('Critical result acknowledged', await p.evaluate(() => !!S.orders.find(o => o.id === 'OR-T1').critAck));

  // 6. amended assessment keeps the old version
  const lina = await open('Lina Abed');
  await p.evaluate(i => noteForm(i), lina); await p.fill('#n-dx', 'Acute severe asthma with pneumonia'); await submit();
  check('Changing a diagnosis needs a reason', /reason for the change/i.test(await msg()));
  await p.fill('#n-why', 'Chest X-ray shows consolidation'); await submit();
  check('Old version kept in the history', await p.evaluate(i => pat(i).clinicalHist.length === 1 && pat(i).clinicalHist[0].dx.startsWith('Acute asthma') && pat(i).clinical.amendReason.startsWith('Chest'), lina));
  await p.click('button.cardlink'); check('History shows both versions', (await p.textContent('.modal')).includes('Version 1')); await p.evaluate(() => closeModal());

  // 7. WHO Surgical Safety Checklist
  const ahmad = await open('Ahmad Saleh');
  const sid = await p.evaluate(i => pat(i).surgeries[0].id, ahmad);
  await p.evaluate(([i, s]) => sscForm(i, s, 'timeOut'), [ahmad, sid]); await p.check('input[name=ssc][value="0"]'); await submit();
  check('Time out stops when items are missing', /^Stop\./.test(await msg()));
  for (let k = 1; k < 7; k++) await p.check(`input[name=ssc][value="${k}"]`); await submit();
  await p.evaluate(([i, s]) => sscForm(i, s, 'signOut'), [ahmad, sid]);
  for (let k = 0; k < 5; k++) await p.check(`input[name=ssc][value="${k}"]`); await submit();
  check('Sign out needs the operation record', /operation record/.test(await msg()));
  await p.fill('#op-st', '01:10'); await p.fill('#op-ebl', '300'); await p.fill('#op-an', 'Dr. Mona Saqqa'); await submit();
  check('Surgery completed and coded for the MDS', await p.evaluate(i => { const x = pat(i).surgeries[0]; return !!(x.timeOut && x.signOut && x.record) && pat(i).clinical.mds.includes(26); }, ahmad));

  // 8. labour and delivery
  const mariam = await open('Mariam Odeh');
  check('Partograph flags slow labour', /alert line/.test(await p.textContent('#sec-lab')));
  await p.evaluate(i => deliveryForm(i), mariam);
  await p.fill('#dl-ebl', '650'); await p.click('label[for="nb-f"]'); await p.fill('#nb-w', '2300'); await p.fill('#nb-a1', '7'); await p.fill('#nb-a5', '9'); await submit();
  check('Blood loss of 650 mL is flagged as PPH', /postpartum haemorrhage/.test(await msg())); await submit();
  const nb = await p.evaluate(i => { const m = pat(i); const bb = pat(m.delivery.baby); return { mds: m.clinical.mds, name: bb.name, mother: bb.motherId, dx: bb.clinical.dx }; }, mariam);
  check('Newborn file created and linked', nb.name === 'Baby girl of Mariam Odeh' && nb.mother === mariam && /low birth weight/.test(nb.dx), JSON.stringify(nb));
  check('Delivery coded (29 normal birth, 23 complication)', nb.mds.includes(29) && nb.mds.includes(23));
  check('Live birth counted in the MDS', await p.evaluate(() => mdsTable(dayKey()).summary.q >= 1));
  check('PPH raises an alert', await p.evaluate(i => S.alerts.some(a => a.pid === i && a.title === 'Postpartum haemorrhage'), mariam));

  // 9. nutrition
  const sara = await open('Sara Khalil');
  check('MUAC 11.2 cm shows severe acute malnutrition', (await p.textContent('.nutri')).includes('Severe acute malnutrition'));
  check('SAM counted as MDS item 24', await p.evaluate(i => mdsRows(dayKey(new Date(pat(i).createdAt))).find(r => r.p.id === i).items.includes(24), sara));

  // 10. disease alert (EWARN)
  const yousef = await open('Yousef Hamdan');
  await p.evaluate(i => noteForm(i), yousef);
  await p.selectOption('#n-sys', { index: 1 }); await p.selectOption('#n-cat', { index: 1 }); await p.selectOption('#n-resp', { index: 1 });
  await p.fill('#n-icd', 'B05.9 · Measles, suspected'); await p.dispatchEvent('#n-icd', 'change');
  check('ICD code fills the diagnosis and suggests MDS 13', (await p.inputValue('#n-dx')) === 'Measles, suspected' && await p.isChecked('input[name=mds][value="13"]'));
  await submit();
  check('Suspected measles raises a disease alert and isolation', await p.evaluate(i => S.alerts.some(a => a.type === 'ewarn' && a.pid === i) && pat(i).isolation && pat(i).clinical.icd === 'B05.9', yousef));
  check('MDS item 52 ticked automatically', await p.evaluate(() => ewarnOnDay(dayKey())));

  // 11. protection is confidential
  const kz = await id('Karim Zaqout');
  await as('nurse'); await p.evaluate(i => go('patient', i), kz);
  check('Nurse cannot see the protection record', !(await p.textContent('#app')).includes('Protection · confidential'));
  await p.evaluate(() => { me = Object.assign({ username: 'doctor' }, USERS.doctor, { name: 'Dr. Samer Odeh' }); render(); });
  check('Another doctor sees it locked', await p.isVisible('button:has-text("Open record")'));
  await p.click('button:has-text("Open record")'); await p.selectOption('#ul-r', 'I am treating this patient'); await submit();
  check('Opening is logged in the audit', await p.evaluate(i => S.audit.some(a => a.action === 'Opened confidential record' && a.pid === i && a.by === 'Dr. Samer Odeh'), kz) && (await p.textContent('#app')).includes('Referral to child protection'));
  await as('doctor');

  // 12. blood transfusion checks
  const dina = await open('Dina Sharif');
  await p.evaluate(i => medForm(i), dina); await p.click('label[for="mk-b"]');
  await p.fill('#bl-bag', 'B-1044'); await p.fill('#bl-v', '350'); await p.selectOption('#bl-pg', 'O+'); await p.selectOption('#bl-ug', 'A+'); await p.fill('#bl-w', 'Dr. Khaled Nasser'); await p.check('#bl-x'); await p.check('#md-id'); await submit();
  const bm = await msg();
  check('Incompatible blood is stopped', /STOP\. A\+ blood is not compatible with a O\+ patient/.test(bm) && /second staff member/.test(bm), bm.slice(0, 100));
  await p.selectOption('#bl-ug', 'O+'); await p.fill('#bl-w', 'Huda Saleem'); await p.check('#bl-vs'); await submit();
  check('Transfusion recorded with the second checker', await p.evaluate(i => pat(i).mar.some(m => m.kind === 'blood' && m.witness === 'Huda Saleem'), dina));

  // 13. death record
  const mh = await open('Mahmoud Abu Taha');
  await p.evaluate(i => dischargeForm(i), mh); await p.click('label:has-text("Died")'); await submit();
  check('Death outcome opens the death record', (await p.textContent('.modal h2')) === 'Death record');
  await p.fill('#de-t', '00:40'); await p.fill('#de-a', 'Cardiogenic shock'); await p.fill('#de-u', 'Acute heart failure'); await p.check('#de-fam'); await submit();
  check('Death recorded and counted', await p.evaluate(i => pat(i).death && pat(i).death.underlying === 'Acute heart failure' && mdsOutcome(pat(i)) === 38, mh));

  // 14. pharmacy receives stock and closes the low-stock alert
  await as('admin'); await p.evaluate(() => go('pharmacy'));
  await p.click('button:has-text("Receive stock")'); await p.selectOption('#rc-it', 'SK-05'); await p.fill('#rc-q', '100'); await p.fill('#rc-e', '2028-01-31'); await submit();
  check('Stock received and alert closed', await p.evaluate(() => S.stock.find(s => s.id === 'SK-05').qty === 138 && !S.alerts.some(a => a.type === 'stock' && a.item === 'SK-05' && !a.ack)));

  // 15. indicators and exports
  await p.evaluate(() => go('indicators'));
  check('Indicators page shows the safety indicators', (await p.textContent('#app')).includes('WHO Surgical Safety Checklist complete'));
  await p.evaluate(() => go('mds'));
  const [d1] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("DHIS2 import file")')]);
  const csv = fs.readFileSync(await d1.path(), 'utf8');
  check('DHIS2 file has the import columns and MDS codes', csv.startsWith('dataelement,period,orgunit,categoryoptioncombo') && /EMT_MDS_13,\d{8},EMT_DEMO,AGE_5_17/.test(csv), csv.split('\n')[1]);
  await p.evaluate(() => go('dash'));
  const [d2] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Export to Excel")')]);
  const zipTxt = fs.readFileSync(await d2.path()).toString('latin1');
  check('Full export has the new sheets, not the protection record', ['Observations', 'Prescriptions', 'Operations', 'Deliveries', 'Audit log', 'Indicators'].every(n => zipTxt.includes(n)) && !zipTxt.includes('Referral to child protection'));

  // 16. screen lock
  await p.evaluate(() => { lastAct = Date.now() - 11 * 60000; lockCheck(); });
  check('Screen locks after 10 minutes', await p.isVisible('#lock') && !(await p.isVisible('#lock .err:has-text("Wrong")')));
  await p.fill('#lk-pw', 'nope'); await p.click('#lock button.primary');
  check('Wrong password stays locked', (await p.textContent('#lk-err')).includes('Wrong'));
  await p.fill('#lk-pw', 'demo123'); await p.click('#lock button.primary');
  check('Unlocked with the password, both logged', !(await p.isVisible('#lock')) && await p.evaluate(() => S.audit.some(a => a.action === 'Screen locked') && S.audit.some(a => a.action === 'Screen unlocked')));
  await p.evaluate(() => go('audit'));
  check('Audit log lists file opens', (await p.textContent('#app')).includes('Opened patient file'));
  await p.screenshot({ path: out + '/safety-audit.png', fullPage: true });

  // 17. phone
  const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage(); m.on('pageerror', e => errs.push(e.message));
  await m.goto('http://localhost:8783/'); await m.fill('#u', 'doctor'); await m.fill('#pw', 'demo123'); await m.click('form button.primary'); await m.waitForTimeout(150);
  await m.evaluate(() => go('patient', S.patients.find(x => x.name === 'Khalil Mansour').id)); await m.waitForTimeout(100);
  check('Phone: patient file fits the screen', await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await m.click('.actionbar button:has-text("Actions")');
  check('Phone: actions grouped', (await m.textContent('.modal')).includes('Assess') && (await m.textContent('.modal')).includes('Treat'));
  await m.screenshot({ path: out + '/safety-phone-actions.png' });

  console.log(res.join('\n')); console.log('errors', errs); await b.close(); srv.close();
})();
