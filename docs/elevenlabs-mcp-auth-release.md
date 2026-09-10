# ElevenLabs MCP authentication release checklist

PR #523 requires `ELEVENLABS_MCP_SECRET` for every request except CORS OPTIONS. The matching header is `x-elevenlabs-mcp-secret`. This document is a release specification, not evidence that either hosted system is configured, and does not authorize a production change.

## Configuration and verification order

1. Confirm the attached HBW Tools MCP server on the intended ElevenLabs agent still points to this Supabase function and uses the existing Streamable HTTP transport. Repository evidence in `voice-trade-in-acceptance.md` records this configuration on September 6; inspect the current dashboard without reading conversations or credentials. Inventory every other MCP caller before enforcing authentication.
2. Through the approved secret-management surfaces, configure the same new secret in Supabase as `ELEVENLABS_MCP_SECRET` and in the ElevenLabs MCP connection as custom header `x-elevenlabs-mcp-secret`. Never use the service-role key as this secret, print either value, put them in git, or include them in screenshots. Configure both before deploying the new gate. A missing server value causes all non-OPTIONS requests to fail closed with 401.
3. Confirm configuration presence and the custom-header name without exposing the value. A pre-deployment successful connection is insufficient: the old endpoint ignores this header and cannot prove the values match.
4. After separately authorized merge/deployment, prove unauthenticated GET and POST `initialize` return 401. Through the configured caller, prove GET/`initialize`/`tools/list` succeed. Discovery is sufficient for authentication verification: do not invoke SMS, email, callbacks, reminders, lead creation, or a voice session as an authentication test.
5. Record deployment commit/function version and the above results. If legitimate discovery fails, repair the configuration. Do not restore an anonymous privileged endpoint as a rollback. Keep unrelated tool acceptance distinct from authentication acceptance.

## Known behavior retained by #523

The two relay tools still require a matching phone or email in `customer_quotes`, even when the MCP secret is correct. Thus authenticated first-time callers cannot receive photos or motor-information email through these tools. Passing authentication tests does not establish that the whole voice customer journey works.

Photo relay limits are 6 requests per recipient per hour and 60 per request IP per hour. Email relay limits are 8 per recipient and 30 per IP per hour. Both fail closed when the limiter is unavailable. Request IP can represent shared provider egress, not the customer; the thresholds are not per-caller limits. Requests consume rate-limit attempts before recipient lookup. The existing focused tests use fake recipients and mocked services; no real message is sent.

## Separate post-authentication improvement

After authentication is deployed and accepted, assess a separate change allowing a validated, explicitly requested recipient supplied during a trusted conversation without requiring a preexisting quote. Preserve fail-closed recipient quotas and a deliberate aggregate provider budget; do not label provider IP as individual caller identity. A conversation-specific key is useful only when bound to trusted provider metadata, never a client-supplied identity assumed trustworthy. Test first-time recipients, invalid contacts, limiter errors/exhaustion, shared provider IP across distinct recipients, and both missing/wrong secrets with mocked outbound services before any authorized live message test. This should not remove current containment before the authenticated channel is verified.
