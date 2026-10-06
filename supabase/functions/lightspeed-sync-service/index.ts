import { handleLightspeedServiceSync } from "./request.ts";

Deno.serve((req) => handleLightspeedServiceSync(req));
