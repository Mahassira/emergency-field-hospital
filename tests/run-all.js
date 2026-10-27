// Runs every end-to-end test in this folder, one after another, and fails if any check fails.
// Usage: npm test   (needs Playwright with Chromium: npm install && npx playwright install chromium)
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js')).sort();
let failed = 0;
for (const f of files) {
  process.stdout.write(`\n▸ ${f}\n`);
  let out = '';
  try {
    out = execFileSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8', timeout: 300000 });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
    failed++;
  }
  process.stdout.write(out);
  if (/^FAIL /m.test(out) || /errors:? \[\s*'/.test(out)) failed++;
}
console.log(failed ? `\n${failed} problem(s) found.` : '\nAll tests passed.');
process.exit(failed ? 1 : 0);
