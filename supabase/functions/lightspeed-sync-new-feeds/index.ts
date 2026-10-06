import { handleLightspeedNewFeeds } from "./sync_handler.ts";

Deno.serve((req) => handleLightspeedNewFeeds(req));
