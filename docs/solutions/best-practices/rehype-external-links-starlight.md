---
module: astro-starlight
date: 2026-07-24
problem_type: best_practice
component: tooling
severity: low
applies_when:
  - Adding external link target handling to an Astro 6 + Starlight site
  - Configuring rehype or remark plugins with Astro 6 deprecation warnings
tags:
  - astro
  - starlight
  - rehype
  - external-links
  - mdx
  - plugin-configuration
---

# External link target=_blank in Astro 6 + Starlight via rehype-external-links

## Context

An Astro 6 + Starlight 0.39 static documentation site needed external links to open in new
tabs (`target="_blank"`), with proper `rel="noopener noreferrer"` security attributes.
Astro's Markdown pipeline runs through rehype, so a rehype plugin is the idiomatic hook
point. Without this configuration, every outbound link navigates the current tab, degrading
the reader experience on a reference site.

## Guidance

Install `rehype-external-links` and configure it via `markdown.rehypePlugins` in
`astro.config.mjs`:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [starlight({ /* ... */ })],
  markdown: {
    rehypePlugins: [
      ['rehype-external-links', { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
});
```

Install with bun:

```bash
bun add rehype-external-links
```

The plugin takes a **string-based shorthand** (`['package-name', options]`) where the
package is auto-resolved. This works for `.md` files.

### MDX workaround

If you have `.mdx` files with external links, import the plugin explicitly instead of using
the string form:

```js
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
});
```

### Verification

Build and grep for the attributes on any known external link:

```bash
bun run build
grep -o 'target="_blank" rel="noopener noreferrer"' dist/**/*.html | head -20
```

Count unique matches to confirm coverage — not just that the attribute string exists, but
that it appears on the expected links.

## Why This Matters

- **Security**: `rel="noopener noreferrer"` prevents the opened page from accessing
  `window.opener` (tab-nabbing) and from leaking the referrer header.
- **UX**: External links opening a new tab keep the reader on your site — conventional for
  reference and documentation content.
- **Tooling**: A rehype plugin is the framework-native route — zero manual link annotation,
  no custom component wrappers, all external links handled uniformly.
- **Future-proofing**: The deprecation warning (`markdown.rehypePlugins` is deprecated in
  Astro 6) is non-blocking today. When Astro removes the shorthand, the fix is a
  straightforward import-and-reference migration — the config shape and plugin behavior
  stay the same.

## When to Apply

- Any Astro project where external links should open in a new tab (documentation, blogs,
  marketing sites).
- Projects using Starlight — Starlight inherits the parent Astro config's
  `markdown.rehypePlugins`, so no separate Starlight-side configuration is needed.
- Avoid when you control all linked destinations and want single-tab navigation (e.g., an
  intranet wiki with internal-only links).

## Examples

**Before** — no plugin, external link stays in the current tab:

```html
<a href="https://example.com">Visit Example</a>
```

**After** — with `rehype-external-links`, the same link renders as:

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Visit Example</a>
```

**Build output verification** (tally across all generated HTML):

```bash
$ grep -ro 'target="_blank" rel="noopener noreferrer"' dist/ | wc -l
4
```

Each count corresponds to one external link present in the site's Markdown content.

## Related

- **Astro 6 deprecation**: `markdown.rehypePlugins` prints a deprecation warning at build
  time. The API continues to work. The planned migration path is to the `rehypePlugins`
  option on `unified()` — no migration is urgent in Astro 6.x.
- **MDX string-plugin limitation**: When using the string form
  `['rehype-external-links', …]`, the plugin is only applied to `.md` files, not `.mdx`.
  To cover `.mdx`, use the explicit import form shown in **Guidance**.
- `rehype-external-links` npm: https://www.npmjs.com/package/rehype-external-links
- Astro Markdown docs: https://docs.astro.build/en/guides/markdown-content/
- Existing solution on the same stack:
  [starlight-gh-pages-bun.md](../starlight-gh-pages-bun.md) — deployment recipe + pitfalls
- Plan: [2026-07-20 polish presentation](../../plans/2026-07-20-001-feat-polish-presentation-grimoire-plan.md)
  — KTD2 defines the external-link contract
