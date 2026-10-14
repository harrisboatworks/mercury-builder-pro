import { familyKey } from "./motor-slug.ts";
import { resolveMercuryCatalogSpecs } from "./mercury-codes.ts";
import { presentPublicCatalogMotor, PUBLIC_CATALOG_AVAILABILITY_OR, type PublicMotorRow } from "./public-motor-contract.ts";

const MOTOR_FIELDS = "id, model, model_display, model_number, family, motor_type, horsepower, shaft, shaft_code, control_type, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, stock_quantity, hero_image_url, image_url";

export function presentMcpMotor(source: PublicMotorRow) {
  const motor = presentPublicCatalogMotor(source);
  if (!motor) return null;
  const { row, ...publicFields } = motor;
  return {
    ...publicFields,
    ...resolveMercuryCatalogSpecs({
      modelDisplay: row.model_display || row.model,
      shaft: row.shaft,
      shaftCode: row.shaft_code,
      controlType: row.control_type,
    }),
  };
}

// A bounded candidate page, not arbitrary-catalog pagination. Normalize stock
// before the caller limit; the DB boolean alone is not the public stock rule.
export async function searchMcpMotors(supabase: any, args: any) {
  let q = supabase.from("motor_models").select(MOTOR_FIELDS)
    .or(PUBLIC_CATALOG_AVAILABILITY_OR).order("horsepower", { ascending: true }).order("id", { ascending: true }).limit(501);
  if (args.horsepower) q = q.eq("horsepower", args.horsepower);
  if (args.min_hp) q = q.gte("horsepower", args.min_hp);
  if (args.max_hp) q = q.lte("horsepower", args.max_hp);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const wantedFamily = args.family ? familyKey(args.family) : null;
  const motors = (data || []).slice(0, 500).map(presentMcpMotor)
    .filter((motor: ReturnType<typeof presentMcpMotor>): motor is NonNullable<typeof motor> => Boolean(motor))
    .filter((motor: NonNullable<ReturnType<typeof presentMcpMotor>>) => !args.in_stock_only || motor.inStock)
    .filter((motor: NonNullable<ReturnType<typeof presentMcpMotor>>) => !wantedFamily || familyKey(motor.family) === wantedFamily)
    .slice(0, Math.min(args.limit ?? 25, 100));
  return { motors, candidateLimit: 500, candidatePageTruncated: (data || []).length > 500 };
}

export async function getMcpMotor(supabase: any, args: any) {
  if (!args.id && !args.slug) throw new Error("id or slug required");
  let q = supabase.from("motor_models").select(`${MOTOR_FIELDS}, description, features`).or(PUBLIC_CATALOG_AVAILABILITY_OR);
  if (args.id) q = q.eq("id", args.id).limit(1);
  else q = q.order("horsepower", { ascending: true }).order("id", { ascending: true });
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  for (const row of data || []) {
    const motor = presentMcpMotor(row);
    if (!motor) continue;
    if (args.id ? motor.id === args.id : motor.slug === String(args.slug).toLowerCase()) {
      return { ...motor, description: row.description, features: row.features };
    }
  }
  return null;
}
