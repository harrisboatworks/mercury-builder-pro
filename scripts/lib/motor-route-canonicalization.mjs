import { applyMotorPresentationOverrides } from '../../src/data/motorPresentationOverrides.js';

export function normalizeMotorPartNumber(motor) {
  return String(motor?.model_number || motor?.mercury_model_no || '')
    .trim()
    .toUpperCase();
}

function normalizeMotorId(motor) {
  return String(motor?.id || '').trim().toLowerCase();
}

export function motorIdentity(motor) {
  const partNumber = normalizeMotorPartNumber(motor);
  if (partNumber) return `part:${partNumber}`;
  const motorId = normalizeMotorId(motor);
  if (motorId) return `id:${motorId}`;
  return `key:${String(motor?.model_key || '').toLowerCase()}`;
}

function readFrontmatterScalar(markdown, fieldName) {
  const match = markdown.match(
    new RegExp(`^${fieldName}:\\s*(.*?)\\s*$`, 'm'),
  );
  if (!match) return '';

  const rawValue = match[1].trim();
  if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
    try {
      return JSON.parse(rawValue);
    } catch {
      throw new Error(`invalid quoted ${fieldName} frontmatter`);
    }
  }
  if (rawValue.startsWith("'") && rawValue.endsWith("'")) {
    return rawValue.slice(1, -1).replaceAll("''", "'");
  }
  return rawValue.replace(/\s+#.*$/, '').trim();
}

export function buildCanonicalMotorRouteCatalog({
  twins = [],
  requiredCanonicalRoutes = new Map(),
}) {
  const byPartNumber = new Map();
  const byId = new Map();
  const claimsBySlug = new Map();

  const claimRoute = (routeSlugValue, claim, context) => {
    const routeSlug = String(routeSlugValue || '').trim();
    const partNumber = String(claim.partNumber || '').trim().toUpperCase();
    const id = String(claim.id || '').trim().toLowerCase();
    if (!routeSlug || (!partNumber && !id)) {
      throw new Error(`${context} has no stable identity for its route`);
    }

    const existing = claimsBySlug.get(routeSlug);
    if (!existing) {
      claimsBySlug.set(routeSlug, { partNumber, id });
      return;
    }

    if (
      existing.partNumber &&
      partNumber &&
      existing.partNumber !== partNumber
    ) {
      throw new Error(
        `canonical motor route ${routeSlug} maps to both ${existing.partNumber} and ${partNumber}`,
      );
    }
    if (existing.id && id && existing.id !== id) {
      throw new Error(
        `canonical motor route ${routeSlug} maps to both ids ${existing.id} and ${id}`,
      );
    }

    const sharesIdentity =
      (existing.partNumber && existing.partNumber === partNumber) ||
      (existing.id && existing.id === id);
    if (!sharesIdentity) {
      throw new Error(
        `canonical motor route ${routeSlug} is claimed by unrelated product identities`,
      );
    }

    claimsBySlug.set(routeSlug, {
      partNumber: existing.partNumber || partNumber,
      id: existing.id || id,
    });
  };

  const registerPartNumber = (partNumberValue, routeSlugValue, context) => {
    const partNumber = String(partNumberValue || '').trim().toUpperCase();
    const routeSlug = String(routeSlugValue || '').trim();
    if (!partNumber || !routeSlug) {
      throw new Error(`${context} is missing model_number or slug frontmatter`);
    }

    const existingSlug = byPartNumber.get(partNumber);
    if (existingSlug && existingSlug !== routeSlug) {
      throw new Error(
        `canonical motor part ${partNumber} maps to both ${existingSlug} and ${routeSlug}`,
      );
    }
    byPartNumber.set(partNumber, routeSlug);
  };

  const registerId = (idValue, routeSlugValue, context) => {
    const id = String(idValue || '').trim().toLowerCase();
    const routeSlug = String(routeSlugValue || '').trim();
    if (!id || !routeSlug) {
      throw new Error(`${context} is missing motor_id or slug frontmatter`);
    }

    const existingSlug = byId.get(id);
    if (existingSlug && existingSlug !== routeSlug) {
      throw new Error(
        `canonical motor id ${id} maps to both ${existingSlug} and ${routeSlug}`,
      );
    }
    byId.set(id, routeSlug);
  };

  for (const { filename, markdown } of twins) {
    const partNumber = readFrontmatterScalar(markdown, 'model_number');
    const motorId = readFrontmatterScalar(markdown, 'motor_id');
    const frontmatterSlug = readFrontmatterScalar(markdown, 'slug');
    const filenameSlug = filename.endsWith('.md')
      ? filename.slice(0, -3)
      : filename;
    if (!frontmatterSlug) {
      throw new Error(
        `canonical motor twin ${filename} is missing slug frontmatter`,
      );
    }
    if (frontmatterSlug !== filenameSlug) {
      throw new Error(
        `canonical motor twin ${filename} declares mismatched slug ${frontmatterSlug}`,
      );
    }
    if (!partNumber && !motorId) {
      throw new Error(
        `canonical motor twin ${filename} has no model_number or motor_id frontmatter`,
      );
    }
    claimRoute(
      filenameSlug,
      { partNumber, id: motorId },
      `canonical motor twin ${filename}`,
    );
    // Part numbers are optional in the upstream contract. Index every twin by
    // its stable API id as a secondary route key so a later Supabase-only
    // prerender can still recover the API-generated slug for a partless motor.
    if (partNumber) {
      registerPartNumber(
        partNumber,
        filenameSlug,
        `canonical motor twin ${filename}`,
      );
    }
    if (motorId) {
      registerId(motorId, filenameSlug, `canonical motor twin ${filename}`);
    }
  }

  for (const [partNumber, routeSlug] of requiredCanonicalRoutes) {
    claimRoute(
      routeSlug,
      { partNumber },
      `required canonical motor ${partNumber}`,
    );
    registerPartNumber(
      partNumber,
      routeSlug,
      `required canonical motor ${partNumber}`,
    );
  }

  if (byPartNumber.size === 0 && byId.size === 0) {
    throw new Error('canonical motor route catalog is empty');
  }
  return { byPartNumber, byId };
}

/**
 * Merge the three prerender motor sources by stable product identity.
 * Source priority is canonical fallback < Supabase < public API, while the
 * checked-in canonical route catalog remains authoritative for public URLs.
 */
export function mergeMotorRouteSources({
  canonicalMotors = [],
  supabaseMotors = [],
  apiMotors = [],
  canonicalRoutesByPartNumber = new Map(),
  canonicalRoutesById = new Map(),
}) {
  const byIdentity = new Map();
  const canonicalizeRoute = (motor) => {
    const presentedMotor = applyMotorPresentationOverrides(motor);
    const partNumber = normalizeMotorPartNumber(presentedMotor);
    const canonicalSlug =
      (partNumber && canonicalRoutesByPartNumber.get(partNumber)) ||
      canonicalRoutesById.get(normalizeMotorId(presentedMotor));
    return canonicalSlug
      ? { ...presentedMotor, model_key: canonicalSlug }
      : presentedMotor;
  };
  const upsertByIdentity = (motor) => {
    // Canonicalize before checking model_key: a checked-in twin can recover the
    // API slug for a Supabase fallback row whose legacy key is NULL.
    const canonicalMotor = canonicalizeRoute(motor);
    if (!canonicalMotor.model_key) return;
    const identity = motorIdentity(canonicalMotor);
    // Map#set preserves the first insertion position for an existing key.
    // Reinsert so iteration order also preserves the declared source priority.
    byIdentity.delete(identity);
    byIdentity.set(identity, canonicalMotor);
  };
  const supabaseByPartNumber = new Map(
    supabaseMotors
      .map((motor) => [normalizeMotorPartNumber(motor), motor])
      .filter(([partNumber]) => partNumber),
  );

  for (const motor of canonicalMotors) {
    const source = supabaseByPartNumber.get(normalizeMotorPartNumber(motor));
    const enriched = source
      ? {
          ...motor,
          hero_image_url: motor.hero_image_url || source.hero_image_url || null,
          image_url: motor.image_url || source.image_url || null,
          shaft: motor.shaft || source.shaft || null,
          shaft_code: motor.shaft_code || source.shaft_code || null,
          start_type: motor.start_type || source.start_type || null,
          control_type: motor.control_type || source.control_type || null,
        }
      : motor;
    upsertByIdentity(enriched);
  }

  for (const motor of supabaseMotors) {
    upsertByIdentity(motor);
  }
  for (const motor of apiMotors) {
    upsertByIdentity(motor);
  }

  // Keep the original one-record-per-route invariant even when two incomplete
  // sources describe the same slug without sharing a stable identity field.
  // Iteration order preserves the declared source priority, so later API
  // records replace Supabase/canonical fallbacks on a route collision.
  const byRoute = new Map();
  for (const motor of byIdentity.values()) {
    const routeKey = String(motor.model_key || '').trim().toLowerCase();
    if (routeKey) byRoute.set(routeKey, motor);
  }
  return Array.from(byRoute.values());
}
