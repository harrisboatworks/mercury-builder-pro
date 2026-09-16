import { useEffect, useRef } from 'react';
import { getStoredConsent } from '@/lib/analytics';

export const REVIEW_150_SLUG = 'mercury-150-hp-fourstroke-pro-xs-review-ontario';
const PATH = `/blog/${REVIEW_150_SLUG}`;
const PRIVATE = 'form,input,textarea,select,option,[contenteditable]:not([contenteditable="false"]),[role="textbox"]';

function tableKey(root: HTMLElement, element: Element | null): string | null {
  const region = element?.closest('.blog-table-scroll');
  if (!region || !root.contains(region)) return null;
  const index = [...root.querySelectorAll('.blog-table-scroll')].indexOf(region);
  return index >= 0 && index < 2 ? `table_${index + 1}` : null;
}

/** Static, bounded labels only. Never derive a label from text, URLs or DOM IDs. */
function targetsFor(root: HTMLElement): Map<Element, string> {
  const targets = new Map<Element, string>();
  const bind = (selector: string, prefix: string, limit: number) => {
    root.querySelectorAll(selector).forEach((element, index) => {
      if (index < limit) targets.set(element, `${prefix}_${index + 1}`);
    });
  };
  bind('blockquote', 'quick_answer', 1);
  const toc = root.querySelector('nav[aria-label="Table of contents"]');
  if (toc) {
    const toggle = toc.querySelector(':scope > button');
    if (toggle) targets.set(toggle, 'toc_toggle');
    toc.querySelectorAll('a[href^="#"]').forEach((link, index) => {
      if (index < 32) targets.set(link, `toc_${index + 1}`);
    });
  }
  root.querySelectorAll('img').forEach((img, index) => {
    if (index < 8) targets.set(img.closest('button') || img, `image_${index + 1}`);
  });
  for (const placement of ['inline', 'full']) {
    for (const control of ['native', 'facebook', 'twitter', 'whatsapp', 'reddit', 'copy', 'email', 'print']) {
      const element = root.querySelector(`[data-blog-share="${placement}"] [data-share-control="${control}"]`);
      if (element) targets.set(element, `share_${placement}_${control}`);
    }
  }
  // Comparison table then freshwater-results table. Cell position is static.
  root.querySelectorAll('.blog-table-scroll').forEach((table, index) => {
    if (index >= 2) return;
    const prefix = `table_${index + 1}`;
    targets.set(table, prefix);
    table.querySelectorAll('tr').forEach((row, r) => {
      row.querySelectorAll('th,td').forEach((cell, c) => {
        if (r < 8 && c < 4) targets.set(cell, `${prefix}_r${r + 1}_c${c + 1}`);
      });
    });
  });
  return targets;
}

/** Route-local evidence only; the existing banner owns consent and Clarity loading. */
export function observeReview150Interactions(root: HTMLElement): () => void {
  if (window.location.pathname !== PATH) return () => {};
  const counts = new Map<string, number>();
  let gesture: { id: number; x: number; y: number; horizontal: boolean; table: string } | null = null;
  let suppressClickUntil = 0;
  let lastWheel = -Infinity;
  const reset = () => {
    counts.clear();
    gesture = null;
    suppressClickUntil = 0;
    lastWheel = -Infinity;
  };
  const consented = () => {
    try {
      if (window.location.pathname === PATH && getStoredConsent() === 'granted') return true;
    } catch { /* Malformed/unavailable consent must fail closed. */ }
    reset();
    return false;
  };
  const eligible = (target: EventTarget | null): target is Element =>
    target instanceof Element && root.contains(target) && !target.closest(PRIVATE) &&
    window.getSelection()?.isCollapsed !== false;
  const send = (target: string, action: 'click' | 'pan') => {
    if (!consented() || typeof window.clarity !== 'function') return;
    const key = `${target}_${action}`;
    const count = counts.get(key) || 0;
    if (count >= 3) return;
    counts.set(key, count + 1);
    // Clarity supplies its existing consented session/device context. No extra IDs,
    // customer data, text, selection contents, URLs or pointer coordinates are sent.
    try {
      window.clarity('event', `review150_${key}_${['first', 'repeat', 'repeat_3plus'][count]}`);
    } catch { /* Instrumentation must never interfere with the article. */ }
  };
  const click = (event: MouseEvent) => {
    if (!consented() || !eligible(event.target) || event.button !== 0) return;
    if (Date.now() < suppressClickUntil && event.target.closest('.blog-table-scroll')) return;
    // Resolve the current DOM: native-share capability and image load state can
    // update controls after mount. Labels still come only from the fixed map.
    const targets = targetsFor(root);
    let element: Element | null = event.target;
    while (element && element !== root) {
      const target = targets.get(element);
      if (target) { send(target, 'click'); return; }
      // Do not attribute unrecognised controls to an enclosing static callout.
      if (element.matches('a,button,[role="button"]')) return;
      element = element.parentElement;
    }
  };
  const down = (event: PointerEvent) => {
    gesture = null;
    suppressClickUntil = 0;
    if (!consented() || !eligible(event.target) || event.button !== 0 || !event.isPrimary) return;
    const table = tableKey(root, event.target);
    if (table) {
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false, table };
    }
  };
  const move = (event: PointerEvent) => {
    if (!consented() || !gesture || gesture.id !== event.pointerId) return;
    const dx = Math.abs(event.clientX - gesture.x);
    const dy = Math.abs(event.clientY - gesture.y);
    gesture.horizontal = dx >= 12 && dx > dy;
  };
  const finish = (event: PointerEvent) => {
    if (!consented() || !gesture || gesture.id !== event.pointerId) return;
    const { horizontal, table } = gesture;
    gesture = null;
    if (horizontal) {
      suppressClickUntil = Date.now() + 500;
      if (eligible(event.target)) send(table, 'pan');
    }
  };
  const wheel = (event: WheelEvent) => {
    if (!consented() || !eligible(event.target)) return;
    const table = tableKey(root, event.target);
    if (!table) return;
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
      (event.shiftKey && event.deltaY !== 0);
    if (!horizontal) return;
    const now = Date.now();
    const newBurst = now - lastWheel > 500;
    lastWheel = now;
    if (newBurst) send(table, 'pan');
  };
  // Passive listeners observe attempts; never capture pointers or prevent scrolling,
  // selection, navigation, sharing, image expansion, or contents navigation.
  root.addEventListener('click', click, true);
  root.addEventListener('pointerdown', down, { passive: true });
  root.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerup', finish, { passive: true });
  window.addEventListener('pointercancel', finish, { passive: true });
  root.addEventListener('wheel', wheel, { passive: true });
  return () => {
    root.removeEventListener('click', click, true);
    root.removeEventListener('pointerdown', down);
    root.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', finish);
    root.removeEventListener('wheel', wheel);
    reset();
  };
}

export function useReview150Interactions(slug?: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (slug === REVIEW_150_SLUG && ref.current) return observeReview150Interactions(ref.current);
  }, [slug]);
  return ref;
}
