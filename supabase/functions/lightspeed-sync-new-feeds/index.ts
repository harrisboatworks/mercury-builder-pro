import { parseLightspeedJson } from "../_shared/lightspeed-json.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

const LS_USERNAME = Deno.env.get("LIGHTSPEED_USERNAME");
const LS_PASSWORD = Deno.env.get("LIGHTSPEED_PASSWORD");
const LS_BASE = "https://int.lightspeeddataservices.com/lsapi";
const CMF = Deno.env.get("LIGHTSPEED_CMF") || "76160844";

type SyncResult = {
  feed: string;
  total: number;
  upserted: number;
  purged?: number;
  filter?: string;
  source_total?: number;
  active_total?: number;
};

const OPEN_RO_CLOSED_STATUS = Number.parseInt(Deno.env.get("OPEN_RO_CLOSED_STATUS") || "3", 10);
const OPEN_RO_MIN_ACTIVE_COUNT = Number.parseInt(Deno.env.get("OPEN_RO_MIN_ACTIVE_COUNT") || "20", 10);
const OPEN_RO_MAX_ACTIVE_COUNT = Number.parseInt(Deno.env.get("OPEN_RO_MAX_ACTIVE_COUNT") || "250", 10);

function getDb() {
  return postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false });
}

function parseTs(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  if (!text || text.startsWith("0001-") || text.startsWith("1000-") || text.startsWith("1900-")) return "";
  return text;
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

async function fetchPage(endpoint: string, skip: number, top: number, filter?: string): Promise<any[]> {
  if (!LS_USERNAME || !LS_PASSWORD) throw new Error("Lightspeed credentials are not configured");
  const auth = btoa(`${LS_USERNAME}:${LS_PASSWORD}`);
  const params = new URLSearchParams({
    "$top": String(top),
    "$skip": String(skip),
    "$format": "json",
  });
  if (filter) params.set("$filter", filter);

  const url = `${LS_BASE}/${endpoint}/${CMF}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`${endpoint} API ${response.status}: ${await response.text()}`);
  }

  const payload = parseLightspeedJson(await response.text());
  return Array.isArray(payload) ? payload : [];
}

async function fetchAll(endpoint: string, pageSize: number, filter?: string): Promise<any[]> {
  const records: any[] = [];
  let skip = 0;

  while (true) {
    const page = await fetchPage(endpoint, skip, pageSize, filter);
    if (page.length === 0) break;
    records.push(...page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }

  return records;
}

function chunk<T>(records: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < records.length; i += size) chunks.push(records.slice(i, i + size));
  return chunks;
}

function uniqueBy<T>(records: T[], keyFor: (record: T) => string): T[] {
  const byKey = new Map<string, T>();
  for (const record of records) {
    const key = keyFor(record);
    if (key) byKey.set(key, record);
  }
  return [...byKey.values()];
}

function transformDeal(record: any) {
  return {
    dealid: text(record.dealid),
    cmf: text(record.Cmf),
    dealer_id: text(record.DealerId),
    deal_no: text(record.DealNo),
    fin_invoice_id: text(record.FinInvoiceId),
    common_invoice_id: text(record.CommonInvoiceID),
    finance_date: parseTs(record.FinanceDate),
    originating_date: parseTs(record.OriginatingDate),
    delivery_date: parseTs(record.DeliveryDate),
    contract_date: parseTs(record.ContractDate),
    create_date: parseTs(record.createdate),
    last_modified_date: parseTs(record.lastmodifieddate),
    backdated_date: parseTs(record.backdateddate),
    is_backdated: text(record.isbackdated),
    salesman_id: text(record.salesmanid),
    salesman_name: text(record.SalesmanName),
    salesman_username: text(record.salesmanusername),
    salesman2_id: text(record.Salesman2id),
    salesman2_name: text(record.Salesman2name),
    salesmanager: text(record.salesmanager),
    cust_id: text(record.CustID),
    cobuyer_cust_id: text(record.cobuyercustid),
    cobuyer_name: text(record.cobuyername),
    cobuyer_email: text(record.cobuyeremail),
    cobuyer_birthdate: parseTs(record.cobuyerbirthdate),
    source_type: text(record.sourcetype),
    source: text(record.source),
    stage_name: text(record.stagename),
    lienholder: text(record.lienholder),
    amt_financed: text(record.AmtFinanced),
    total_cash_price: text(record.totalcashprice),
    balance_to_finance: text(record.balancetofinance),
    total_of_payments: text(record.totalofpayments),
    total_prev_pymt: text(record.totalprevpymt),
    additional_pymt_today: text(record.additionalpymttoday),
    deferred_amt: text(record.deferredamt),
    deposit: text(record.deposit),
    term: text(record.Term),
    rate: text(record.Rate),
    payment: text(record.Payment),
    days_to_first: text(record.DaysToFirst),
    fe_margin: text(record.femargin),
    be_margin: text(record.bemargin),
    sales_tax_total: text(record.salestaxtotal),
    vehicle_tax_total: text(record.vehicletaxtotal),
    insurance_tax_total: text(record.insurancetaxtotal),
    deal_description: text(record.dealdescription),
    customer_notes: text(record.customernotes),
    raw_units: record.Units || [],
    raw_trades: record.Trade || [],
    raw_extra_lines: record.DealExtraLines || [],
    raw_prospects: record.DealProspect || [],
  };
}

function transformOpenRo(record: any) {
  return {
    ro_header_id: text(record.ROHeaderID),
    cmf: text(record.Cmf),
    dealer_id: text(record.DealerId),
    ro_no: text(record.rono),
    ro_misc_invoice_id: text(record.ROMiscInvoiceID),
    common_invoice_id: text(record.CommonInvoiceID),
    ro_status: text(record.Rostatus),
    status: text(record.status),
    cust_id: text(record.CustID),
    date_in: parseTs(record.datein),
    close_date: parseTs(record.closedate),
    pu_date: parseTs(record.pudate),
    promised_date: parseTs(record.promiseddate),
    date_created: parseTs(record.datecreated),
    last_modified_date: parseTs(record.lastmodifieddate),
    shop_supply: text(record.shopsupply),
    misc_charge_1: text(record.MiscCharge1),
    misc_charge_2: text(record.MiscCharge2),
    misc_charge_3: text(record.MiscCharge3),
    misc_charge_4: text(record.MiscCharge4),
    service_writer_id: text(record.ServiceWriterId),
    service_writer_name: text(record.ServiceWriterName),
    service_writer_username: text(record.ServiceWriterUserName),
    tot_sub_cost: text(record.TotsubCost),
    tot_sub_sales: text(record.TotsubSales),
    category: text(record.category),
    sales_tax_warr: text(record.Salestaxwarr),
    sales_tax_mu: text(record.Salestaxmu),
    sales_tax_nw: text(record.Salestaxnw),
    total_tax: text(record.Totaltax),
    total_owed: text(record.totalowed),
    oem_ro_number: text(record.oemronumber),
    raw_units: record.Unit || [],
  };
}

function isActiveOpenRo(record: any): boolean {
  const roNo = text(record.rono);
  if (!roNo || roNo === "-1") return false;

  const roStatus = Number.parseInt(text(record.Rostatus), 10);
  if (!Number.isFinite(roStatus)) return false;

  return roStatus !== OPEN_RO_CLOSED_STATUS;
}

function transformPartsInvoice(record: any) {
  return {
    invoice_line_no: text(record.invoicelineno),
    cmf: text(record.Cmf),
    dealer_id: text(record.DealerId),
    invoice_id: text(record.invoiceId),
    invoice_no: text(record.InvoiceNo),
    common_invoice_id: text(record.CommonInvoiceID),
    invoice_date: parseTs(record.InvoiceDate),
    cust_id: text(record.CustID),
    salesman_id: text(record.salesmanId),
    salesman_name: text(record.salesmanname),
    cashier_name: text(record.cashiername),
    part_no: text(record.partno),
    part_desc: text(record.partdesc),
    source: text(record.source || record.inventorysource),
    category: text(record.category),
    qty: text(record.qty),
    cost: text(record.cost),
    price: text(record.price),
    std_price: text(record.stdprice),
    each_price: text(record.eachprice),
    ext_total_price: text(record.exttotalprice),
    ext_total_cost: text(record.exttotalcost),
    total_margin: text(record.totalmargin),
    total_qty: text(record.totalqty),
    total_return: text(record.totalreturn),
    pu: text(record.pu),
    so: text(record.so),
    lay: text(record.lay),
    lost: text(record.lost),
    flag_internal: text(record.FlagInternal),
    comment: text(record.comment),
    date_created: parseTs(record.datecreated),
    discount_rate: text(record.discountrate),
    discount_type: text(record.discounttype),
    line_discount: text(record.linediscount),
    invoice_collect_amt: text(record.invoicecollectamt),
    invoice_handling_amt: text(record.invoicehandlingamt),
    invoice_discount: text(record.invoicediscount),
    invoice_subtotal: text(record.invoicesubtotal),
    invoice_tax: text(record.invoicetax),
    sale_type: text(record.SalesType),
    sale_type_description: text(record.saletypedescription),
    is_resale: text(record.isresale),
    is_special_order: text(record.isspecialorder),
    is_taxable: text(record.istaxable),
    warranty: text(record.warranty),
    shipping_vendor: text(record.shippingvendor),
    shipping_method: text(record.shippingmethod),
    shipment_complete_date: parseTs(record.shipmentcompletedate),
    special_order_number: text(record.specialordernumber),
    layaway_number: text(record.layawaynumber),
    po_number: text(record.ponumber),
    repair_order_id: text(record.repairorderid),
    major_unit_id: text(record.majorunitid),
    tax_category_id: text(record.taxcategoryid),
    tax_category_description: text(record.taxcategorydescription),
    weborder_partnumber: text(record.weborderpartnumber),
    weborder_number: text(record.webordernumber),
    order_type: text(record.ordertype),
    ship_to_first_name: text(record.shiptofirstname),
    ship_to_last_name: text(record.shiptolastname),
    ship_to_company: text(record.shiptocompanyname),
    ship_to_email: text(record.shiptoemail),
    ship_to_city: text(record.shiptocity),
    ship_to_state: text(record.shiptostate),
    ship_to_zip: text(record.shiptozipcode),
  };
}

async function syncDeals(sql: any): Promise<SyncResult> {
  const records = await fetchAll("DealDetail", 500);
  const payload = uniqueBy(records.map(transformDeal), (row) => row.dealid);
  let upserted = 0;

  for (const batch of chunk(payload, 100)) {
    const [result] = await sql`select public.bulk_upsert_deals(${sql.json(batch)}) as count`;
    await sql`
      with incoming as (
        select *
        from jsonb_to_recordset(${sql.json(batch)}) as x(
          dealid text,
          deal_no text,
          contract_date text,
          originating_date text,
          create_date text,
          source_type text,
          source text,
          stage_name text,
          salesmanager text,
          salesman_id text,
          salesman_username text,
          term text,
          rate text,
          payment text,
          deposit text,
          total_of_payments text
        )
      )
      update lightspeed.deals d
      set
        deal_no = nullif(i.deal_no, ''),
        contract_date = nullif(i.contract_date, '')::timestamptz,
        originating_date = nullif(i.originating_date, '')::timestamptz,
        create_date = nullif(i.create_date, '')::timestamptz,
        source_type = nullif(i.source_type, ''),
        source = nullif(i.source, ''),
        stage_name = nullif(i.stage_name, ''),
        salesmanager = nullif(i.salesmanager, ''),
        salesman_id = nullif(i.salesman_id, '')::bigint,
        salesman_username = nullif(i.salesman_username, ''),
        term = nullif(i.term, '')::int,
        rate = nullif(i.rate, '')::numeric,
        payment = nullif(i.payment, '')::numeric,
        deposit = nullif(i.deposit, '')::numeric,
        total_of_payments = nullif(i.total_of_payments, '')::numeric
      from incoming i
      where d.dealid = i.dealid
    `;
    upserted += Number(result?.count || 0);
  }

  return { feed: "deals", total: records.length, upserted };
}

async function syncOpenRos(sql: any): Promise<SyncResult> {
  const records = await fetchAll("OpenServiceDet", 500);
  const activeRecords = records.filter(isActiveOpenRo);
  const payload = uniqueBy(activeRecords.map(transformOpenRo), (row) => row.ro_header_id);
  let upserted = 0;

  if (payload.length < OPEN_RO_MIN_ACTIVE_COUNT || payload.length > OPEN_RO_MAX_ACTIVE_COUNT) {
    throw new Error(
      `OpenServiceDet active RO count ${payload.length} outside guarded range ${OPEN_RO_MIN_ACTIVE_COUNT}-${OPEN_RO_MAX_ACTIVE_COUNT}; source records ${records.length}`
    );
  }

  for (const batch of chunk(payload, 200)) {
    const [result] = await sql`select public.bulk_upsert_open_ros(${sql.json(batch)}) as count`;
    await sql`
      with incoming as (
        select *
        from jsonb_to_recordset(${sql.json(batch)}) as x(
          ro_header_id text,
          ro_no text,
          ro_status text,
          close_date text,
          pu_date text,
          date_created text,
          shop_supply text,
          total_tax text,
          total_owed text,
          category text,
          oem_ro_number text
        )
      )
      update lightspeed.ro_headers_open r
      set
        ro_no = nullif(i.ro_no, ''),
        ro_status = nullif(i.ro_status, '')::int,
        close_date = nullif(i.close_date, '')::timestamptz,
        pu_date = nullif(i.pu_date, '')::timestamptz,
        date_created = nullif(i.date_created, '')::timestamptz,
        shop_supply = nullif(i.shop_supply, '')::numeric,
        total_tax = nullif(i.total_tax, '')::numeric,
        total_owed = nullif(i.total_owed, '')::numeric,
        category = nullif(i.category, ''),
        oem_ro_number = nullif(i.oem_ro_number, '')
      from incoming i
      where r.ro_header_id = nullif(i.ro_header_id, '')::bigint
    `;
    upserted += Number(result?.count || 0);
  }

  let purged = 0;
  const liveIds = payload.map((row) => row.ro_header_id);
  const removed = await sql`
    delete from lightspeed.ro_headers_open
    where ro_header_id != all(${liveIds}::bigint[])
    returning ro_header_id
  `;
  purged = removed.length;

  const [{ current_count }] = await sql`
    select count(*)::int as current_count
    from lightspeed.ro_headers_open
    where nullif(trim(ro_no), '') is not null
      and nullif(trim(ro_no), '') <> '-1'
  `;

  if (Number(current_count) !== payload.length) {
    throw new Error(`Open RO mirror reconciliation failed: table has ${current_count}, active payload has ${payload.length}`);
  }

  return {
    feed: "ro_headers_open",
    total: payload.length,
    upserted,
    purged,
    source_total: records.length,
    active_total: payload.length,
  };
}

async function syncPartsInvoices(sql: any, daysBack: number): Promise<SyncResult> {
  const since = new Date(Date.now() - daysBack * 86_400_000);
  const sinceDate = `${since.toISOString().slice(0, 10)}T00:00:00`;
  const filter = `invoicedate gt datetime'${sinceDate}'`;
  const records = await fetchAll("InvoiceDet", 1000, filter);
  const payload = uniqueBy(records.map(transformPartsInvoice), (row) => row.invoice_line_no);
  let upserted = 0;

  for (const batch of chunk(payload, 1000)) {
    const [result] = await sql`select public.bulk_upsert_parts_invoices(${sql.json(batch)}) as count`;
    upserted += Number(result?.count || 0);
  }

  return { feed: "parts_invoices", total: records.length, upserted, filter };
}

Deno.serve(async (req: Request) => {
  const sql = getDb();
  const url = new URL(req.url);
  const feed = url.searchParams.get("feed") || "all";
  const daysBack = Number.parseInt(url.searchParams.get("days_back") || "90", 10);
  const results: SyncResult[] = [];
  const started = Date.now();

  try {
    if (feed === "all" || feed === "deals") results.push(await syncDeals(sql));
    if (feed === "all" || feed === "ro_headers_open" || feed === "open_ros") {
      results.push(await syncOpenRos(sql));
    }
    if (feed === "all" || feed === "parts_invoices") {
      results.push(await syncPartsInvoices(sql, Number.isFinite(daysBack) && daysBack > 0 ? daysBack : 90));
    }

    for (const result of results) {
      await sql`
        insert into lightspeed.sync_log
          (feed_name, status, records_fetched, records_upserted, completed_at, metadata)
        values
          (${result.feed}, 'success', ${result.total}, ${result.upserted}, now(), ${sql.json(result)})
      `;
    }

    await sql.end();
    return new Response(JSON.stringify({
      success: true,
      elapsed_seconds: Number(((Date.now() - started) / 1000).toFixed(1)),
      results,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await sql`
      insert into lightspeed.sync_log
        (feed_name, status, error_message, completed_at, metadata)
      values
        (${feed}, 'failed', ${message}, now(), ${sql.json({ feed, days_back: daysBack })})
    `.catch(() => {});
    await sql.end();
    return new Response(JSON.stringify({ success: false, feed, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

