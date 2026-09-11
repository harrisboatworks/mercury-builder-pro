const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderYouTubeEmbedLinkHtml({ id: rawId, title: rawTitle }) {
  const id = String(rawId || '').trim();
  if (!YOUTUBE_VIDEO_ID_RE.test(id)) return '';

  const title = String(rawTitle || '').trim() || 'Watch video';
  return `<p class="my-6" data-mercury-video-link="${id}"><a href="https://www.youtube.com/watch?v=${id}">${escHtml(title)}</a></p>`;
}
