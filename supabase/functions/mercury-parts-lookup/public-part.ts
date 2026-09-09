type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const PARTS_PAGE_URL = "https://www.mercuryrepower.ca/mercuryparts";

export type PublicPartInfo = {
  partNumber: string;
  name: string | null;
  description: string | null;
  cadPrice: number | null;
  imageUrl: string | null;
  sourceUrl: string;
  fromCache: boolean;
};

const asStringOrNull = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const asFiniteNumberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * Map a mercury_parts_cache row (or a known-part stand-in) onto the only
 * public PartInfo shape. Unknown columns — including lookup_count — fail closed.
 */
export function buildPublicPartInfo(
  row: unknown,
  {
    fromCache,
    fallbackPartNumber,
  }: {
    fromCache: boolean;
    fallbackPartNumber?: string;
  },
): PublicPartInfo {
  const record = isRecord(row) ? row : {};
  const partNumber = typeof record.part_number === "string" && record.part_number
    ? record.part_number
    : (fallbackPartNumber ?? "");

  return {
    partNumber,
    name: asStringOrNull(record.name),
    description: asStringOrNull(record.description),
    cadPrice: asFiniteNumberOrNull(record.cad_price),
    imageUrl: asStringOrNull(record.image_url),
    sourceUrl: PARTS_PAGE_URL,
    fromCache,
  };
}

export function buildPublicPartResponse(
  row: unknown,
  options: {
    fromCache: boolean;
    fallbackPartNumber?: string;
    message?: string;
  },
) {
  const data = buildPublicPartInfo(row, options);
  if (options.message !== undefined) {
    return { success: true as const, data, message: options.message };
  }
  return { success: true as const, data };
}
