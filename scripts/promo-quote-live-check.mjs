import { chromium } from 'playwright';

const baseUrl = (process.env.PROMO_CANARY_BASE_URL || 'https://www.mercuryrepower.ca')
  .replace(/\/$/, '');
const screenshotPath = `${process.env.RUNNER_TEMP || '/tmp'}/promo-quote-canary.png`;
const expiresAt = process.env.PROMO_CANARY_EXPIRES_AT;
const retiresAt = process.env.PROMO_CANARY_RETIRES_AT;
const now = Date.now();

if (retiresAt && now >= Date.parse(retiresAt)) {
  console.log(JSON.stringify({ status: 'skipped', reason: 'rollover window ended', retiresAt }));
  process.exit(0);
}

const phase = process.env.PROMO_CANARY_PHASE ||
  (expiresAt && now >= Date.parse(expiresAt) ? 'expired' : 'active');

if (!['active', 'expired'].includes(phase)) {
  throw new Error(`Invalid PROMO_CANARY_PHASE: ${phase}`);
}

function requireMatch(text, pattern, description) {
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Missing ${description}. Expected ${pattern}, received: ${text.slice(0, 1_000)}`);
  }
  return Number(match[1].replaceAll(',', ''));
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
  const motorHeading = page.getByRole('heading', { name: /^60 ELPT FourStroke$/i }).first();
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
  await page.getByRole('heading', { name: /Options for your 60 ELPT/i }).waitFor();

  await clickVisible(page.getByRole('button', { name: /^Continue$/i }), 'options Continue button');
  await page.waitForURL(/\/quote\/purchase-path/);
  await page.getByRole('button', { name: /Loose Motor/i }).click();
  await page.waitForURL(/\/quote\/trade-in/);
}

function assertNoExpiredSummerSavings(text, location) {
  const stalePatterns = [
    /Summer Savings/i,
    /save up to \$700/i,
    /2\.99% for 24 months/i,
    /August 31, 2026/i,
  ];
  const stalePattern = stalePatterns.find((pattern) => pattern.test(text));
  if (stalePattern) {
    throw new Error(`Expired Summer Savings copy remained on ${location}: ${stalePattern}`);
  }
}

async function checkActivePromotion(page) {
  await page.goto(`${baseUrl}/quote/motor-selection?promo_canary=1`, {
    waitUntil: 'domcontentloaded',
  });
  await acceptCookies(page);
  await configureCanaryMotor(page);
  await page.getByRole('button', { name: /No trade-in/i }).click();
  await page.waitForURL(/\/quote\/promo-selection/);

  await page.getByText('Factory Rebate: $250 auto-applied', { exact: false }).waitFor();
  await page.getByText('Offer ends August 31, 2026', { exact: false }).waitFor();

  // Exercise both branches, then opt into promo financing. The 24-month rate
  // must persist even when the customer never clicks the rate tile itself.
  await page.getByRole('heading', { name: /^Standard TD Financing$/i })
    .locator('xpath=ancestor::button[1]')
    .click();
  await page.getByRole('heading', { name: /^Promotional Financing$/i })
    .locator('xpath=ancestor::button[1]')
    .click();

  const continueButton = page.getByRole('button', { name: /Apply Bonus & Continue/i });
  await continueButton.waitFor({ state: 'visible' });
  if (await continueButton.isDisabled()) {
    throw new Error('Promo Continue button stayed disabled after selecting promotional financing');
  }
  await continueButton.click();
  await page.waitForURL(/\/quote\/summary/);

  const skipIntro = page.getByRole('button', { name: /Skip intro/i });
  if (await skipIntro.isVisible().catch(() => false)) {
    await skipIntro.click();
  }

  await page.getByText('Mercury Rebate + 2.99% APR', { exact: false }).first().waitFor();
  await page.getByText('2.99% APR · 24 months', { exact: false }).first().waitFor();

  const pageText = await page.locator('body').innerText();
  if (!/Mercury Rebate[\s\S]{0,160}(?:−|-)\$250/.test(pageText)) {
    throw new Error('Summary did not show a $250 Mercury rebate line item');
  }

  const pricingPayment = requireMatch(
    pageText,
    /From \$([\d,]+)\/month/,
    'main financing payment',
  );
  const stickyPayment = requireMatch(
    pageText,
    /From \$([\d,]+)\/mo/,
    'sticky summary payment',
  );
  if (pricingPayment !== stickyPayment) {
    throw new Error(
      `Payment mismatch: pricing table is $${pricingPayment}/month, sticky summary is $${stickyPayment}/mo`,
    );
  }

  return {
    status: 'pass',
    phase,
    baseUrl,
    motor: '60 ELPT FourStroke',
    rebate: 250,
    financing: { rate: 2.99, months: 24, monthlyPayment: pricingPayment },
    offerEnds: '2026-08-31',
  };
}

async function checkExpiredPromotion(page) {
  await page.goto(`${baseUrl}/promotions?promo_canary=1`, {
    waitUntil: 'domcontentloaded',
  });
  await acceptCookies(page);
  await page.getByRole('heading', { name: /Mercury Financing as Low as/i }).waitFor();
  await page.waitForFunction(() => document.title === 'Mercury Outboard Promotions & Financing | HBW');
  const evergreenTitle = await page.title();

  const promotionsText = await page.locator('body').innerText();
  assertNoExpiredSummerSavings(promotionsText, '/promotions');
  if (await page.locator('meta[property="og:image"][content*="summer-savings"]').count()) {
    throw new Error('Expired Summer Savings social image remained in /promotions metadata');
  }

  await page.goto(`${baseUrl}/quote/motor-selection?promo_canary=1`, {
    waitUntil: 'domcontentloaded',
  });
  await page.getByRole('heading', { name: /^60 ELPT FourStroke$/i }).first().waitFor();
  const motorSelectionText = await page.locator('body').innerText();
  assertNoExpiredSummerSavings(motorSelectionText, '/quote/motor-selection');
  await configureCanaryMotor(page);

  await page.getByRole('button', { name: /No trade-in/i }).click();
  await page.waitForURL(/\/quote\/summary/);

  const skipIntro = page.getByRole('button', { name: /Skip intro/i });
  if (await skipIntro.isVisible().catch(() => false)) {
    await skipIntro.click();
  }

  const summaryText = await page.locator('body').innerText();
  assertNoExpiredSummerSavings(summaryText, '/quote/summary');
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
