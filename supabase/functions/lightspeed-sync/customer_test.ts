import {mapCustomer} from "./customer.ts";
const equal=(a:unknown,b:unknown)=>{if(a!==b) throw new Error("Customer mapping mismatch");};
Deno.test("source changes refresh phone, address and marketing consent",()=>{
 const old=mapCustomer({CustomerId:1,HomePhone:"111",WorkPhone:"222",Address2:"old",Zip:"old",Country:"CA",LoyaltyCustomer:0,optoutmarketing:false});
 const changed=mapCustomer({CustomerId:1,HomePhone:"333",WorkPhone:"444",Address2:"new",Zip:"new",Country:"CA",LoyaltyCustomer:1,optoutmarketing:true});
 equal(old.opt_out_marketing,false);equal(changed.opt_out_marketing,true);equal(changed.home_phone,"333");equal(changed.work_phone,"444");equal(changed.address2,"new");equal(changed.postal_code,"new");equal(changed.loyalty_customer,true);
});
Deno.test("unknown consent cannot silently become opted-in",()=>{
 let rejected=false;try{mapCustomer({CustomerId:1});}catch{rejected=true;}equal(rejected,true);
});
