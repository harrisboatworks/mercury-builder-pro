'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('./validate-automerge-dispatch.cjs');
const SHA='a'.repeat(40), CURRENT='b'.repeat(40), PARENT='c'.repeat(40);
function args() { return {mergeSha:SHA,eventName:'workflow_dispatch',ref:'refs/heads/main',sha:CURRENT,
  git: a=>a[0]==='merge-base'?'':a[1]==='--verify'?SHA:a[1]==='HEAD'?CURRENT:PARENT}; }
test('normal push/PR/manual behavior stays on event SHA without git mutations',()=>{
  assert.deepEqual(validate({...args(),mergeSha:'',git:()=>{throw Error('unexpected git');}}),
    {checkout_sha:CURRENT,current_sha:CURRENT,merge_parent:''});
});
test('approved merge tests exact SHA and deploys current main across merge-parent range',()=>{
  assert.deepEqual(validate(args()),{checkout_sha:SHA,current_sha:CURRENT,merge_parent:PARENT});
});
test('injection, branch dispatch, PR event, missing/non-main commit all fail closed',()=>{
  for(const mutate of [a=>a.mergeSha='main; touch /tmp/x',a=>a.ref='refs/heads/cursor/x',a=>a.eventName='pull_request',
    a=>a.git=()=>{throw Error('not an ancestor');},a=>a.git=()=>CURRENT]) {
    const a=args(); mutate(a); assert.throws(()=>validate(a));
  }
});
