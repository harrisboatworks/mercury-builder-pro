function parseTs(val: string | null | undefined) { return !val || val.startsWith("1000-") || val.startsWith("1900-") ? null : val; }
export function mapCustomer(r: any) {
  if (typeof r.optoutmarketing !== "boolean") throw new Error("Customer consent missing or invalid");
  return {
      customer_id: r.CustomerId, full_name: (r.CustFullName || "").trim(),
      first_name: (r.FirstName || "").trim(), last_name: (r.LastName || "").trim(),
      company_name: (r.Companyname || "").trim(), address1: (r.Address1 || "").trim(),
      address2: (r.Address2 || "").trim(), city: (r.City || "").trim(),
      province: (r.State || "").trim(), postal_code: (r.Zip || "").trim(),
      country: (r.Country || "").trim(), home_phone: (r.HomePhone || "").trim(),
      work_phone: (r.WorkPhone || "").trim(), cell_phone: (r.CellPhone || "").trim(),
      email: (r.EMail || "").trim(), customer_type: (r.CustomerType || "").trim(),
      loyalty_customer: r.LoyaltyCustomer === 1, opt_out_marketing: r.optoutmarketing === true,
      comments: (r.comments || "").trim(), date_gathered: parseTs(r.DateGathered),
  };
}

