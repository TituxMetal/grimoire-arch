---
title: "Trouvailles session 31/05 — carte des fils (scratchpad, Markdown HD3000, nvim-reader)"
type: findings
date: 2026-05-31
related:
  - docs/brainstorms/2026-05-31-scratchpad-bspwm-brainstorm.md
  - docs/plans/2026-05-31-feat-scratchpad-bspwm-plan.md
  - docs/findings/2026-05-30-bspwm-reload-et-verdicts-phase6.md
status: >-
  Truth-up 2026-06-07 : §1 scratchpad = SHIPPÉ (solution publiée, 4 pièges résolus) ; §3 nvim-reader =
  brainstormé + planifié le 06-07 dans le repo terrain ~/.config/nvim. §2 tranché, §4 écarté, §5 adopté
  — inchangés. (Origine : carte des fils de la session du 31/05, pour reprendre séparément des sujets
  mélangés.)
---


> Pourquoi ce doc : la session est partie du scratchpad puis a dérivé (chasse à une app Markdown →
> rendu HD3000 → nvim comme lecteur). Contexte à ~220K, plusieurs sujets mélangés. On **arrête** et on
> **sépare** : chaque fil ci-dessous est autonome, avec son état et son point de reprise.

## 1. Scratchpad bspwm — FAIT (discovery + plan), prêt pour `/work`

> **MAJ 2026-06-07** : `/work` exécuté, scratchpad **en place** (famille `super + alt`, terminal
> escamotable + dropdowns) — 4 pièges résolus dans
> [la solution publiée](/grimoire-arch/solutions/bspwm/scratchpad-dropdowns-fenetres-cachees/).

- **Artefacts** : brainstorm `docs/brainstorms/2026-05-31-scratchpad-bspwm-brainstorm.md` + plan approuvé
  `docs/plans/2026-05-31-feat-scratchpad-bspwm-plan.md` (confiance haute).
- **Décisions figées** : adopter le scratchpad **JAGL tel quel** (3 mécanismes : terminal escamotable,
  slots numérotés, slots nommés) ; **toute la famille sous `super + alt`** (un modificateur = un outil) ;
  terminal = **st** en essai réversible (repli `alacritty --class scratchpad`) ; **helper dédié**
  `scratchpad-help` référencé depuis `help`.
- **Reste** : lancer `/work` (9 tâches). Deux points à valider en live : **T8** keysym du *release* fr-mac
  (`super+alt+shift+{1,2,3}` vs symboles — calque la convention desktops l.16/20, confiance haute), **T9**
  confort de st.
- **Hors périmètre (gelé)** : épinglage dédié `bspc rule … desktop=` (lié au rituel reboot triple-écran),
  nvim-par-projet façon VSCode, profils/`--class` navigateurs multiples, mail en scratchpad.
- **Reprise** : `/work docs/plans/2026-05-31-feat-scratchpad-bspwm-plan.md`. **C'était le sujet initial** —
  à reprendre en priorité une fois le contexte frais.

## 2. Affichage Markdown sur HD 3000 — TRANCHÉ

- **Constat** : les éditeurs/visionneuses **GUI** rendent **mal** sur la HD 3000 — **dédoublement de
  glyphes** = rasterisation **GPU du moteur web** embarqué (même cause que le `--disable-gpu-rasterization`
  imposé à Brave dans le CLAUDE.md). [retex, captures]
  - **Ghostwriter** (Qt6/QtWebEngine) : rend correctement **avec `--disable-gpu`** (flag natif), mais tire
    **531 Mio** (qt6-webengine + KF6), erreurs `libva i965_drv_video`, pas d'aperçu-seul.
  - **Marker** (GTK3/webkit2gtk, `WEBKIT_DISABLE_COMPOSITING_MODE=1` corrige le dédoublement) : en plus
    **obsolète** — emojis couleur en tofu (cairo), **mojibake UTF-8**, **lien interne cliqué → mode code**.
- **Verdict titux** : les **deux dégagent** → `sudo pacman -Rns ghostwriter marker` (récupère la pile Qt/KDE).
- **Adopté** : **glow** (terminal, zéro GPU) pour les helpers fichier-unique.
- **Déjà en mémoire** : `[[hd3000-markdown-viewers]]`. **Rien à reprendre** (clos), sauf le ménage `-Rns`.

## 3. Neovim comme LECTEUR/NAVIGATEUR Markdown — NOUVEAU, le plus ouvert → à brainstormer

> **MAJ 2026-06-07** : brainstormé et planifié le 06-07 — les artefacts vivent dans le repo
> **terrain** `~/.config/nvim/docs/{brainstorms,plans}/` (le travail se fait là où vivent les
> fichiers ; le livre n'en recevra qu'une éventuelle promotion, plus tard).

- **Besoin (titux insiste)** : que **nvim RENDE** le Markdown (pas juste le code brut) **ET** suive les
  **liens internes inter-fichiers**, rendus. **GÉNÉRAL, pas juste pour le guide** — pour tout `.md`.
- **Piste identifiée (NON implémentée, feu vert PAS donné)** :
  - rendu in-buffer via **`render-markdown.nvim`** (ou `markview.nvim`), ajouté en **`vim.pack`** ;
  - suivi de liens **natif** : `gf` (go-to-file) + `Ctrl-o` (retour), avec dans `after/ftplugin/markdown.lua` :
    `conceallevel=2`, `path+=~/migration-backup`, `suffixesadd+=.md` (pour résoudre les chemins relatifs-racine).
  - pré-requis treesitter markdown : **déjà présent** (init.lua:901).
- **Pourquoi à part** : titux **apprend nvim** (vim.pack natif, base kickstart), veut un truc **général +
  réversible** ; mérite un cadrage propre, pas un bricolage en fin de session dérivée.
- **Reprise** : `/deep-thought:brainstorm` dédié « nvim lecteur Markdown général » (rendu + suivi liens
  internes, choix render-markdown vs markview, ergonomie reader, toggle).

## 4. Alacritty hints (URLs web) — ÉCARTÉ (mais noté)

- Donné puis écarté : ce n'était **pas** le besoin (titux voulait les liens **internes**, pas web).
- Si un jour utile pour de vraies URLs : bloc `[hints]` dans `alacritty.toml` (`Ctrl+Shift+U` + `Ctrl+clic`,
  `command = "xdg-open"`, regex `https?://|file://|mailto:` en chaîne littérale TOML). Recharge à chaud.
- **Reprise** : aucune, sauf envie ponctuelle.

## 5. glow — ADOPTÉ (avec sa limite)

- Installé (`2.1.2`), zéro GPU, sombre. **Lecteur Markdown des helpers** (fichier unique).
- **Limite connue** : ne suit pas les liens **inline** (les liste en `[N]`). Mode TUI sans argument =
  navigateur de **fichiers** (pas de suivi de lien inline). C'est ce manque qui a ouvert le fil §3.

## Related
- Brainstorm/plan scratchpad : `docs/brainstorms/2026-05-31-…`, `docs/plans/2026-05-31-feat-scratchpad-bspwm-plan.md`
- Finding parent (le §6 qui a lancé le brainstorm scratchpad) : `docs/findings/2026-05-30-bspwm-reload-et-verdicts-phase6.md`
- Mémoires : `[[hd3000-markdown-viewers]]`, `[[feedback-discussion-plutot-que-qcm]]`,
  `[[fr-mac-binds-chiffres-niveau-shift]]`, `[[polybar-x-session-restart]]`
