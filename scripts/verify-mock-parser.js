// Dev script (not part of the app): verifies the mock parser scoring logic.
// Run: node scripts/verify-mock-parser.js
// NOTE: resume_tracker/js/app.js must be SAVED on disk for this to see it.
const vm = require('vm');
const fs = require('fs');

global.document = { getElementById: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, scrollIntoView() {}, textContent: '', innerHTML: '', disabled: false }) };
global.window = {};
global.File = class { constructor(parts, name, opts) { this.name = name; this.size = parts.join('').length; this.type = opts.type; } };

const src = fs.readFileSync('resume_tracker/js/app.js', 'utf8');
if (src.trim() === '') {
  console.log('app.js is empty on disk — save the file in your editor first.');
  process.exit(1);
}
vm.runInThisContext(src);

const f1 = new File(['x'], 'resume.pdf', { type: 'application/pdf' });
const a = runAnalysis(f1);
const b = runAnalysis(f1);
console.log('same file -> same score:', a.score === b.score, '(' + a.score + '/100)');
console.log('present + missing == 20:', a.present.length + a.missing.length === 20);
console.log('no overlap between lists:', a.missing.every(s => !a.present.includes(s)));
const c = runAnalysis(new File(['x'], 'other.pdf', { type: 'application/pdf' }));
console.log('different file -> different score:', c.score !== a.score, '(' + c.score + '/100)');
