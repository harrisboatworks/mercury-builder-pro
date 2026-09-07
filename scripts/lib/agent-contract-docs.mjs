import ts from 'typescript';

export const agentFinancingGuidance = 'Request build_quote for the selected motor and purchase options. Use its available offers, eligibility, APR, amount financed, fees, amortization and contract term from active financing records. Estimates require lender approval. Do not substitute cached headline rates or treat amortization as the contract term. If financing is unavailable, do not invent a monthly payment.';

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

export function synchronizeAgentContractDocs(markdown, ucpSource) {
  const names = readUcpToolNames(ucpSource);
  const toolLine = /^Checkout tool surface[^\n]*$/m;
  if (!toolLine.test(markdown)) throw new Error('Missing UCP tool documentation anchor');
  return markdown
    .replace(toolLine, `Checkout tool surface (${names.length} tools): ${names.join(', ')}.`)
    .replace(/^Yes\. Financing is arranged through DealerPlan[^\n]*$/m, `Yes. Financing is arranged through DealerPlan across Canadian lenders. ${agentFinancingGuidance}`)
    .replace(/^Authoritative current offers:[^\n]*$/gm, 'Authoritative per-quote financing: https://www.mercuryrepower.ca/api/agents/quote — request build_quote. Current promotions: https://www.mercuryrepower.ca/promotions.')
    .replace(/^A: Yes\. HBW arranges Canadian Mercury outboard financing[^\n]*$/m, `A: Yes. HBW arranges Canadian Mercury outboard financing through DealerPlan. ${agentFinancingGuidance}`)
    .replace(/^All motors are sold with full factory warranty\.[^\n]*$/m, `All motors are sold with full factory warranty. ${agentFinancingGuidance}`)
    .replace(/^- Financing minimum:[^\n]*$/m, `- Financing minimum: $5,000 CAD. ${agentFinancingGuidance}`)
    .replace(/^- \[Finance Calculator\][^\n]*$/m, '- [Finance Calculator](https://www.mercuryrepower.ca/finance-calculator): Explore payment estimates; use build_quote for the selected motor and current eligible offers.')
    .replace(/^Harris Boat Works is a live UCP merchant[^\n]*$/m, 'Harris Boat Works exposes UCP quote-mode checkout and pickup fulfillment, declaring spec version 2026-04-08. Inspect the discovery profile and tool catalog when building an integration.')
    .replace(/^Quote mode means:[^\n]*$/m, 'Quote mode means: UCP estimates motor prices plus HST and pickup only. Installation, propellers and trade-in credits are excluded; use the Public Quote API build_quote action for an itemized repower estimate. A continue_url hands the buyer back to the quote flow with the motor selection and checkout reference; it does not restore a complete multi-motor cart. complete_checkout never places an order or collects payment. The dealer confirms every sale with the buyer in person with valid government photo ID. When contact is supplied, check the returned lead-capture status before claiming the quote was registered for follow-up.');
}
