const base = (process.env.KNOWLEDGE_CANARY_SUPABASE_URL ||
  'https://eutsoqdpjurknjsshxes.supabase.co').replace(/\/$/, '');
const site = (process.env.KNOWLEDGE_CANARY_SITE_URL ||
  'https://www.mercuryrepower.ca').replace(/\/$/, '');

async function postFunction(name, body) {
  const response = await fetch(`${base}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${name} returned ${response.status}: ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${name} returned non-JSON: ${text.slice(0, 500)}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function callVoiceTool(name, args = {}) {
  const response = await postFunction('elevenlabs-mcp-server', {
    jsonrpc: '2.0',
    id: name,
    method: 'tools/call',
    params: { name, arguments: args },
  });
  const text = response?.result?.content?.map((item) => item.text || '').join('\n') || '';
  assert(text, `Voice tool ${name} returned no text`);
  return text;
}

const [chat, voice, brand] = await Promise.all([
  postFunction('ai-chatbot-stream', { knowledgeProbe: true }),
  postFunction('elevenlabs-conversation-token', { knowledgeProbe: true }),
  fetch(`${site}/.well-known/brand.json`, { signal: AbortSignal.timeout(20_000) })
    .then(async (response) => {
      if (!response.ok) throw new Error(`brand.json returned ${response.status}`);
      return response.json();
    }),
]);

for (const [label, snapshot] of [['chat', chat], ['voice', voice]]) {
  assert(snapshot.sourceVersion, `${label} has no sourceVersion`);
  assert(snapshot.business?.published === true, `${label} is using the fallback business profile`);
  assert(snapshot.motors?.count > 0, `${label} has no customer-visible motors`);
  assert(snapshot.motors?.digest, `${label} has no motor digest`);
  assert(snapshot.promotions?.digest, `${label} has no promotion digest`);
  assert(snapshot.financing?.count > 0, `${label} has no active financing`);
}

assert(chat.sourceVersion === voice.sourceVersion,
  `Chat/voice source versions differ: ${chat.sourceVersion} vs ${voice.sourceVersion}`);
assert(chat.motors.digest === voice.motors.digest, 'Chat/voice motor facts differ');
assert(chat.promotions.digest === voice.promotions.digest, 'Chat/voice promotion facts differ');
assert(chat.financing.digest === voice.financing.digest, 'Chat/voice financing facts differ');
assert(chat.business.phone === brand.contact?.phone, 'AI phone differs from published brand profile');
assert(JSON.stringify(chat.business.hours) === JSON.stringify(brand.contact?.hours),
  'AI hours differ from published brand profile');

const [deals, financing, hours] = await Promise.all([
  callVoiceTool('check_current_deals'),
  callVoiceTool('check_financing_options'),
  callVoiceTool('get_store_hours'),
]);
const toolText = `${deals}\n${financing}\n${hours}`;
for (const staleFact of ['342-9980', 'Vancouver, BC', 'Sunday: Closed', 'Sunday closed']) {
  assert(!toolText.includes(staleFact), `Voice tools exposed stale fact: ${staleFact}`);
}

const rates = [...chat.financing.context.matchAll(/(\d+(?:\.\d+)?)% APR/g)].map((match) => match[1]);
for (const rate of new Set(rates)) {
  assert(financing.includes(`${rate}% APR`), `Voice financing omitted live ${rate}% APR option`);
}
if (chat.promotions.count > 0) {
  const promoName = chat.promotions.context.match(/^## ([^\n]+)/m)?.[1];
  if (promoName && !promoName.startsWith('CURRENT')) {
    assert(deals.includes(promoName), `Voice deals omitted active promotion ${promoName}`);
  }
}

console.log(JSON.stringify({
  ok: true,
  sourceVersion: chat.sourceVersion,
  motorCount: chat.motors.count,
  inStockCount: chat.motors.inStockCount,
  promotionCount: chat.promotions.count,
  financingCount: chat.financing.count,
  businessProfileUpdated: chat.business.lastUpdated,
}, null, 2));
