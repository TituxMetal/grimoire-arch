// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';

// https://astro.build/config
export default defineConfig({
	// GitHub Pages — see docs/adr/2026-06-02-base-path-github-pages.md
	site: 'https://TituxMetal.github.io',
	// `base` MUST match the GitHub repo name (`grimoire-arch`), NOT the dated
	// local folder. The site is served at https://TituxMetal.github.io/grimoire-arch/.
	base: '/grimoire-arch',
	integrations: [
		starlight({
			title: 'Grimoire Arch',
			// Monolingual French site at the root (no URL locale prefix). Sets
			// <html lang="fr"> so Pagefind builds a FRENCH search index — accents
			// and word segmentation matter (done-criterion #7). Default would be `en`.
			defaultLocale: 'root',
			locales: {
				root: { label: 'Français', lang: 'fr' },
			},
			// Theme: default Starlight + a small custom stylesheet, no Tailwind.
			// See docs/adr/2026-06-02-theme-starlight-defaut-customcss.md
			customCss: ['./src/styles/custom.css'],
			// Broken-link canary: Astro/Starlight do NOT fail the build on broken
			// internal links by default. This plugin makes `bun run build` error on
			// them — the real canary for the `guide/annexe-b → /grimoire-arch/adr/`
			// seam and for STORY-008 propagation. Internal content links must be
			// root-relative WITH base. See docs/adr/2026-06-03-link-validation-canary.md
			plugins: [starlightLinksValidator()],
			// Sidebar: the Guide is the hero — explicit ordered items preserve the
			// linear reading order (NOT autogenerate). The migration substrate
			// (here: the ADRs) lives in a subordinate "Coulisses" group listed AFTER,
			// collapsed, so the guide never drowns. Full substrate taxonomy = STORY-008.
			sidebar: [
				{
					label: 'Guide',
					items: [
						{ slug: 'guide' },
						{ slug: 'guide/01-audit-baseline' },
						{ slug: 'guide/02-ext4-vers-btrfs' },
						{ slug: 'guide/03-snapshots' },
						{ slug: 'guide/04-boot-moderne' },
						{ slug: 'guide/05-recuperation' },
						{ slug: 'guide/06-bureau-xfce-ly' },
						{ slug: 'guide/07-reseau-securite' },
						{ slug: 'guide/08-shell-env-modulaire' },
						{ slug: 'guide/09-outils-terminal' },
						{ slug: 'guide/10-hotkeys-sxhkd' },
						{ slug: 'guide/11-wm-bspwm-polybar' },
						{ slug: 'guide/12-outillage-ia' },
						{ slug: 'guide/13-workflow-ia' },
						{ slug: 'guide/annexe-a-materiel-ancien' },
						{ slug: 'guide/annexe-b-adr' },
					],
				},
				{
					// Migration substrate — subordinate to the Guide hero: listed AFTER,
					// collapsed, split into life-cycle sub-groups (brainstorm -> finding ->
					// plan -> solution -> story -> adr) so 21 heterogeneous files never
					// drown the guide. STORY-008 / Open Q4.
					// v0.39 GOTCHA: the `autogenerate` object carries NO label; the label
					// lives on the parent group. `directory: 'solutions'` auto-nests its
					// bspwm/ and theme/ sub-folders. See docs/solutions/starlight-gh-pages-bun.md
					label: 'Coulisses / journal',
					collapsed: true,
					items: [
						{ label: 'Brainstorms', items: [{ autogenerate: { directory: 'brainstorms' } }] },
						{ label: 'Findings', items: [{ autogenerate: { directory: 'findings' } }] },
						{ label: 'Plans', items: [{ autogenerate: { directory: 'plans' } }] },
						{ label: 'Solutions', items: [{ autogenerate: { directory: 'solutions' } }] },
						{ label: 'Stories', items: [{ autogenerate: { directory: 'stories' } }] },
						{ label: 'Décisions (ADR)', items: [{ autogenerate: { directory: 'adr' } }] },
					],
				},
			],
		}),
	],
});
