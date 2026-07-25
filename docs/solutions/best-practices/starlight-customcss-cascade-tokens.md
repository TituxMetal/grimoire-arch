---
title: "Starlight customCss tokens look ignored — cascade wins, prose never uses --sl-text-body"
type: solution
date: 2026-07-25
module: astro-starlight
domain: frontend
component: src/styles/custom.css, @astrojs/starlight Page.astro + layers.css
problem_type: bug_fix
severity: medium
symptoms:
  - "custom.css gray palette changed but UI looks identical"
  - "body text still 16px after setting --sl-text-base"
  - "--sl-text-body overridden but paragraphs unchanged"
  - "theme polish feels like a no-op; cascade suspected broken"
  - "headings do not scale when body font is bumped"
root_cause: "Two independent traps: (1) gray token deltas of ~2–3 lightness points are real cascade wins but visually imperceptible; (2) Starlight defines --sl-text-body: var(--sl-text-base) but never applies font-size: var(--sl-text-body) on main prose — body/markdown inherit the browser 16px — so overriding --sl-text-base alone changes nothing on paragraphs."
applies_when:
  - Tuning Starlight design tokens via customCss
  - Body font-size or gray contrast polish looks ineffective
  - Diagnosing whether user CSS loses to @layer starlight.base
tags:
  - starlight
  - css
  - cascade
  - customCss
  - design-tokens
  - font-size
  - gray-palette
related:
  - ../../adr/2026-06-02-theme-starlight-defaut-customcss.md
  - ./rehype-external-links-starlight.md
  - ../../plans/2026-07-20-001-feat-polish-presentation-grimoire-plan.md
---

# Starlight `customCss` tokens look ignored

## Problem

After shipping gray / font / width tokens in `src/styles/custom.css` (polish C.6–C.8),
the built site still looked like stock Starlight:

- Body prose stayed **16px**
- Gray chrome barely moved
- Easy false diagnosis: “Starlight layers crush our overrides”

Runtime proved the opposite for colors: custom tokens **did** win. The polish was
mostly invisible for other reasons.

## Cascade facts (Starlight 0.39–0.40)

1. `customCss` is imported **unlayered** in `Page.astro` **before** Starlight’s
   layered styles (`@layer starlight.base`, etc. via `layers.css`).
2. Unlayered author rules beat layered rules for the same specificity.
   So `:root { --sl-color-gray-2: ... }` in `custom.css` **does** override the
   defaults in `props.css`.
3. Do **not** wrap the whole user file in `@layer` unless you intend to lose to
   Starlight’s layers.

Verify in the built bundle (`dist/_astro/common.*.css`):

- First declaration of `--sl-color-gray-2` should be the **unlayered** custom value
- Layered `starlight.base` defaults appear later and lose

Verify in the browser (computed styles on a content page):

| Token / property | Expectation after a real tweak |
|---|---|
| `--sl-color-gray-2` | custom HSL, not stock |
| `--sl-text-base` / `--sl-text-body` | e.g. `1.125rem` |
| `p` / `.sl-markdown-content` `font-size` | must match body intent — **this is the gotcha** |
| `--sl-content-width` | e.g. `75rem` → content column max-width |

## Root cause A — gray deltas too timid

Moving lightness by **2–3 points** (e.g. gray-2 `L=85%` → `80%`) is a real CSS
change and a real cascade win. At a glance it reads as “nothing happened.”

**Fix:** spread the scale enough to read as a theme (order of **~8–15 pts** on key
steps, not 2–3). Keep one shared `--hue-gray` so dark/light stay coherent.

## Root cause B — `--sl-text-body` never applied to prose

In Starlight `props.css`:

- `--sl-text-body: var(--sl-text-base);` (default base = `1rem` / 16px)
- Heading aliases use `--sl-text-h1` … `--sl-text-h5` → `--sl-text-4xl` … `--sl-text-lg`

But main markdown content does **not** set `font-size: var(--sl-text-body)`.
`body` / `.sl-markdown-content` inherit the **browser 16px**. Chrome UI chrome
(sidebar labels, etc.) may consume the tokens; article paragraphs do not.

So this alone is a no-op for reading size:

```css
:root {
  --sl-text-base: 1.125rem; /* token changes; prose stays 16px */
}
```

**Fix:** apply the token where prose lives, and bump the heading scale if body grows:

```css
:root {
  --sl-text-base: 1.125rem; /* 18px */
  /* optional: step headings ~+12.5% so h1–h5 track the larger body */
  --sl-text-lg: 1.25rem;
  --sl-text-xl: 1.375rem;
  --sl-text-2xl: 1.6875rem;
  --sl-text-3xl: 2.0625rem;
  --sl-text-4xl: 2.5rem;
  --sl-text-5xl: 3rem;
}

.sl-markdown-content {
  font-size: var(--sl-text-body);
}
```

## Root cause C — content width is the easy win

`--sl-content-width` **is** consumed by layout. Default `45rem` (720px) → `75rem`
(1200px) is immediately visible on wide monitors. Use it as a canary that customCss
is loaded when font/gray feel doubtful.

## Diagnostic checklist (before rewriting cascade)

1. Confirm `customCss: ['./src/styles/custom.css']` in the Starlight integration.
2. `bun run build` and search `dist/_astro/common.*.css` for your token strings.
3. DevTools → computed on a `<p>` inside `.sl-markdown-content`:
   - If gray tokens match custom but look identical → **increase contrast** (A).
   - If `--sl-text-base` is custom but `font-size` is `16px` → **apply token** (B).
4. Only if custom declarations are missing or lose in the cascade, re-open
   `Page.astro` import order / accidental `@layer` wrapping.

## Prevention

- Never ship font polish that only sets `--sl-text-*` without a consuming rule on
  `.sl-markdown-content` (until upstream Starlight applies `--sl-text-body` itself).
- Judge gray tweaks in **both** themes with a side-by-side screenshot, not token diffs.
- Keep comments in `custom.css` English (repo convention); point at this solution
  from the cascade note in the file header.

## Related

- ADR theme: `docs/adr/2026-06-02-theme-starlight-defaut-customcss.md`
- Rehype / processor migration: [rehype-external-links-starlight.md](./rehype-external-links-starlight.md)
- Plan items C.6–C.8: `docs/plans/2026-07-20-001-feat-polish-presentation-grimoire-plan.md`
