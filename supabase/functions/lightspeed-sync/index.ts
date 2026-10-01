import { mapCustomer } from "./customer.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

const LS_USERNAME = Deno.env.get("LIGHTSPEED_USERNAME");
const LS_PASSWORD = Deno.env.get("LIGHTSPEED_PASSWORD");
const LS_BASE = "https://int.lightspeeddataservices.com/lsapi";
const CMF = "76160844";

function getDb() {
  return postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false });
}

async function fetchPage(endpoint: string, skip: number, top: number): Promise<any[]> {
  if (!LS_USERNAME || !LS_PASSWORD) throw new Error("Lightspeed credentials are not configured");
  const auth = btoa(`${LS_USERNAME}:${LS_PASSWORD}`);
  const url = `${LS_BASE}/${endpoint}/${CMF}?$top=${top}&$skip=${skip}&$format=json`;
  const resp = await fetch(url, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });
  if (!resp.ok) throw new Error(`Lightspeed API ${resp.status}`);
  return await resp.json();
}

async function fetchAll(endpoint: string, pageSize = 500): Promise<any[]> {
  const all: any[] = [];
  let skip = 0;
  while (true) {
    const data = await fetchPage(endpoint, skip, pageSize);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

// Fetch ServiceDet by specific ROHeaderIDs using OR filter (avoids pagination Unit[] bug)
async function fetchByROHeaderIDs(ids: number[]): Promise<any[]> {
  if (ids.length === 0) return [];
  if (!LS_USERNAME || !LS_PASSWORD) throw new Error("Lightspeed credentials are not configured");
  const auth = btoa(`${LS_USERNAME}:${LS_PASSWORD}`);
  const filterStr = ids.map(id => `ROHeaderID eq ${id}`).join(" or ");
  const url = `${LS_BASE}/ServiceDet/${CMF}?$filter=${encodeURIComponent(filterStr)}&$format=json`;
  const resp = await fetch(url, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });
  if (!resp.ok) throw new Error(`Lightspeed API ${resp.status}`);
  return await resp.json();
}

function parseTs(val: string | null | undefined): string | null {
  if (!val || val.startsWith("1000-") || val.startsWith("1900-")) return null;
  return val;
}

async function syncCustomers(sql: any) {
  const records = await fetchAll("Customer");
  records.forEach(mapCustomer); // Validate complete consent coverage before any customer writes.
  let upserted = 0;
  for (let i = 0; i < records.length; i += 200) {
    const chunk = records.slice(i, i + 200);
    const values = chunk.map(mapCustomer);
    await sql`INSERT INTO lightspeed.customers ${sql(values, 'customer_id','full_name','first_name','last_name','company_name','address1','address2','city','province','postal_code','country','home_phone','work_phone','cell_phone','email','customer_type','loyalty_customer','opt_out_marketing','comments','date_gathered')}
    ON CONFLICT (customer_id) DO UPDATE SET full_name=EXCLUDED.full_name, first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, company_name=EXCLUDED.company_name, address1=EXCLUDED.address1, address2=EXCLUDED.address2, city=EXCLUDED.city, province=EXCLUDED.province, postal_code=EXCLUDED.postal_code, country=EXCLUDED.country, home_phone=EXCLUDED.home_phone, work_phone=EXCLUDED.work_phone, cell_phone=EXCLUDED.cell_phone, email=EXCLUDED.email, customer_type=EXCLUDED.customer_type, loyalty_customer=EXCLUDED.loyalty_customer, opt_out_marketing=EXCLUDED.opt_out_marketing, comments=EXCLUDED.comments, date_gathered=EXCLUDED.date_gathered, updated_at=NOW(), synced_at=NOW()`;
    upserted += chunk.length;
  }
  return { feed: "customers", total: records.length, upserted };
}

async function syncUnits(sql: any) {
  const records = await fetchAll("Unit");
  const values = records.map((r: any) => ({
    major_unit_header_id: r.MajorUnitHeaderId, stock_number: (r.StockNumber || "").trim(),
    new_used: (r.NewUsed || "").trim(), model_year: r.ModelYear || 0,
    make: (r.Make || "").trim(), model: (r.Model || "").trim(), vin: (r.VIN || "").trim(),
    class: (r.Class || "").trim(), unit_type: (r.UnitType || "").trim(),
    unit_status: (r.UnitStatus || "").trim(), condition: (r.Condition || "").trim(),
    hours: r.Hours || 0, odometer: String(r.Odometer || "").trim(), hp: r.HP || 0,
    length: r.Length || 0, beam: r.Beam || 0, color: (r.Color || "").trim(),
    interior_color: (r.InteriorColor || "").trim(), exterior_color: (r.ExteriorColor || "").trim(),
    hull_construction: (r.HullConstruction || "").trim(), fuel_type: (r.FuelType || "").trim(),
    floor_layout: (r.FloorLayout || "").trim(), msrp: r.MSRP || 0, dsrp: r.DSRP || 0,
    invoice_amt: r.InvoiceAmt || 0, comments: (r.Comments || "").trim(),
    date_received: parseTs(r.DateReceived), date_gathered: parseTs(r.DateGathered),
    last_update_date: parseTs(r.lastupdatedate),
  }));
  await sql`INSERT INTO lightspeed.units ${sql(values, 'major_unit_header_id','stock_number','new_used','model_year','make','model','vin','class','unit_type','unit_status','condition','hours','odometer','hp','length','beam','color','interior_color','exterior_color','hull_construction','fuel_type','floor_layout','msrp','dsrp','invoice_amt','comments','date_received','date_gathered','last_update_date')}
  ON CONFLICT (major_unit_header_id) DO UPDATE SET stock_number=EXCLUDED.stock_number, new_used=EXCLUDED.new_used, model_year=EXCLUDED.model_year, make=EXCLUDED.make, model=EXCLUDED.model, vin=EXCLUDED.vin, class=EXCLUDED.class, unit_type=EXCLUDED.unit_type, unit_status=EXCLUDED.unit_status, condition=EXCLUDED.condition, hours=EXCLUDED.hours, odometer=EXCLUDED.odometer, hp=EXCLUDED.hp, length=EXCLUDED.length, beam=EXCLUDED.beam, color=EXCLUDED.color, interior_color=EXCLUDED.interior_color, exterior_color=EXCLUDED.exterior_color, hull_construction=EXCLUDED.hull_construction, fuel_type=EXCLUDED.fuel_type, floor_layout=EXCLUDED.floor_layout, msrp=EXCLUDED.msrp, dsrp=EXCLUDED.dsrp, invoice_amt=EXCLUDED.invoice_amt, comments=EXCLUDED.comments, date_received=EXCLUDED.date_received, date_gathered=EXCLUDED.date_gathered, last_update_date=EXCLUDED.last_update_date, updated_at=NOW(), synced_at=NOW()`;

  // Purge units that were sold/removed from Lightspeed since last sync
  const liveIds = values.map((v: any) => v.major_unit_header_id);
  const purged = await sql`DELETE FROM lightspeed.units WHERE major_unit_header_id != ALL(${liveIds}::int[]) RETURNING stock_number, make, model`;

  return { feed: "units", total: records.length, upserted: values.length, purged: purged.length };
}

async function syncParts(sql: any) {
  const records = await fetchAll("Part");
  let upserted = 0;
  for (let i = 0; i < records.length; i += 200) {
    const chunk = records.slice(i, i + 200);
    const values = chunk.map((r: any) => ({
      part_number: (r.PartNumber || "").trim(), supplier_code: (r.SupplierCode || "").trim(),
      supplier_name: (r.SupplierName || "").trim(), description: (r.Description || "").trim(),
      on_hand: r.OnHand || 0, available: r.Avail || 0, on_order: r.OnOrder || 0,
      cost: r.Cost || 0, retail_price: r.Retail || 0, active_price: r.CurrentActivePrice || 0,
      category: (r.category || "").trim(), upc: (r.UPC || "").trim(),
      bin1: (r.Bin1 || "").trim(), bin2: (r.Bin2 || "").trim(),
      movement_code: (r.movementcode || "").trim(), last_sold_date: parseTs(r.LastSoldDate),
      last_received_date: parseTs(r.LastReceivedDate), last_count_date: parseTs(r.LastCountDate),
      superseded_to: (r.SupersededTo || "").trim(), date_gathered: parseTs(r.DateGathered),
      last_update_date: parseTs(r.lastupdatedate),
    }));
    await sql`INSERT INTO lightspeed.parts ${sql(values, 'part_number','supplier_code','supplier_name','description','on_hand','available','on_order','cost','retail_price','active_price','category','upc','bin1','bin2','movement_code','last_sold_date','last_received_date','last_count_date','superseded_to','date_gathered','last_update_date')}
    ON CONFLICT (part_number, supplier_code) DO UPDATE SET supplier_name=EXCLUDED.supplier_name, description=EXCLUDED.description, on_hand=EXCLUDED.on_hand, available=EXCLUDED.available, on_order=EXCLUDED.on_order, cost=EXCLUDED.cost, retail_price=EXCLUDED.retail_price, active_price=EXCLUDED.active_price, category=EXCLUDED.category, upc=EXCLUDED.upc, bin1=EXCLUDED.bin1, bin2=EXCLUDED.bin2, movement_code=EXCLUDED.movement_code, last_sold_date=EXCLUDED.last_sold_date, last_received_date=EXCLUDED.last_received_date, last_count_date=EXCLUDED.last_count_date, superseded_to=EXCLUDED.superseded_to, date_gathered=EXCLUDED.date_gathered, last_update_date=EXCLUDED.last_update_date, updated_at=NOW(), synced_at=NOW()`;
    upserted += chunk.length;
  }
  return { feed: "parts", total: records.length, upserted };
}

// Service sync: paginate for headers, then re-fetch each page's ROHeaderIDs via OR filter
// to get complete Unit/Job/Labor/Parts data (pagination returns empty Unit[] for many records)
async function syncServicePage(sql: any, skip: number, top: number) {
  // Step 1: Get the page of RO headers via normal pagination
  const pageRecords = await fetchPage("ServiceDet", skip, top);
  if (pageRecords.length === 0) return { done: true, headers: 0, units: 0, jobs: 0, labor: 0, parts: 0 };

  // Step 2: Upsert RO headers (header fields come through pagination fine)
  const headers = pageRecords.map((ro: any) => ({
    ro_header_id: ro.ROHeaderID, ro_number: ro.rono || "", customer_id: ro.CustID,
    date_in: parseTs(ro.datein), close_date: parseTs(ro.closedate),
    pickup_date: parseTs(ro.pudate), promised_date: parseTs(ro.promiseddate),
    last_modified: parseTs(ro.lastmodifieddate), date_created: parseTs(ro.datecreated),
    service_writer: ro.ServiceWriterName || "", service_writer_id: ro.Servicewriterid || 0,
    shop_supply: ro.shopsupply || 0, total_tax: ro.Totaltax || 0,
    total_owed: ro.totalowed || 0, category: ro.category || null,
    oem_ro_number: ro.oemronumber || "",
  }));
  await sql`INSERT INTO lightspeed.ro_headers ${sql(headers, 'ro_header_id','ro_number','customer_id','date_in','close_date','pickup_date','promised_date','last_modified','date_created','service_writer','service_writer_id','shop_supply','total_tax','total_owed','category','oem_ro_number')}
  ON CONFLICT (ro_header_id) DO UPDATE SET ro_number=EXCLUDED.ro_number, customer_id=EXCLUDED.customer_id, date_in=EXCLUDED.date_in, close_date=EXCLUDED.close_date, pickup_date=EXCLUDED.pickup_date, promised_date=EXCLUDED.promised_date, last_modified=EXCLUDED.last_modified, date_created=EXCLUDED.date_created, service_writer=EXCLUDED.service_writer, service_writer_id=EXCLUDED.service_writer_id, shop_supply=EXCLUDED.shop_supply, total_tax=EXCLUDED.total_tax, total_owed=EXCLUDED.total_owed, category=EXCLUDED.category, oem_ro_number=EXCLUDED.oem_ro_number, updated_at=NOW(), synced_at=NOW()`;

  // Step 3: Re-fetch same ROHeaderIDs via OR filter to get full Unit/Job/Labor/Parts data
  const roHeaderIds = pageRecords.map((ro: any) => ro.ROHeaderID);
  const fullRecords = await fetchByROHeaderIDs(roHeaderIds);

  const units: any[] = [], jobs: any[] = [], labors: any[] = [], parts: any[] = [];
  for (const ro of fullRecords) {
    for (const u of ro.Unit || []) {
      units.push({ ro_unit_id: u.ROUnitID, ro_header_id: ro.ROHeaderID, major_unit_header_id: u.majorunitheaderid || null, vin: u.VIN || "", make: u.Make || "", model: u.Model || "", year: u.Year || "", stock_number: u.StockNumber || "", model_name: u.modelname || "", class: u.Class || "", odometer: u.Odometer || 0, unit_on_lot: u.unitonlot === true });
      for (const j of u.Job || []) {
        jobs.push({ ro_job_id: j.ROJobID, ro_unit_id: u.ROUnitID, ro_header_id: ro.ROHeaderID, job_title: j.JobTitle || "", job_description: j.JobDescription || "", technotes: j.technotes || "", resolution: j.resolution || "", recommendations: j.recommendations || "", action_taken: j.actiontaken || null, reason_for_delay: j.reasonfordelay || null, sales_type: j.salestype || "", internal_job: j.InternalJob ? true : false, warranty_job: j.WarrantyJob ? true : false, warranty_status: j.warrantystatus || "", customer_approval: j.customerapproval || "", shop_supply: j.ShopSupply || 0, custom_item1: j.customitem1 || null, custom_item2: j.customitem2 || null, custom_item3: j.customitem3 || null, custom_item4: j.customitem4 || null });
        for (const lb of j.Labor || []) {
          labors.push({ ro_labor_id: lb.ROLaborID, ro_job_id: j.ROJobID, description: lb.JobDescription || "", hours: lb.Hours || 0, rate: lb.Rate || 0, total: lb.Total || 0, total_charge: lb.TotalCharge || 0, actual_hours: lb.Actualhours || 0, technician_name: lb.TechnicianName || "", technician_code: lb.techniciancode || "", technician_id: lb.technicianid || 0, close_time: parseTs(lb.closetime) });
        }
        for (const pt of j.Parts || []) {
          parts.push({ ro_part_id: pt.ROPartID, ro_job_id: j.ROJobID, part_number: pt.PartNumber || "", description: pt.PartDescription || "", source_code: pt.SourceCode || "", qty: pt.Qty || 0, cost: pt.Cost || 0, price: pt.Price || 0, ext_price: pt.ExtPrice || 0, discount_price: pt.DiscountPrice || 0 });
        }
      }
    }
  }

  if (units.length > 0) await sql`INSERT INTO lightspeed.ro_units ${sql(units, 'ro_unit_id','ro_header_id','major_unit_header_id','vin','make','model','year','stock_number','model_name','class','odometer','unit_on_lot')} ON CONFLICT (ro_unit_id) DO UPDATE SET ro_header_id=EXCLUDED.ro_header_id, major_unit_header_id=EXCLUDED.major_unit_header_id, vin=EXCLUDED.vin, make=EXCLUDED.make, model=EXCLUDED.model, year=EXCLUDED.year, stock_number=EXCLUDED.stock_number, model_name=EXCLUDED.model_name, class=EXCLUDED.class, odometer=EXCLUDED.odometer, unit_on_lot=EXCLUDED.unit_on_lot, synced_at=NOW()`;
  if (jobs.length > 0) await sql`INSERT INTO lightspeed.ro_jobs ${sql(jobs, 'ro_job_id','ro_unit_id','ro_header_id','job_title','job_description','technotes','resolution','recommendations','action_taken','reason_for_delay','sales_type','internal_job','warranty_job','warranty_status','customer_approval','shop_supply','custom_item1','custom_item2','custom_item3','custom_item4')} ON CONFLICT (ro_job_id) DO UPDATE SET ro_unit_id=EXCLUDED.ro_unit_id, ro_header_id=EXCLUDED.ro_header_id, job_title=EXCLUDED.job_title, job_description=EXCLUDED.job_description, technotes=EXCLUDED.technotes, resolution=EXCLUDED.resolution, recommendations=EXCLUDED.recommendations, action_taken=EXCLUDED.action_taken, reason_for_delay=EXCLUDED.reason_for_delay, sales_type=EXCLUDED.sales_type, internal_job=EXCLUDED.internal_job, warranty_job=EXCLUDED.warranty_job, warranty_status=EXCLUDED.warranty_status, customer_approval=EXCLUDED.customer_approval, shop_supply=EXCLUDED.shop_supply, custom_item1=EXCLUDED.custom_item1, custom_item2=EXCLUDED.custom_item2, custom_item3=EXCLUDED.custom_item3, custom_item4=EXCLUDED.custom_item4, synced_at=NOW()`;
  if (labors.length > 0) await sql`INSERT INTO lightspeed.ro_labor ${sql(labors, 'ro_labor_id','ro_job_id','description','hours','rate','total','total_charge','actual_hours','technician_name','technician_code','technician_id','close_time')} ON CONFLICT (ro_labor_id) DO UPDATE SET ro_job_id=EXCLUDED.ro_job_id, description=EXCLUDED.description, hours=EXCLUDED.hours, rate=EXCLUDED.rate, total=EXCLUDED.total, total_charge=EXCLUDED.total_charge, actual_hours=EXCLUDED.actual_hours, technician_name=EXCLUDED.technician_name, technician_code=EXCLUDED.technician_code, technician_id=EXCLUDED.technician_id, close_time=EXCLUDED.close_time, synced_at=NOW()`;
  if (parts.length > 0) await sql`INSERT INTO lightspeed.ro_parts ${sql(parts, 'ro_part_id','ro_job_id','part_number','description','source_code','qty','cost','price','ext_price','discount_price')} ON CONFLICT (ro_part_id) DO UPDATE SET ro_job_id=EXCLUDED.ro_job_id, part_number=EXCLUDED.part_number, description=EXCLUDED.description, source_code=EXCLUDED.source_code, qty=EXCLUDED.qty, cost=EXCLUDED.cost, price=EXCLUDED.price, ext_price=EXCLUDED.ext_price, discount_price=EXCLUDED.discount_price, synced_at=NOW()`;

  return { done: pageRecords.length < top, headers: headers.length, units: units.length, jobs: jobs.length, labor: labors.length, parts: parts.length };
}

Deno.serve(async (req: Request) => {
  const sql = getDb();
  try {
    const url = new URL(req.url);
    const feed = url.searchParams.get("feed") || "all";
    const results: any[] = [];
    const startTime = Date.now();

    if (feed === "all" || feed === "customers") results.push(await syncCustomers(sql));
    if (feed === "all" || feed === "units") results.push(await syncUnits(sql));
    if (feed === "all" || feed === "parts") results.push(await syncParts(sql));

    if (feed === "all" || feed === "service") {
      const pageSize = parseInt(url.searchParams.get("page_size") || "500");
      let skip = parseInt(url.searchParams.get("skip") || "0");
      let totalH = 0, totalU = 0, totalJ = 0, totalL = 0, totalP = 0;
      while (true) {
        const r = await syncServicePage(sql, skip, pageSize);
        totalH += r.headers; totalU += r.units; totalJ += r.jobs; totalL += r.labor; totalP += r.parts;
        if (r.done) break;
        skip += pageSize;
      }
      results.push({ feed: "service_detail", total_ros: totalH, units: totalU, jobs: totalJ, labor: totalL, parts: totalP });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    for (const r of results) {
      await sql`INSERT INTO lightspeed.sync_log (feed_name, status, records_fetched, records_upserted, completed_at, metadata) VALUES (${r.feed}, 'completed', ${r.total || r.total_ros || 0}, ${r.upserted || r.total_ros || 0}, NOW(), ${JSON.stringify(r)}::jsonb)`;
    }
    await sql.end();
    return new Response(JSON.stringify({ success: true, elapsed_seconds: elapsed, results }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    await sql`INSERT INTO lightspeed.sync_log (feed_name, status, error_message, completed_at) VALUES ('error', 'failed', ${error instanceof Error ? error.message : "Sync failed"}, NOW())`.catch(() => {});
    await sql.end();
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Sync failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

