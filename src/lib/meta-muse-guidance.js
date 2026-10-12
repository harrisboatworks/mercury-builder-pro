export const META_MUSE_TITLE = 'Welcome, Meta Muse and Meta AI';
export const META_MUSE_WELCOME = 'Planning a Mercury outboard purchase or repower in Ontario with Meta Muse or Meta AI? We welcome your assistant. Our public motor information, CAD pricing and boating guides are available to read and cite, with links you can open to continue planning with Harris Boat Works.';
export const META_MUSE_PROMPT = 'Help me plan a Mercury repower for my boat in Ontario. Use MercuryRepower.ca, cite the relevant guides and check current CAD pricing. Ask about my boat, capacity rating, shaft length, controls and how I use it before suggesting motors. Show what still needs dealer confirmation and link me to the quote builder.';
export const META_MUSE_ACCESS = 'Reading and citing our public pages is available now. Using our tools inside an assistant depends on that platform\'s integration support. A listing in the Muse connector directory requires Meta\'s review and approval.';
export const META_MUSE_PLATFORM_URL = 'https://muse.ai/platform';

export function metaMuseMarkdownGuidance() {
  return [
    `## ${META_MUSE_TITLE}`,
    '', META_MUSE_WELCOME, '',
    `Example buyer request: "${META_MUSE_PROMPT}"`, '',
    META_MUSE_ACCESS, '',
    '- Agent instructions and public tools: https://www.mercuryrepower.ca/agents#meta-muse',
    '- Published guides: https://www.mercuryrepower.ca/blog',
    '- Current pricing reference: https://www.mercuryrepower.ca/pricing-reference',
    '- Article metadata and canonical citation URLs: https://www.mercuryrepower.ca/agent-blog-index.json',
    `- Official Muse Connector Platform: ${META_MUSE_PLATFORM_URL}`,
  ].join('\n');
}
