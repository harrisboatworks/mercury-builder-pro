#!/usr/bin/env node
// Guards against factual errors that the October 2026 blog audit found repeated
// across many posts. Each rule is a fact the owner or a primary source has
// confirmed, and each had zero violations when the rule was added. Scans the
// published Markdown twins, so retired and redirected posts are ignored.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'public/blog';

const rules = [
  {
    id: 'route-not-highway-115',
    why: 'HBW is reached from Highway 401 Exit 472 (Cobourg) and County Road 18. Highway 115 and County Road 28 lead to Peterborough.',
    pattern: /401\s*(?:E|Este|est)?\s*\+\s*(?:Hwy\.?\s*)?115|(?:Highway|Hwy\.?|autoroute|autopista)\s*115\s*N?\b|County Road 28|chemin de comté 28/i,
    // A sentence that warns readers off the wrong road is allowed.
    allowLine: /Peterborough|not the route|n'est pas|no es la ruta/i,
  },
  {
    id: 'service-link-is-hbwservice',
    why: 'Service requests go to hbwservice.ca. hbw.wiki/service is the retired address.',
    pattern: /hbw\.wiki\/service/i,
  },
  {
    id: 'ministry-is-mnr',
    why: "Ontario's ministry has been the Ministry of Natural Resources (MNR) since 2024, not MNRF.",
    pattern: /\bMNRF\b|Natural Resources and Forestry|自然资源与林业部|自然資源與林業部|Recursos Naturales y Forestales|Richesses naturelles et des Forêts/,
  },
  {
    id: 'mercury-150-is-inline-four',
    why: 'The current Mercury 150 FourStroke and 150 Pro XS are inline four-cylinder engines. The V6 line starts at 175 HP.',
    pattern: /V6 repower \(150|150\s*(?:-|–|to)\s*225 HP V6\b/i,
  },
  {
    id: 'prop-size-ranges-not-comma-lists',
    why: 'Propeller diameter and pitch ranges must read as ranges (14–15"), not comma lists left behind by a punctuation sweep.',
    pattern: /^\|.*\b\d{1,2},\s\d{1,2}"/m,
  },
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

function body(markdown) {
  if (!markdown.startsWith('---')) return markdown;
  const end = markdown.indexOf('\n---', 3);
  return end === -1 ? markdown : markdown.slice(end + 4);
}

const failures = [];
const files = walk(ROOT);

for (const file of files) {
  const lines = body(fs.readFileSync(file, 'utf8')).split('\n');
  for (const rule of rules) {
    const perLine = new RegExp(rule.pattern.source, rule.pattern.flags.replace('m', ''));
    for (const line of lines) {
      if (!perLine.test(line)) continue;
      if (rule.allowLine && rule.allowLine.test(line)) continue;
      failures.push(`${file}: [${rule.id}] ${line.trim().slice(0, 160)}\n    ${rule.why}`);
    }
  }
}

if (failures.length) {
  console.error('Blog fact-drift check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Blog fact-drift check passed: ${rules.length} rules across ${files.length} published posts.`);
