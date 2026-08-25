import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('AI chat refresh contract', () => {
  it('restores a mobile launcher and docks the drawer after UnifiedMobileBar disappeared', () => {
    const launcher = read('src/components/chat/AIChatButton.tsx');
    const globalChat = read('src/components/chat/GlobalAIChat.tsx');
    const drawer = read('src/components/chat/InlineChatDrawer.tsx');

    expect(launcher).toContain('getMobileLauncherBottom');
    expect(launcher).toContain('useIsMobileOrTablet');
    expect(launcher).not.toContain('useIsMobile();');
    expect(launcher).toContain('aria-label="Open Mercury Expert chat"');
    expect(launcher).not.toContain('if (isMobileOrTablet || isOpen) return null');
    expect(globalChat).toContain('<AIChatButton');
    expect(globalChat).not.toContain('{!isMobileOrTablet && (');
    expect(drawer).toContain('getMobileDrawerBottom');
    expect(drawer).toContain('role="dialog"');
    expect(drawer).toContain('aria-label="Close AI chat assistant"');
    expect(drawer).toContain('aria-label="Retry last message"');
  });

  it('keeps every parsed CTA visible on desktop and mobile chat surfaces', () => {
    const desktop = read('src/components/chat/EnhancedChatWidget.tsx');
    const drawer = read('src/components/chat/InlineChatDrawer.tsx');

    for (const source of [desktop, drawer]) {
      for (const cta of ['financingCTA', 'tradeInCTA', 'serviceCTA', 'repowerCTA']) {
        expect(source).toContain(cta);
      }
      for (const card of ['FinancingCTACard', 'TradeInCTACard', 'ServiceCTACard', 'RepowerCTACard']) {
        expect(source).toContain(`<${card} data={message.`);
      }
    }
  });

  it('keeps desktop, mobile, and motor-detail chat on parse-only writes until Confirm', () => {
    const desktop = read('src/components/chat/EnhancedChatWidget.tsx');
    const drawer = read('src/components/chat/InlineChatDrawer.tsx');
    const motor = read('src/components/motors/MotorInlineChatPanel.tsx');

    for (const source of [desktop, drawer, motor]) {
      expect(source).toContain('parseAssistantCommandMarkers');
      expect(source).toContain('ChatWriteConsentCard');
      expect(source).toContain('buildChatQuoteProgress');
      expect(source).not.toContain("functions.invoke('capture-chat-lead'");
      expect(source).not.toContain("functions.invoke('voice-send-follow-up'");
      expect(source).not.toContain('location.pathname.includes(\'motor-selection\') ? 1');
    }
  });

  it('gives the stream current quote-page context without promising unconfirmed writes', () => {
    const stream = read('supabase/functions/ai-chatbot-stream/index.ts');

    for (const route of [
      '/quote/boat-info',
      '/quote/trade-in',
      '/quote/installation',
      '/quote/promo-selection',
      '/quote/summary',
      '/quote/schedule',
    ]) {
      expect(stream).toContain(`currentPage?.includes('${route}')`);
    }

    expect(stream).toContain('The marker only prepares a consent card');
    expect(stream).toContain('Do not say the callback is booked, captured, or sent before they confirm');
    expect(stream).toContain('treat the data as unavailable, not as proof that no offer exists');
    expect(stream).not.toContain('tell the customer there is no active promotion right now');
    expect(stream).not.toContain('Someone from our team will call you within 24 hours');
    expect(stream).not.toContain("We'll give you a call within 24 hours");
  });
});
