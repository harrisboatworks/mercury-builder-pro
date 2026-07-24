#!/usr/bin/env node
/**
 * HBW storage / transport operating-canon validator
 * --------------------------------------------------
 * Detects customer-facing claims that contradict the operating rules repaired
 * in PRs #119-#121:
 *
 * - HBW offers outdoor winter storage with shrinkwrap only.
 * - Customers arrange fall drop-off and spring pickup.
 * - HBW does not provide or arrange transport or transport referrals.
 * - The physical marina is closed December 1 through April 1.
 * - Storage pricing, capacity, battery handling, and commissioning scope come
 *   from the current written quote/work order, not timeless promises.
 *
 * This is intentionally attribution- and polarity-aware. Comparison content
 * may discuss indoor/heated storage, third-party transport, and winter access;
 * explicit HBW denials using those same terms must also remain valid.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEXT_EXTENSIONS = new Set(['.html', '.js', '.jsx', '.json', '.md', '.ts', '.tsx', '.txt']);
const CUSTOMER_CONTENT_ROOTS = [
  'src/components',
  'src/data',
  'src/pages',
  'public/blog',
  'public/locations',
  'supabase/functions/_shared',
];
const CUSTOMER_CONTENT_FILES = [
  'public/catalog.md',
  'public/llms.txt',
];

const ATTRIBUTION = String.raw`(?:\bHBW\b|Harris Boat Works|\bwe\b|\bour (?:marina|yard|lot|facility|shop|team|(?:winter )?storage(?: program)?)\b)`;
const STORAGE_TIER = String.raw`(?:indoor|heated(?: indoor)?|climate[- ]controlled|year[- ]round|summer)`;
const TRANSPORT_TARGET = String.raw`(?:transport|hauler|hauling|carrier|towing service|tow service)`;

const RULES = [
  {
    id: 'storage-outdoor-only',
    message: 'HBW must not be presented as offering indoor, heated, climate-controlled, summer, or year-round storage.',
    patterns: [
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,36}\\b(?:offer(?:s|ed)?|provide(?:s|d)?|has|have|includes?|books?|accepts?)\\b[^.!?;\\n]{0,32}\\b${STORAGE_TIER}\\b[^.!?;\\n]{0,18}\\bstorage\\b`, 'i'),
      new RegExp(`\\b${STORAGE_TIER}\\b[^.!?;\\n]{0,18}\\bstorage\\b[^.!?;\\n]{0,45}\\b(?:available|offered|provided|bookable)\\b[^.!?;\\n]{0,25}\\b(?:at|from|through|with)\\s+(?:HBW|Harris Boat Works|us|our (?:marina|shop|facility))\\b`, 'i'),
      new RegExp(`\\b${STORAGE_TIER}\\b[^.!?;\\n]{0,18}\\bstorage\\b[^.!?;\\n]{0,80}\\b(?:at|from|through|with)\\s+(?:HBW|Harris Boat Works|us|our (?:marina|shop|facility))\\b`, 'i'),
      new RegExp(`\\b(?:at|from|through|with)\\s+(?:HBW|Harris Boat Works|us|our (?:marina|shop|facility))\\b[^.!?;\\n]{0,80}\\b${STORAGE_TIER}\\b[^.!?;\\n]{0,18}\\bstorage\\b`, 'i'),
      /\bstorage:\**\s*year[- ]round\b/i,
      /\byear[- ]round (?:outdoor )?storage here\b/i,
      /\byear[- ]round storage relationship\b/i,
      /\byear[- ]round option\b/i,
      /\[year[- ]round storage\]\(\/blog\/boat-storage-kawartha-lakes\)/i,
      /\b(?:boats?|vessels?)\b[^.!?;\n]{0,35}\blives? at HBW year[- ]round\b/i,
      /\bcustomers?\b[^.!?;\n]{0,30}\bstore here year[- ]round\b/i,
      /\bwe do both\b[^.!?;\n]{0,60}\b(?:indoor|heated|storage|shrinkwrap)\b/i,
      /\bindoor and shrinkwrap (?:storage )?pricing at mercuryrepower\.ca\b/i,
    ],
    allow: [
      /^!?comparison of\b/i,
    ],
  },
  {
    id: 'customer-transport-only',
    message: 'HBW must not be presented as picking up, delivering, hauling, towing, or otherwise transporting customer boats.',
    patterns: [
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,36}\\b(?:pick(?:s|ed|ing)?\\s*up|deliver(?:s|ed|ing)?|haul(?:s|ed|ing)?|transport(?:s|ed|ing)?|tow(?:s|ed|ing)?(?![- ]boats?\\b))\\b[^.!?;\\n]{0,45}\\b(?:boats?|vessels?|your boat|it|them)\\b`, 'i'),
      new RegExp(`\\b(?:boats?|vessels?|your boat)\\b[^.!?;\\n]{0,36}\\b(?:picked\\s*up|delivered|hauled|transported|towed)\\b[^.!?;\\n]{0,25}\\b(?:by|through|with)\\s+(?:HBW|Harris Boat Works|us|our team)\\b`, 'i'),
      new RegExp(`\\b(?:pick(?:s|ed|ing)?\\s*up|deliver(?:s|ed|ing)?|haul(?:s|ed|ing)?|transport(?:s|ed|ing)?|tow(?:s|ed|ing)?)\\b[^.!?;\\n]{0,60}\\b(?:available|offered|provided)\\b[^.!?;\\n]{0,25}\\b(?:at|from|through|with)\\s+(?:HBW|Harris Boat Works|us|our team)\\b`, 'i'),
    ],
    allow: [
      /\bwithin (?:the )?(?:yard|lot|shop|facility|storage area)\b/i,
      /\bbetween (?:the )?(?:yard|lot|shop|service bay|storage area)\b/i,
    ],
  },
  {
    id: 'no-transport-arrangement-or-referrals',
    message: 'HBW must not be presented as arranging transport, referring transport providers, or finding a hauler.',
    patterns: [
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,42}\\b(?:arrange|coordinate|book|schedule|recommend|refer|connect|point|put you in touch)\\w*\\b[^.!?;\\n]{0,55}\\b${TRANSPORT_TARGET}\\b`, 'i'),
      /\bcommercial boat transport services\b/i,
      /\bwork with several Ontario marine transport services\b/i,
      /\bwe can refer you to dealers\b/i,
      /\bpoint you to other shops\b/i,
      /\brecommend local towing services\b/i,
    ],
  },
  {
    id: 'no-transport-pricing',
    message: 'HBW must not quote or estimate transport pricing.',
    patterns: [
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,70}\\b(?:transport|hauling|delivery|pickup|pick-up)\\b[^.!?;\\n]{0,35}(?:CA\\$|\\$)\\s?\\d`, 'i'),
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,70}(?:CA\\$|\\$)\\s?\\d[^.!?;\\n]{0,35}\\b(?:each way|transport|hauling|delivery|pickup|pick-up)\\b`, 'i'),
    ],
  },
  {
    id: 'winter-closure-no-physical-work',
    message: 'HBW must not promise physical service, inspection, or yard work during the December 1-April 1 closure.',
    patterns: [
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,60}\\b(?:service|repair|maintain|inspect|install(?:ed|ing)|repower|commission|work on|patch|check)\\w*\\b[^.!?;\\n]{0,45}\\b(?:during|through|throughout|over|all)\\b[^.!?;\\n]{0,18}\\b(?:winter|off[- ]season|storage season)\\b`, 'i'),
      new RegExp(`\\b(?:during|through|throughout|over)\\b[^.!?;\\n]{0,18}\\b(?:winter|off[- ]season|storage season)\\b[^.!?;\\n]{0,55}${ATTRIBUTION}[^.!?;\\n]{0,35}\\b(?:service|repair|maintain|inspect|install(?:ed|ing)|repower|commission|work on|patch|check)\\w*\\b`, 'i'),
      /\beverything happens while the boat is stored\b/i,
      /\bmaintenance during the off-season\b/i,
    ],
    allow: [
      /\bcommission(?:ed|ing)?\s+in spring\b/i,
      /\bafter (?:the marina )?reopens?\b/i,
      /\bafter April 1\b/i,
    ],
  },
  {
    id: 'winter-closure-no-customer-access',
    message: 'HBW must not promise customer access, item retrieval, or pickup during the winter closure.',
    patterns: [
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,55}\\b(?:customers?|you)\\b[^.!?;\\n]{0,25}\\b(?:can|may|will be able to)\\b[^.!?;\\n]{0,25}\\b(?:access|retrieve|pick\\s*up|visit)\\b[^.!?;\\n]{0,45}\\b(?:boats?|items?|yard|lot|marina)\\b[^.!?;\\n]{0,30}\\b(?:winter|off[- ]season|closure)\\b`, 'i'),
      new RegExp(`\\b(?:customers?|you)\\b[^.!?;\\n]{0,25}\\b(?:can|may|will be able to)\\b[^.!?;\\n]{0,25}\\b(?:access|retrieve|pick\\s*up|visit)\\b[^.!?;\\n]{0,45}\\b(?:boats?|items?|yard|lot|marina)\\b[^.!?;\\n]{0,30}\\b(?:at HBW|at Harris Boat Works|at our (?:yard|lot|marina)|through winter at HBW)\\b`, 'i'),
    ],
  },
  {
    id: 'no-winter-staffing-security-or-storm-promise',
    message: 'HBW must not promise winter staffing, monitoring, cameras, storm checks, or mid-closure wrap repairs.',
    patterns: [
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,45}\\b(?:storage )?(?:yard|lot)\\b[^.!?;\\n]{0,35}\\b(?:fenced|monitored|cameras?|staffed daily|on-site daily)\\b`, 'i'),
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,75}\\b(?:check(?:s|ed|ing)? (?:the )?(?:lot|boats?) after (?:big )?storms?|patch(?:es|ed|ing)? (?:the )?(?:wrap|it))\\b`, 'i'),
      /\bfenced, monitored lot\b/i,
      /\bfenced, with cameras\b/i,
      /\bon-site daily through the off-season\b/i,
      /\bstaffed daily through the off-season\b/i,
      /\bcheck the lot after big storms\b/i,
    ],
  },
  {
    id: 'no-stale-fixed-storage-rate',
    message: 'HBW storage or shrinkwrap must not be assigned a timeless per-foot rate.',
    patterns: [
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,65}\\b(?:storage|shrinkwrap|winterization|pricing|rate)\\b[^.!?;\\n]{0,30}(?:CA\\$|\\$)\\s?\\d[^.!?;\\n]{0,16}\\b(?:per\\s+(?:ft|foot)|\\/\\s*ft)\\b`, 'i'),
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,65}(?:CA\\$|\\$)\\s?\\d[^.!?;\\n]{0,16}\\b(?:per\\s+(?:ft|foot)|\\/\\s*ft)\\b[^.!?;\\n]{0,30}\\b(?:storage|shrinkwrap|winterization)\\b`, 'i'),
      /\bHBW pricing 2025-2026\b/i,
    ],
  },
  {
    id: 'no-fixed-storage-size-limit',
    message: 'HBW storage capacity must be confirmed from the current boat/trailer dimensions, not a fixed published size limit.',
    patterns: [
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,70}\\b(?:storage|store|accept|taking|capacity|fit)\\w*\\b[^.!?;\\n]{0,35}\\b(?:over|under|up to|max(?:imum)?)\\s+\\d+(?:\\.\\d+)?\\s*(?:ft|feet|foot)\\b`, 'i'),
      new RegExp(`\\b(?:anything|boats?)\\s+(?:over|under|up to)\\s+\\d+(?:\\.\\d+)?\\s*(?:ft|feet|foot)\\b[^.!?;\\n]{0,50}\\b(?:HBW|us|our (?:yard|lot|storage)|store|storage|taking|accept)\\b`, 'i'),
    ],
  },
  {
    id: 'battery-removal-not-universal',
    message: 'Battery removal must not be presented as a universal HBW storage requirement.',
    patterns: [
      /\b(?:all|every)\b[^.!?;\n]{0,35}\b(?:storage|winterization)?\s*(?:customers?|boats?)\b[^.!?;\n]{0,45}\b(?:must|need to|required to)\b[^.!?;\n]{0,20}\bremove\b[^.!?;\n]{0,12}\bbatter(?:y|ies)\b/i,
      /\bbatter(?:y|ies)\s+removal\b[^.!?;\n]{0,30}\b(?:is|required|mandatory|included in every|standard for all)\b/i,
      /\b(?:our|HBW|standard)\b[^.!?;\n]{0,35}\b(?:storage|winterization) (?:package|service)\b[^.!?;\n]{0,45}\b(?:includes?|requires?)\b[^.!?;\n]{0,25}\bbattery removal\b/i,
    ],
  },
  {
    id: 'commissioning-scope-canon',
    message: 'Spring commissioning must not be presented as a separate add-on for HBW winter-storage customers.',
    patterns: [
      /\bspring commissioning\b[^.!?;\n]{0,45}\b(?:separate service|add-on|extra charge|not included)\b[^.!?;\n]{0,55}\b(?:HBW|storage|stored|storage customers?)\b/i,
      /\b(?:HBW|winter-storage|storage customers?|stored boats?)\b[^.!?;\n]{0,55}\bspring commissioning\b[^.!?;\n]{0,35}\b(?:separate|add-on|extra charge|not included)\b/i,
    ],
    allow: [
      /\bnon-storage customers?\b/i,
      /\bcustomers? who (?:do not|don't) store\b/i,
    ],
  },
  {
    id: 'no-storage-bundle-discount-promise',
    message: 'HBW must not promise an unsupported storage-package or bundle discount.',
    patterns: [
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,60}\\b(?:storage|winterization|shrinkwrap)\\b[^.!?;\\n]{0,50}\\b(?:small discount|bundle discount|discount over booking|save by booking)\\b`, 'i'),
      /\bour (?:winter )?storage\b[^.!?;\n]{0,60}\b(?:small discount|bundle discount|discount over booking|save by booking)\b/i,
      /\bsmall discount over booking them separately\b/i,
    ],
  },
  {
    id: 'no-ready-to-run-or-one-trip-promise',
    message: 'HBW storage must not promise a one-trip process or a ready-to-run/ready-to-launch spring outcome.',
    patterns: [
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,70}\\b(?:one trip|one drive|ready to run|ready to launch)\\b[^.!?;\\n]{0,70}\\b(?:storage|stored|spring|pickup|pick-up)\\b`, 'i'),
      new RegExp(`\\b(?:storage|stored|spring|pickup|pick-up)\\b[^.!?;\\n]{0,70}${ATTRIBUTION}[^.!?;\\n]{0,70}\\b(?:one trip|one drive|ready to run|ready to launch)\\b`, 'i'),
      /\bone drive[^.!?;\n]{0,80}\b(?:pickup|stored|storage)\b/i,
    ],
  },
  {
    id: 'no-unverified-rewrap-charge',
    message: 'HBW must not publish an unverified automatic re-wrap charge.',
    patterns: [
      new RegExp(`${ATTRIBUTION}[^.!?;\\n]{0,45}\\b(?:charge|fee)\\w*\\b[^.!?;\\n]{0,25}\\bre-?wrap(?:ping)?\\b`, 'i'),
    ],
  },
  {
    id: 'no-unverified-storage-volume',
    message: 'Unsupported storage-volume claims removed in PR #119 must not return.',
    patterns: [
      /\b311\+?\s+storage contracts\b/i,
      /\b300\s*[-–]\s*400 boats\b/i,
    ],
    negatable: false,
  },
];

const CONTEXT_RULES = [
  {
    id: 'storage-outdoor-only',
    message: 'HBW must not answer yes when asked whether it offers year-round storage.',
    pattern: /\b(?:can|may) I store\b[\s\S]{0,80}\b(?:at HBW|with you)\b[\s\S]{0,55}\byear[- ]round\b[^?\n]{0,55}\?[\s\S]{0,180}\byes\b/gi,
  },
];

function walk(dir, files) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(path, files);
    } else if (
      entry.isFile()
      && TEXT_EXTENSIONS.has(extname(entry.name))
      && !/\.(?:spec|test)\.[^.]+$/i.test(entry.name)
    ) {
      files.push(path);
    }
  }
}

export function listCustomerContentFiles(cwd = process.cwd()) {
  const files = [];
  for (const root of CUSTOMER_CONTENT_ROOTS) walk(resolve(cwd, root), files);
  for (const file of CUSTOMER_CONTENT_FILES) {
    const path = resolve(cwd, file);
    if (existsSync(path)) files.push(path);
  }
  return [...new Set(files)].sort();
}

function cleanSegment(segment) {
  return segment
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitLine(line) {
  return line
    .replace(/,\s*answer\s*:/gi, '. answer:')
    .split(/(?<=[.!?;])(?:["'`)}\]]*)\s+|\s+(?:but|however)\s+/i)
    .map(cleanSegment)
    .filter(Boolean);
}

function isExplicitDenial(text) {
  const withoutNotOnly = text.replace(/\bnot only\b/gi, '');
  return /\b(?:do|does|did|is|are|was|were|can|could|will|would|have|has)\s+(?:not|never|no longer)\b/i.test(withoutNotOnly)
    || /\b(?:don't|doesn't|didn't|isn't|aren't|wasn't|weren't|can't|couldn't|won't|wouldn't|haven't|hasn't)\b/i.test(withoutNotOnly)
    || /\bno\s+(?:indoor|heated|climate[- ]controlled|year[- ]round|summer|transport|pickup|delivery|hauling|mobile|winter access|customer access)\b/i.test(withoutNotOnly);
}

export function findHbwServiceCanonViolations(text, { file = '<text>' } = {}) {
  const violations = [];
  const seen = new Set();
  const lines = text.split(/\r?\n/);

  for (const rule of CONTEXT_RULES) {
    for (const match of text.matchAll(rule.pattern)) {
      const line = text.slice(0, match.index).split(/\r?\n/).length;
      const key = `${file}:${line}:${rule.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      violations.push({
        file,
        line,
        rule: rule.id,
        message: rule.message,
        snippet: cleanSegment(match[0]).slice(0, 220),
      });
    }
  }

  lines.forEach((line, index) => {
    for (const segment of splitLine(line)) {
      if (/\?\s*[*_'"`)}\]]*,?\s*$/.test(segment) || /\bquestion\s*:/i.test(segment)) continue;
      for (const rule of RULES) {
        if (rule.allow?.some((allow) => allow.test(segment))) continue;
        for (const pattern of rule.patterns) {
          const match = segment.match(pattern);
          if (!match) continue;
          if (rule.negatable !== false && isExplicitDenial(segment)) continue;
          const key = `${file}:${index + 1}:${rule.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          violations.push({
            file,
            line: index + 1,
            rule: rule.id,
            message: rule.message,
            snippet: segment.slice(0, 220),
          });
        }
      }
    }
  });

  return violations;
}

export function scanHbwServiceCanon(cwd = process.cwd()) {
  const violations = [];
  for (const path of listCustomerContentFiles(cwd)) {
    const file = relative(cwd, path);
    const text = readFileSync(path, 'utf8');
    violations.push(...findHbwServiceCanonViolations(text, { file }));
  }
  return violations;
}

function run() {
  const violations = scanHbwServiceCanon();
  if (violations.length) {
    console.error(`\nHBW storage/transport canon validation FAILED - ${violations.length} issue(s):\n`);
    for (const violation of violations) {
      console.error(`  ${violation.file}:${violation.line} [${violation.rule}]`);
      console.error(`    ${violation.snippet}`);
      console.error(`    ${violation.message}\n`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(`HBW storage/transport canon validation PASSED - ${listCustomerContentFiles().length} customer-facing file(s) checked.`);
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) run();
