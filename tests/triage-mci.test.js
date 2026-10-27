const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), out = path.join(__dirname, 'output') + '/';
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { let f = path.join(root, q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'image/png' }); r.end(d); }); }).listen(8774);
const results = [];
const check = (name, ok, extra) => { results.push((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); };
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const login = async u => { await p.goto('http://localhost:8774/'); await p.evaluate(() => { if (me) logout(); }); await p.fill('#u', u + '@emttentcare.com'); await p.fill('#pw', 'demo123'); await p.click('form button.primary'); await p.waitForTimeout(150); };
  await p.goto('http://localhost:8774/'); await p.evaluate(() => localStorage.clear());
  await login('reception');
  const count = () => p.evaluate(() => S.patients.length);
  const n0 = await count();
  // 1. pulse from vitals ticks the red sign and suggests red
  await p.fill('#r-name', 'Criteria Test'); await p.fill('#r-age', '40'); await p.click('label[for="s-m"]'); await p.fill('#r-cc', 'Chest pain');
  await p.click('label[for="al-u"]'); await p.fill('#v-hr', '160'); await p.waitForTimeout(50);
  const hint = await p.textContent('#tri-hint');
  check('Adult pulse 160 ticks the red sign and suggests Red', /suggest RED/.test(hint), hint);
  // 2. choosing green against criteria warns, second press saves and records override
  await p.click('label[for="t-green"]'); await p.click('text=Register and send');
  const msg = await p.textContent('.form-msg');
  const warned = /criteria suggest Red/.test(msg) && (await count()) === n0;
  await p.screenshot({ path: out + 'p4-undertriage.png', fullPage: true });
  await p.click('text=Register and send'); await p.waitForTimeout(150);
  const rec = await p.evaluate(() => { const q = S.patients[S.patients.length - 1]; return q.triageCriteria; });
  check('Under-triage warns, then saves with the override recorded', warned && rec && rec.override && rec.suggested === 'red', JSON.stringify(rec).slice(0, 160));
  await p.click('.modal >> text=Done');
  check('Patient file shows the triage criteria', /Triage criteria/.test(await p.textContent('main')) && /clinical judgement/.test(await p.textContent('main')));
  // 3. high-risk trauma suggests yellow
  await p.evaluate(() => go('register'));
  await p.click('#crit summary');
  await p.check('#ht3'); await p.waitForTimeout(50);
  check('High-risk trauma suggests at least Yellow', /at least YELLOW/.test(await p.textContent('#tri-hint')));
  await p.screenshot({ path: out + 'p4-criteria.png', fullPage: true });
  // 4. dead on arrival from full registration
  await p.fill('#r-name', 'DOA Test'); await p.fill('#r-age', '50'); await p.click('label[for="s-m"]'); await p.fill('#r-cc', 'Brought in by family'); await p.click('label[for="al-u"]');
  await p.click('label[for="t-black"]'); await p.click('text=Register and send'); await p.waitForTimeout(150);
  const doa = await p.evaluate(() => { const q = S.patients[S.patients.length - 1]; return { s: q.state, o: q.outcome }; });
  check('Dead on arrival recorded and not sent to a tent', doa.s === 'discharged' && doa.o === 'Dead on arrival', JSON.stringify(doa));
  await p.evaluate(() => closeModal());
  // 5. mass casualty mode
  await p.evaluate(() => go('register'));
  await p.click('text=Mass casualty mode');
  await p.click('.modal button.danger');
  check('Incident name required', /incident/.test(await p.textContent('.modal .form-msg')));
  await p.fill('#mci-name', 'Market explosion'); await p.click('.modal button.danger'); await p.waitForTimeout(150);
  check('Red banner and fast form shown', await p.isVisible('.mcibar') && await p.isVisible('text=Fast registration'));
  await p.click('text=Register and next');
  check('Fast form needs triage, sex and age group', /triage/.test(await p.textContent('.form-msg')) && /sex/.test(await p.textContent('.form-msg')));
  const fast = async (t, sx, ag) => { await p.click(`label[for="t-${t}"]`); await p.click(`label[for="fs-${sx}"]`); await p.click(`label[for="fa${ag}"]`); await p.click('text=Register and next'); await p.waitForTimeout(120); };
  const t0 = Date.now();
  await fast('red', 'M', 2); await fast('yellow', 'F', 1); await fast('green', 'U', 2); await fast('black', 'M', 2);
  const mci = await p.evaluate(() => mciPatients().map(q => [q.tempId, q.triage, q.location, q.state]));
  check('Four patients registered with temporary IDs and routed by colour', mci.length === 4 && mci[0][0] === 'MCI-001' && mci[0][2] === 'ER' && mci[2][2] === 'OPD' && mci[3][3] === 'discharged', JSON.stringify(mci));
  check('Fast registration under 2 s per patient in test', (Date.now() - t0) / 4 < 2000);
  await p.screenshot({ path: out + 'p4-mci.png', fullPage: true });
  // 6. other users see the banner; doctor finds the patient by temporary id and identifies them
  await login('doctor');
  check('Doctor sees the incident banner', await p.isVisible('.mcibar'));
  await p.evaluate(() => go('search')); await p.fill('#q', 'MCI-001'); await p.evaluate(() => doSearch());
  await p.click('.pcard >> nth=0');
  await p.click('.actions .btn:has-text("Identify patient")');
  await p.fill('#id-name', 'Omar Haddad'); await p.fill('#id-age', '34'); await p.click('.modal button.primary'); await p.waitForTimeout(100);
  const idf = await p.evaluate(() => { const q = S.patients.find(x => x.tempId === 'MCI-001'); return { n: q.name, u: q.unidentified, a: q.age }; });
  check('Identify keeps the file and temporary ID', idf.n === 'Omar Haddad' && !idf.u && idf.a === 34, JSON.stringify(idf));
  await p.screenshot({ path: out + 'p4-identified.png', fullPage: true });
  // 7. new outcomes
  const opts = await p.evaluate(() => VISIT_OUTCOMES);
  check('Outcomes include Left without being seen and Died', opts.includes('Left without being seen') && opts.includes('Died'));
  // 8. close incident
  await login('reception');
  await p.click('.mcibar button'); await p.click('text=Close incident and return'); await p.waitForTimeout(100);
  check('Incident closed, normal registration back', !(await p.isVisible('.mcibar')) && await p.isVisible('#r-name'));
  // 9. export columns
  await login('admin');
  const head = await p.evaluate(() => { let h = []; const orig = window.xlsx; window.xlsx = s => { h = s[0][1][0]; return orig(s); }; try { exportData(); } catch (e) {} window.xlsx = orig; return h; });
  check('Excel has triage criteria and temporary ID columns', head.includes('Triage criteria') && head.includes('Mass casualty temporary ID'));
  console.log(results.join('\n')); console.log('errors', errs);
  await b.close(); srv.close();
})().catch(e => { console.log(results.join('\n')); console.error('FAIL', e.message.split('\n').slice(0, 5).join('\n')); process.exit(1); });
