import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('verified K3 leftover UX contract', () => {
  it('treats the site mobile menu as a focus-trapped dialog', () => {
    const menu = read('src/components/repower/RepowerMobileMenu.tsx');
    const header = read('src/components/repower/RepowerHeader.tsx');

    expect(menu).toContain('role="dialog"');
    expect(menu).toContain('aria-modal="true"');
    expect(menu).toContain('aria-label="Site menu"');
    expect(menu).toContain("event.key === 'Escape'");
    expect(menu).toContain('onCloseRef.current()');
    expect(menu).toContain('onCloseRef.current = onClose');
    expect(menu).toMatch(/}, \[isOpen\]\);/);
    expect(menu).not.toMatch(/\[isOpen,\s*onClose\]/);
    expect(menu).toContain("document.body.style.overflow = 'hidden'");
    expect(menu).toContain('previouslyFocused?.focus()');
    expect(menu).toContain("event.key !== 'Tab'");
    expect(menu).toContain("{ to: '/pricing-reference', label: 'Pricing' }");
    expect(menu).toContain("{ to: '/mercury-product-protection', label: 'Product Protection' }");
    expect(menu).toContain("{ to: '/quote/motor-selection', label: 'Outboards' }");

    expect(header).toContain('aria-haspopup="dialog"');
    expect(header).toContain('aria-expanded={menuOpen}');
    expect(header).toContain('aria-controls={SITE_MOBILE_MENU_ID}');
  });

  it('keeps table-of-contents entries as copyable heading links', () => {
    const toc = read('src/components/blog/TableOfContents.tsx');

    expect(toc).toContain('aria-controls={panelId}');
    expect(toc).toContain('href={`#${group.h2.id}`}');
    expect(toc).toContain('href={`#${h3.id}`}');
    expect(toc).toMatch(/href=\{`#\$\{group\.h2\.id\}`\}[\s\S]*?"block w-full text-left/);
    expect(toc).toMatch(/href=\{`#\$\{h3\.id\}`\}[\s\S]*?"block w-full text-left/);
    expect(toc).toContain("aria-current={activeId === group.h2.id ? 'location' : undefined}");
    expect(toc).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(toc).toContain("scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })");
    expect(toc).not.toContain('window.scrollTo({ top: y, behavior: \'smooth\' })');
  });

  it('labels icon-only chat and voice controls', () => {
    const voice = read('src/components/chat/VoiceButton.tsx');
    const chat = read('src/components/chat/EnhancedChatWidget.tsx');
    const drawer = read('src/components/chat/InlineChatDrawer.tsx');
    const launcher = read('src/components/chat/AIChatButton.tsx');
    const filters = read('src/components/motors/ConfigFilterSheet.tsx');

    expect(voice).toContain("return 'Start voice chat'");
    expect(voice).toContain("return 'End voice chat'");
    expect(voice).toContain('aria-label={getAriaLabel()}');
    expect(chat).toContain('aria-label="Close AI chat assistant"');
    expect(chat).toContain('aria-label="Ask the Mercury Expert"');
    expect(chat).toContain('aria-label="Send message"');
    expect(chat).toContain('role="dialog"');
    expect(chat).toContain('aria-modal="true"');
    expect(drawer).toContain('aria-label="Close AI chat assistant"');
    expect(drawer).toContain('aria-label="Ask the Mercury Expert"');
    expect(drawer).toContain('aria-label="Send message"');
    expect(drawer).toContain('role="dialog"');
    expect(launcher).toContain('aria-label="Open Mercury Expert chat"');
    expect(launcher).not.toContain('if (isMobileOrTablet || isOpen) return null');
    expect(filters).toContain('Filter motors by configuration, ${activeCount} active');
    expect(filters).toContain("<span className=\"hidden md:inline text-[11px] font-bold uppercase tracking-[0.10em]\">Filters</span>");
  });
});
