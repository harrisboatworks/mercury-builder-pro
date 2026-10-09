import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const baseUrl = (process.env.PROMO_CANARY_BASE_URL || 'https://www.mercuryrepower.ca')
  .replace(/\/$/, '');
const screenshotPath = `${process.env.RUNNER_TEMP || '/tmp'}/promo-quote-canary.png`;
const expiresAt = process.env.PROMO_CANARY_EXPIRES_AT;
const retiresAt = process.env.PROMO_CANARY_RETIRES_AT;
const now = Date.now();

export const PROMO_RATE = 2.99;
export const PROMO_TERM_MONTHS = 24;

const promoRateSource = String(PROMO_RATE).replace('.', '\\.');
const promoTermSource = String(PROMO_TERM_MONTHS);

/**
 * Same-line match for the Chase promo rate and 24-month term.
 * Accepts the compact #674 teaser (`$311/mo · 24 mo · 2.99% OAC`) and older
 * wording (`2.99% APR · 24 months`) so small copy tweaks do not flake.
 * Fails when the rate or term is missing, split across lines, or wrong.
 */
export const PROMO_FINANCING_LINE_PATTERN = new RegExp(
  String.raw`(?:${promoRateSource}\s*%[^\n]{0,80}${promoTermSource}(?:\s*|-)?mo(?:nths?)?\b|${promoTermSource}(?:\s*|-)?mo(?:nths?)?\b[^\n]{0,80}${promoRateSource}\s*%)`,
  'i',
);

export const FROM_MONTHLY_PAYMENT_PATTERN = /From\s+\$([\d,]+)\/(?:mo(?:nths?)?)/i;

export function findPromoFinancingLine(text) {
  const match = String(text).match(PROMO_FINANCING_LINE_PATTERN);
  return match?.[0] ?? null;
}

export function requirePromoFinancingLine(text) {
  const line = findPromoFinancingLine(text);
  if (!line) {
    throw new Error(
      `Missing promotional financing line with ${PROMO_RATE}% and ${PROMO_TERM_MONTHS} mo. Received: ${String(text).slice(0, 1_000)}`,
    );
  }
  return line;
}

export function collectFromPayments(text) {
  return [...String(text).matchAll(new RegExp(FROM_MONTHLY_PAYMENT_PATTERN, 'gi'))].map((match) =>
    Number(match[1].replaceAll(',', '')),
  );
}

export function requireFromPayments(text, { minimum = 2 } = {}) {
  const payments = collectFromPayments(text);
  if (payments.length < minimum) {
    throw new Error(
      `Expected at least ${minimum} From $…/mo financing payments, found ${payments.length}. Received: ${String(text).slice(0, 1_000)}`,
    );
  }
  const [first, ...rest] = payments;
  const mismatch = rest.find((payment) => payment !== first);
  if (mismatch !== undefined) {
    throw new Error(`Payment mismatch: From $…/mo values were ${payments.map((amount) => `$${amount}`).join(', ')}`);
  }
  return first;
}

function canaryUrl(pathWithQuery) {
  const url = new URL(pathWithQuery, `${baseUrl}/`);
  const utmSource = process.env.PROMO_CANARY_UTM_SOURCE;
  if (utmSource) {
    url.searchParams.set('utm_source', utmSource);
  }
  return url.toString();
}

async function clickVisible(locator, description) {
  await locator.first().waitFor({ state: 'attached' });
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click();
      return;
    }
  }
  throw new Error(`Could not find a visible ${description}`);
}

async function acceptCookies(page) {
  const cookieButton = page.getByRole('button', { name: /accept|allow all/i });
  if (await cookieButton.first().isVisible().catch(() => false)) {
    await cookieButton.first().click();
  }
}

async function configureCanaryMotor(page) {
  const motorHeading = page.getByRole('heading', { name: /^25 ELPT FourStroke$/i }).first();
  await motorHeading.waitFor({ state: 'visible' });
  const motorCard = motorHeading.locator(
    'xpath=ancestor::div[.//button[contains(normalize-space(.), "Build & Price")]][1]',
  );
  await motorCard.getByRole('button', { name: /Build & Price/i }).click();
  await clickVisible(
    page.getByRole('button', { name: /Configure This Motor/i }),
    'Configure This Motor button',
  );
  await page.waitForURL(/\/quote\/options/);
  await page.getByRole('heading', { name: /Options for your 25 ELPT/i }).waitFor();

  await clickVisible(page.getByRole('button', { name: /^Continue$/i }), 'options Continue button');
  await page.waitForURL(/\/quote\/purchase-path/);
  await page.getByRole('button', { name: /Loose Motor/i }).click();
  await page.waitForURL(/\/quote\/trade-in/);
}

function assertNoExpiredChaseSavings(text, location) {
  const stalePatterns = [
    /Chase the Savings/i,
    /save up to \$400/i,
    /2\.99% for 24 months/i,
    /October 30, 2026/i,
  ];
  const stalePattern = stalePatterns.find((pattern) => pattern.test(text));
  if (stalePattern) {
    throw new Error(`Expired Chase the Savings copy remained on ${location}: ${stalePattern}`);
  }
}

async function checkActivePromotion(page) {
  await page.goto(canaryUrl('/quote/motor-selection?promo_canary=1&hp=all'), {
    waitUntil: 'domcontentloaded',
  });
  await acceptCookies(page);
  await configureCanaryMotor(page);
  await page.getByRole('button', { name: /No trade-in/i }).click();
  await page.waitForURL(/\/quote\/promo-selection/);

  await page.getByText('Factory Rebate: $400 auto-applied', { exact: false }).waitFor();
  await page.getByText('Offer ends October 30, 2026', { exact: false }).waitFor();

  // Exercise the cash branch first. The rebate must remain applied and no
  // financing language should leak into the summary.
  await page.getByRole('heading', { name: /^Cash Purchase$/i })
    .locator('xpath=ancestor::button[1]')
    .click();
  const cashContinueButton = page.getByRole('button', { name: /Continue to Quote/i });
  await cashContinueButton.click();
  await page.waitForURL(/\/quote\/summary/);

  const cashSkipIntro = page.getByRole('button', { name: /Skip intro/i });
  if (await cashSkipIntro.isVisible().catch(() => false)) {
    await cashSkipIntro.click();
  }

  await page.getByText('Cash purchase selected', { exact: true }).waitFor();
  const cashPageText = await page.locator('body').innerText();
  if (!/Mercury Rebate[\s\S]{0,160}(?:−|-)\$400/.test(cashPageText)) {
    throw new Error('Cash summary did not retain the $400 Mercury rebate line item');
  }
  if (FROM_MONTHLY_PAYMENT_PATTERN.test(cashPageText)) {
    throw new Error('Cash summary still displayed a monthly financing payment');
  }
  if (await page.getByRole('button', { name: /Apply for Financing/i }).count()) {
    throw new Error('Cash summary still displayed an Apply for Financing button');
  }

  await page.getByRole('button', { name: /^Promo(?:, step|$)/i }).click();
  await page.waitForURL(/\/quote\/promo-selection/);

  // Then opt into promo financing. The 24-month rate must persist even when
  // the customer never clicks the rate tile itself.
  await page.getByRole('heading', { name: /^Standard TD Financing$/i })
    .locator('xpath=ancestor::button[1]')
    .click();
  await page.getByRole('heading', { name: /^Promotional Financing$/i })
    .locator('xpath=ancestor::button[1]')
    .click();

  const continueButton = page.getByRole('button', { name: /Continue to Quote/i });
  await continueButton.waitFor({ state: 'visible' });
  // Playwright's click waits for the React effect that persists the default
  // 24-month rate and enables the button. An immediate isDisabled() check races
  // that effect even though a real customer click succeeds a moment later.
  await continueButton.click();
  await page.waitForURL(/\/quote\/summary/);

  const skipIntro = page.getByRole('button', { name: /Skip intro/i });
  if (await skipIntro.isVisible().catch(() => false)) {
    await skipIntro.click();
  }

  await page.getByText('Mercury Rebate + 2.99% APR', { exact: false }).first().waitFor();
  await page.waitForFunction(
    (source) => new RegExp(source, 'i').test(document.body.innerText),
    PROMO_FINANCING_LINE_PATTERN.source,
  );

  const pageText = await page.locator('body').innerText();
  requirePromoFinancingLine(pageText);
  if (!/Mercury Rebate[\s\S]{0,160}(?:−|-)\$400/.test(pageText)) {
    throw new Error('Summary did not show a $400 Mercury rebate line item');
  }

  const pricingPayment = requireFromPayments(pageText);

  return {
    status: 'pass',
    phase,
    baseUrl,
    motor: '25 ELPT FourStroke',
    rebate: 400,
    financing: { rate: PROMO_RATE, months: PROMO_TERM_MONTHS, monthlyPayment: pricingPayment },
    offerEnds: '2026-10-30',
  };
}

async function checkExpiredPromotion(page) {
  await page.goto(canaryUrl('/promotions?promo_canary=1'), {
    waitUntil: 'domcontentloaded',
  });
  await acceptCookies(page);
  await page.getByRole('heading', { name: /Mercury Financing as Low as/i }).waitFor();
  await page.waitForFunction(() => document.title === 'Mercury Outboard Promotions & Financing | HBW');
  const evergreenTitle = await page.title();

  const promotionsText = await page.locator('body').innerText();
  assertNoExpiredChaseSavings(promotionsText, '/promotions');
  if (await page.locator('meta[property="og:image"][content*="chase-savings"]').count()) {
    throw new Error('Expired Chase the Savings social image remained in /promotions metadata');
  }

  await page.goto(canaryUrl('/quote/motor-selection?promo_canary=1&hp=all'), {
    waitUntil: 'domcontentloaded',
  });
  await page.getByRole('heading', { name: /^25 ELPT FourStroke$/i }).first().waitFor();
  const motorSelectionText = await page.locator('body').innerText();
  assertNoExpiredChaseSavings(motorSelectionText, '/quote/motor-selection');
  await configureCanaryMotor(page);

  await page.getByRole('button', { name: /No trade-in/i }).click();
  await page.waitForURL(/\/quote\/summary/);

  const skipIntro = page.getByRole('button', { name: /Skip intro/i });
  if (await skipIntro.isVisible().catch(() => false)) {
    await skipIntro.click();
  }

  const summaryText = await page.locator('body').innerText();
  assertNoExpiredChaseSavings(summaryText, '/quote/summary');
  if (/Mercury Rebate/i.test(summaryText)) {
    throw new Error('Expired Mercury rebate remained in the quote summary');
  }

  return {
    status: 'pass',
    phase,
    baseUrl,
    evergreenTitle,
    summerSavingsVisible: false,
    rebateApplied: false,
    checkedAfter: expiresAt,
  };
}

async function run() {
  if (retiresAt && now >= Date.parse(retiresAt)) {
    console.log(JSON.stringify({ status: 'skipped', reason: 'rollover window ended', retiresAt }));
    return;
  }

  if (!['active', 'expired'].includes(phase)) {
    throw new Error(`Invalid PROMO_CANARY_PHASE: ${phase}`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1_000 },
    locale: 'en-CA',
  });

  // Local verification hook: simulate the post-expiry Supabase response without
  // changing production data. The scheduled workflow never sets this flag.
  if (process.env.PROMO_CANARY_MOCK_EXPIRED === '1') {
    await context.route('**/rest/v1/promotions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '*/0' },
        body: '[]',
      });
    });
  }

  const page = await context.newPage();
  page.setDefaultTimeout(30_000);

  try {
    const result = phase === 'expired'
      ? await checkExpiredPromotion(page)
      : await checkActivePromotion(page);
    console.log(JSON.stringify(result));
  } catch (error) {
    const failureText = await page.locator('body').innerText().catch(() => '');
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    console.error(`Failed at ${page.url()}`);
    console.error(failureText.slice(0, 2_000));
    console.error(`Promo quote canary failed. Screenshot: ${screenshotPath}`);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

const phase = process.env.PROMO_CANARY_PHASE ||
  (expiresAt && now >= Date.parse(expiresAt) ? 'expired' : 'active');

const isDirectRun = Boolean(process.argv[1]) &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await run();
}
