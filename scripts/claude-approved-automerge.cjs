'use strict';

// Runs only from trusted main. Nothing from a PR checkout is executed here.
const LABEL = 'claude-approved';
const APPROVER = 'harrisboatworks';
const BOT = 'github-actions[bot]';
const CHECKS = ['Frontend typecheck', 'Edge typecheck', 'test'];
const MARKER = '<!-- hbw-claude-approval:';
const RECEIPT = '<!-- hbw-claude-merge:';
const PIPELINES = ['tests.yml', 'supabase-functions-deploy.yml'];

function eligible(pr, repo) {
  return pr.base?.ref === 'main' && pr.base?.repo?.full_name === repo &&
    pr.head?.repo?.full_name === repo && pr.head.ref.startsWith('cursor/') &&
    pr.labels.some(l => l.name === LABEL);
}
function labelCycle(events) {
  const relevant = events.filter(e => e.label?.name === LABEL &&
    ['labeled', 'unlabeled'].includes(e.event)).sort((a, b) => a.id - b.id);
  const last = relevant.at(-1);
  return last?.event === 'labeled' && last.actor?.login === APPROVER ? last : null;
}
function record(comments, marker, cycle) {
  for (const c of [...comments].reverse()) {
    if (c.user?.login !== BOT || c.user?.type !== 'Bot' || !c.body.startsWith(marker)) continue;
    try {
      const value = JSON.parse(c.body.slice(marker.length).split(' -->')[0]);
      if (String(value.labelEventId) === String(cycle.id)) return { comment: c, value };
    } catch { /* User text is data; malformed records never confer approval. */ }
  }
  return null;
}
function checksPass(checks, statuses, sha) {
  const selected = CHECKS.map(name => checks.filter(c => c.name === name)
    .sort((a, b) => b.id - a.id)[0]);
  if (selected.some(c => !c || c.head_sha !== sha || c.app?.slug !== 'github-actions' ||
    c.status !== 'completed' || c.conclusion !== 'success')) return null;
  // Vercel's App-created commit status currently omits creator. Its immutable
  // App avatar identifies integration 8329; a user-created lookalike fails.
  const vercel = statuses.filter(s => s.context === 'Vercel').sort((a, b) => b.id - a.id)[0];
  if (!vercel || vercel.state !== 'success' ||
    !/^https:\/\/vercel\.com\/hbw\/mercury-builder-pro\//.test(vercel.target_url || '') ||
    (vercel.creator ? vercel.creator.login !== 'vercel[bot]' :
      !/^https:\/\/avatars\.githubusercontent\.com\/in\/8329\?/.test(vercel.avatar_url || ''))) return null;
  return selected;
}
function blockingReview(reviews) {
  const decisions = new Map();
  for (const r of [...reviews].sort((a, b) => a.id - b.id)) {
    if (['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(r.state)) decisions.set(r.user.login, r.state);
  }
  return [...decisions.values()].includes('CHANGES_REQUESTED');
}
function body(marker, value, text) { return `${marker}${JSON.stringify(value)} -->\n${text}`; }

async function run({ github, context, core, pullNumber, writeApproval = value => {
  require('node:fs').mkdirSync('approval-artifact', { recursive: true });
  require('node:fs').writeFileSync('approval-artifact/approval.json', JSON.stringify(value));
} }) {
  const { owner, repo } = context.repo;
  const repoName = `${owner}/${repo}`;
  const args = { owner, repo };
  const api = github.rest;
  const list = (method, extra) => github.paginate(method, { ...args, per_page: 100, ...extra });
  const getPR = async number => (await api.pulls.get({ ...args, pull_number: number })).data;
  const cycleFor = async number => labelCycle(await list(api.issues.listEventsForTimeline, { issue_number: number }));
  const commentsFor = number => list(api.issues.listComments, { issue_number: number });
  const log = message => core.info(message);
  const artifactName = (number, cycle, sha) => `claude-approval-${number}-${cycle.id}-${sha}`;
  async function trustedApproval(candidate, number, cycle) {
    if (!candidate || !/^[0-9a-f]{40}$/.test(candidate.value.sha) ||
      !/^[0-9]+$/.test(String(candidate.value.runId))) return false;
    const source = (await api.actions.getWorkflowRun({ ...args, run_id: candidate.value.runId })).data;
    if (source.path !== '.github/workflows/claude-approved-automerge.yml' ||
      source.event !== 'pull_request_target' || source.actor?.login !== APPROVER) return false;
    // Immutable artifact names bind the label event and reviewed head to a
    // trusted workflow run. A PR workflow can impersonate the Actions comment
    // author, but cannot upload an artifact into this trusted run.
    const ancestry = (await api.repos.compareCommitsWithBasehead({ ...args, basehead: `${source.head_sha}...main` })).data;
    if (!['behind', 'identical'].includes(ancestry.status)) return false;
    const artifacts = await list(api.actions.listWorkflowRunArtifacts, { run_id: candidate.value.runId });
    return artifacts.some(a => !a.expired && a.name === artifactName(number, cycle, candidate.value.sha));
  }
  const eventPR = context.payload.pull_request;
  const numbers = pullNumber ? [Number(pullNumber)] : eventPR ? [eventPR.number] :
    (await list(api.pulls.list, { state: 'open', base: 'main' })).filter(p => eligible(p, repoName)).map(p => p.number);

  async function drop(number, expectedCycle, expectedHead) {
    const pr = await getPR(number);
    const current = await cycleFor(number);
    if (pr.state === 'open' && pr.head.sha === expectedHead && current?.id === expectedCycle.id &&
      pr.labels.some(l => l.name === LABEL)) {
      await api.issues.removeLabel({ ...args, issue_number: number, name: LABEL });
      log(`#${number}: removed approval after head changed; fresh review/relabel required`);
    }
  }

  async function release(pr, cycle, approval) {
    // Recovery is restricted to our own approved bot merges, including a retry
    // after a dispatch failure. Arbitrary merged PRs cannot start deployments.
    if (!pr.merged || pr.merged_by?.login !== BOT || approval.value.sha !== pr.head.sha) return;
    const comments = await commentsFor(pr.number);
    let receipt = record(comments, RECEIPT, cycle);
    // Receipts are advisory, not authority to skip a pipeline. Recovery is
    // at-least-once: rerunning a failed merge job dispatches both pipelines.
    const value = { labelEventId: cycle.id, sha: pr.merge_commit_sha, dispatched: [] };
    if (value.sha !== pr.merge_commit_sha || !/^[0-9a-f]{40}$/.test(value.sha) ||
      !Array.isArray(value.dispatched)) throw new Error('Invalid merge receipt');
    async function save() {
      const text = body(RECEIPT, value, `Approved head ${pr.head.sha} squash-merged as ${value.sha}. Post-merge pipelines dispatched: ${value.dispatched.join(', ') || 'pending'}. Deployment/live verification remain separate gates.`);
      if (receipt) await api.issues.updateComment({ ...args, comment_id: receipt.comment.id, body: text });
      else receipt = { comment: (await api.issues.createComment({ ...args, issue_number: pr.number, body: text })).data, value };
    }
    await save();
    for (const workflow_id of PIPELINES) {
      await api.actions.createWorkflowDispatch({ ...args, workflow_id, ref: 'main', inputs: { merge_sha: value.sha } });
      value.dispatched.push(workflow_id);
      await save();
    }
    log(`#${pr.number}: post-merge pipeline dispatch receipts saved`);
  }

  async function gate(pr) {
    const runs = await list(api.checks.listForRef, { ref: pr.head.sha, filter: 'all' });
    const statuses = await list(api.repos.listCommitStatusesForRef, { ref: pr.head.sha });
    const selected = checksPass(runs, statuses, pr.head.sha);
    if (!selected) return false;
    // A similarly named job in another workflow must not impersonate tests.
    const ids = new Set();
    for (const check of selected) {
      const match = check.details_url?.match(/\/actions\/runs\/(\d+)\/job\//);
      if (!match) return false;
      ids.add(match[1]);
    }
    if (ids.size !== 1) return false;
    const workflow = (await api.actions.getWorkflowRun({ ...args, run_id: [...ids][0] })).data;
    if (workflow.path !== '.github/workflows/tests.yml' || workflow.event !== 'pull_request' ||
      workflow.head_sha !== pr.head.sha || workflow.conclusion !== 'success') return false;
    if (blockingReview(await list(api.pulls.listReviews, { pull_number: pr.number }))) return false;
    return true;
  }

  for (const number of numbers) {
    let pr = await getPR(number);
    if (!eligible(pr, repoName)) continue;
    let cycle = await cycleFor(number);
    if (!cycle) { log(`#${number}: no current trusted label cycle`); continue; }
    let comments = await commentsFor(number);
    let approval = record(comments, MARKER, cycle);
    let approvedHere = false;
    if (context.eventName === 'pull_request_target' && context.payload.action === 'labeled' &&
      context.payload.label?.name === LABEL && context.payload.sender?.login === APPROVER &&
      eventPR?.number === number && eventPR.updated_at === cycle.created_at) {
      if (eventPR.head.sha !== pr.head.sha) { await drop(number, cycle, pr.head.sha); continue; }
      approvedHere = true;
      const name = artifactName(number, cycle, eventPR.head.sha);
      core.setOutput('approval_artifact', name);
      writeApproval({
        repo: repoName, number, labelEventId: cycle.id, sha: eventPR.head.sha, runId: context.runId,
      });
      if (!approval || approval.value.sha !== eventPR.head.sha || approval.value.runId !== context.runId) {
        await api.issues.createComment({ ...args, issue_number: number,
          body: body(MARKER, { labelEventId: cycle.id, sha: eventPR.head.sha, runId: context.runId },
            `Claude approval recorded for head ${eventPR.head.sha}. A new commit requires a new review and label cycle.`) });
        comments = await commentsFor(number);
        approval = record(comments, MARKER, cycle);
      }
    }
    if (!approval || (!approvedHere && !await trustedApproval(approval, number, cycle))) {
      log(`#${number}: no trusted SHA-bound approval artifact; remove/reapply label after review`); continue;
    }
    if (approval.value.sha !== pr.head.sha) { await drop(number, cycle, pr.head.sha); continue; }
    if (pr.merged) { await release(pr, cycle, approval); continue; }
    if (pr.state !== 'open' || !await gate(pr)) { log(`#${number}: required checks/reviews pending or failed`); continue; }

    if (pr.draft) {
      // Drafts may have no CI until ready; approval alone does not make ready.
      await github.graphql('mutation($id:ID!){markPullRequestReadyForReview(input:{pullRequestId:$id}){pullRequest{id}}}', { id: pr.node_id });
    }
    // Re-read the mutable boundaries after readiness and immediately before
    // merge. REST's sha parameter atomically rejects a new head at merge time.
    pr = await getPR(number);
    const currentCycle = await cycleFor(number);
    if (!eligible(pr, repoName) || pr.state !== 'open' || pr.draft || pr.head.sha !== approval.value.sha ||
      currentCycle?.id !== cycle.id || pr.mergeable !== true || !await gate(pr)) continue;
    const result = (await api.pulls.merge({ ...args, pull_number: number, merge_method: 'squash', sha: approval.value.sha })).data;
    if (!result.merged) throw new Error(`#${number}: GitHub refused guarded merge`);
    log(`#${number}: squash-merged ${approval.value.sha} as ${result.sha}`);
    await release(await getPR(number), cycle, approval);
  }
}

module.exports = { run, eligible, labelCycle, record, checksPass, blockingReview };
