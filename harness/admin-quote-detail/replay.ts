import { SITE_URL } from '@/lib/site';
import {
  DEPOSIT_SAVED_ID,
  PRIVATE_DOCUMENT_URL,
  PRIVATE_DOWNLOAD_URL,
  RESERVATION_DOWNLOAD_URL,
  SUBMITTED_ID,
} from './fixtures';
import { getHarnessEvents, resetHarnessEvents, type HarnessEvent } from './harness-log';

export type ScenarioName = 'submitted' | 'deposit';

export type ScenarioResult = {
  scenario: ScenarioName;
  pass: boolean;
  checks: Array<{ name: string; pass: boolean; actual: string }>;
};

const savedDepositUrl = `${SITE_URL}/quote/saved/${DEPOSIT_SAVED_ID}`;

function textIncludes(needle: string) {
  return document.body.innerText.includes(needle);
}

function waitForText(needle: string, timeoutMs = 8000) {
  const started = Date.now();
  return new Promise<void>((resolve, reject) => {
    const tick = () => {
      const panel = document.querySelector('[data-harness-panel]');
      const pageText = panel
        ? document.body.innerText.replace(panel.textContent || '', '')
        : document.body.innerText;
      if (pageText.includes(needle)) {
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timed out waiting for ${needle}`));
        return;
      }
      window.setTimeout(tick, 40);
    };
    tick();
  });
}

function clickPageButton(label: string) {
  const buttons = [...document.querySelectorAll('button')].filter(
    (button) => !button.closest('[data-harness-panel]'),
  );
  const match = buttons.find((button) => (button.textContent || '').replace(/\s+/g, ' ').trim() === label);
  if (!match) throw new Error(`Missing page button ${label}`);
  match.click();
}

function eventsOf(kind: HarnessEvent['kind']) {
  return getHarnessEvents().filter((event) => event.kind === kind);
}

function check(name: string, pass: boolean, actual: string) {
  return { name, pass, actual };
}

function invokeBodies(name: string) {
  return eventsOf('invoke')
    .filter((event) => event.detail.name === name)
    .map((event) => event.detail.body);
}

export async function replayScenario(scenario: ScenarioName): Promise<ScenarioResult> {
  resetHarnessEvents(['invoke', 'clipboard', 'download', 'local-fetch']);
  if (scenario === 'submitted') {
    await waitForText('Submitted quote HBW-150193');
    const screenChecks = [
      check('submitted receipt', textIncludes('Submitted quote HBW-150193'), 'Submitted quote HBW-150193'),
      check('private link hint', textIncludes('Copy Link creates a private link to the original PDF, valid for 30 days.'), 'private link hint'),
      check('no canonical card', !textIncludes('Canonical reservation PDF'), 'canonical heading absent'),
      check('no edit full quote', !textIncludes('Edit Full Quote'), 'edit button absent'),
      check('no public saved url', !textIncludes(`${SITE_URL}/quote/saved/`), 'saved url absent'),
    ];
    clickPageButton('Copy Link');
    await waitForText(PRIVATE_DOCUMENT_URL);
    clickPageButton('Download PDF');
    await waitForDownload(PRIVATE_DOWNLOAD_URL);
    clickPageButton('Email Quote');
    await waitForInvoke('admin-consultation-document', 'admin-email');
    const checks = [
      ...screenChecks,
      check(
        'clipboard is private document url',
        eventsOf('clipboard').some((event) => event.detail.text === PRIVATE_DOCUMENT_URL),
        JSON.stringify(eventsOf('clipboard').map((event) => event.detail.text)),
      ),
      check(
        'share invoke',
        invokeBodies('admin-consultation-document').some((body) =>
          matchesBody(body, { action: 'admin-share', quoteId: SUBMITTED_ID })),
        JSON.stringify(invokeBodies('admin-consultation-document')),
      ),
      check(
        'download invoke',
        invokeBodies('admin-consultation-document').some((body) =>
          matchesBody(body, { action: 'admin-download', quoteId: SUBMITTED_ID })),
        JSON.stringify(invokeBodies('admin-consultation-document')),
      ),
      check(
        'download click is private pdf',
        eventsOf('download').some((event) => event.detail.href === PRIVATE_DOWNLOAD_URL),
        JSON.stringify(eventsOf('download')),
      ),
      check(
        'email invoke',
        invokeBodies('admin-consultation-document').some((body) =>
          matchesBody(body, { action: 'admin-email', quoteId: SUBMITTED_ID, emailIntent: 'send' })),
        JSON.stringify(invokeBodies('admin-consultation-document')),
      ),
      check('no send-quote-email', invokeBodies('send-quote-email').length === 0, JSON.stringify(invokeBodies('send-quote-email'))),
      check('no reservation api', invokeBodies('quote-document-api').length === 0, JSON.stringify(invokeBodies('quote-document-api'))),
      check('no reservation fetch', eventsOf('local-fetch').length === 0, JSON.stringify(eventsOf('local-fetch'))),
    ];
    return { scenario, pass: checks.every((item) => item.pass), checks };
  }

  await waitForText('Canonical reservation PDF');
  await waitForText(`${SITE_URL}/quote/saved/${DEPOSIT_SAVED_ID.slice(0, 8)}...`);
  const screenChecks = [
    check('canonical card', textIncludes('Canonical reservation PDF'), 'canonical heading'),
    check('bound status', textIncludes('Status: bound'), 'Status: bound'),
    check('saved quote prefix', textIncludes(`${SITE_URL}/quote/saved/${DEPOSIT_SAVED_ID.slice(0, 8)}...`), 'saved prefix'),
    check('deposit email note', textIncludes('tracked three-audience confirmation'), 'three-audience note'),
    check('no submitted receipt', !textIncludes('Submitted quote'), 'submitted heading absent'),
    check('no email quote button', ![...document.querySelectorAll('button')].some((button) =>
      !button.closest('[data-harness-panel]') && (button.textContent || '').includes('Email Quote')), 'email button absent'),
  ];
  clickPageButton('Copy Link');
  await waitForClipboard(savedDepositUrl);
  clickPageButton('Download canonical reservation PDF');
  await waitForLocalFetch(RESERVATION_DOWNLOAD_URL);
  const checks = [
    ...screenChecks,
    check(
      'clipboard is saved quote url',
      eventsOf('clipboard').some((event) => event.detail.text === savedDepositUrl),
      JSON.stringify(eventsOf('clipboard').map((event) => event.detail.text)),
    ),
    check(
      'no consultation invoke',
      invokeBodies('admin-consultation-document').length === 0,
      JSON.stringify(invokeBodies('admin-consultation-document')),
    ),
    check(
      'reservation invoke',
      invokeBodies('quote-document-api').some((body) =>
        matchesBody(body, { action: 'download', savedQuoteId: DEPOSIT_SAVED_ID })),
      JSON.stringify(invokeBodies('quote-document-api')),
    ),
    check(
      'local reservation fetch',
      eventsOf('local-fetch').some((event) => event.detail.url === RESERVATION_DOWNLOAD_URL),
      JSON.stringify(eventsOf('local-fetch')),
    ),
    check(
      'reservation filename',
      eventsOf('download').some((event) => event.detail.download === `HBW-reservation-${DEPOSIT_SAVED_ID.slice(0, 8)}.pdf`),
      JSON.stringify(eventsOf('download')),
    ),
  ];
  return { scenario, pass: checks.every((item) => item.pass), checks };
}

function matchesBody(actual: unknown, expected: Record<string, unknown>) {
  if (!actual || typeof actual !== 'object') return false;
  return Object.entries(expected).every(([key, value]) => (actual as Record<string, unknown>)[key] === value);
}

function waitForInvoke(name: string, action: string) {
  const started = Date.now();
  return new Promise<void>((resolve, reject) => {
    const tick = () => {
      const found = invokeBodies(name).some((body) => matchesBody(body, { action }));
      if (found) {
        resolve();
        return;
      }
      if (Date.now() - started > 4000) {
        reject(new Error(`Timed out waiting for ${name} ${action}`));
        return;
      }
      window.setTimeout(tick, 40);
    };
    tick();
  });
}

function waitForClipboard(text: string) {
  const started = Date.now();
  return new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (eventsOf('clipboard').some((event) => event.detail.text === text)) {
        resolve();
        return;
      }
      if (Date.now() - started > 4000) {
        reject(new Error(`Timed out waiting for clipboard ${text}`));
        return;
      }
      window.setTimeout(tick, 40);
    };
    tick();
  });
}

function waitForDownload(href: string) {
  const started = Date.now();
  return new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (eventsOf('download').some((event) => event.detail.href === href)) {
        resolve();
        return;
      }
      if (Date.now() - started > 4000) {
        reject(new Error(`Timed out waiting for download ${href}`));
        return;
      }
      window.setTimeout(tick, 40);
    };
    window.setTimeout(tick, 0);
  });
}

function waitForLocalFetch(url: string) {
  const started = Date.now();
  return new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (eventsOf('local-fetch').some((event) => event.detail.url === url)) {
        resolve();
        return;
      }
      if (Date.now() - started > 4000) {
        reject(new Error(`Timed out waiting for local fetch ${url}`));
        return;
      }
      window.setTimeout(tick, 40);
    };
    tick();
  });
}

export function blockedEvents() {
  return getHarnessEvents().filter((event) => event.kind === 'blocked');
}
