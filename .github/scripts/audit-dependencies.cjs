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
  return { report, counts, blocked: counts.critical > 0 };
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
  const advisories = new Map();
  for (const [scope, extra] of [['production', ['--omit=dev']], ['all', []]]) {
    const result = run('npm', ['audit', '--package-lock-only', '--ignore-scripts', '--audit-level=info', '--json', ...extra], {
      encoding: 'utf8', timeout: 300_000, killSignal: 'SIGKILL', maxBuffer: 32 * 1024 * 1024,
    });
    fs.writeFileSync(path.join(outputDirectory, `${scope}.json`), result.stdout || '{}');
    try {
      const { report, counts, blocked } = assessAudit(result);
      failed ||= blocked;
      for (const vulnerability of Object.values(report.vulnerabilities)) {
        for (const advisory of Array.isArray(vulnerability?.via) ? vulnerability.via : []) {
          if (advisory && ['high', 'critical'].includes(advisory.severity) &&
              typeof advisory.name === 'string' && advisory.name.length <= 214 &&
              /^(?:@[a-z0-9_.-]+\/)?[a-z0-9_.-]+$/i.test(advisory.name) &&
              typeof advisory.url === 'string' && advisory.url.length <= 200 &&
              /^https:\/\/github\.com\/advisories\/GHSA-[a-z0-9-]+$/i.test(advisory.url)) {
            advisories.set(advisory.url, `- \`${advisory.name}\` (${advisory.severity}): [advisory](${advisory.url})`);
          }
        }
      }
      summary.push(`| ${scope} | ${counts.critical} | ${counts.high} | ${counts.moderate} | ${counts.low} | ${blocked ? 'FAIL' : counts.high > 0 ? 'WARN' : 'PASS'} |`);
      console.log(`${scope}: ${counts.critical} critical, ${counts.high} high, ${counts.moderate} moderate, ${counts.low} low`);
      if (counts.high > 0) console.warn(`::warning::${scope}: ${counts.high} high-severity vulnerabilities found; review the dependency audit report.`);
    } catch (error) {
      failed = true;
      summary.push(`| ${scope} | — | — | — | — | SCAN ERROR |`);
      console.error(`${scope}: ${error.message}`);
    }
  }
  if (advisories.size) {
    summary.push('', '### High / critical advisory roots', '', ...[...advisories.values()].slice(0, 20));
    if (advisories.size > 20) summary.push('', 'Additional advisories are included in the full audit reports.');
  }
  summary.push('', 'Critical findings in either scope fail this check. High findings emit warnings; moderate and low findings remain visible in the reports.',
    'The all scope includes development/build dependencies; the production scope follows npm dependency classification.',
    'No dependencies are installed and no package lifecycle scripts are run.', '');
  const markdown = summary.join('\n');
  fs.writeFileSync(path.join(outputDirectory, 'summary.md'), markdown);
  if (summaryFile && path.resolve(summaryFile) !== path.resolve(outputDirectory, 'summary.md')) fs.appendFileSync(summaryFile, markdown);
  return failed ? 1 : 0;
}

module.exports = { assessAudit, audit };
if (require.main === module) process.exitCode = audit();
