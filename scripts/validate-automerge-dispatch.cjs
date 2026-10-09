'use strict';

const { execFileSync } = require('node:child_process');
const { appendFileSync } = require('node:fs');

function validate({ mergeSha, eventName, ref, sha, git }) {
  if (!mergeSha) return { checkout_sha: sha, current_sha: sha, merge_parent: '' };
  if (eventName !== 'workflow_dispatch' || ref !== 'refs/heads/main' ||
    !/^[0-9a-f]{40}$/.test(mergeSha)) throw new Error('Merge dispatch requires a full SHA and main ref');
  const read = args => git(args).trim();
  if (read(['rev-parse', '--verify', `${mergeSha}^{commit}`]) !== mergeSha) throw new Error('Invalid merge commit');
  git(['merge-base', '--is-ancestor', mergeSha, 'refs/remotes/origin/main']);
  // The deploy checkout uses current main, so a delayed dispatch deploys the
  // latest source across all changes since this merge's parent, never old code.
  const current = read(['rev-parse', 'HEAD']);
  git(['merge-base', '--is-ancestor', mergeSha, current]);
  return { checkout_sha: mergeSha, current_sha: current,
    merge_parent: read(['rev-parse', `${mergeSha}^`]) };
}

if (require.main === module) {
  const result = validate({ mergeSha: process.env.MERGE_SHA || '', eventName: process.env.GITHUB_EVENT_NAME,
    ref: process.env.GITHUB_REF, sha: process.env.GITHUB_SHA,
    git: args => execFileSync('git', args, { encoding: 'utf8' }) });
  if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT missing');
  for (const [key, value] of Object.entries(result)) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}
module.exports = { validate };
