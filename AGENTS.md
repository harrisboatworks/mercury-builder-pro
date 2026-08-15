# Agent rules

- Preserve dirty work. Do not revert, overwrite, or clean unrelated local changes.
- Use an isolated worktree when unrelated or concurrent work is present.
- Never expose secrets or customer-private data in prompts, logs, documentation, commits, shell history, or generated files.
- Do not hand-edit generated artifacts. Use the owning generator and review its diff intentionally.
- Follow the validation guidance in `README.md`; use `npm run verify:small` for normal changes.
- Require explicit authorization before merging to `main`, deploying to production, or making any production write or trigger.
- Treat GitHub `main` as authoritative and HBW Vercel as the production release path. Do not rely on unverified editor synchronization.
