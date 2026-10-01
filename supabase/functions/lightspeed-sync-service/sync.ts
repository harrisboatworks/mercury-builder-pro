import { parseLightspeedJson } from "../_shared/lightspeed-json.ts";
export function serviceFilter(days: number, now = new Date()) {
  if (!days) return undefined;
  const since = new Date(now.getTime()-days*86400000).toISOString().slice(0,10)+"T00:00:00";
  return ["lastmodifieddate","closedate","datein"].map(f => `${f} ge datetime'${since}'`).join(" or ");
}
export async function fetchServicePage(skip: number,top: number,filter?: string,fetcher: typeof fetch = fetch): Promise<any[]> {
  const username=Deno.env.get("LIGHTSPEED_USERNAME"),password=Deno.env.get("LIGHTSPEED_PASSWORD");
  if (!username || !password) throw new Error("Lightspeed credentials are not configured");
  const params=new URLSearchParams({"$top":String(top),"$skip":String(skip),"$format":"json","$orderby":"ROHeaderID asc"});
  if(filter) params.set("$filter",filter);
  const response=await fetcher(`https://int.lightspeeddataservices.com/lsapi/ServiceDet/76160844?${params}`,{headers:{Authorization:`Basic ${btoa(`${username}:${password}`)}`,Accept:"application/json"},signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw new Error(`Lightspeed API ${response.status}`);
  const rows=parseLightspeedJson(await response.text());
  if(!Array.isArray(rows)) throw new Error("Invalid Lightspeed response shape");
  return rows;
}
export async function fetchFullServiceRecords(ids: number[],fetcher: typeof fetch = fetch) {
  const all:any[]=[];
  for(let i=0;i<ids.length;i+=20) {
    const batch=ids.slice(i,i+20),wanted=new Set(batch);
    const rows=await fetchServicePage(0,batch.length,batch.map(id=>`ROHeaderID eq ${id}`).join(" or "),fetcher);
    if(rows.length!==wanted.size || new Set(rows.map(r=>r.ROHeaderID)).size!==wanted.size || rows.some(r=>!wanted.has(r.ROHeaderID))) throw new Error("Incomplete RO detail response");
    all.push(...rows);
  }
  return all;
}
function parseTs(val: string | null | undefined) {
  return !val || val.startsWith("1000-") || val.startsWith("1900-") ? null : val;
}
async function upsertRecords(sql:any,records:any[]) {
    // Headers
    const headers = records.map((ro: any) => ({
      ro_header_id: ro.ROHeaderID, ro_number: ro.rono || "", customer_id: ro.CustID,
      date_in: parseTs(ro.datein), close_date: parseTs(ro.closedate),
      pickup_date: parseTs(ro.pudate), promised_date: parseTs(ro.promiseddate),
      last_modified: parseTs(ro.lastmodifieddate), date_created: parseTs(ro.datecreated),
      service_writer: ro.ServiceWriterName || "", service_writer_id: ro.Servicewriterid || 0,
      shop_supply: ro.shopsupply || 0, total_tax: ro.Totaltax || 0,
      total_owed: ro.totalowed || 0, category: ro.category || null,
      oem_ro_number: ro.oemronumber || "",
    }));
    await sql`INSERT INTO lightspeed.ro_headers ${sql(headers, 'ro_header_id','ro_number','customer_id','date_in','close_date','pickup_date','promised_date','last_modified','date_created','service_writer','service_writer_id','shop_supply','total_tax','total_owed','category','oem_ro_number')} ON CONFLICT (ro_header_id) DO UPDATE SET ro_number=EXCLUDED.ro_number, customer_id=EXCLUDED.customer_id, date_in=EXCLUDED.date_in, close_date=EXCLUDED.close_date, pickup_date=EXCLUDED.pickup_date, promised_date=EXCLUDED.promised_date, last_modified=EXCLUDED.last_modified, date_created=EXCLUDED.date_created, service_writer=EXCLUDED.service_writer, service_writer_id=EXCLUDED.service_writer_id, shop_supply=EXCLUDED.shop_supply, total_tax=EXCLUDED.total_tax, total_owed=EXCLUDED.total_owed, category=EXCLUDED.category, oem_ro_number=EXCLUDED.oem_ro_number, updated_at=NOW(), synced_at=NOW()`;

    const units: any[] = [], jobs: any[] = [], labors: any[] = [], parts: any[] = [];
    for (const ro of records) {
      for (const u of ro.Unit || []) {
        units.push({ ro_unit_id: u.ROUnitID, ro_header_id: ro.ROHeaderID, major_unit_header_id: u.majorunitheaderid || null, vin: u.VIN || "", make: u.Make || "", model: u.Model || "", year: u.Year || "", stock_number: u.StockNumber || "", model_name: u.modelname || "", class: u.Class || "", odometer: u.Odometer || 0, unit_on_lot: u.unitonlot === true });
        for (const j of u.Job || []) {
          jobs.push({ ro_job_id: j.ROJobID, ro_unit_id: u.ROUnitID, ro_header_id: ro.ROHeaderID, job_title: j.JobTitle || "", job_description: j.JobDescription || "", technotes: j.technotes || "", resolution: j.resolution || "", recommendations: j.recommendations || "", action_taken: j.actiontaken || null, reason_for_delay: j.reasonfordelay || null, sales_type: j.salestype || "", internal_job: j.InternalJob ? true : false, warranty_job: j.WarrantyJob ? true : false, warranty_status: j.warrantystatus || "", customer_approval: j.customerapproval || "", shop_supply: j.ShopSupply || 0, custom_item1: j.customitem1 || null, custom_item2: j.customitem2 || null, custom_item3: j.customitem3 || null, custom_item4: j.customitem4 || null });
          for (const lb of j.Labor || []) labors.push({ ro_labor_id: lb.ROLaborID, ro_job_id: j.ROJobID, description: lb.JobDescription || "", hours: lb.Hours || 0, rate: lb.Rate || 0, total: lb.Total || 0, total_charge: lb.TotalCharge || 0, actual_hours: lb.Actualhours || 0, technician_name: lb.TechnicianName || "", technician_code: lb.techniciancode || "", technician_id: lb.technicianid || 0, close_time: parseTs(lb.closetime) });
          for (const pt of j.Parts || []) parts.push({ ro_part_id: pt.ROPartID, ro_job_id: j.ROJobID, part_number: pt.PartNumber || "", description: pt.PartDescription || "", source_code: pt.SourceCode || "", qty: pt.Qty || 0, cost: pt.Cost || 0, price: pt.Price || 0, ext_price: pt.ExtPrice || 0, discount_price: pt.DiscountPrice || 0 });
        }
      }
    }

    if (units.length > 0) await sql`INSERT INTO lightspeed.ro_units ${sql(units, 'ro_unit_id','ro_header_id','major_unit_header_id','vin','make','model','year','stock_number','model_name','class','odometer','unit_on_lot')} ON CONFLICT (ro_unit_id) DO UPDATE SET ro_header_id=EXCLUDED.ro_header_id, major_unit_header_id=EXCLUDED.major_unit_header_id, vin=EXCLUDED.vin, make=EXCLUDED.make, model=EXCLUDED.model, year=EXCLUDED.year, stock_number=EXCLUDED.stock_number, model_name=EXCLUDED.model_name, class=EXCLUDED.class, odometer=EXCLUDED.odometer, unit_on_lot=EXCLUDED.unit_on_lot, synced_at=NOW()`;
    if (jobs.length > 0) await sql`INSERT INTO lightspeed.ro_jobs ${sql(jobs, 'ro_job_id','ro_unit_id','ro_header_id','job_title','job_description','technotes','resolution','recommendations','action_taken','reason_for_delay','sales_type','internal_job','warranty_job','warranty_status','customer_approval','shop_supply','custom_item1','custom_item2','custom_item3','custom_item4')} ON CONFLICT (ro_job_id) DO UPDATE SET ro_unit_id=EXCLUDED.ro_unit_id, ro_header_id=EXCLUDED.ro_header_id, job_title=EXCLUDED.job_title, job_description=EXCLUDED.job_description, technotes=EXCLUDED.technotes, resolution=EXCLUDED.resolution, recommendations=EXCLUDED.recommendations, action_taken=EXCLUDED.action_taken, reason_for_delay=EXCLUDED.reason_for_delay, sales_type=EXCLUDED.sales_type, internal_job=EXCLUDED.internal_job, warranty_job=EXCLUDED.warranty_job, warranty_status=EXCLUDED.warranty_status, customer_approval=EXCLUDED.customer_approval, shop_supply=EXCLUDED.shop_supply, custom_item1=EXCLUDED.custom_item1, custom_item2=EXCLUDED.custom_item2, custom_item3=EXCLUDED.custom_item3, custom_item4=EXCLUDED.custom_item4, synced_at=NOW()`;
    if (labors.length > 0) await sql`INSERT INTO lightspeed.ro_labor ${sql(labors, 'ro_labor_id','ro_job_id','description','hours','rate','total','total_charge','actual_hours','technician_name','technician_code','technician_id','close_time')} ON CONFLICT (ro_labor_id) DO UPDATE SET ro_job_id=EXCLUDED.ro_job_id, description=EXCLUDED.description, hours=EXCLUDED.hours, rate=EXCLUDED.rate, total=EXCLUDED.total, total_charge=EXCLUDED.total_charge, actual_hours=EXCLUDED.actual_hours, technician_name=EXCLUDED.technician_name, technician_code=EXCLUDED.technician_code, technician_id=EXCLUDED.technician_id, close_time=EXCLUDED.close_time, synced_at=NOW()`;
    if (parts.length > 0) await sql`INSERT INTO lightspeed.ro_parts ${sql(parts, 'ro_part_id','ro_job_id','part_number','description','source_code','qty','cost','price','ext_price','discount_price')} ON CONFLICT (ro_part_id) DO UPDATE SET ro_job_id=EXCLUDED.ro_job_id, part_number=EXCLUDED.part_number, description=EXCLUDED.description, source_code=EXCLUDED.source_code, qty=EXCLUDED.qty, cost=EXCLUDED.cost, price=EXCLUDED.price, ext_price=EXCLUDED.ext_price, discount_price=EXCLUDED.discount_price, synced_at=NOW()`;


  return {headers:headers.length,units:units.length,jobs:jobs.length,labor:labors.length,parts:parts.length};
}
export async function runServiceSync(req:Request,sql:any,fetcher:typeof fetch=fetch) {
  const startedAt=new Date().toISOString(),url=new URL(req.url);
  const skip=Number(url.searchParams.get("skip")||"0"),top=Number(url.searchParams.get("top")||"500"),days=Number(url.searchParams.get("days_back")||"0");
  if(![skip,top,days].every(Number.isSafeInteger)||skip<0||top<1||top>500||days<0||days>3650) return Response.json({success:false,error:"Invalid sync parameters"},{status:400});
  const filter=serviceFilter(days),seen=new Set<number>(),counts={headers:0,units:0,jobs:0,labor:0,parts:0};
  let fetched=0,pages=0,currentSkip=skip;
  try {
    for(;;) {
      if(pages>=50 || Date.now()-Date.parse(startedAt)>240000) throw new Error("Sync bound reached before completeness");
      const page=await fetchServicePage(currentSkip,top,filter,fetcher);pages++;
      if(!page.length) break;
      const ids=page.map(r=>r.ROHeaderID);
      if(ids.some(id=>!Number.isSafeInteger(id)||id<=0||seen.has(id)) || new Set(ids).size!==ids.length) throw new Error("Invalid or repeated RO page keys");
      const full=await fetchFullServiceRecords(ids,fetcher);
      const added=await sql.begin((tx:any)=>upsertRecords(tx,full));
      for(const k of Object.keys(counts) as (keyof typeof counts)[]) counts[k]+=added[k];
      ids.forEach(id=>seen.add(id));fetched+=ids.length;
      if(page.length<top) break;
      currentSkip+=top;
    }
    const metadata={days_back:days||"all",skip,top,pages,filter_fields:["lastmodifieddate","closedate","datein"],complete:true,...counts};
    await sql`INSERT INTO lightspeed.sync_log (feed_name,status,records_fetched,records_upserted,started_at,completed_at,metadata) VALUES ('service_detail_incremental','completed',${fetched},${counts.headers},${startedAt},NOW(),${JSON.stringify(metadata)}::jsonb)`;
    return Response.json({success:true,done:true,fetched,...metadata});
  }catch(error) {
    const message=error instanceof Error && /^(Lightspeed API \d+|Incomplete RO detail response|Invalid Lightspeed response shape|Invalid or repeated RO page keys|Sync bound reached before completeness|Lightspeed credentials are not configured)$/.test(error.message)?error.message:"Service sync failed";
    await sql`INSERT INTO lightspeed.sync_log (feed_name,status,records_fetched,records_upserted,started_at,completed_at,error_message,metadata) VALUES ('service_detail_incremental','failed',${fetched},${counts.headers},${startedAt},NOW(),${message},${JSON.stringify({skip,top,pages,complete:false,next_skip:currentSkip})}::jsonb)`.catch(()=>{});
    return Response.json({success:false,done:false,error:message,fetched,pages},{status:500});
  }
}

