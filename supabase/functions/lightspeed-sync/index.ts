import { handleLightspeedSync } from "./sync_handler.ts";

Deno.serve((req) => handleLightspeedSync(req));
