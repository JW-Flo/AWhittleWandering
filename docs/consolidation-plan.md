# Documentation consolidation plan

Goal
- Create a single authoritative `docs/` directory containing canonical, human-facing documentation and migration guides. Keep short how-tos next to code when they are tiny; move long-form operational and security docs under `docs/`.

Proposed steps
1. Inventory existing docs (done — many files at repo root and `docs/` subfolders).
2. Pick canonical files for each topic:
   - Secrets & sync: `SYNC_SECRETS_GUIDE.md`, `GITHUB_SECRETS_GUIDE.md`, `SECRET_MANAGEMENT_SUMMARY.md`
   - Deployment: `DEPLOYMENT.md`, `DEPLOY_PAGES.md`, `DEPLOYMENT.md`
   - Security & incident: `SECURITY.md`, `SECURITY_INCIDENT_REMEDIATION.md`
   - Roadmap & status: `ROADMAP.md`, `STATUS_UPDATE.md`
3. Copy canonical files into `docs/` and update links to point to `docs/*`.
4. Add `docs/README.md` (index) and a top-level `CONTRIBUTING_DOCS.md` with doc contribution rules (naming, frontmatter, TOC).
5. Open a PR that:
   - Moves files (git mv) where appropriate (not just copy).
   - Updates internal links (use `repo-wide sed` in a single commit).
   - Adds a small CI check that ensures `docs/` contains required files.

Automation & safeguards
- Use a single branch `docs/move-consolidation` for the whole change so reviewers get one cohesive diff.
- Add a `scripts/update-doc-links.sh` to safely update links and a follow-up CI job to catch broken links.
- Keep legacy docs in their original location for one release (tag) and rely on review to delete duplicates afterward.

Quick commands (run from repository root):

```bash
# create the branch
git checkout -b docs/move-consolidation

# copy canonical files into docs/
mkdir -p docs
git mv SYNC_SECRETS_GUIDE.md docs/ || cp SYNC_SECRETS_GUIDE.md docs/
git mv GITHUB_SECRETS_GUIDE.md docs/ || cp GITHUB_SECRETS_GUIDE.md docs/

# update links (preview first)
./scripts/update-doc-links.sh --preview

# push and open PR
git commit -m \"docs: consolidate canonical docs into docs/\" || true
git push --set-upstream origin docs/move-consolidation
gh pr create --title \"Docs: consolidate canonical docs\" --body \"Moves canonical docs into docs/ and updates links\" --base main
```

Acceptance criteria
- `docs/index.md` exists and links to main categories.
- No site-broken links (CI job passes).
- One PR consolidates the moves with maintainer review.

