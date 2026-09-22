import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { observeOverheatInteractions, OVERHEAT_SLUG } from './useOverheatInteractions';

let root: HTMLElement;
let stop: () => void;
const clarity = vi.fn();
const consent = (value: string) => {
  document.cookie = `mr_consent=${value}; path=/`;
  localStorage.setItem('mr_consent', value);
};
const get = (selector: string) => root.querySelector(selector)!;
const click = (selector: string) => get(selector).dispatchEvent(new MouseEvent('click', { bubbles: true }));
const pointer = (type: string, x: number, y: number, target = get('td')) => {
  // jsdom does not implement PointerEvent in every supported version.
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
  Object.defineProperties(event, { pointerId: { value: 1 }, isPrimary: { value: true } });
  target.dispatchEvent(event);
};
const events = () => clarity.mock.calls.map((call) => call[1]);

beforeEach(() => {
  history.replaceState({}, '', `/blog/${OVERHEAT_SLUG}?private=never-send#private`);
  document.cookie = 'mr_consent=; max-age=0; path=/';
  localStorage.clear();
  window.getSelection()?.removeAllRanges();
  clarity.mockClear();
  window.clarity = clarity;
  root = document.createElement('article');
  root.innerHTML = `
    <aside aria-label="Quick answer"><p>Article text</p><input value="private" /></aside>
    <div data-diagnostic-flow><span>Step text</span><button>Untracked control</button></div>
    <div data-diagnostic-escalation>Escalation</div>
    <div class="blog-table-scroll"><table><tbody><tr><td>Table text</td><td>Second cell</td></tr></tbody></table></div>
    <img src="/hero.png" alt="Private-looking alt" />
    <button><img src="/inline.png" /><span class="overlay">Expand</span></button>
    <div data-blog-share="inline"><button data-share-control="copy"><svg></svg>Copy</button></div>
    <a href="https://hbw.wiki/service"><span>Service</span></a>
    <form><a href="https://hbw.wiki/service">Private form</a></form>
    <div contenteditable><a href="https://hbw.wiki/service">Editable</a></div>
    <a href="https://hbw.wiki/service?customer=private">Not allowlisted</a>`;
  document.body.append(root);
  stop = observeOverheatInteractions(root);
});
afterEach(() => { stop(); root.remove(); vi.restoreAllMocks(); });

describe('overheating evidence privacy and scope', () => {
  it('drops missing/denied consent and never replays those clicks on grant', () => {
    click('td');
    consent('denied'); click('td');
    expect(clarity).not.toHaveBeenCalled();
    consent('granted');
    expect(clarity).not.toHaveBeenCalled();
    click('td');
    expect(events()).toEqual(['overheat_table_r1_c1_click_first']);
  });
  it('stops after revocation and resets observed repeat counts', () => {
    consent('granted'); click('td');
    consent('denied'); click('td');
    consent('granted'); click('td');
    expect(events()).toEqual(['overheat_table_r1_c1_click_first', 'overheat_table_r1_c1_click_first']);
  });
  it('fails closed on malformed consent and does not load an absent provider', () => {
    document.cookie = 'mr_consent=%E0%A4%A; path=/';
    expect(() => click('td')).not.toThrow();
    consent('granted'); delete window.clarity; click('td');
    expect(clarity).not.toHaveBeenCalled();
    expect(document.querySelector('script[src*="clarity.ms"]')).toBeNull();
    window.clarity = clarity; click('td');
    expect(events()).toEqual(['overheat_table_r1_c1_click_first']);
  });
  it('uses only bounded labels and independently counts repeated targets', () => {
    consent('granted');
    for (let i = 0; i < 10; i++) click('td');
    click('td:nth-child(2)'); click('[data-diagnostic-flow] span');
    click('[data-diagnostic-escalation]'); click('aside p'); click('img');
    click('.overlay'); click('svg'); click('a span');
    expect(events()).toEqual([
      'overheat_table_r1_c1_click_first', 'overheat_table_r1_c1_click_repeat', 'overheat_table_r1_c1_click_repeat_3plus',
      'overheat_table_r1_c2_click_first', 'overheat_diagnostic_flow_1_click_first',
      'overheat_diagnostic_escalation_1_click_first', 'overheat_quick_answer_1_click_first',
      'overheat_image_1_click_first', 'overheat_image_2_click_first',
      'overheat_share_inline_copy_click_first', 'overheat_service_1_click_first',
    ]);
    expect(clarity.mock.calls.every(call => call.length === 2 && call[0] === 'event')).toBe(true);
    expect(JSON.stringify(clarity.mock.calls)).not.toMatch(/private|Article text|Table text|http|customer|\/blog/i);
  });
  it('resolves controls added after mount without sending DOM-provided labels', () => {
    consent('granted');
    const native = document.createElement('button');
    native.dataset.shareControl = 'native';
    get('[data-blog-share]').append(native);
    click('[data-share-control="native"]');
    native.dataset.shareControl = 'private-customer-value';
    native.click();
    expect(events()).toEqual(['overheat_share_inline_native_click_first']);
  });
  it('drops events after leaving the exact route and outside the article', () => {
    consent('granted');
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    history.replaceState({}, '', '/blog/other'); click('td');
    expect(clarity).not.toHaveBeenCalled();
  });
  it('excludes selections, form/editable descendants, unknown URLs and controls', () => {
    consent('granted');
    click('input'); click('form a'); click('[contenteditable] a');
    click('a[href*="customer"]'); click('[data-diagnostic-flow] button');
    const range = document.createRange(); range.selectNodeContents(get('td'));
    window.getSelection()?.addRange(range);
    click('td');
    pointer('pointerdown', 10, 10); pointer('pointermove', 70, 10); pointer('pointerup', 70, 10);
    expect(clarity).not.toHaveBeenCalled();
  });
  it('suppresses a text-selection drag even if selection forms after pointerdown', () => {
    consent('granted'); pointer('pointerdown', 10, 10); pointer('pointermove', 70, 10);
    const range = document.createRange(); range.selectNodeContents(get('td'));
    window.getSelection()?.addRange(range);
    pointer('pointerup', 70, 10); click('td');
    expect(clarity).not.toHaveBeenCalled();
  });
  it('does not attach on other routes and stops on navigation/cleanup', () => {
    consent('granted'); stop();
    history.replaceState({}, '', '/blog/other'); stop = observeOverheatInteractions(root); click('td');
    history.replaceState({}, '', `/blog/${OVERHEAT_SLUG}`); click('td');
    expect(clarity).not.toHaveBeenCalled();
    stop(); stop = observeOverheatInteractions(root); stop(); click('td');
    expect(clarity).not.toHaveBeenCalled();
  });
  it('tolerates a provider error without interfering with default behavior', () => {
    consent('granted'); clarity.mockImplementationOnce(() => { throw new Error('unavailable'); });
    expect(() => click('td')).not.toThrow();
  });
});

describe('table pan attempts', () => {
  it('separates horizontal pointer movement from clicks without preventing defaults', () => {
    consent('granted'); pointer('pointerdown', 10, 10); pointer('pointermove', 70, 12);
    pointer('pointerup', 70, 12); click('td');
    expect(events()).toEqual(['overheat_table_pan_first']);
    pointer('pointerdown', 10, 10); pointer('pointerup', 10, 10); click('td');
    expect(events()).toEqual(['overheat_table_pan_first', 'overheat_table_r1_c1_click_first']);
  });
  it('handles touch cancellation and ignores vertical movement and pre-consent gestures', () => {
    pointer('pointerdown', 10, 10); consent('granted');
    pointer('pointermove', 80, 10); pointer('pointerup', 80, 10);
    pointer('pointerdown', 10, 10); pointer('pointermove', 12, 80); pointer('pointercancel', 12, 80);
    expect(clarity).not.toHaveBeenCalled();
    pointer('pointerdown', 10, 10); pointer('pointermove', 80, 12); pointer('pointercancel', 80, 12);
    expect(events()).toEqual(['overheat_table_pan_first']);
  });
  it('coalesces horizontal wheel bursts, including shift-wheel, and ignores vertical wheel', () => {
    consent('granted');
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const wheel = (x: number, y: number, shiftKey = false) => {
      const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: x, deltaY: y, shiftKey });
      get('td').dispatchEvent(event); expect(event.defaultPrevented).toBe(false);
    };
    wheel(0, 80); wheel(80, 0); wheel(80, 0);
    vi.mocked(Date.now).mockReturnValue(2000); wheel(0, 80, true);
    expect(events()).toEqual(['overheat_table_pan_first', 'overheat_table_pan_repeat']);
  });
});
