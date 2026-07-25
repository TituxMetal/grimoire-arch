---
title: "External link target=_blank in Astro 6.4+ + Starlight via rehype-external-links on unified()"
type: solution
date: 2026-07-25
module: astro-starlight
domain: tooling
component: astro.config.mjs, rehype-external-links, @astrojs/markdown-remark
problem_type: best_practice
severity: medium
symptoms:
  - "external links stay in the current tab"
  - "[astro] markdown.rehypePlugins are deprecated. Pass them to unified({...})"
  - "string-form rehype plugin not applied to MDX"
  - "build green but deprecation noise on every bun run build"
root_cause: "Astro 6.4 deprecated top-level markdown.rehypePlugins/remarkPlugins; plugins must live on markdown.processor: unified({...}). Starlight <0.40 and starlight-links-validator <0.24.1 still injected the legacy keys and re-triggered the warning even after the site config was migrated."
applies_when:
  - Adding external link target handling to an Astro 6.4+ + Starlight site
  - Silencing markdown.rehypePlugins deprecation warnings
  - Configuring rehype/remark plugins with the unified processor API
tags:
  - astro
  - starlight
  - rehype
  - external-links
  - mdx
  - unified
  - markdown-processor
  - deprecation
related:
  - ../starlight-gh-pages-bun.md
  - ./starlight-customcss-cascade-tokens.md
  - ../../plans/2026-07-20-001-feat-polish-presentation-grimoire-plan.md
---

# External link target=_blank via `unified()` (Astro 6.4+)

## Context

grimoire-arch (Astro 6 + Starlight) needed outbound links to open in a new tab
with `rel="noopener noreferrer"`. The first ship used top-level
`markdown.rehypePlugins` (string form, then explicit import). That worked for
HTML output but left a permanent Astro deprecation warning. Migrating only the
site config was **not** enough: Starlight 0.39 and starlight-links-validator
0.24.0 still called `updateConfig({ markdown: { rehypePlugins: [...] } })`,
which re-armed the warning on every build.

Validated on commits through `74738b5` (2026-07-25): build **CLEAN**, 66 pages,
4 external links with `target="_blank"`.

## Guidance (current)

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import { unified } from '@astrojs/markdown-remark';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  markdown: {
    processor: unified({
      rehypePlugins: [
        [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
      ],
    }),
  },
  integrations: [
    starlight({
      plugins: [starlightLinksValidator()],
      // ...
    }),
  ],
});
```

```bash
bun add rehype-external-links @astrojs/markdown-remark
# versions that stop injecting legacy markdown.rehypePlugins:
bun add @astrojs/starlight@^0.40.0 astro@^6.4.5
bun add -d starlight-links-validator@^0.24.1
```

### Why each piece

| Piece | Role |
|---|---|
| `processor: unified({ rehypePlugins })` | Astro 6.4+ non-deprecated API |
| **Explicit** `import rehypeExternalLinks` | String form only covers `.md`; MDX needs the function reference |
| `@astrojs/markdown-remark` **direct** dep | Stable import surface for `unified()` (was transitive only) |
| Starlight **≥ 0.40** | Pushes its own remark/rehype plugins onto `processor.options` instead of top-level keys |
| links-validator **≥ 0.24.1** | Same: mutates `processor.options.rehypePlugins` when a processor is present |

### Do **not** use (deprecated)

```js
// LEGACY — still works in Astro 6.x but always warns
markdown: {
  rehypePlugins: [
    ['rehype-external-links', { target: '_blank', rel: ['noopener', 'noreferrer'] }],
  ],
},
```

## Root-cause trail (why "we migrated and it still warned")

1. Site config still on `markdown.rehypePlugins` → warning (expected).
2. Site config moved to `unified()` → warning **remained**.
3. `node_modules/astro/dist/core/config/validate.js` `coerceLegacyMarkdownPlugins`
   fires whenever **any** top-level `rehypePlugins`/`remarkPlugins` array is non-empty
   after integrations run — not only when *you* set them.
4. Grep showed:
   - `@astrojs/starlight@0.39` → `updateConfig({ markdown: { remarkPlugins, rehypePlugins } })`
   - `starlight-links-validator@0.24.0` → same for its validator rehype plugin
5. Starlight **0.40.0** (needs Astro **≥ 6.4.5**) + validator **0.24.1** → warning gone.

Do **not** jump to Starlight 0.41 / validator 0.25 just to kill the warning: those
drop Astro 6 and require Astro 7.

## Verification

```bash
bun run build 2>&1 | tee /tmp/build.log
rg -i 'deprecat|WARN' /tmp/build.log || echo CLEAN

# external links still get the attributes
python - <<'PY'
from pathlib import Path
import re
ext=[]
for p in Path('dist').rglob('*.html'):
    for m in re.finditer(r'<a\b[^>]+>', p.read_text(errors='ignore')):
        tag=m.group(0)
        href=re.search(r'href="([^"]*)"', tag)
        if not href: continue
        h=href.group(1)
        if h.startswith('http') and 'tituxmetal.github.io' not in h.lower():
            ok='target="_blank"' in tag and 'noopener' in tag
            ext.append((ok, h, str(p)))
print(len(ext), 'external;', 'all ok' if ext and all(e[0] for e in ext) else 'FAIL or none')
for e in ext: print(e)
PY
```

## Prevention

- New rehype/remark plugins → always `unified({ ... })`, never top-level keys.
- After any Astro minor ≥ 6.4, if a deprecation mentions `markdown.rehypePlugins`,
  **grep integrations** (`node_modules/@astrojs/starlight`, plugins) before blaming
  site config alone.
- Pin floor: `astro@^6.4.5`, `@astrojs/starlight@^0.40`, `starlight-links-validator@^0.24.1`
  while staying on Astro 6.

## Related

- [starlight-gh-pages-bun.md](../starlight-gh-pages-bun.md) — deploy recipe + silent traps
- [starlight-customcss-cascade-tokens.md](./starlight-customcss-cascade-tokens.md) — CSS tokens that look ignored
- Plan polish B+C: `docs/plans/2026-07-20-001-feat-polish-presentation-grimoire-plan.md`
- Astro 6.4 blog (processor API): https://astro.build/blog/astro-640/
- `rehype-external-links`: https://www.npmjs.com/package/rehype-external-links
