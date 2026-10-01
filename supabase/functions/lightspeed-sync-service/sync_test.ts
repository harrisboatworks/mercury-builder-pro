import {serviceFilter,runServiceSync} from "./sync.ts";
const equal=(a:unknown,b:unknown)=>{if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error(`Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);};
function db() {
 const logs:{text:string,values:unknown[]}[]=[];
 const sql:any=(strings:TemplateStringsArray|any[],...values:unknown[])=>{
   if(!("raw" in strings)) return strings;
   logs.push({text:strings.join("?"),values});return Promise.resolve([]);
 };
 sql.begin=async(fn:any)=>fn(sql);
 return {sql,logs};
}
function provider(pages:any[][],badDetail=false) {
 const calls:string[]=[];
 const fetcher:typeof fetch=async(input:any)=>{
  const u=new URL(String(input)),filter=u.searchParams.get("$filter")||"";calls.push(u.search);
  if(filter.startsWith("ROHeaderID eq")) {
   const ids=[...filter.matchAll(/ROHeaderID eq (\d+)/g)].map(m=>Number(m[1]));
   return Response.json(badDetail?[]:ids.map(id=>({ROHeaderID:id,rono:String(id),CustID:1,datein:"2025-01-01",closedate:"2026-09-30",lastmodifieddate:"2026-09-30",Unit:[{ROUnitID:id,VIN:"fixture-vin",Job:[{ROJobID:id,actiontaken:"changed",customerapproval:"yes",Labor:[{ROLaborID:id,Rate:125,Actualhours:3}],Parts:[{ROPartID:id,Qty:2,Price:25,ExtPrice:45,DiscountPrice:5}]}]}]})));
  }
  const skip=Number(u.searchParams.get("$skip"));return Response.json(pages[skip]||[]);
 };
 return {fetcher,calls};
}
Deno.env.set("LIGHTSPEED_USERNAME","fixture");Deno.env.set("LIGHTSPEED_PASSWORD","fixture");
Deno.test("old check-in with recent close or modification is included in filter",()=>{
 const f=serviceFilter(60,new Date("2026-10-01T12:00:00Z"))!;
 equal(f.includes("lastmodifieddate ge"),true);equal(f.includes("closedate ge"),true);equal(serviceFilter(0),undefined);
});
Deno.test("follows pages, refetches nested detail lost by paging, and refreshes mutable fields",async()=>{
 const {sql,logs}=db(),{fetcher,calls}=provider([[{ROHeaderID:10}],[{ROHeaderID:11}],[]]);
 const res=await runServiceSync(new Request("https://fixture/?top=1&days_back=60"),sql,fetcher),out=await res.json();
 equal(res.status,200);equal(out.headers,2);equal(out.units,2);equal(out.parts,2);equal(out.pages,3);equal(out.complete,true);
 equal(calls.filter(s=>new URLSearchParams(s).get("$filter")?.startsWith("ROHeaderID")).length,2);
 const part=logs.find(l=>l.text.includes("INSERT INTO lightspeed.ro_parts"))!;
 equal(part.text.includes("ext_price=EXCLUDED.ext_price"),true);
 equal(part.text.includes("discount_price=EXCLUDED.discount_price"),true);
 equal((part.values[0] as any[])[0].ext_price,45);
 const job=logs.find(l=>l.text.includes("INSERT INTO lightspeed.ro_jobs"))!;
 equal(job.text.includes("customer_approval=EXCLUDED.customer_approval"),true);
 equal((job.values[0] as any[])[0].action_taken,"changed");
 const log=logs.at(-1)!;equal(log.text.includes("started_at"),true);equal(log.text.includes("'completed'"),true);
});
Deno.test("incomplete detail fails before writes and records failure",async()=>{
 const {sql,logs}=db(),{fetcher}=provider([[{ROHeaderID:10}]],true);
 const res=await runServiceSync(new Request("https://fixture/?top=1"),sql,fetcher);
 equal(res.status,500);equal(logs.length,1);equal(logs[0].text.includes("'failed'"),true);
 equal(JSON.parse(logs[0].values.at(-1) as string).complete,false);
});
Deno.test("repeated page keys cannot report completeness",async()=>{
 const {sql,logs}=db(),{fetcher}=provider([[{ROHeaderID:10}],[{ROHeaderID:10}]]);
 const res=await runServiceSync(new Request("https://fixture/?top=1"),sql,fetcher);
 equal(res.status,500);equal(logs.at(-1)!.text.includes("'failed'"),true);
});
Deno.test("invalid parameters perform no API calls or writes",async()=>{
 const {sql,logs}=db();let calls=0;
 const res=await runServiceSync(new Request("https://fixture/?top=0"),sql,async()=>{calls++;return Response.json([]);});
 equal(res.status,400);equal(calls,0);equal(logs.length,0);
});

