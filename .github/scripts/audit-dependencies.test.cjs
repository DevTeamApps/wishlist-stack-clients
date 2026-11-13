const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { assessAudit, audit } = require('./audit-dependencies.cjs');

function result(counts = {}, status = Object.values(counts).some(Boolean) ? 1 : 0) {
  return { status, stdout: JSON.stringify({ auditReportVersion: 2, vulnerabilities: {},
    metadata: { vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, ...counts } } }) };
}

test('clean scans pass', () => assert.equal(assessAudit(result()).blocked, false));
test('moderate/low findings remain nonblocking', () => assert.equal(assessAudit(result({ moderate: 2, low: 1 })).blocked, false));
test('high findings remain nonblocking', () => assert.equal(assessAudit(result({ high: 1 })).blocked, false));
test('critical findings block', () => assert.equal(assessAudit(result({ critical: 1 })).blocked, true));
test('scanner failures fail closed', () => {
  for (const value of [
    { status: 1, stdout: '{invalid' },
    { status: 1, stdout: '{"error":{"code":"ENOTFOUND"}}' },
    { status: 0, stdout: '{"auditReportVersion":2,"metadata":{}}' },
    { ...result(), error: new Error('timeout') },
    { ...result(), signal: 'SIGTERM' },
    { ...result(), status: 2 },
    result({ high: 1 }, 0), result({}, 1), result({ high: -1 }),
  ]) assert.throws(() => assessAudit(value));
});
test('high findings warn while both raw reports are preserved', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dependency-audit-test-'));
  const calls = [];
  const warning = t.mock.method(console, 'warn', () => {});
  try {
    const code = audit({ outputDirectory: directory, summaryFile: path.join(directory, 'summary.md'),
      run: (command, args) => { calls.push([command, args]); return args.includes('--omit=dev') ? result() : result({ high: 1 }); } });
    assert.equal(code, 0); assert.equal(calls.length, 2);
    assert.equal(warning.mock.callCount(), 1);
    assert.match(warning.mock.calls[0].arguments[0], /^::warning::all: 1 high-severity/);
    assert.match(fs.readFileSync(path.join(directory, 'summary.md'), 'utf8'), /\| all \| 0 \| 1 \| 0 \| 0 \| WARN \|/);
    assert.ok(calls.every(([command, args]) => command === 'npm' && args.includes('--ignore-scripts') && args.includes('--package-lock-only')));
    assert.ok(fs.existsSync(path.join(directory, 'production.json')));
    assert.ok(fs.existsSync(path.join(directory, 'all.json')));
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test('critical findings in either scope fail even if the other scope passes', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dependency-audit-test-'));
  try {
    for (const criticalScope of ['production', 'all']) {
      let calls = 0;
      const code = audit({ outputDirectory: directory, summaryFile: path.join(directory, 'summary.md'),
        run: (_command, args) => {
          calls++;
          const scope = args.includes('--omit=dev') ? 'production' : 'all';
          return result(scope === criticalScope ? { critical: 1 } : {});
        } });
      assert.equal(code, 1);
      assert.equal(calls, 2);
    }
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test('a scan error is not hidden by a successful second scan', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dependency-audit-test-'));
  try {
    let call = 0;
    assert.equal(audit({ outputDirectory: directory, summaryFile: path.join(directory, 'summary.md'),
      run: () => ++call === 1 ? { status: 1, stdout: '{"error":{}}' } : result() }), 1);
    assert.equal(call, 2);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test('saved summaries deduplicate advisory roots and exclude unsafe Markdown', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dependency-audit-test-'));
  try {
    const scan = result({ high: 2 });
    const report = JSON.parse(scan.stdout);
    const advisory = { name: 'braces', severity: 'high', url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm' };
    report.vulnerabilities.braces = { via: [advisory, { ...advisory, name: '@everyone`\nInjected' }, { ...advisory, url: 'javascript:alert(1)' }] };
    scan.stdout = JSON.stringify(report);
    assert.equal(audit({ outputDirectory: directory, run: () => scan, summaryFile: path.join(directory, 'step-summary.md') }), 0);
    const summary = fs.readFileSync(path.join(directory, 'summary.md'), 'utf8');
    assert.equal(summary.split('- `braces`').length - 1, 1);
    assert.match(summary, /\[advisory\]\(https:\/\/github.com\/advisories\/GHSA-vfj7-8cjw-p6xm\)/);
    assert.doesNotMatch(summary, /Injected|javascript:/);
    assert.equal(fs.readFileSync(path.join(directory, 'step-summary.md'), 'utf8'), summary);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
