import { describe, expect, it } from 'vitest';
import { renderYouTubeEmbedLinkHtml } from '../../scripts/lib/youtube-embed-html.mjs';

describe('static YouTube embed fallback', () => {
  it('emits a quoted fixed-host link and escapes the visible title', () => {
    expect(renderYouTubeEmbedLinkHtml({
      id: 'lEa_MVfOs7M',
      title: `Mercury & <SmartCraft> "install" 'guide'`,
    })).toBe(
      '<p class="my-6" data-mercury-video-link="lEa_MVfOs7M"><a href="https://www.youtube.com/watch?v=lEa_MVfOs7M">Mercury &amp; &lt;SmartCraft&gt; &quot;install&quot; &#39;guide&#39;</a></p>',
    );
  });

  it.each([
    'short',
    'lEa_MVfOs7M<script>',
    'lEa_MVfOs7M_extra',
  ])('rejects a malformed video ID: %s', (id) => {
    expect(renderYouTubeEmbedLinkHtml({ id, title: 'Watch video' })).toBe('');
  });

  it('keeps an accessible default name for a whitespace-only title', () => {
    expect(renderYouTubeEmbedLinkHtml({
      id: 'YGuQjF6vuao',
      title: '   ',
    })).toContain('>Watch video</a>');
  });
});
