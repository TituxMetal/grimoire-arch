---
title: "Conform + Biome : config projet si elle existe, sinon config perso (sémantique VSCode)"
type: solution
date: 2026-06-07
domain: formatting
component: conform.nvim / biome
symptoms:
  - "un fichier ts/js hors projet Biome est formaté avec les défauts Biome (point-virgules) au lieu des préférences perso"
  - "comment répliquer dans nvim le comportement VSCode « settings du projet sinon settings utilisateur » pour le formatage"
  - "où brancher un argument conditionnel par buffer dans conform"
root_cause: "le formateur biome builtin de conform n'a aucune notion de config utilisateur hors projet — sans biome.json à la racine, il retombe sur des heuristiques indent-style/indent-width"
severity: low
related: []
---

## Problème

Dans VSCode, le formatage suit la config Biome du projet quand elle existe,
sinon les réglages utilisateur. Le formateur `biome` livré avec conform.nvim
ne connaît que la moitié de cette sémantique : avec un `biome.json` à la
racine il l'utilise, **sans** il improvise des flags `--indent-style`/
`--indent-width` à partir des options du buffer — les préférences perso
(pas de point-virgule, etc.) sont perdues.

## Cause racine

Le builtin (`conform/formatters/biome.lua`) branche sur `self:cwd(ctx)` —
la racine projet détectée par recherche de `biome.json`/`biome.jsonc`/
`.biome.json`/`.biome.jsonc`. La branche « pas de racine » n'a simplement
aucun point d'entrée vers une config utilisateur.

## Fix

Surcharger **uniquement** `args` dans `formatters.biome` du setup conform
(`init.lua`, section FORMATTING). `vim.tbl_deep_extend` ne remplace que la
clé fournie : `cwd` et `command` du builtin sont hérités, et `self:cwd(ctx)`
reste appelable dans l'override.

```lua
formatters = {
  biome = {
    args = function(self, ctx)
      if self:cwd(ctx) then return { 'format', '--stdin-file-path', '$FILENAME' } end
      return { 'format', '--stdin-file-path', '$FILENAME', '--config-path', vim.fn.expand '~/.config/biome' }
    end,
  },
},
```

Deux subtilités vérifiées :

- **`self:cwd(ctx)` plutôt que `vim.fs.root(bufnr, 'biome.json')`** : même
  sémantique, mais couvre aussi les variantes `biome.jsonc`/`.biome.json`
  exactement comme le builtin — pas de divergence possible entre le test et
  la détection réelle.
- **`--config-path` reçoit un répertoire, pas un fichier** : la doc Biome
  décrit un répertoire dans lequel Biome cherche `biome.json`. La forme
  fichier marche en 2.4.16 mais n'est pas documentée — un update pourrait
  la casser silencieusement (finding SUG-1 de la revue du 2026-06-07).

La config perso vit à `~/.config/biome/biome.json` (hors repo nvim, destinée
au futur repo dotfiles).

## Prévention

Tester les **deux** contextes après tout changement de cette mécanique :

```bash
# hors projet → préférences perso (pas de point-virgule)
# dans un projet avec biome.json (semicolons: always) → point-virgules gardés
```

Harnais headless terrain (non publié) :
`~/.config/nvim/docs/solutions/testing/verification-headless-config-nvim.md`
— exécute exactement ces deux tests.

## Voir aussi

- Plan d'origine (terrain, non publié) :
  `~/.config/nvim/docs/plans/2026-06-07-feat-nvim-transition-lecteur-markdown-plan.md`
  (tâche A5, risque R4)
- Builtin de référence :
  `~/.local/share/nvim/site/pack/core/opt/conform.nvim/lua/conform/formatters/biome.lua`
