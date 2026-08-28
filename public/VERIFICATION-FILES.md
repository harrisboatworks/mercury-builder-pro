# Webmaster verification files

Drop verification files for Chinese (and any other) webmaster consoles directly
into `public/` at the repo root. Vite copies everything in `public/` verbatim
into `dist/` at build time, and Vercel serves `dist/` from the site root, so
any file at `public/<name>` is reachable at `https://www.mercuryrepower.ca/<name>`
with no rewrite needed.

The catch-all SPA rewrite in `vercel.json` only fires for paths that do **not**
match an existing file in `dist/`, so static files in `public/` always win.

## Baidu Search Resource Platform — ziyuan.baidu.com

Baidu issues a file named like `baidu_verify_codeva-<code>.html` containing a
single line of text. Place it here:

    public/baidu_verify_codeva-<code>.html

Verify it's reachable at:

    https://www.mercuryrepower.ca/baidu_verify_codeva-<code>.html

Then click "Verify" in the Baidu console.

## Sogou Webmaster — zhanzhang.sogou.com

Sogou issues a file named like `sogousiteverification.txt`. Place it here:

    public/sogousiteverification.txt

Verify it's reachable at:

    https://www.mercuryrepower.ca/sogousiteverification.txt

## 360 Search Webmaster — zhanzhang.so.com

360 issues a file named like `360-site-verification-<code>.html`. Same pattern:
drop in `public/` at the root and verify the served URL.

## Bytedance / Toutiao / Doubao

Bytespider is already allowed in `robots.txt`. Bytedance doesn't currently
require a verification file for indexing — the open robots.txt + sitemap is
sufficient.

## After dropping a verification file

No build-config changes needed. Trigger a deploy (push to `main`) and the file
will be live within ~60 seconds via Vercel's deploy pipeline.
