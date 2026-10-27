const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const out = path.join(__dirname, 'output') + '/';
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const srv = http.createServer((q, r) => {
  let f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(8766);

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const run = async (label, viewport) => {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: viewport.width < 700, hasTouch: viewport.width < 700 });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(label + ': ' + e.message));
    page.on('dialog', d => d.accept());
    const shot = n => page.screenshot({ path: out + label + '-' + n + '.png' });
    const login = async u => { await page.fill('#u', u + '@emttentcare.com'); await page.fill('#pw', 'demo123'); await page.click('form button.primary'); };
    const logout = async () => { await page.evaluate(() => logout()); };
    await page.goto('http://localhost:8766/');
    await shot('01-login');

    await login('reception');
    await shot('02-register');
    await page.fill('#r-name', 'Test Patient');
    await page.fill('#r-age', '40');
    await page.click('label[for="s-m"]');
    await page.fill('#r-cc', 'Chest injury');
    await page.click('label[for="al-k"]');
    await page.fill('#r-all', 'Penicillin');
    await page.fill('#v-weight', '78');
    await page.click('label[for="t-red"]');
    await page.click('label[for="d-ER"]');
    await page.click('text=Register and send');
    const mrn = (await page.textContent('.band .mrn')).trim();
    await shot('03-wristband');
    await page.click('.modal >> text=Done');
    await logout();

    await login('doctor');
    await shot('04-er-queue');
    await page.click(`.pcard:has-text("${mrn}")`);
    await shot('05-patient');
    const mobile = viewport.width < 700;
    const act = async name => {
      if (mobile) {
        const primary = page.locator('.actionbar .btn.primary');
        if ((await primary.textContent()).includes(name)) { await primary.click(); return; }
        await page.click('.actionbar .btn.more');
        await page.click(`.sheetlist button:has-text("${name}")`);
      } else {
        await page.click(`.actions .btn:has-text("${name}")`);
      }
    };
    await act('Start consultation');
    if (mobile) { await page.click('.actionbar .btn.more'); await shot('06-actions-sheet'); await page.click('.x'); }
    await act('Clinical assessment');
    await page.fill('#n-hist', 'None');
    await page.selectOption('#n-sys', 'Respiratory');
    await page.selectOption('#n-cat', 'Trauma');
    await page.fill('#n-exam', 'Reduced air entry left');
    await page.fill('#n-dx', 'Rib fractures, suspected pneumothorax');
    await page.selectOption('#n-resp', 'Stable');
    await page.fill('#n-plan', 'Oxygen, analgesia, chest X-ray');
    await page.click('.modal button.primary');
    await act('Request lab / X-ray');
    await page.selectOption('#o-test', 'Imaging|Chest X-ray');
    await page.click('.modal button.primary');
    await logout();

    await login('lab');
    await shot('07-lab');
    await page.click(`.order:has-text("Test Patient") >> text=Enter result`);
    await page.fill('#res', 'Small left pneumothorax, two rib fractures');
    await page.click('.modal button.primary');
    await logout();

    await login('doctor');
    if (mobile) await page.click('button[aria-label="Search"].iconbtn'); else await page.click('nav button[aria-label="Search"]');
    await page.fill('#q', mrn);
    await page.click(`.pcard:has-text("${mrn}")`);
    await act('Refer to another tent');
    await page.selectOption('#ref', 'OT');
    await page.click('.modal button.primary');
    await act('Accept patient');
    await act('Admit to ward');
    await page.selectOption('#bed', '1');
    await page.click('.modal button.primary');
    await shot('08a-reserved');
    await act('Patient arrived on ward');
    await act('Approve discharge');
    await page.click('label[for="out0"]');
    await page.fill('#dis-meds', 'Paracetamol 1 g by mouth, every 8 hours, 3 days');
    await page.selectOption('#dis-ref', 'Diagnostic test');
    await page.selectOption('#dis-fu', '7');
    await shot('08b-discharge');
    await page.click('.modal button[value="approve"]');
    const where = await page.textContent('.phead .where');
    if (mobile) { await page.click('.backbtn'); console.log(label, 'back went to:', await page.textContent('.mtitle')); }
    await logout();

    await login('nurse');
    await shot('08-ward');
    await page.click('.bed.occ >> nth=0');
    await act('Confirm departure');
    await page.click('.modal button.primary');
    await shot('08c-file');
    const after = await page.textContent('.phead .where');
    await logout();

    await login('admin');
    await shot('09-dash');
    if (mobile) await page.click('nav button:has-text("Attendance")'); else await page.click('nav button:has-text("Attendance")');
    await shot('13-attend');
    await page.click('.srow >> nth=0');
    await page.click('.sheetlist button:has-text("Check in now")');
    const onduty = await page.textContent('.tiles .tile >> nth=0');
    await page.click('.seg button:has-text("Patients")');
    await shot('14-attend-patients');
    await page.click('.fu button:has-text("Attended") >> nth=0');
    console.log(label, 'on duty tile:', onduty.trim().replace(/\s+/g,' '));
    await page.click('nav button:has-text("Dashboard")').catch(()=>{});
    await page.evaluate(()=>go('patient','FH-0002'));
    await shot('15-patient-full');
    await page.evaluate(()=>go('dash'));
    if (mobile) {
      const navCount = await page.locator('nav.nav button:visible').count();
      await page.click('nav button[aria-label="More"]');
      await shot('10-more');
      await page.click('.sheetlist button:has-text("Maternity")');
      await shot('11-maternity');
      await page.click('.avatar');
      await shot('12-account');
      console.log(label, 'visible bottom tabs:', navCount);
    }
    console.log(label, '| registered', mrn, '| after admit:', where.trim(), '| after discharge:', after.trim());
    await ctx.close();
  };
  await run('phone', { width: 390, height: 844 });
  await run('tablet', { width: 820, height: 1180 });
  await run('desktop', { width: 1280, height: 900 });
  console.log('errors:', errors);
  await browser.close(); srv.close();
})().catch(e => { console.error('FAIL', e.message.split('\n').slice(0, 6).join('\n')); process.exit(1); });
