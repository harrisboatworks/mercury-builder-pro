'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { run, eligible, labelCycle, record, checksPass, blockingReview } = require('./claude-approved-automerge.cjs');
const SHA = 'a'.repeat(40), NEW = 'b'.repeat(40), MERGE = 'c'.repeat(40);
const REPO = 'harrisboatworks/mercury-builder-pro';
function pr() { return { number: 9, node_id: 'PR_9', state: 'open', draft: false, merged: false, mergeable: true,
  updated_at: '2026-10-09T18:00:00Z', labels: [{ name: 'claude-approved' }],
  base: { ref: 'main', repo: { full_name: REPO } },
  head: { ref: 'cursor/example', sha: SHA, repo: { full_name: REPO } } }; }
function cycle() { return { id: 101, event: 'labeled', label: { name: 'claude-approved' },
  actor: { login: 'harrisboatworks' }, created_at: '2026-10-09T18:00:00Z' }; }
function checks() { return ['Frontend typecheck','Edge typecheck','test'].map((name,i) => ({
  id: i + 1, name, app: { slug: 'github-actions' }, head_sha: SHA, status: 'completed', conclusion: 'success',
  details_url: 'https://github.com/harrisboatworks/mercury-builder-pro/actions/runs/80/job/1' })); }
function statuses() { return [{ id: 10, context: 'Vercel', state: 'success',
  target_url: 'https://vercel.com/hbw/mercury-builder-pro/deployment',
  avatar_url: 'https://avatars.githubusercontent.com/in/8329?v=4' }]; }
function stamp(sha = SHA, runId = 42) { return { id: 1, user: { login: 'github-actions[bot]', type: 'Bot' },
  body: `<!-- hbw-claude-approval:${JSON.stringify({ labelEventId: 101, sha, runId })} -->\nApproved` }; }
function fixture({ event = 'status', stamped = true } = {}) {
  const current = pr(), calls = [], data = { checks: checks(), statuses: statuses(), comments: stamped ? [stamp()] : [],
    events: [cycle()], reviews: [], artifacts: [{ name: `claude-approval-9-101-${SHA}`, expired: false }],
    sourceEvent: 'pull_request_target', sourceActor: 'harrisboatworks', ancestry: 'behind' };
  const listMethod = name => Object.assign(async () => {}, { listName: name });
  const github = { rest: { pulls: {}, issues: {}, checks: {}, repos: {}, actions: {} },
    graphql: async (_, args) => { calls.push(['ready', args]); current.draft = false; },
    paginate: async (method, args) => { calls.push(['paginate', method.listName, args.per_page]);
      return method.listName === 'prs' ? [current] : data[method.listName]; } };
  github.rest.pulls.list = listMethod('prs');
  github.rest.pulls.listReviews = listMethod('reviews');
  github.rest.issues.listEventsForTimeline = listMethod('events');
  github.rest.issues.listComments = listMethod('comments');
  github.rest.checks.listForRef = listMethod('checks');
  github.rest.repos.listCommitStatusesForRef = listMethod('statuses');
  github.rest.actions.listWorkflowRunArtifacts = listMethod('artifacts');
  github.rest.pulls.get = async () => { calls.push(['get']); return { data: structuredClone(current) }; };
  github.rest.pulls.merge = async args => { calls.push(['merge', args]);
    if (args.sha !== current.head.sha) throw new Error('409 head moved');
    current.merged = true; current.state = 'closed'; current.merge_commit_sha = MERGE;
    current.merged_by = { login: 'github-actions[bot]' }; return { data: { merged: true, sha: MERGE } }; };
  github.rest.issues.removeLabel = async () => { calls.push(['remove']); current.labels = []; };
  github.rest.issues.createComment = async args => { const comment = { id: data.comments.length + 1,
    user: { login: 'github-actions[bot]', type: 'Bot' }, body: args.body };
    calls.push(['comment',args]); data.comments.push(comment); return { data: comment }; };
  github.rest.issues.updateComment = async args => { calls.push(['update',args]); data.comments.find(c => c.id === args.comment_id).body = args.body; };
  github.rest.actions.getWorkflowRun = async ({ run_id }) => ({ data: String(run_id) === '80' ?
    { path: '.github/workflows/tests.yml', event: 'pull_request', head_sha: SHA, conclusion: 'success' } :
    { path: '.github/workflows/claude-approved-automerge.yml', event: data.sourceEvent,
      actor: { login: data.sourceActor }, head_sha: 'd'.repeat(40) } });
  github.rest.repos.compareCommitsWithBasehead = async () => ({ data: { status: data.ancestry } });
  github.rest.actions.createWorkflowDispatch = async args => { calls.push(['dispatch',args]); };
  const context = { repo: { owner: 'harrisboatworks', repo: 'mercury-builder-pro' }, eventName: event, runId: 42,
    payload: event === 'pull_request_target' ? { action: 'labeled', label: { name: 'claude-approved' },
      sender: { login: 'harrisboatworks' }, pull_request: structuredClone(current) } : {} };
  const core = { info: () => {}, setOutput: (key,value) => calls.push(['output',key,value]) };
  return { current, calls, data, context, github, core,
    execute: () => run({ github, context, core, writeApproval: value => calls.push(['artifact',value]) }) };
}

test('owner, base, branch, approval and fork boundaries', () => {
  assert.equal(eligible(pr(),REPO),true);
  for (const mutate of [p=>p.base.ref='develop',p=>p.head.ref='codex/example',
    p=>p.head.repo.full_name='attacker/fork',p=>p.labels=[]]) {
    const p=pr(); mutate(p); assert.equal(eligible(p,REPO),false);
  }
});
test('latest label cycle and trusted actor only', () => {
  assert.equal(labelCycle([cycle()]).id,101);
  assert.equal(labelCycle([cycle(),{...cycle(),id:102,event:'unlabeled'}]),null);
  assert.equal(labelCycle([{...cycle(),actor:{login:'attacker'}}]),null);
  assert.equal(record([{...stamp(),user:{login:'attacker',type:'User'}}],'<!-- hbw-claude-approval:',cycle()),null);
  assert.equal(record([{...stamp(),body:'<!-- hbw-claude-approval:{bad -->'}],'<!-- hbw-claude-approval:',cycle()),null);
});
test('all named checks, current head, trusted apps and latest reruns must succeed', () => {
  assert.ok(checksPass(checks(),statuses(),SHA));
  for (const status of ['failure','skipped','cancelled',null]) {
    const c=checks(); c[0].conclusion=status; assert.equal(checksPass(c,statuses(),SHA),null);
  }
  for (const mutate of [c=>c.pop(),c=>c[0].status='in_progress',c=>c[0].head_sha=NEW,
    c=>c[0].app.slug='other',c=>c.push({...c[0],id:99,conclusion:'failure'})]) {
    const c=checks(); mutate(c); assert.equal(checksPass(c,statuses(),SHA),null);
  }
  for (const mutate of [s=>s.pop(),s=>s[0].state='pending',s=>s[0].avatar_url='https://example.com',
    s=>s[0].target_url='https://vercel.com/attacker/project/id',s=>s.push({...s[0],id:99,state:'failure'})]) {
    const s=statuses(); mutate(s); assert.equal(checksPass(checks(),s,SHA),null);
  }
});
test('commented review does not erase a changes-requested decision', () => {
  assert.ok(blockingReview([{id:1,state:'CHANGES_REQUESTED',user:{login:'owner'}},{id:2,state:'COMMENTED',user:{login:'owner'}}]));
  assert.equal(blockingReview([{id:1,state:'CHANGES_REQUESTED',user:{login:'owner'}},{id:2,state:'DISMISSED',user:{login:'owner'}}]),false);
});
test('green draft gets ready, SHA-guarded squash and explicit main pipeline dispatches', async () => {
  const f=fixture(); f.current.draft=true; await f.execute();
  assert.equal(f.calls.filter(c=>c[0]==='merge').length,1);
  assert.equal(f.calls.find(c=>c[0]==='merge')[1].sha,SHA);
  assert.equal(f.calls.find(c=>c[0]==='merge')[1].merge_method,'squash');
  assert.ok(f.calls.findIndex(c=>c[0]==='ready') < f.calls.findIndex(c=>c[0]==='merge'));
  assert.deepEqual(f.calls.filter(c=>c[0]==='dispatch').map(c=>[c[1].workflow_id,c[1].ref,c[1].inputs.merge_sha]),
    [['tests.yml','main',MERGE],['supabase-functions-deploy.yml','main',MERGE]]);
  assert.ok(f.calls.filter(c=>c[0]==='paginate').every(c=>c[2]===100));
});
test('fresh label binds payload head, label event, trusted run and artifact', async () => {
  const f=fixture({event:'pull_request_target',stamped:false}); await f.execute();
  assert.equal(f.calls.find(c=>c[0]==='artifact')[1].sha,SHA);
  assert.ok(f.calls.some(c=>c[0]==='merge'));
});
test('new push invalidates approval; old label event cannot stamp newer head', async () => {
  for (const event of ['status','pull_request_target']) {
    const f=fixture({event}); f.current.head.sha=NEW; await f.execute();
    assert.ok(f.calls.some(c=>c[0]==='remove')); assert.ok(!f.calls.some(c=>c[0]==='merge'));
  }
});
test('missing stamp, forged Actions comment/artifact, wrong ancestry and new cycle fail closed', async () => {
  for (const mutate of [f=>f.data.comments=[], f=>f.data.artifacts=[],
    f=>f.data.sourceEvent='pull_request',f=>f.data.sourceActor='attacker',f=>f.data.ancestry='diverged',
    f=>f.data.events.push({...cycle(),id:102}),f=>f.data.artifacts[0].expired=true]) {
    const f=fixture(); mutate(f); await f.execute(); assert.ok(!f.calls.some(c=>c[0]==='merge'));
  }
});
test('delayed/relabelled label event does not bind to a newer cycle', async () => {
  const f=fixture({event:'pull_request_target',stamped:false});
  f.data.events=[{...cycle(),id:102,created_at:'2026-10-09T18:01:00Z'}]; await f.execute();
  assert.ok(!f.calls.some(c=>c[0]==='artifact'||c[0]==='merge'));
});
test('review changes and latest failed/pending check hold draft without readiness', async () => {
  for (const mutate of [f=>f.data.reviews=[{id:1,state:'CHANGES_REQUESTED',user:{login:'owner'}}],
    f=>f.data.checks.push({...checks()[0],id:99,status:'in_progress',conclusion:null})]) {
    const f=fixture(); f.current.draft=true; mutate(f); await f.execute();
    assert.ok(!f.calls.some(c=>c[0]==='ready'||c[0]==='merge'));
  }
});
test('head moves after readiness: re-read holds merge', async () => {
  const f=fixture(); f.current.draft=true;
  f.github.graphql=async()=>{f.current.draft=false;f.current.head.sha=NEW;}; await f.execute();
  assert.ok(!f.calls.some(c=>c[0]==='merge'));
});
test('GitHub rejects final merge race; no pipeline is dispatched', async () => {
  const f=fixture(); f.github.rest.pulls.merge=async()=>{throw new Error('409 head moved');};
  await assert.rejects(f.execute(),/409/); assert.ok(!f.calls.some(c=>c[0]==='dispatch'));
});
test('same named checks from another workflow do not pass', async () => {
  const f=fixture(); const original=f.github.rest.actions.getWorkflowRun;
  f.github.rest.actions.getWorkflowRun=async args=>{
    const result=await original(args); if(String(args.run_id)==='80') result.data.path='.github/workflows/lookalike.yml';
    return result;
  };
  await f.execute(); assert.ok(!f.calls.some(c=>c[0]==='merge'));
});
test('label removed during draft readiness holds merge', async () => {
  const f=fixture(); f.current.draft=true;
  f.github.graphql=async()=>{f.current.draft=false;f.data.events.push({...cycle(),id:102,event:'unlabeled'});};
  await f.execute(); assert.ok(!f.calls.some(c=>c[0]==='merge'));
});
test('partial post-merge dispatch failure is visible and throws for recovery', async () => {
  const f=fixture(); f.github.rest.actions.createWorkflowDispatch=async args=>{
    f.calls.push(['dispatch',args]); if(args.workflow_id==='supabase-functions-deploy.yml') throw Error('dispatch denied');
  };
  await assert.rejects(f.execute(),/dispatch denied/);
  assert.ok(f.current.merged);
  assert.ok(f.data.comments.some(c=>c.body.includes('Post-merge pipelines dispatched: tests.yml.')));
});
test('merged bot PR can retry dispatch; a human merge cannot', async () => {
  for (const actor of ['github-actions[bot]','harrisboatworks']) {
    const f=fixture({event:'pull_request_target'}); f.current.state='closed'; f.current.merged=true;
    f.current.merged_by={login:actor}; f.current.merge_commit_sha=MERGE;
    await f.execute(); assert.equal(f.calls.filter(c=>c[0]==='dispatch').length,actor==='github-actions[bot]'?2:0);
  }
});
