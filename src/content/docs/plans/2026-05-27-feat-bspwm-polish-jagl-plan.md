---
title: "feat: polir la config bspwm (theme switcher + look JAGL) et réorganiser les scripts par portée"
type: plan
date: 2026-05-27
status: complete
brainstorm: docs/brainstorms/2026-05-27-bspwm-polish-jagl-brainstorm.md
confidence: high
---


**En une ligne :** rendre la session bspwm « finie » (theme switcher multi-thèmes dark, polybar
Nerd Font, power menu refondu, wallpapers, cheatsheet), réorganiser les scripts par portée, et tester
sans s'y enchaîner picom / st / scratchpad / tabs — le tout réversible, derrière un snapshot.

## Problem Statement

La session bspwm (Phase 11) est fonctionnelle mais brute : polybar en texte, Arc Dark figé, pas de
scratchpad ni de cheatsheet, power menu qui ne convient pas, scripts entassés dans `~/bin` sans
distinction de portée. titux veut s'inspirer de la structure du rice JustAGuyLinux (`bspwm-setup`)
pour adopter ce qui plaît, tester ce qui est incertain, et finir le look — sans usine à gaz ni
copier-coller.

## Target End State

- Un **theme switcher** (`thememenu`, rofi) bascule entre plusieurs thèmes **dark** (set JAGL trié +
  Arc Dark) ; un changement de thème repeint polybar + bordures bspwm + dunst + thème **rofi**
  (officiel) en une commande, sans redémarrer la session. *(Alacritty hors switcher — couleurs du terminal inchangées ;
  wallpaper écarté — voir périmètre réduit Phases 2.5/3.3.)*
- **Polybar** relookée en **Nerd Font** (icônes), `%index%:%name%` pour les bureaux, module `tray`
  dédié (plus de clés dépréciées).
- **Power menu** refondu (rofi thémé) dans `~/.config/bspwm/scripts/`, bindé sur une touche fiable.
- **Scripts rangés par portée** : `~/bin` vidé ; communs dans `~/.config/scripts/` ; spécifiques bspwm
  dans `~/.config/bspwm/scripts/` ; autostart et alias `vpn` repointés en conséquence.
- ~~Wallpapers pilotés par le manifeste de thème~~ → **écarté** (29/05, fond X par défaut) ; remplacé
  par des **captures Flameshot** bindées (`super+shift+p`, `super+shift+ctrl+p` différé) → `~/screenshots/`.
- **Cheatsheet** des raccourcis sur une touche qui marche en fr-mac.
- **Essais tranchés** (gardés ou jetés, avec raison écrite) : picom, st, scratchpad, bspwm-tabs.
- i3 et XFCE **inchangés et toujours bootables**.
- Décisions **propagées** au guide/ADR ; journal jour 8 rédigé.

## Scope and Non-Goals

**Dans le périmètre :** theme switcher + thèmes, polybar Nerd Font, power menu refondu, réorg scripts +
rewiring autostart/alias, wallpapers, cheatsheet, essais picom/st/scratchpad/tabs, propagation doc.

**Hors périmètre :**
- Migration/suppression d'i3 ou XFCE (filet de sécurité).
- **nvim dans le switcher** — exclu (débutant, pas de colorscheme custom repéré ; à reconsidérer plus tard).
- Réécriture de la **logique** des scripts communs (gpgctl, vpn, lock, pinentry-auto) — on les déplace,
  on ne les réécrit pas. (Le power menu, lui, est refondu.)
- Remplacer Alacritty par st **par défaut** (st = essai optionnel).
- Multi-moniteur : pas implémenté ici, **mais** dualscreen prévu prochainement → ne pas hardcoder le
  mono-écran (polybar/bspwmrc à garder dualscreen-friendly).
- Suppression des LV ext4 / entrées BLS de secours (Phase 12).

## Proposed Solution

Découper en phases dépendantes derrière un snapshot Timeshift. D'abord l'**hygiène** (réorg scripts,
fondation des dossiers), puis la **pièce maîtresse** (theme switcher) validée par un **proof slice**
(polybar + un thème), puis les **finitions** (palette, power menu, wallpapers, cheatsheet), puis les
**essais réversibles** (chacun avec critère de rejet), enfin la **propagation doc**. On reprend le
*pattern* JAGL (split couleurs, manifeste `theme.conf`) adapté à la stack (Alacritty, pas
ghostty/wezterm), jamais les fichiers tels quels.

## Subjective Contract (plan esthétique)

- **Target outcome :** bureau bspwm fini, cohérent, dark, lisible ; polybar à icônes ; thème
  changeable en une commande.
- **Anti-goals :** usine à gaz ; dépendre de picom (doit rester jetable) ; chasse exhaustive aux
  glyphes ; recompiler st en boucle ; config opaque.
- **References :** JAGL `bspwm-setup` (polybar, `thememenu`, structure `themes/`).
- **Anti-references :** rice « show-off » surchargé d'effets ; copier-coller opaque.
- **Tone/taste :** sobre mais fini, dark, defaults sensés.
- **Proof slice :** polybar Nerd Font sur **gruvbox** + switch vers **Arc Dark** repeignant
  polybar/bordures/rofi proprement (Phase 2).
- **Required preview artifact :** **capture d'écran avant/après** de la polybar/desktop, validée par
  titux, AVANT d'industrialiser toute la palette (Phase 3). Échec du proof slice → retour planning.
- **Rejection criteria :** picom = tearing/lag/instabilité → jeter ; st = perso trop pénible → jeter ;
  thème qui ne plaît pas → on en prend un autre, on ne le « répare » pas ; tabs fragile → jeter.

## Implementation Tasks

### Phase 0 — Filet de sécurité
- [x] **0.1** Snapshot Timeshift « pre-bspwm-polish » (rollback 1 clic).

*Exit : snapshot listé dans `timeshift --list`.*

### Phase 1 — Réorganisation des scripts par portée (Q11)
- [x] **1.1** Créer `~/.config/scripts/` (commun) et `~/.config/bspwm/scripts/` (spécifique bspwm).
- [x] **1.2** Déplacer les **communs** vers `~/.config/scripts/` : `gpgctl`, `pinentry-auto`, `vpn`, `lock`.
- [x] **1.3** Repointer les références : `xss-lock.desktop` (→ `~/.config/scripts/lock`),
      `vpn-up.desktop` (→ `~/.config/scripts/vpn --up`), `gpg-agent.conf` (`pinentry-program`).
      **Écart au plan :** aucune entrée d'autostart GPG `.desktop` n'existe (seul `gpg-agent.conf`
      pilote pinentry). **+2 refs XFCE non listées au plan, rewirées aussi :** `xfce4-session.xml`
      (`LockCommand` → `lock`) et `panel/launcher-19/…desktop` (`vpn --toggle`). gpg-agent rechargé.
- [x] **1.4** **PATH plutôt qu'alias** (décidé avec titux) : aucun alias `vpn` n'existait — ajout de
      `~/.config/scripts` au `PATH` dans `~/.config/env/00-core.sh`, donc `vpn`/`gpgctl`/`lock` restent
      appelables par leur nom (usage manuel `vpn --status/--down/--toggle` préservé).
- [x] **1.5** Déplacer `powermenu` → `~/.config/bspwm/scripts/` (sera refondu en Phase 4), bind corrigé
      dans `sxhkdrc-bspwm` + chemin interne `lock` mis à jour.
- [x] **1.6** Déplacer l'overlay → `~/.config/bspwm/sxhkd/sxhkdrc-bspwm` et répercuter le chemin dans
      `bspwmrc` (corrige l'incohérence finding §2).
- [x] **1.7** `~/bin` est **vide**.

*Exit : i3/XFCE/bspwm bootent ; lock (capot), `vpn --up` au login, GPG/pinentry et le power menu
fonctionnent ; `pgrep`/`journalctl -b` sans échec lié.*

### Phase 2 — Theme switcher + proof slice (pièce maîtresse)
- [x] **2.1** Structure créée : `~/.config/bspwm/themes/{gruvbox,arc-dark}/` + fichiers actifs
      `~/.config/polybar/colors.ini`, `~/.config/rofi/colors.rasi`, `~/.config/bspwm/colors.sh`,
      `~/.config/alacritty/colors.toml`, `~/.config/dunst/dunstrc` (marqueurs `# THEME: dunst_*`).
      **Adaptation XDG** (vs JAGL self-contained) : couleurs actives dans les dossiers standards.
- [x] **2.2** Configs restructurées pour inclure les couleurs : `polybar/config.ini`
      (`include-file = colors.ini` + Nerd Font + icônes FA), `rofi/config.rasi` (`@import colors.rasi`
      + thème local), `bspwmrc` (`. colors.sh`), `alacritty.toml` (`[general] import` + live reload).
- [x] **2.3** `thememenu` écrit en style titux (header, `printMessage`/`tput`, camelCase, `case` dans
      `main`, action lecture seule `--current`/`--list`). Manifeste `theme.conf` : `name`/`gtk`/`icons`/
      `wallpaper`/`dunst_*` — **`alacritty` droppé** (thémé par copie de `colors.toml`, comme les autres
      `colors.*`), ghostty/wezterm droppés. Wallpaper depuis `~/wallpapers/`, `bspc wm -r`, cache
      `~/.cache/bspwm/current_theme`. Bind `super + shift + t`. dunst rechargé via `pkill` (dbus respawn).
- [x] **2.4** Deux thèmes créés : **gruvbox** (depuis JAGL, mappé au schéma polybar/rofi/alacritty de
      titux) et **arc-dark** (couleurs actuelles figées en thème). Vérifs statiques OK (cfgGet, sed
      dunst, wallpapers présents, polybar relative-include confirmée vs JAGL).
- [x] **2.5** **Proof slice VALIDÉ** (captures titux 28/05). **Périmètre du switcher réduit suite
      retours titux :** thème = **polybar (couleurs) + bordures bspwm + dunst** uniquement. **Sortis du
      thème** (gardés tels quels d'origine) : **rofi** (stock Arc-Dark), **Alacritty** (couleurs
      inchangées, fond quasi-noir). **Fond d'écran : non géré** (défaut X, ni photo ni couleur unie — les deux rejetés).
      Bonus livrés : icônes Nerd Font polybar (modules + bureaux `%index%:%name%`), padding terminal
      réduit (6→2 + `dynamic_padding`).

*Exit : le switch gruvbox ↔ arc-dark fonctionne live ; preview validée. Sinon → retour planning.*

### Phase 3 — Polybar finitions + palette complète
- [x] **3.1** Polybar Nerd Font (FiraCode/Hack), glyphes modules (cpu/mem/fs/vol/date/horloge) +
      **icônes de bureaux** (noms bspwmrc en glyphes, `%index%:%name%` conservé). **Module `tray` dédié
      FAIT (29/05)** : `tray-position`/`tray-maxsize` (clés bar-level **dépréciées** en polybar 3.7,
      warnings confirmés dans le log) remplacées par `[module/tray] type = internal/tray`, ajouté en
      fin de `modules-right` (tray reste à droite, **apparence inchangée**, `tray-size = 66%`).
      Distinction posée par titux : « ne pas toucher au **style** » ≠ « garder des clés **dépréciées** ».
- [x] **3.2** Set dark importé et **vérifié** : 12 thèmes (arc-dark, gruvbox, nord, dracula, catppuccin,
      kanagawa, everforest, rose-pine, doomone, monokai, moonfly, github-dark). **Adapté** : `colors.ini`
      (couleurs mappées primary→accent, disabled→muted) + `colors.sh` (bordures, depuis JAGL) +
      `theme.conf` (name/gtk/icons/dunst_*). **Pas** de colors.rasi/toml (rofi/Alacritty hors thème).
- [x] **3.3** Tri à l'usage (captures titux 28-29/05) : **9 thèmes gardés** (arc-dark, catppuccin,
      dracula, everforest, github-dark, gruvbox, kanagawa, monokai, rose-pine). **Supprimés** : moonfly,
      doomone, nord (nord jugé délavé/trop clair). **Bonus hors plan, validés titux :**
      (a) **everforest reverdi** (accent/bordure/dunst jaune→vert `#a7c080` — « rien de FORREST » sinon) ;
      (b) **monokai unifié** rose Monokai Pro `#ff6188` (accent+bordures+dunst, fini le cyan discordant) ;
      (c) **bordures de notifs cohérentes** : tous les `dunst_frame_*`/`highlight`/`fg_low` alignés sur
      l'accent du thème (gruvbox était teal sur accent or, etc.), `critical` gardé rouge/orange ;
      (d) **rofi RÉINTÉGRÉ au switcher** (revient sur le drop Phase 2.5) via **thèmes rofi officiels**
      (clé `rofi` dans `theme.conf`, `thememenu` réécrit `@theme` de `config.rasi`) : Arc-Dark→arc-dark,
      Monokai→monokai, gruvbox-dark-hard→gruvbox/github-dark, purple→rose-pine/catppuccin/dracula/kanagawa,
      solarized_alternate→everforest. Stratégie : rofi garde sa palette officielle (pas d'injection
      d'accent — l'essai d'injection avait échoué) ; on harmonise seulement polybar↔bordures↔dunst.
      (e) **fix offset dunst** `(14,14)`→`(14,44)` : les bulles ne chevauchent plus la polybar.

*Exit : polybar à icônes lisible ; `thememenu` liste les thèmes gardés ; chacun repeint tout proprement.*

### Phase 4 — Power menu refondu
- [x] **4.1** Réécrire `~/.config/bspwm/scripts/powermenu` : rofi thémé (hérite de `config.rasi`,
      suppression du `-font` override), `set -u`, style titux, scrollbar désactivée via `-theme-str`.
      Actions via logind+polkit, aucun sudo.
- [x] **4.2** Bind `super + Escape` déjà en place dans `sxhkdrc-bspwm` — rien à changer.

*Exit : le power menu s'affiche thémé et chaque action marche sans mot de passe sudo.*

### Phase 5 — Confort (cheatsheet + captures d'écran)
- [x] **5.1** `~/.config/bspwm/scripts/help` créé (rofi -dmenu lecture seule), bindé `super + shift + i`
      dans `sxhkdrc-bspwm`. **Correction 29/05** : le bind initial `super + shift + h` entrait en
      collision avec le déplacement de fenêtre vim (`super + shift + {h,j,k,l}`, masqué par l'expansion
      d'accolades) → help muet ; rebindé `super + shift + i`. Contenu du help corrigé : volume/luminosité
      = **touches directes** (le « Fn + … » était faux ; sur le MBP `fn` ne sert qu'à atteindre F1–F12).
      Validé clavier fr-mac.
- [x] **5.2** Wallpaper rejeté (29/05 — ni photo ni couleur unie, fond X par défaut conservé).
      **Remplacé :** capture d'écran Flameshot dans le sxhkdrc **commun** :
      `super + shift + p` (immédiat → `~/screenshots/YYYY-MM-DD_HH-MM.png`) +
      `super + shift + ctrl + p` (différé 3s, pour capturer menus/rofi ouverts). Validé.

*Exit : la touche cheatsheet (`super + shift + i`) affiche les raccourcis ; les captures Flameshot fonctionnent.*

### Phase 6 — Essais réversibles (install → test → garde/jette, raison écrite)
- [x] **6.1** **picom** : **GARDÉ** (verdict 30/05). Découverte : picom tournait **déjà** (autostart XDG
      système `dex -a` → `/etc/xdg/autostart/picom.desktop`), d'où le fondu inter-bureaux apprécié.
      Verdict = garder, pour le fondu **+ les coins arrondis**. **Câblage local FAIT (30/05)** :
      `~/.config/bspwm/picom/picom.conf` (backend **`glx`** — requis pour les coins arrondis ; `xrender`
      les rend carrés) lancé depuis `bspwmrc` (idempotent) + autostart système neutralisé
      (`~/.config/autostart/picom.desktop` `Hidden=true`). **Validé par titux** (coins arrondis + fondu +
      fluide). ADR 0007 + annexe A à jour (tâche 7.2).
- [x] **6.2** **st** : installé (`chaotic-aur/st 0.9.3-1`), démarre OK. Verdict = **gardé**, mais sa
      raison d'être = être le **terminal du scratchpad** → sort définitif lié au brainstorm scratchpad
      (6.3). (Si scratchpad pénible avec st → repli `alacritty --class scratchpad` et st jeté.)
- [ ] **6.3** **scratchpad** — **RE-CADRÉ (30/05) : sorti de ce plan → brainstorm requis.** Découverte :
      ce n'est pas un simple terminal flottant mais un **système à 3 fonctions** (terminal escamotable +
      promotion de n'importe quelle fenêtre + slots nommés). titux découvre bspwm et ne connaît pas encore
      ses usages → **gelé** jusqu'à un brainstorm dédié (idéalement après usage). Finding 30/05 §6.
- [x] **6.4** **bspwm-tabs** : **GARDÉ** (verdict 30/05) — fonctionne après fix AZERTY. Sources/binaires
      dans `~/.config/bspwm/{tabbed,bspwm-tabs}` ; binds `super+ctrl+a` (attach) / `super+ctrl+d` (detach).
      Cleanup install système (`/usr/local/...`) **fait** (titux, sudo). Label « binds temporaires »
      **retiré** de `sxhkdrc-bspwm` (30/05).

*Exit : picom/st/bspwm-tabs ont un verdict écrit (gardés) ; **scratchpad re-cadré en brainstorm** (hors ce
plan). Aucune dépendance imposée.*

### Phase 7 — Propagation doc + clôture
- [x] **7.1** MAJ `guide/11` (Nerd Font, power menu déplacé, scripts par portée, switcher) et le
      commentaire « aucune Nerd Font requise » de `polybar/config.ini`.
- [x] **7.2** `annexe-a-materiel-ancien.md` + **ADR 0007** : **picom adopté inscrit** (truth-up 30/05),
      avec le raisonnement (la contrainte GPU porte sur Vulkan/compute shaders, **pas** sur l'OpenGL du
      backend `glx`) et la preuve (finding 30/05 §5). Annexe A : nouveau point « compositeur picom OK » + la
      section fr-mac reformulée (symboles au repos vs chiffres au Shift).
- [x] **7.3** **Deux nouveaux ADR** : *theme switcher bspwm* et *organisation des scripts par portée*.
- [x] **7.4** Journal **jour 8** (`day8.md` — Phases / Leçons 19-28 / État des lieux / PENDING) écrit +
      `pkglist-{explicit,native,foreign}-2026-05-30.txt` régénérés. **Écart au plan :** le
      `git add -A && git commit` est **laissé à titux** (trace locale, jamais de commit côté agent).

*Exit : guide/ADR cohérents avec la config vivante ; journal écrit ; pkglists commitées.*

## Acceptance Criteria

- `thememenu` bascule entre les thèmes gardés ; un switch repeint **live** polybar + bordures bspwm +
  dunst + thème **rofi** (officiel), sans relancer la session. *(Alacritty et wallpaper hors switcher.)*
- Polybar affiche des **icônes** (Nerd Font), `%index%:%name%`, et un `tray` (module `internal/tray`)
  **sans warning déprécié** (fait 29/05).
- Le power menu thémé exécute lock/logout/suspend/reboot/poweroff **sans sudo**.
- `~/bin` est vide ; `gpgctl`/`pinentry-auto`/`vpn`/`lock` sont en `~/.config/scripts/` et tout
  fonctionne (lock capot, VPN au login + en manuel via le `PATH`, GPG) sur **les trois WM**.
- La touche cheatsheet (`super + shift + i`) affiche les raccourcis ; captures Flameshot → `~/screenshots/`.
- picom / st / bspwm-tabs : chacun **gardé** avec raison (verdicts 30/05) ; **scratchpad re-cadré en
  brainstorm** (sorti de ce plan — voir 6.3).
- i3 et XFCE démarrent toujours, inchangés.
- `guide/11`, annexe A, ADR 0007 + 2 nouveaux ADR, et `day8` reflètent l'état final.

## Decision Rationale

- **Réorg scripts d'abord** : fondation (les dossiers `bspwm/scripts` accueillent ensuite
  thememenu/power/help) et hygiène indépendante ; derrière un snapshot car elle touche les chemins
  d'autostart (risque cross-WM).
- **Proof slice avant la palette complète** : valider le *mécanisme* du switcher sur 2 thèmes évite de
  fabriquer 13 jeux de couleurs avant de savoir s'il repeint proprement (anti-gâchis).
- **Essais après les finitions** : picom/st/tabs sont optionnels et jetables ; ne pas bloquer le look
  fini dessus. scratchpad dépend du verdict st (repli Alacritty prévu).
- **Adapter, pas copier** (drop ghostty/wezterm, ajout Alacritty) : respecte la hiérarchie des sources
  de vérité et la stack réelle.
- **Alternatives rejetées** : tout adopter façon JAGL (usine à gaz, essais non testés) ; garder Arc
  Dark figé (titux a rouvert l'esthétique) ; laisser les scripts dans `~/bin` (mélange manuel/auto).

## Constraints and Boundaries

- **Style scripts titux** : header commenté, `printMessage`+`tput`, camelCase, `case` dans `main`,
  early-return `&&`/`||`, action read-only par défaut. Ne pas masquer un binaire (cf. `gpgctl`).
- **ADR figés non rouverts ici** : Ly, systemd-boot, zram, Timeshift-BTRFS, ESP-on-/boot. (picom est
  le seul ADR explicitement mis à l'épreuve, via essai.)
- **Réversibilité** : tout additif/déplaçable ; rollback = snapshot Timeshift.
- **Config bash splittée** sur le MBP (`~/.config/bash/*.bash`) — en tenir compte pour le `PATH` des
  scripts communs (décision 1.4 : `PATH` plutôt qu'alias).
- **Dualscreen à venir** : ne pas hardcoder `monitor =` mono-écran dans polybar/bspwmrc.

## Assumptions

L'audit du brainstorm est hérité ; complété par la recherche de ce plan :

| Hypothèse | Statut | Évidence |
|---|---|---|
| Alacritty recharge les couleurs via `[general] import` + live reload | Vérifié | Alacritty **0.17.0** ; `import` + `live_config_reload` supportés |
| picom installable sans AUR | Vérifié | `extra/picom 13-2` |
| st installable en binaire sans compiler pour l'essayer | Vérifié | `chaotic-aur/st 0.9.3-1` (helper = **paru**) |
| dunst n'a pas encore de config (création propre) | Vérifié | `~/.config/dunst` absent, dunst présent |
| Le module `internal/bspwm` rend `%index%:%name%`, tray dédié ≥ 3.7 | Vérifié | finding §3-4 |
| picom tourne proprement sur ce GPU | **Vérifié — adopté** | backend `glx` (OpenGL GL 3.1) OK : coins arrondis + fondu, fluide (finding 30/05 §5) |
| st thémable sans recompiler (Xresources) | **Non vérifié** | → **tâche 6.2** (détermine « vivable ») |
| Touche cheatsheet fiable en fr-mac | **Non vérifié** | → **tâche 5.1** (test clavier) |
| GTK bascule live sans `xsettingsd` | **Non vérifié / limité** | pas de `xsettingsd` → hook GTK par `sed`, effet au prochain lancement des apps GTK |

## Risk Analysis

- **Casser l'autostart commun en déplaçant les scripts** (plus de lock/VPN/GPG). *Mitigation :* tâche
  1.3/1.4 repointe **toutes** les références ; test des 3 WM en sortie de Phase 1 ; snapshot.
- **Switcher qui repeint mal** (couleurs résiduelles, app non rechargée). *Mitigation :* proof slice
  (Phase 2) avant la palette ; preview validée.
- **Régression du bug clavier fr-mac** en touchant `bspwmrc`/sxhkd (cf. finding §1). *Mitigation :*
  conserver `setxkbmap` **avant** sxhkd et le lancement unique ; tester un **reboot à froid**.
- **picom : tearing/instabilité.** *Mitigation :* essai isolé, critère de rejet écrit, `Rns` si KO.
- **`bspc wm -r` recharge `bspwmrc`** → vérifier que les `respawn`/kill-wait restent idempotents
  (dunst/polybar/sxhkd non dupliqués).
- **Perte de réversibilité si on supprime trop tôt.** *Mitigation :* ne désinstaller un essai jeté
  qu'après verdict ; garder i3/XFCE intacts.

## References

- Brainstorm : `docs/brainstorms/2026-05-27-bspwm-polish-jagl-brainstorm.md`
- Finding : `docs/findings/2026-05-26-bspwm-polybar-sxhkd.md` (keymap §1, lanceur §2, tray §3,
  `%index%:%name%` §4, écarts i3→bspwm §5, autostart commun/par-WM §6, binds JAGL §7)
- Guide cible : `docs/guide/11-wm-bspwm-polybar.md`
- Référence externe (clone local) : `~/GIT/bspwm-setup` (thememenu, theme.conf, polybar, scripts)
- Config vivante : `~/.config/{bspwm,polybar,sxhkd,rofi,alacritty,gtk-3.0}`, `~/.config/autostart/*.desktop`
- Mémoire : `[[script-organization-by-scope]]`, `[[titux-choices-revisitable]]`,
  `[[verify-living-config-and-findings]]`, `[[source-of-truth-hierarchy]]`

## Next Steps

- `/work docs/plans/2026-05-27-feat-bspwm-polish-jagl-plan.md` — exécuter phase par phase (les
  checkboxes sont le tracker). Commencer par 0.1 (snapshot) puis Phase 1.
