---
title: "Polir la config bspwm en s'inspirant de JustAGuyLinux (bspwm-setup)"
type: brainstorm
date: 2026-05-27
participants: [titux, Claude]
related:
  - docs/brainstorms/2026-05-26-guide-migration-arch-btrfs-tiling-brainstorm.md
  - docs/findings/2026-05-26-bspwm-polybar-sxhkd.md
  - docs/guide/11-wm-bspwm-polybar.md
  - phase11-bspwm-plan-20260525.md
  - CLAUDE.md (ADR : picom différé, polybar sans Nerd Font, « style titux »)
---


## Problem Statement

La config bspwm de la Phase 11 est **fonctionnelle mais « pas finie »** : polybar en labels texte
bruts, Arc Dark figé, pas de scratchpad, pas de cheatsheet, rendu encore brut. Le besoin réel n'est
**pas** « copier JAGL » ni « tout reskiner », mais :

> **S'inspirer de la structure du rice JAGL (`bspwm-setup`) pour adopter ce qui plaît et qui est
> faisable, jeter le reste — et au passage rendre l'ensemble plus fini.**

Recadrage clé apparu en cours de route : le **« style titux »** n'est *pas* « surtout ne rien
changer ». C'est pragmatique — *« je ne suis pas graphiste, je ne veux pas me prendre la tête à
créer un thème, je veux juste un truc qui me plaît »*. Arc Dark est un choix d'il y a ~12 ans,
**pas une relique sacrée** : d'autres thèmes dark sont bienvenus. Ce recadrage **renverse** le
verdict initial sur le theme switcher (cf. Q1).

## Context

Sources lues (vrai code, pas inventé) :

- **Config vivante** : `~/.config/bspwm/bspwmrc`, `~/.config/polybar/{config.ini,launch.sh}`,
  `~/.config/sxhkd/{sxhkdrc,sxhkdrc-bspwm}`. Fonctionnelle, minimale, Arc Dark, labels texte,
  kill-wait-relaunch déjà en place, terminal **Alacritty**.
- **Référence JAGL** : `~/GIT/bspwm-setup` — clone **upstream** de
  `codeberg.org/justaguylinux/bspwm-setup`, à jour, **aucune modif locale** (réf fiable).
- **Doc projet** : `docs/findings/2026-05-26-bspwm-polybar-sxhkd.md` (diagnostics + écarts i3→bspwm
  §5, bons binds JAGL à reprendre §7, modèle autostart commun/par-WM §6) et `docs/guide/11`
  (chapitre cible, qui documente encore « polybar texte / pas de Nerd Font » et « picom écarté »).

**Principe déjà acté dans le projet (finding §6)** : daemons **communs** en XDG autostart
(`dex -a -e <wm>`), config **WM-spécifique** (overlay sxhkd, polybar) dans le **rc du WM**, *jamais*
en autostart (sinon « fuite » vers les autres WM). La réorg des scripts (Q11) **généralise ce
principe** — ce n'est pas une convention nouvelle, c'est la même séparation commun/spécifique.

Écart, mécanisme par mécanisme :

| Brique JAGL | Intérêt | Verdict (voir décisions) |
|---|---|---|
| **Theme switcher** (`thememenu` + `themes/<nom>/` + split couleurs) | ⭐ fort | **Adopter/adapter** (pièce maîtresse) |
| **Polybar Nerd Font** (icônes vol/power/dispo) | esthétique | **Adopter** (Nerd Fonts déjà installées) |
| **scratchpad / scratchpad-promote** | fonctionnel | **Essayer** (avec st, repli Alacritty `--class`) |
| **picom** | esthétique | **Essayer** (install/test/décide) |
| **st** (terminal suckless) | léger | **Essayer** (binaire chaotic-aur ; rejet si perso pénible) |
| **bspwm-tabs / tabbed** (C à compiler) | niche | **Essayer** |
| **wallpapers** (+ feh dans bspwmrc) | esthétique | **Mettre en place** (dossier `~/wallpapers/` existant) |
| **help / cheatsheet** (`super+/`) | confort | **Adopter**, mais touche qui marche |
| **power menu rofi** | fonctionnel | **Adapter** (refondre l'actuel, thémé) |
| **rofi/dunst thémés** | esthétique | **Adapter** — config **commune** à tous les WM, pilotée par le switcher |
| **organisation des scripts** | hygiène | **Réorganiser** (split commun/spécifique, cf. Q11) |
| **respawn() restart-safe** | robustesse | **Déjà fait** (convergence, rien à faire) |

Mécanique du theme switcher (le cœur) : chaque `themes/<nom>/` contient `colors.{sh,ini,rasi}` +
`theme.conf` (manifeste). `thememenu` copie ces fichiers vers les emplacements actifs, réécrit
terminal/GTK/dunst/wallpaper, puis `bspc wm -r`. Principe d'or : **le layout est à toi, seules les
couleurs sont remplacées** (`colors.ini` séparé via `include-file`).

## Chosen Approach

**Adopter le squelette JAGL (theme switcher + look Nerd Font), l'adapter à la stack en place, et
traiter le reste comme des essais réversibles « install → test → garde/jette ».**

1. **Adopter/adapter** (haute confiance) : le **theme switcher** + structure `themes/` à colonne
   couleurs, adapté à la stack en place (**Alacritty** et non ghostty/wezterm ; nvim, dunst, rofi,
   polybar, bordures bspwm, wallpaper). Polybar **relookée en Nerd Font** (FiraCode / Hack, déjà
   installées).
2. **Essais réversibles** (proof = ça tourne / c'est vivable, sinon jeter) : **picom**, **st**,
   **scratchpad**, **bspwm-tabs**, **wallpapers**.
3. **Confort** : **cheatsheet** des raccourcis sur une touche qui fonctionne sur le clavier fr-mac
   (pas `slash`/antislash, mort sur cette machine).
4. **Hygiène** : **réorganiser les scripts** selon le split à trois niveaux (Q11) — `~/bin` = manuel,
   `~/.config/scripts` = commun WM, `~/.config/$wm/scripts` = WM-spécifique — et **refondre le power
   menu**, thémé via le switcher.
5. **Objectif chapeau** : rendre l'ensemble **plus fini**, sans usine à gaz ni chasse aux glyphes.

Garde-fou transverse : **snapshot Timeshift avant** toute manip (filet de sécurité, rollback 1 clic).

## Why This Approach

- **Le switcher résout le vrai problème** (« pas graphiste ») : des thèmes prêts à l'emploi, zéro
  design à produire. C'est pour ça qu'il est la pièce maîtresse, et non un « conflit avec un style
  figé ».
- **L'approche essai/réversible** colle à la façon de faire (« je prends ce qui marche, je jette le
  reste ») et lève l'inertie d'ADR sans pari aveugle : picom n'est pas rejeté a priori, il est
  *testé* (12 ans de progrès depuis la dernière tentative ratée).
- **Adapter plutôt que copier** respecte la hiérarchie des sources de vérité : on reprend le
  *pattern*, pas les fichiers tels quels (ex. on jette les hooks ghostty/wezterm, terminaux non
  utilisés ici).

Alternatives rejetées : (a) **tout adopter façon JAGL** → trahit « pas d'usine à gaz » + embarque
picom/st/tabs sans les tester ; (b) **ne rien toucher aux choix figés** → laisse la config « pas
finie » et ignore que l'esthétique a été explicitement rouverte.

## Subjective Contract

- **Target outcome** : bureau bspwm **fini, cohérent, dark**, avec une polybar lisible à icônes et
  un changement de thème en une commande.
- **Anti-goals** : usine à gaz à maintenir ; **dépendre** de picom (doit rester jetable) ; passer
  des heures à choisir des glyphes ; recompiler st en boucle ; config qu'on ne comprend plus.
- **References** : JAGL `bspwm-setup` (polybar, theme switcher, structure `themes/`).
- **Anti-references** : rice « show-off » surchargé d'effets ; copier-coller de config opaque.
- **Tone / taste** : sobre mais fini, dark, lisible ; defaults sensés plutôt que personnalisation
  exhaustive.
- **Rejection criteria** : picom → tearing/lag/instabilité = **jeter** ; st → perso (recompil
  suckless) trop pénible = **jeter** ; un thème qui ne plaît pas = on en prend un autre, on ne le
  « répare » pas ; tabs → trop fragile/inutile = **jeter**.

## Preview And Proof Slice

- **Proof slice** : la **polybar relookée** (Nerd Font + couleurs via `colors.ini`) sur **un** thème
  (ex. gruvbox), **plus** un `thememenu` qui bascule vers Arc Dark et change *proprement* polybar +
  bordures bspwm + rofi. Si ce slice marche → le pattern est validé, on déroule dunst/gtk/wallpaper
  et les essais.
- **Required preview artifacts** : capture d'écran **avant/après** de la polybar ; idéalement un
  mini-mockup du layout polybar (modules + glyphes) avant d'industrialiser tous les thèmes.
- **Rollout rule** : snapshot Timeshift **avant** ; valider le proof slice **avant** de propager le
  switcher à tout (dunst, GTK, wallpaper, palette complète).

## Key Design Decisions

### Q1 : Theme switcher — RÉSOLU : adopter/adapter (pièce maîtresse)
**Décision :** reprendre le pattern JAGL (split couleurs + `themes/<nom>/` + `thememenu`), adapté à
la stack en place. **Renversement assumé** du cadrage initial.
**Rationale :** résout directement le « je ne suis pas graphiste » — thèmes prêts à l'emploi.
**Alternatives rejetées :** créer un thème à la main (pas voulu) ; garder Arc Dark figé (rouvert).
**⚠️ Contradiction avec doctrine antérieure** : CLAUDE.md/mémoire présentaient « style titux »
comme « ne rien changer ». À mettre à jour (candidat `/compound`, cf. Next Steps).

### Q2 : Palette de départ — RÉSOLU : tout le set dark JAGL + Arc Dark, puis tri à l'usage
**Décision :** importer **tous** les thèmes dark de JAGL (gruvbox, nord, dracula, catppuccin,
kanagawa, everforest, rose-pine, doomone, monokai, moonfly, github_dark…) **+** Arc Dark, **puis
jeter ceux qui ne conviennent pas** une fois essayés. Tout au départ → tri de ce qu'on garde.
**Alternatives rejetées :** curer seulement 3-4 d'emblée (on préfère essayer large puis élaguer).

### Q3 : Icônes / Nerd Font — RÉSOLU : oui
**Décision :** polybar (et rofi) en **Nerd Font** — **FiraCode** ou **Hack Nerd Font**, déjà
installées. Defaults de glyphes sensés, **sans** chasse exhaustive aux icônes.
**Alternatives rejetées :** rester en labels texte (rendu trop brut).
**Note :** met à jour le commentaire « aucune Nerd Font requise » de `polybar/config.ini`.

### Q4 : Scratchpad — RÉSOLU : essayer avec st (repli Alacritty)
**Décision :** brancher le scratchpad sur **st** (`st -c scratchpad`). Repli si st jeté :
**Alacritty `--class scratchpad`** (zéro paquet sup, le scratchpad ne dépend donc pas de st).

### Q5 : picom — RÉSOLU : essai réversible
**Décision :** **installer et tester** picom (commencer `--backend xrender`, sans blur/ombres
lourdes). Garder seulement si ça tourne proprement (pas de tearing/lag).
**Rationale :** pas d'allergie GPU ; juste ne pas en *dépendre* au cas où ça casse. Le « différé »
de l'ADR était un choix non testé, pas un fait mesuré.
**Alternatives rejetées :** rejet a priori (inertie) ; en faire une dépendance obligatoire.

### Q6 : st — RÉSOLU : essai (binaire chaotic-aur ; rejet si perso pénible)
**Décision :** installer st **depuis chaotic-aur** (`sudo pacman -S st` — **binaire, aucune
compilation pour l'essayer**). (Helper AUR de la machine = **paru**, *pas* yay — le `yay-bin` de
`~/GIT` est un vieux reste.)
**Nuance importante :** le binaire chaotic-aur s'essaie tel quel, mais **personnaliser/thémer** st
(font, scrollback, couleurs du switcher) suppose en général de **rebâtir depuis les sources**
(`config.h` + patches). C'est *là* que se joue le critère de rejet : si la perso suckless est trop
pénible → jeter, garder Alacritty.
**Cohabitation** st + Alacritty = **sans conflit** (apps X11 indépendantes).

### Q7 : bspwm-tabs / tabbed — RÉSOLU : essai
**Décision :** compiler et tester (C + Makefile). Jeter si fragile/inutile à l'usage.

### Q8 : Cheatsheet des raccourcis — RÉSOLU : adopter, autre touche
**Décision :** reprendre l'idée `help` (notify/rofi listant les binds), mappée sur une touche qui
**fonctionne** sur le clavier fr-mac (à trancher en /plan : ex. `super+F1`, `super+i`…), **pas**
`slash`/antislash (mort sur cette machine).

### Q9 : Wallpapers — RÉSOLU : utiliser `~/wallpapers/` (déjà existant)
**Décision :** utiliser le dossier **`~/wallpapers/`** (déjà présent, avec des images), **pas** sous
`~/.config/bspwm/` + `feh --bg-fill` dans `bspwmrc`, idéalement piloté par le manifeste de thème
(le switcher réécrit le wallpaper, comme JAGL).

### Q10 : Power menu — RÉSOLU : refondre, et le ranger en bspwm-spécifique
**Décision :** **adapter**, pas ignorer. Le `~/bin/powermenu` actuel ne convient pas → le
**refondre** en rofi thémé (piloté par le switcher), mêmes actions (Verrouiller / Déconnexion /
Veille / Redémarrer / Éteindre via logind+polkit, sans sudo). **Emplacement :
`~/.config/bspwm/scripts/`** — il n'est lancé que par bspwm aujourd'hui ; i3/XFCE ont déjà leur
propre système de power menu (donc pas commun pour l'instant).
**Correction d'un verdict antérieur :** « garder car il existe » ≠ « il convient ».
**Note guide :** met à jour `guide/11` §5 qui le décrit « rofi, style titux » à `~/bin/powermenu`.

### Q11 : Organisation des scripts — RÉSOLU : split à trois niveaux + mapping exact
**Décision :** ranger chaque script selon sa **portée**, en calquant le pattern sxhkd (commun vs
overlay) et le modèle autostart du finding §6. **Mapping arrêté** (plus de cas en suspens) :

| Script | Emplacement | Pourquoi |
|---|---|---|
| `gpgctl` | `~/.config/scripts/` | successeur de `startGpg` ; doit démarrer le GPG **dans tous les WM** au login |
| `pinentry-auto` | `~/.config/scripts/` | appelé avec GPG au démarrage de tout WM (cohérent avec `gpgctl`) |
| `vpn` | `~/.config/scripts/` | lancé au démarrage de tout WM (`vpn --up`) — **+ alias bash** pour l'usage manuel (`--status/--down/--toggle`) |
| `lock` | `~/.config/scripts/` | lancé par `xss-lock` sur tous les WM (commun) |
| `powermenu` (refondu) | `~/.config/bspwm/scripts/` | lancé uniquement par bspwm (Q10) |
| *(nouveaux)* `thememenu`, `help`, `changevolume`, `scratchpad` | `~/.config/bspwm/scripts/` | spécifiques bspwm, souvent thémés |

**Conséquence assumée :** `~/bin` se **vide** (les 5 scripts actuels partent tous en commun ou en
bspwm-spécifique). `~/bin` reste pour de futurs scripts réellement tapés à la main.
**Rofi / dunst :** leurs *configs* restent **communes** (`~/.config/rofi`, `~/.config/dunst`,
partagées par tous les WM) ; c'est le switcher (bspwm) qui réécrit leurs couleurs.
**Conséquence de cohérence :** l'overlay `sxhkdrc-bspwm` devrait aussi passer sous
`~/.config/bspwm/sxhkd/` (le finding §2 écrit déjà ce chemin ; le fichier réel est encore sous
`~/.config/sxhkd/` → incohérence à corriger), et répercuter le chemin dans `bspwmrc`.
**Wiring autostart :** déplacer un script commun implique de **mettre à jour les chemins** dans les
`.desktop` d'autostart (ex. `xss-lock.desktop` → `~/.config/scripts/lock`, `vpn-up.desktop`,
l'entrée GPG) et l'alias bash de `vpn`.
**Alternatives rejetées :** tout laisser dans `~/bin` (mélange manuel/auto + fuite cross-WM) ;
tout mettre dans `~/.config/bspwm` (casse le partage des scripts communs entre WM).
**⚠️ Met à jour** le plan Phase 11 et CLAUDE.md qui disaient « scripts `~/bin` réutilisés tels quels ».

## Open Questions

- **Touche du cheatsheet** : quel keysym fiable sur fr-mac (super+F1 ? super+i ?) — à valider au clavier.
- **Adaptation du switcher à Alacritty** : mécanisme de rechargement des couleurs (Alacritty récent
  supporte `general.import` + live reload d'un fichier de couleurs TOML) — à confirmer en /plan.
- **st thémable proprement ?** Le binaire chaotic-aur lit-il Xresources (couleurs sans recompiler),
  ou faut-il rebâtir `config.h` pour suivre le switcher ? Détermine si st passe le critère « vivable ».
- **nvim dans le switcher ?** Faut-il aussi basculer le colorscheme nvim avec le thème, ou le laisser
  indépendant ? (apprentissage nvim en cours → ne pas surcharger.)
- **Tri de la palette** : quels thèmes dark on garde après essai (on importe large puis on élague, Q2).
- **picom backend** : si xrender insuffisant esthétiquement, tester glx — sans réintroduire de tearing.
- **Déplacer `sxhkdrc-bspwm`** sous `~/.config/bspwm/sxhkd/` : oui/non, et répercuter dans `bspwmrc`
  (corrige l'incohérence finding §2 vs fichier réel).

## Out of Scope

- Migration / suppression d'i3 ou XFCE (restent intacts, filet de sécurité).
- **Multi-moniteur** : pas dans *ce* chantier, **mais dualscreen prévu prochainement** → ne pas
  hardcoder le mono-écran (polybar/config à garder dualscreen-friendly pour ne pas tout refaire après).
- Réécriture de la **logique** des scripts communs existants (gpgctl, vpn, lock, pinentry-auto) — on
  les **déplace/range** (Q11), on ne réécrit pas leur fonctionnement. (Le power menu, lui, est
  refondu — Q10.)
- Remplacer Alacritty par st **par défaut** (st reste un essai optionnel ; Alacritty reste le
  terminal principal tant qu'il convient).
- Suppression des LV ext4 / entrées BLS de secours (Phase 12, conditionnée).

## Next Steps

- `/plan docs/brainstorms/2026-05-27-bspwm-polish-jagl-brainstorm.md` — découper en tâches ordonnées
  (snapshot → réorg scripts Q11 + wiring autostart/alias → switcher + proof slice polybar → palette
  → power menu refondu → essais picom/st/scratchpad/tabs → wallpapers → cheatsheet → propagation
  guide/11 + annexe A + ADR → journal jour 8).
- **Propagation cible (le guide fait foi)** : ces décisions devront redescendre dans `guide/11`
  (Nerd Font, power menu, scripts), `annexe-a-materiel-ancien.md` + ADR 0007 (picom rouvert), et
  probablement **deux nouveaux ADR** : *theme switcher* et *organisation des scripts par portée*.
- **Candidats `/compound`** :
  1. Le « style titux » est **pragmatique** (pas graphiste, pas d'usine à gaz, juste « un truc qui
     me plaît »), **pas** « ne rien changer / Arc Dark figé ». Reformuler aussi l'ADR picom
     (« différé non testé » → « à tester »).
  2. **Convention d'organisation des scripts** (Q11) : `~/bin` = manuel, `~/.config/scripts` =
     commun WM, `~/.config/$wm/scripts` = WM-spécifique — généralise le modèle autostart/sxhkd.
  3. **Leçon de process** : lire `docs/{guide,adr,findings}` + journaux **dès le cadrage** (pas
     seulement CLAUDE.md + config) — aurait évité de mal cadrer « style titux » et le power menu.
