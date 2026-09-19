import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { observeReview150Interactions, REVIEW_150_SLUG } from './useReview150Interactions';

let root: HTMLElement;
let stop: () => void;
const clarity = vi.fn();
const consent = (value: string) => {
  document.cookie = `mr_consent=${value}; path=/`;
  localStorage.setItem('mr_consent', value);
};
const get = (selector: string) => root.querySelector(selector)!;
const click = (selector: string) => get(selector).dispatchEvent(new MouseEvent('click', { bubbles: true }));
const pointer = (type: string, x: number, y: number, target = get('.comparison td')) => {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
  Object.defineProperties(event, { pointerId: { value: 1 }, isPrimary: { value: true } });
  target.dispatchEvent(event);
};
const events = () => clarity.mock.calls.map((call) => call[1]);

beforeEach(() => {
  history.replaceState({}, '', `/blog/${REVIEW_150_SLUG}?private=never-send#private`);
  document.cookie = 'mr_consent=; max-age=0; path=/';
  localStorage.clear();
  window.getSelection()?.removeAllRanges();
  clarity.mockClear();
  window.clarity = clarity;
  root = document.createElement('article');
  root.innerHTML = `
    <blockquote><p>Article text</p><input value="private" /></blockquote>
    <nav aria-label="Table of contents">
      <button type="button" aria-expanded="false">Table of Contents</button>
      <div>
        <a href="#what-the-current-mercury-150-actually-is">Section</a>
        <a href="#fourstroke-vs-pro-xs-the-differences-that-matter">Comparison</a>
      </div>
    </nav>
    <div class="blog-table-scroll comparison"><table><tbody><tr><td>Table text</td><td>Second cell</td></tr></tbody></table></div>
    <div class="blog-table-scroll results"><table><tbody><tr><td><a href="https://example.test/private">Boat</a></td><td>Result</td></tr></tbody></table></div>
    <img src="/hero.png" alt="Private-looking alt" />
    <button><img src="/inline.png" /><span class="overlay">Expand</span></button>
    <div data-blog-share="inline"><button data-share-control="copy"><svg></svg>Copy</button></div>
    <form><a href="#fourstroke-vs-pro-xs-the-differences-that-matter">Private form</a></form>
    <div contenteditable><a href="#fourstroke-vs-pro-xs-the-differences-that-matter">Editable</a></div>
    <a href="https://example.test/customer">Not allowlisted</a>`;
  document.body.append(root);
  stop = observeReview150Interactions(root);
});
afterEach(() => { stop(); root.remove(); vi.restoreAllMocks(); });

describe('150 review evidence privacy and scope', () => {
  it('drops missing/denied consent and never replays those clicks on grant', () => {
    click('.comparison td');
    consent('denied'); click('.comparison td');
    expect(clarity).not.toHaveBeenCalled();
    consent('granted');
    expect(clarity).not.toHaveBeenCalled();
    click('.comparison td');
    expect(events()).toEqual(['review150_table_1_r1_c1_click_first']);
  });
  it('stops after revocation and resets observed repeat counts', () => {
    consent('granted'); click('.comparison td');
    consent('denied'); click('.comparison td');
    consent('granted'); click('.comparison td');
    expect(events()).toEqual(['review150_table_1_r1_c1_click_first', 'review150_table_1_r1_c1_click_first']);
  });
  it('fails closed on malformed consent and does not load an absent provider', () => {
    document.cookie = 'mr_consent=%E0%A4%A; path=/';
    expect(() => click('.comparison td')).not.toThrow();
    consent('granted'); delete window.clarity; click('.comparison td');
    expect(clarity).not.toHaveBeenCalled();
    expect(document.querySelector('script[src*="clarity.ms"]')).toBeNull();
    window.clarity = clarity; click('.comparison td');
    expect(events()).toEqual(['review150_table_1_r1_c1_click_first']);
  });
  it('uses only bounded labels and independently counts repeated targets', () => {
    consent('granted');
    for (let i = 0; i < 10; i++) click('.comparison td');
    click('.comparison td:nth-child(2)');
    click('.results td:nth-child(2)');
    click('blockquote p');
    click('nav button');
    click('nav a[href="#fourstroke-vs-pro-xs-the-differences-that-matter"]');
    click('img');
    click('.overlay');
    click('svg');
    expect(events()).toEqual([
      'review150_table_1_r1_c1_click_first', 'review150_table_1_r1_c1_click_repeat', 'review150_table_1_r1_c1_click_repeat_3plus',
      'review150_table_1_r1_c2_click_first', 'review150_table_2_r1_c2_click_first',
      'review150_quick_answer_1_click_first', 'review150_toc_toggle_click_first',
      'review150_toc_2_click_first', 'review150_image_1_click_first', 'review150_image_2_click_first',
      'review150_share_inline_copy_click_first',
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
    expect(events()).toEqual(['review150_share_inline_native_click_first']);
  });
  it('drops events after leaving the exact route and outside the article', () => {
    consent('granted');
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    history.replaceState({}, '', '/blog/other'); click('.comparison td');
    expect(clarity).not.toHaveBeenCalled();
  });
  it('excludes selections, form/editable descendants, unknown URLs and controls', () => {
    consent('granted');
    click('input'); click('form a'); click('[contenteditable] a');
    click('a[href*="customer"]'); click('.results a');
    const range = document.createRange(); range.selectNodeContents(get('.comparison td'));
    window.getSelection()?.addRange(range);
    click('.comparison td');
    pointer('pointerdown', 10, 10); pointer('pointermove', 70, 10); pointer('pointerup', 70, 10);
    expect(clarity).not.toHaveBeenCalled();
  });
  it('suppresses a text-selection drag even if selection forms after pointerdown', () => {
    consent('granted'); pointer('pointerdown', 10, 10); pointer('pointermove', 70, 10);
    const range = document.createRange(); range.selectNodeContents(get('.comparison td'));
    window.getSelection()?.addRange(range);
    pointer('pointerup', 70, 10); click('.comparison td');
    expect(clarity).not.toHaveBeenCalled();
  });
  it('does not attach on other routes and stops on navigation/cleanup', () => {
    consent('granted'); stop();
    history.replaceState({}, '', '/blog/other'); stop = observeReview150Interactions(root); click('.comparison td');
    history.replaceState({}, '', `/blog/${REVIEW_150_SLUG}`); click('.comparison td');
    expect(clarity).not.toHaveBeenCalled();
    stop(); stop = observeReview150Interactions(root); stop(); click('.comparison td');
    expect(clarity).not.toHaveBeenCalled();
  });
  it('tolerates a provider error without interfering with default behavior', () => {
    consent('granted'); clarity.mockImplementationOnce(() => { throw new Error('unavailable'); });
    expect(() => click('.comparison td')).not.toThrow();
  });
});

describe('150 review table pan and contents targets', () => {
  it('separates horizontal pointer movement from clicks without preventing defaults', () => {
    consent('granted'); pointer('pointerdown', 10, 10); pointer('pointermove', 70, 12);
    pointer('pointerup', 70, 12); click('.comparison td');
    expect(events()).toEqual(['review150_table_1_pan_first']);
    pointer('pointerdown', 10, 10); pointer('pointerup', 10, 10); click('.comparison td');
    expect(events()).toEqual(['review150_table_1_pan_first', 'review150_table_1_r1_c1_click_first']);
  });
  it('labels a pan on the second table independently', () => {
    const cell = get('.results td:nth-child(2)');
    consent('granted');
    pointer('pointerdown', 10, 10, cell); pointer('pointermove', 70, 12, cell);
    pointer('pointerup', 70, 12, cell);
    expect(events()).toEqual(['review150_table_2_pan_first']);
  });
  it('handles touch cancellation and ignores vertical movement and pre-consent gestures', () => {
    pointer('pointerdown', 10, 10); consent('granted');
    pointer('pointermove', 80, 10); pointer('pointerup', 80, 10);
    pointer('pointerdown', 10, 10); pointer('pointermove', 12, 80); pointer('pointercancel', 12, 80);
    expect(clarity).not.toHaveBeenCalled();
    pointer('pointerdown', 10, 10); pointer('pointermove', 80, 12); pointer('pointercancel', 80, 12);
    expect(events()).toEqual(['review150_table_1_pan_first']);
  });
  it('coalesces horizontal wheel bursts, including shift-wheel, and ignores vertical wheel', () => {
    consent('granted');
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const wheel = (x: number, y: number, shiftKey = false, target = get('.comparison td')) => {
      const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: x, deltaY: y, shiftKey });
      target.dispatchEvent(event); expect(event.defaultPrevented).toBe(false);
    };
    wheel(0, 80); wheel(80, 0); wheel(80, 0);
    vi.mocked(Date.now).mockReturnValue(2000); wheel(0, 80, true, get('.results td:nth-child(2)'));
    expect(events()).toEqual(['review150_table_1_pan_first', 'review150_table_2_pan_first']);
  });
});
