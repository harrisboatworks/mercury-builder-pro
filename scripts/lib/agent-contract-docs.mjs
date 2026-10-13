import ts from 'typescript';
import { agentDiscoveryGuidance } from './public-blog-catalog.mjs';
import { metaMuseMarkdownGuidance } from '../../src/lib/meta-muse-guidance.js';

export const agentFinancingGuidance = 'Request build_quote for the selected motor and purchase options. Use its available offers, eligibility, APR, amount financed, fees, amortization and contract term from active financing records. Estimates require lender approval. Do not substitute cached headline rates or treat amortization as the contract term. If financing is unavailable, do not invent a monthly payment.';

export function readPublicMcpCatalog(source, catalogName = 'TOOLS') {
  const file = ts.createSourceFile('agent-mcp-server.ts', source, ts.ScriptTarget.Latest, true);
  let catalog;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === catalogName) {
      if (!node.initializer || !ts.isArrayLiteralExpression(node.initializer)) throw new Error('MCP tools must be an explicit array');
      catalog = node.initializer.elements.map((entry) => {
        if (!ts.isObjectLiteralExpression(entry)) throw new Error('Invalid MCP tool');
        const field = (name) => entry.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(file).replace(/["']/g, '') === name)?.initializer;
        const name = field('name'), description = field('description'), hints = field('annotations');
        if (!name || !description || !ts.isStringLiteral(name) || !ts.isStringLiteral(description) || !hints || !ts.isCallExpression(hints) || hints.expression.getText(file) !== 'mcpToolAnnotations') throw new Error('MCP tool requires literal name/description and explicit annotations');
        const kind = hints.arguments[0]?.text;
        if (!['read', 'write', 'destructive-write'].includes(kind)) throw new Error('Unknown annotation policy');
        return { name: name.text, description: description.text, annotations: {
          readOnlyHint: kind === 'read', destructiveHint: kind === 'destructive-write',
          ...(kind !== 'read' ? { idempotentHint: false } : {}), openWorldHint: false,
        } };
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (!catalog?.length || new Set(catalog.map(t => t.name)).size !== catalog.length) throw new Error('Missing or duplicate MCP tool');
  return catalog;
}

export function readUcpToolNames(source) {
  const file = ts.createSourceFile('ucp-checkout.ts', source, ts.ScriptTarget.Latest, true);
  let names;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'MCP_TOOLS') {
      let value = node.initializer;
      while (value && (ts.isAsExpression(value) || ts.isSatisfiesExpression(value))) value = value.expression;
      if (!value || !ts.isArrayLiteralExpression(value)) throw new Error('UCP tool catalog must be an explicit array');
      names = value.elements.map((element) => {
        if (!ts.isObjectLiteralExpression(element)) throw new Error('Unexpected UCP tool entry');
        const property = element.properties.find((item) => ts.isPropertyAssignment(item) && item.name.getText(file).replace(/["']/g, '') === 'name');
        if (!property || !ts.isStringLiteral(property.initializer)) throw new Error('UCP tool name must be a literal');
        return property.initializer.text;
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (!names?.length || new Set(names).size !== names.length) throw new Error('Missing or duplicate UCP tools');
  return names;
}

export function synchronizeAgentContractDocs(markdown, ucpSource, mcpSource) {
  const names = readUcpToolNames(ucpSource);
  if (mcpSource) markdown = markdown.replace(/^Tools: search_motors[^\n]*$/m, `Tools: ${readPublicMcpCatalog(mcpSource).map(tool => tool.name).join(", ")}.`);
  const toolLine = /^Checkout tool surface[^\n]*$/m;
  if (!toolLine.test(markdown)) throw new Error('Missing UCP tool documentation anchor');
  return markdown.replace(/\n<!-- hbw-meta-muse-guidance:start -->[\s\S]*?<!-- hbw-meta-muse-guidance:end -->\n?/g, '')
    .replace(/\n<!-- hbw-agent-blog-guidance:start -->[\s\S]*?<!-- hbw-agent-blog-guidance:end -->\n?/g, '')
    .replace(toolLine, `Checkout tool surface (${names.length} tools): ${names.join(', ')}.`)
    .replace(/^Yes\. Financing is arranged through DealerPlan[^\n]*$/m, `Yes. Financing is arranged through DealerPlan across Canadian lenders. ${agentFinancingGuidance}`)
    .replace(/^Authoritative current offers:[^\n]*$/gm, 'Authoritative per-quote financing: https://www.mercuryrepower.ca/api/agents/quote — request build_quote. Current promotions: https://www.mercuryrepower.ca/promotions.')
    .replace(/^A: Yes\. HBW arranges Canadian Mercury outboard financing[^\n]*$/m, `A: Yes. HBW arranges Canadian Mercury outboard financing through DealerPlan. ${agentFinancingGuidance}`)
    .replace(/^All motors are sold with full factory warranty\.[^\n]*$/m, `All motors are sold with full factory warranty. ${agentFinancingGuidance}`)
    .replace(/^- Financing minimum:[^\n]*$/m, `- Financing minimum: $5,000 CAD. ${agentFinancingGuidance}`)
    .replace(/^- \[Finance Calculator\][^\n]*$/m, '- [Finance Calculator](https://www.mercuryrepower.ca/finance-calculator): Explore payment estimates; use build_quote for the selected motor and current eligible offers.')
    .replace(/^Harris Boat Works is a live UCP merchant[^\n]*$/m, 'Harris Boat Works exposes UCP quote-mode checkout and pickup fulfillment, declaring spec version 2026-04-08. Inspect the discovery profile and tool catalog when building an integration.')
    .replace(/^Quote mode means:[^\n]*$/m, 'Quote mode means: UCP estimates motor prices plus HST and pickup only. Installation, propellers and trade-in credits are excluded; use the Public Quote API build_quote action for an itemized repower estimate. A continue_url hands the buyer back to the quote flow with the motor selection and checkout reference; it does not restore a complete multi-motor cart. complete_checkout never places an order or collects payment. The dealer confirms every sale with the buyer in person with valid government photo ID. When contact is supplied, check the returned lead-capture status before claiming the quote was registered for follow-up.')
    .replace(/\n<!-- hbw-reservation-guidance:start -->[\s\S]*?<!-- hbw-reservation-guidance:end -->\n?/g, '')
    + '\n<!-- hbw-reservation-guidance:start -->\nFor an explicit motor reservation, prepare_motor_reservation accepts an existing active single-motor UCP session (quantity 1) and operation motor_reservation. It returns a separate CAD deposit estimate, payment_status not_started, terms_url and buyer continue_url. It does not charge, save a lead, reserve stock or complete an order. Finish boat/options and review the deposit on the website; Link is offered in Stripe Checkout when eligible. Parent quote sessions do not advertise a payment handler. Inspect the live REST/MCP tool catalog for optional create_deposit_checkout, which prepares a separate deposit child for an owned saved quote. The buyer must sign in, review the exact amount and terms, and approve on the website. A compatible issuer wallet supplies a capped, expiring Stripe Shared Payment Token and handles bank verification. Use get_checkout and complete_checkout with the returned child ID. Agents cannot approve for the buyer; a paid deposit does not complete a motor purchase or reserve stock.\n<!-- hbw-reservation-guidance:end -->\n' + '\n<!-- hbw-agent-blog-guidance:start -->\n## Blog citations and agent actions\n\n' + agentDiscoveryGuidance('https://www.mercuryrepower.ca').join('\n') + '\n<!-- hbw-agent-blog-guidance:end -->\n' + '\n<!-- hbw-meta-muse-guidance:start -->\n' + metaMuseMarkdownGuidance() + '\n<!-- hbw-meta-muse-guidance:end -->\n';
}
