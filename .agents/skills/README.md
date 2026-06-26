# Skills

This folder contains reusable [Claude Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) for the Stellar Community Fund (SCF) — covering application review, drafting, budgeting, prescreening, and more.

Each skill lives in its own directory as `skills/<name>/SKILL.md`, with YAML frontmatter (`name`, `description`) followed by the full instruction set.

## Available Skills

| Skill | Description |
|-------|-------------|
| [scf-round-reviewer](scf-round-reviewer/SKILL.md) | Review and rank an entire SCF round end-to-end from a CSV export. Supports Open Track, Integration Track, and RFP Track with track-specific scoring dimensions. Orchestrates parallel batch reviews, calibration, and final ranking. |
| [scf-reviewer](scf-reviewer/SKILL.md) | Review SCF Build Award applications across Integration, Open, and RFP tracks. Covers project fit, technical architecture, team readiness, traction, budget analysis, and funding recommendations. |
| [fetch-external-doc](fetch-external-doc/SKILL.md) | Fetch external documents linked in SCF submissions — Google Docs, Google Drive PDFs, GitHub, Notion, IPFS. Handles URL transformation and uses `curl` for reliable Google Docs/Drive fetching. |
| [scf-prescreen-checker](scf-prescreen-checker/SKILL.md) | Simulate the SCF team's manual prescreen (completeness + eligibility) before submission. Catches the issues that get submissions flagged or returned before they reach the review panel. |
| [scf-budget-builder](scf-budget-builder/SKILL.md) | Build bottom-up budgets with role-based rates, per-deliverable cost breakdowns, and tranche mapping. Validates against benchmarks from funded Build Awards. |
| [scf-competitor-analyst](scf-competitor-analyst/SKILL.md) | Analyze the competitive landscape — similar projects on Stellar and other chains — and articulate differentiation for the application. |
| [scf-submission-drafter](scf-submission-drafter/SKILL.md) | Draft Build Award applications interactively. Walks through project description, Stellar integration, architecture, team, deliverables, budget, and traction. |
| [scf-interest-form-drafter](scf-interest-form-drafter/SKILL.md) | Draft a strong Interest Form — the first filter that determines whether a team gets invited to submit a full application. |
| [scf-tranche-reporter](scf-tranche-reporter/SKILL.md) | Help funded teams write tranche submission reports with deliverable documentation, completion evidence, and the format reviewers expect. |
| [scf-referral-preparer](scf-referral-preparer/SKILL.md) | Prepare materials for an SCF referral. Covers what referrers evaluate and assembles a package that makes it easy for an approved Referrer (Ambassador, Navigator, Pilot, partner, or SDF personnel) to endorse the team. |

## Required External Skills (for reviewing)

When using the review skills (`scf-round-reviewer`, `scf-reviewer`), you should also install these external skills for Stellar domain knowledge:

- **[stellar/stellar-dev-skill](https://github.com/stellar/stellar-dev-skill)** — Soroban, RPC, Horizon, SEPs, Smart Accounts, ecosystem context
- **[OpenZeppelin/openzeppelin-skills](https://github.com/OpenZeppelin/openzeppelin-skills)** — Smart contract security patterns, Stellar contract setup/upgrades

These significantly improve scoring accuracy for Technical Depth, Stellar Integration, and smart contract architecture evaluation. In SCF #42 testing, adding these skills changed 40% of recommendation outcomes.

## Usage

Each skill is a directory containing a `SKILL.md` file with YAML frontmatter (`name`, `description`) followed by the full instruction set. Install the whole repo as a Claude Code plugin (see the [root README](../README.md#install-as-a-claude-code-plugin)), or point your AI tool/workflow directly at an individual `skills/<name>/SKILL.md` to load its framework.

For a turnkey review setup with CSV input and all skills pre-configured, see [scf-review-boilerplate](https://github.com/lumenloop/scf-review-boilerplate).

## Adding a New Skill

1. Create a new directory `skills/<name>/` and add a `SKILL.md` inside it.
2. Include YAML frontmatter with `name` (must equal the directory name) and a third-person, trigger-rich `description` (include a "Use when…" clause).
3. Write the skill body using the same structure: overview, process, evaluation criteria, output formats, red flags/strengths, and references. Put any bundled resources in `skills/<name>/references/` or `skills/<name>/scripts/`.
4. Update the table above and run `node scripts/validate_skills.mjs`.
