export const PUBLIC_QUOTE_LEAD_SOURCE = "public-quote-api";
export const PUBLIC_QUOTE_LEAD_FAILURE =
  "Lead could not be stored. The estimate is still valid.";

type SupabaseLike = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => PromiseLike<{ error?: { message?: string } | null }>;
  };
};

export async function insertPublicQuoteLead(
  supabase: SupabaseLike,
  row: Record<string, unknown>,
): Promise<{ captured: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from("customer_quotes").insert(row);
    if (error) {
      return { captured: false, error: PUBLIC_QUOTE_LEAD_FAILURE };
    }
    return { captured: true, error: null };
  } catch {
    return { captured: false, error: PUBLIC_QUOTE_LEAD_FAILURE };
  }
}
