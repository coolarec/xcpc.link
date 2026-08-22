# Website Issue Preview Comment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Comment the successful Vercel Preview URL back onto the website-submission Issue associated with an automatically generated PR branch.

**Architecture:** Add a repository workflow triggered by successful `deployment_status` events. It accepts only branches matching `issue/<number>-add-site`, finds the open PR for that branch, then creates or updates one marker-tagged Issue comment so redeployments replace the URL instead of adding duplicates.

**Tech Stack:** GitHub Actions, `actions/github-script@v7`, Vitest, YAML.

## Global Constraints

- Do not change the existing Issue-to-PR workflow or gallery data.
- Only successful HTTPS deployments from `issue/<number>-add-site` branches may be written to Issues.
- Repeated deployments must update the existing bot comment identified by `<!-- site-preview-deployment -->`.
- The workflow needs only read access to contents, deployments and pull requests, plus write access to Issues.

---

### Task 1: Comment successful preview deployments on their source Issues

**Files:**
- Create: `.github/workflows/comment-site-preview.yml`
- Modify: `src/issueAutomationConfig.test.ts`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-08-22-issue-site-submission-design.md`

**Interfaces:**
- Consumes: GitHub `deployment_status` payload fields `deployment.ref`, `deployment_status.state`, `deployment_status.environment_url`, and `deployment_status.target_url`.
- Produces: one Issue comment containing `<!-- site-preview-deployment -->`, the latest HTTPS Preview URL, and the related PR number.

- [x] **Step 1: Write the failing configuration test**

Add a Vitest case that reads `.github/workflows/comment-site-preview.yml` and asserts the `deployment_status` trigger, restricted permissions, branch regex, HTTPS URL validation, PR lookup, marker, and create/update comment calls.

- [x] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run src/issueAutomationConfig.test.ts`

Expected: FAIL because `.github/workflows/comment-site-preview.yml` does not exist.

- [x] **Step 3: Add the workflow**

Create a `deployment_status` workflow using `actions/github-script@v7`. On successful status, match `issue/<number>-add-site`, normalize the environment or target URL with `new URL`, require HTTPS, find the open PR by head branch, then update the existing marker comment or create it when absent.

- [x] **Step 4: Document the Issue comment behavior**

Update README and the approved design so they state that Preview appears both on the PR and, after a successful deployment, as a single updated comment on the source Issue.

- [x] **Step 5: Verify GREEN and repository configuration**

Run:

```bash
npm test -- --run
ruby -e "require 'yaml'; Dir['.github/**/*.{yml,yaml}'].each { |file| YAML.load_file(file) }; puts 'YAML OK'"
git diff --check
```

Expected: all tests pass, YAML parses, and the diff has no whitespace errors.

- [x] **Step 6: Commit**

```bash
git add .github/workflows/comment-site-preview.yml src/issueAutomationConfig.test.ts README.md docs/superpowers/specs/2026-08-22-issue-site-submission-design.md docs/superpowers/plans/2026-08-22-issue-preview-comment.md
git commit -m "feat: comment preview links on site issues"
```
