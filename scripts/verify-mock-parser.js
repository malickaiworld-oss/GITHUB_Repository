// Dev script (not part of the app): verifies the mock parser scoring logic.
// Run: node scripts/verify-mock-parser.js
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// Minimal DOM/file stubs so app.js can load outside a browser.
global.document = { getElementById: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, scrollIntoView() {}, textContent: '', innerHTML: '', disabled: false }) };
global.window = {};
global.File = class { constructor(parts, name, opts) { this.name = name; this.size = parts.join('').length; this.type = opts.type; } };

const src = fs.readFileSync(path.join('resume_tracker', 'js', 'app.js'), 'utf8');
let loadError = null;
try {
  vm.runInThisContext(src);
} catch (e) {
  loadError = e;
}
console.log('load error:', loadError ? loadError.stack : 'none');

if (!loadError) {
  console.log('runAnalysis reachable:', typeof runAnalysis);
  const f1 = new File(['x'], 'resume.pdf', { type: 'application/pdf' });
  const a = runAnalysis(f1);
  const b = runAnalysis(f1);
  console.log('same file -> same score:', a.score === b.score, `(${a.score}/100)`);
  console.log('present + missing == 20 skills:', a.present.length + a.missing.length === 20);
  console.log('no overlap between lists:', a.missing.every((s) => !a.present.includes(s)));
  const f2 = new File(['x'], 'other.pdf', { type: 'application/pdf' });
  const c = runAnalysis(f2);
  console.log('different file -> different score:', c.score !== a.score, `(${c.score}/100)`);
}
