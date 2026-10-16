const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const severities = ['critical', 'high', 'moderate', 'low', 'info'];

// An unavailable/malformed scanner result must fail, never look like a clean scan.
function assessAudit(result) {
  if (result.error || result.signal || ![0, 1].includes(result.status)) {
    throw new Error('npm audit did not complete successfully');
  }
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error('npm audit returned invalid JSON');
  }
  const counts = report.metadata?.vulnerabilities;
  if (report.error || report.auditReportVersion !== 2 || !counts ||
      !report.vulnerabilities || typeof report.vulnerabilities !== 'object' ||
      severities.some(level => !Number.isSafeInteger(counts[level]) || counts[level] < 0)) {
    throw new Error('npm audit returned an error or incomplete vulnerability counts');
  }
  if (result.status === 0 && severities.some(level => counts[level] > 0)) {
    throw new Error('npm audit exit status disagrees with its vulnerability counts');
  }
  if (result.status === 1 && severities.every(level => counts[level] === 0)) {
    throw new Error('npm audit exited unsuccessfully without reporting vulnerabilities');
  }
  return { report, counts, blocked: counts.critical > 0 || counts.high > 0 };
}

function audit({ run = spawnSync, outputDirectory = 'dependency-audit', summaryFile = process.env.GITHUB_STEP_SUMMARY } = {}) {
  fs.mkdirSync(outputDirectory, { recursive: true });
  const summary = [
    '## Dependency security audit',
    '',
    '| Scope | Critical | High | Moderate | Low | Result |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
  ];
  let failed = false;
  for (const [scope, extra] of [['production', ['--omit=dev']], ['all', []]]) {
    const result = run('npm', ['audit', '--package-lock-only', '--ignore-scripts', '--json', ...extra], {
      encoding: 'utf8', timeout: 120_000, maxBuffer: 32 * 1024 * 1024,
    });
    fs.writeFileSync(path.join(outputDirectory, `${scope}.json`), result.stdout || '{}');
    try {
      const { counts, blocked } = assessAudit(result);
      failed ||= blocked;
      summary.push(`| ${scope} | ${counts.critical} | ${counts.high} | ${counts.moderate} | ${counts.low} | ${blocked ? 'FAIL' : 'PASS'} |`);
      console.log(`${scope}: ${counts.critical} critical, ${counts.high} high, ${counts.moderate} moderate, ${counts.low} low`);
    } catch (error) {
      failed = true;
      summary.push(`| ${scope} | — | — | — | — | SCAN ERROR |`);
      console.error(`${scope}: ${error.message}`);
    }
  }
  summary.push('', 'High or critical findings in either scope fail this check. Moderate and low findings remain visible in the reports.',
    'The all scope includes development/build dependencies; the production scope follows npm dependency classification.',
    'No dependencies are installed and no package lifecycle scripts are run.', '');
  if (summaryFile) fs.appendFileSync(summaryFile, summary.join('\n'));
  return failed ? 1 : 0;
}

module.exports = { assessAudit, audit };
if (require.main === module) process.exitCode = audit();
