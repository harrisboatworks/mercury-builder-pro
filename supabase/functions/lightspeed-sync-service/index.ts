import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";
import { runServiceSync } from "./sync.ts";
Deno.serve(async(req:Request)=>{
  const sql=postgres(Deno.env.get("SUPABASE_DB_URL")!,{prepare:false,max:1});
  try{return await runServiceSync(req,sql);}finally{await sql.end();}
});

