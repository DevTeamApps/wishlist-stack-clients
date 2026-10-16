# Dependency security monitoring

Dependabot alerts and automatic security-update PRs must be enabled in repository settings. They were enabled and verified on October 16, 2026. The configuration file customizes supported ecosystems; it cannot enable those repository settings itself.

## Branch coverage

The SDK repository uses `main` as its default branch. Dependabot security alerts and security-update PRs use the default branch only. A `target-branch` entry can create routine version-update PRs for another branch, but cannot create security alerts or security-fix PRs there.

`.github/dependabot.yml` enables security-only configuration for npm and GitHub Actions. `open-pull-requests-limit: 0` suppresses routine version-update PRs, while security-update PRs remain enabled. No automatic merging is configured. The daily schedule in that file does not delay advisory-triggered security updates.

After a security fix is merged into main, publish and verify the patched SDK release. Upgrade the installed SDK in each consumer; merging a library fix does not update existing storefront installations.

## CI audits

The separate `Dependency security` workflow runs on PRs and pushes targeting main. Scheduled and manually dispatched runs explicitly check out and audit main. The daily schedule is 15:23 UTC (08:23 PDT or 07:23 PST); GitHub schedules can be delayed. The workflow must be merged into the default branch for scheduled runs, and its script files must exist on main.

Each audit runs npm against the committed lockfile twice: production dependencies and all dependencies including development/build tooling. It does not install packages or run lifecycle scripts. Counts appear in the Actions summary, and raw JSON reports are retained as workflow artifacts for 14 days.

High/critical findings in either scope fail the check. Moderate/low findings remain visible. Registry failures, invalid output, and timeouts also fail rather than appearing clean. Existing dependency debt can make the first runs red; this monitoring change does not upgrade the application dependencies.

The workflow uses read-only repository permissions, does not retain checkout credentials, and pins its actions to release commit hashes. Existing build/typecheck/test workflows remain separate. A failing audit blocks merging only after an administrator makes the audit check required in branch protection/rulesets; it does not independently stop an external deployment.

## Alert delivery and response

Repository administrators should verify Dependabot settings and choose a primary responder plus backup. Each responder must enable their personal security-alert email/web notifications and watch the repository for security alerts. Repository enablement does not configure an individual's notification preferences or email the entire existing backlog.

Review the initial backlog in Security → Dependabot. Review critical alerts within one business day; escalate reachable or actively exploited vulnerabilities immediately. Record the affected deployment, owner, decision, fix PR, and deployed verification. Do not dismiss alerts solely because a package is transitive or labeled as a development dependency.

This workflow covers known dependency advisories, not first-party authorization or injection bugs. Continue application security review and subscribe to security notices for Shopify, Netlify, Node, and other separately managed infrastructure.
