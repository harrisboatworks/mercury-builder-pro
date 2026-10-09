# Claude approved auto-merge

The cloud triage reviews a complete, unchanged `cursor/*` PR head and applies
`claude-approved` using the existing `harrisboatworks` account. Only same-repository
PRs targeting `main` qualify. A label from another account cannot authorize a merge.

The trusted `pull_request_target` handler records the label event and payload head
in an Actions comment and an immutable artifact from its main workflow run. Later
check events validate that artifact's provenance; a PR workflow posting a lookalike
Actions bot comment cannot grant approval. A new head removes the old approval.
Labels predating installation have no approval artifact: remove and reapply the
label after reviewing the current head. Artifacts expire after 90 days, requiring
a fresh label cycle if a PR remains held that long.
The separate Claude approval follow-through workflow makes one refresh after the
label handler publishes its artifact. GitHub forbids listening to one's own
workflow completion; the separate listener has no completion loop.

Frontend typecheck, Edge typecheck and test must all succeed in the real Test suite
workflow on the reviewed head. The latest Vercel status must succeed and belong to
the Vercel integration. Pending, skipped, cancelled and failed checks hold the PR,
as do changes-requested reviews. After checks pass, drafts are made ready and the
head, label cycle and checks are reread. The squash merge supplies the reviewed SHA
to GitHub's atomic merge guard. Only trusted main source executes with write access.
The merge and function-deploy concurrency groups use `queue: max` so later events
do not replace a pending approval or deployment (GitHub's default single-pending
behavior). GitHub caps each queue at 100 pending runs; a full-queue cancellation
remains a visible retry gate.

## Post-merge validation and deployment

`GITHUB_TOKEN` merges do not start ordinary push Actions workflows, so this handler
explicitly dispatches Test suite and Deploy Supabase edge functions. Both receive
the exact squash-merge SHA and refuse a commit outside main. Tests validate that
SHA. A delayed function-deploy dispatch checks out current main and covers the
range from the approved merge's parent through current main, preventing an older
queued dispatch from deploying stale source. Existing migration and pair guards
remain in force; no migration is applied. The normal main financing integration
credential gate also applies to the approved-merge test dispatch.

The bot PR comment records each dispatched pipeline. Dispatch acceptance is not
pipeline completion, Vercel production acceptance, actual function deployment or
live behavior proof. If dispatch fails after a merge, the merge remains completed
and the Actions job fails. Rerun that job, or dispatch Claude approved auto-merge
with its `pull_number` input. Recovery is restricted to a SHA-bound approved bot
merge; it dispatches both pipelines again (at-least-once delivery). Normal pipeline
retries may repeat their existing integration validation. A human merge follows
the normal push pipeline and is not eligible for this recovery path.

## Validation

```sh
node --test scripts/claude-approved-automerge.node-test.cjs scripts/validate-automerge-dispatch.node-test.cjs
actionlint .github/workflows/claude-approved-automerge.yml .github/workflows/tests.yml .github/workflows/supabase-functions-deploy.yml
```

The tests run in Test suite alongside the existing unit suite. No repository
secret, personal token, branch-protection bypass or new scheduled polling job is
needed for this workflow.

Actionlint 1.7.12 predates GitHub's documented `concurrency.queue: max`. For that
version, lint temporary copies omitting only that field, and verify the complete
workflow with GitHub's current validator. Do not remove the queue from production.
