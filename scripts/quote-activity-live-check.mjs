import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = (process.env.QUOTE_ACTIVITY_BASE_URL || 'https://www.mercuryrepower.ca').replace(/\/$/, '');
const sessionId = `qa_acceptance_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const capturedEvents = [];
const leadRequests = [];
const consoleErrors = [];
const pageErrors = [];
const trackingRequests = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  serviceWorkers: 'block',
  viewport: { width: 1280, height: 900 },
});

await context.addInitScript(({ acceptanceSessionId }) => {
  localStorage.setItem('quote_activity_session_id', acceptanceSessionId);

  // Keep the app's 2-second activity debounce open long enough for the three
  // customer steps below to be intentionally rapid relative to that window.
  const originalSetTimeout = window.setTimeout.bind(window);
  window.setTimeout = ((handler, timeout, ...args) => originalSetTimeout(
    handler,
    timeout === 2000 ? 8000 : timeout,
    ...args,
  ));
}, { acceptanceSessionId: sessionId });

const page = await context.newPage();

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  if (request.url().includes('quote_activity_events')) {
    trackingRequests.push({ method: request.method(), url: request.url() });
  }
});

await page.route('**/*quote_activity_events*', async (route) => {
  const request = route.request();
  if (request.method() === 'POST') {
    const rawPayload = request.postData() || '{}';
    const payload = JSON.parse(rawPayload);
    capturedEvents.push(...(Array.isArray(payload) ? payload : [payload]));
    await route.fulfill({ status: 201, body: '' });
    return;
  }

  await route.fulfill({
    status: 200,
    headers: {
      'access-control-expose-headers': 'content-range',
      'content-range': '*/0',
      'content-type': 'application/json',
    },
    body: request.method() === 'HEAD' ? '' : '[]',
  });
});

await page.route('**/*submit-quote-lead*', async (route) => {
  leadRequests.push(route.request().url());
  await route.abort('blockedbyclient');
});

try {
  await page.goto(`${baseUrl}/quote/motor-selection?quote_activity_acceptance=${sessionId}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.getByRole('heading', { name: 'Choose your power.', exact: true }).waitFor();

  const motorCard = page.locator('[data-motor-card="true"]').filter({
    has: page.getByRole('heading', { name: '20 ELHPT FourStroke', exact: true }),
  });
  assert.equal(await motorCard.count(), 1, 'expected one 20 ELHPT motor card');
  const buildButton = motorCard.getByRole('button', { name: /Build & Price/ });
  assert.equal(await buildButton.count(), 1, 'expected one Build & Price button in the motor card');
  await buildButton.click();
  const configureButton = page.getByRole('button', { name: /Configure this motor/i });
  await configureButton.waitFor();
  await configureButton.click();

  await page.waitForURL('**/quote/options');
  await page.getByRole('heading', { name: 'Options for your 20 ELHPT FourStroke', exact: true }).waitFor();

  const selectableOption = page.locator(
    'main [role="checkbox"][aria-checked="false"]:not([aria-disabled="true"])',
  );
  const selectableCount = await selectableOption.count();
  if (selectableCount > 0) {
    const selectedBefore = await page.locator('main [role="checkbox"][aria-checked="true"]').count();
    await selectableOption.first().click();
    await page.waitForFunction(
      (previousCount) => document.querySelectorAll('main [role="checkbox"][aria-checked="true"]').length > previousCount,
      selectedBefore,
    );
  } else {
    const selectedCount = await page.locator('main [role="checkbox"][aria-checked="true"]').count();
    assert.ok(selectedCount > 0, 'expected the options step to contain a selected option');
  }

  const continueButton = page.getByRole('button', { name: 'Continue', exact: true }).filter({ visible: true });
  assert.equal(await continueButton.count(), 1, 'expected one visible Continue button');
  await continueButton.click();

  await page.waitForURL('**/quote/purchase-path');
  await page.getByRole('heading', { name: 'Loose motor or professional install?', exact: true }).waitFor();
  const looseMotor = page.locator('button').filter({ hasText: 'Loose Motor' });
  assert.equal(await looseMotor.count(), 1, 'expected one Loose Motor purchase-path button');
  await looseMotor.click();
  await page.waitForURL('**/quote/trade-in');

  const expectedTypes = ['motor_selected', 'options_configured', 'purchase_path_chosen'];
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    const observed = capturedEvents.map((event) => event.event_type);
    if (expectedTypes.every((eventType) => observed.includes(eventType))) break;
    await page.waitForTimeout(100);
  }

  const eventOrder = capturedEvents
    .map((event) => event.event_type)
    .filter((eventType) => expectedTypes.includes(eventType));
  const motorIndex = eventOrder.indexOf('motor_selected');
  const optionsIndex = eventOrder.indexOf('options_configured');
  const pathIndex = eventOrder.indexOf('purchase_path_chosen');

  assert.ok(motorIndex >= 0, `motor_selected missing from ${eventOrder.join(' -> ')}`);
  assert.ok(optionsIndex > motorIndex, `options_configured out of order: ${eventOrder.join(' -> ')}`);
  assert.ok(pathIndex > optionsIndex, `purchase_path_chosen out of order: ${eventOrder.join(' -> ')}`);
  assert.equal(leadRequests.length, 0, 'the acceptance flow must never call submit-quote-lead');
  assert.deepEqual(pageErrors, [], `browser page errors: ${pageErrors.join(' | ')}`);

  console.log(JSON.stringify({
    ok: true,
    target: baseUrl,
    sessionId,
    eventOrder,
    analyticsWritesIntercepted: capturedEvents.length,
    leadRequests: leadRequests.length,
    consoleErrors,
    pageErrors,
  }, null, 2));
} catch (error) {
  const screenshotPath = `/tmp/quote-activity-acceptance-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});
  console.error(JSON.stringify({
    capturedEvents,
    trackingRequests,
    leadRequests,
    consoleErrors,
    pageErrors,
  }, null, 2));
  console.error(`Quote activity acceptance failed; screenshot: ${screenshotPath}`);
  throw error;
} finally {
  await browser.close();
}
