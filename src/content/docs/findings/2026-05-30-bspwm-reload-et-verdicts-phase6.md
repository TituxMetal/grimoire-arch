---
title: "Trouvailles session 30/05 — mécanisme de reload bspwm + verdicts essais Phase 6"
type: findings
date: 2026-05-30
related:
  - docs/plans/2026-05-27-feat-bspwm-polish-jagl-plan.md
  - docs/findings/2026-05-26-bspwm-polybar-sxhkd.md
  - day7.md
status: >-
  Matière pour (a) un futur plan « reload sûr » (§1-§3), (b) la fin de Phase 6 + le journal jour 8 (§4),
  (c) le truth-up doc picom (§5) et (d) un brainstorm scratchpad (§6). §1-§3 et §5 confirmés (lecture
  config) ; verdicts §4 rendus par titux ; §6 = re-cadrage (scratchpad gelé jusqu'au brainstorm).
---


> Convention de sourcing : `[officiel]` = doc/man ; `[retex]` = retour d'expérience de cette machine.
> §1-§3 alimentent un futur plan « reload sûr » (mécanisme i3-like avec validation). §4 = verdicts des
> essais Phase 6, avec ce qu'il reste à implémenter (à faire dans une session fraîche).

## 1. `dex -a -e bspwm` n'est PAS idempotent au reload

**Constat** (lecture `bspwmrc:58`) : à chaque `bspc wm -r`, bspwm ré-exécute `bspwmrc` du début, donc
relance `dex -a -e bspwm` **sans dédup** → l'autostart XDG (nm-applet, polkit-gnome, xss-lock,
`vpn --up`) est **relancé en doublon** et s'empile à chaque rechargement. [retex]

À l'inverse, dans le même `bspwmrc` :
- **sxhkd** est idempotent (`pkill -x sxhkd` + `while pgrep` + respawn, lignes 48-50)
- **polybar** est idempotent (`killall -q polybar` dans `launch.sh`, ligne 61)

→ Le futur reload doit rendre `dex` idempotent (garde `pgrep`/dédup, ou ne relancer l'autostart qu'au
premier démarrage, pas à chaque reload).

## 2. `bspc wm -r` recharge DÉJÀ tout — le « reload-all » i3-like existe

**Constat** : `bspc wm -r` ré-exécute `bspwmrc`, qui relance config bspwm + sxhkd + polybar. Donc
`super + shift + c` (bindé sur `bspc wm -r`) est **déjà** un « tout recharger » façon i3. [officiel + retex]

Distinction des deux binds existants :
- `super + shift + r` → `pkill -USR1 -x sxhkd` : recharge **sxhkd seul, à chaud** (léger, ne tue rien).
- `super + shift + c` → `bspc wm -r` : recharge **tout** (config + sxhkd + polybar).

→ Pas besoin d'« inventer » un reload-all ; il existe. Ce qui manque, c'est la **sûreté** (§3).

## 3. Cartographie du risque de lockout + manque de validate-before-apply

**Risque par bloc** (ce qui se passe si on recharge avec une config cassée) : [retex]

| Bloc cassé | Effet | Lockout ? |
|---|---|---|
| `bspwmrc` (erreur shell **avant** la ligne 50) | le script s'interrompt → sxhkd jamais lancé | **OUI** (vrai lockout) |
| `sxhkdrc*` (1 ligne fautive) | sxhkd survit, ignore ce raccourci, garde les autres | Non (1 raccourci perdu) |
| `polybar` (config invalide) | la barre ne démarre pas | Non (la barre n'est pas un input) |

**Filet absolu** : la TTY `Ctrl + Alt + Fn + F2` (F-keys = Fn sur le MBP, cf. `[[mbp-fkeys-need-fn]]`)
→ console texte, on corrige le fichier, on reboot. On n'est jamais *vraiment* enfermé dehors.

**Manque vs i3** : i3 **valide la config avant de l'appliquer** et garde l'ancienne si la nouvelle est
cassée. bspwm/sxhkd/polybar appliquent **à l'aveugle**. → cœur du futur plan : un script `reload` unique
qui (a) corrige le bug `dex` §1, (b) valide chaque bloc avant d'appliquer (`bash -n` fiable pour le
bspwmrc ; heuristique pour sxhkd/polybar), (c) garantit que sxhkd reste vivant + notifie via dunst si une
config est rejetée.

**Garde-fou opérationnel lié** : ne JAMAIS relancer sxhkd à la main depuis un shell hors-X (crée des
doublons « already grabbed » → tous les raccourcis muets). Voir mémoire `[[polybar-x-session-restart]]`.

## 4. Verdicts des essais Phase 6 (rendus par titux le 30/05)

| Essai | Verdict | Raison | Reste à faire |
|---|---|---|---|
| **picom** | **GARDÉ** | bords arrondis (le but recherché) | `picom.conf` avec `corner-radius` + câblage **idempotent** dans `bspwmrc` (pattern `pkill -x picom` + wait + `picom -b`). Rouvre l'exclusion ADR 0007 / annexe A (tâche 7.2). |
| **st** | **suspendu au scratchpad** | démarre OK, mais sa raison d'être = être le terminal du scratchpad | tranché par le test du scratchpad ci-dessous |
| **scratchpad** | **à construire AVEC st** | c'était le vrai objectif (st seul n'avait pas de sens) | script `~/.config/bspwm/scripts/scratchpad` (st, classe `scratchpad`) + `bspc rule -a scratchpad state=floating` dans bspwmrc + bind (touches libres : a/g/m/o/u/v/w/x/y/z). Si pénible avec st → bascule `alacritty --class scratchpad` ET st jeté. |
| **bspwm-tabs** | **GARDÉ** | fonctionne après fix AZERTY | enlever le label « binds temporaires » dans `sxhkdrc-bspwm` |

**État bspwm-tabs (déjà en place)** : sources dans `~/.config/bspwm/{tabbed,bspwm-tabs}`, binaires dans
`~/.config/bspwm/scripts/{tabbed,bspwm-tabs}`. AZERTY corrigé dans `tabbed/config.def.h`
(`XK_ampersand … XK_agrave` pour `alt+1..0`, fr-mac). `bspwm-tabs.c` : `TABBED_BIN` →
`~/.config/bspwm/scripts/tabbed`. Binds `super+ctrl+a` (attach) / `super+ctrl+d` (detach). Navigation
interne tabbed : `alt+Tab`/`alt+shift+Tab` (suivant/préc.), `alt+&…alt+à` (onglet direct), `alt+q` (fermer).

**Cleanup système : FAIT** (titux, `sudo rm` le 30/05) — `/usr/local/bin/{tabbed,xembed}` +
`/usr/local/share/{doc/tabbed,man/man1/{tabbed,xembed}.1}` supprimés (vérifié : aucun ne subsiste).
tabbed vit désormais uniquement dans `~/.config/bspwm`.

## 5. picom : mécanisme d'autostart réel + scope de fait (découverte 30/05)

**Constat** : picom **tourne déjà** et **survit aux reboots** (titux a rebooté ≥2× depuis la veille),
alors qu'aucune ligne picom n'est dans `bspwmrc` ni `.xprofile`. La source : [retex + officiel]

- `/etc/xdg/autostart/picom.desktop` (fichier **système**, sans `OnlyShowIn`/`NotShowIn`) est ramassé
  par le **`dex -a -e bspwm`** de `bspwmrc:autostart`. C'est *lui* qui lance picom au démarrage de bspwm.
- Il utilise la config par défaut **`/etc/xdg/picom.conf`** : `shadow = true`, **`fading = true`**
  (le fondu inter-bureaux que titux **aime**), `backend = "xrender"`, `vsync = true`, et
  **`corner-radius = 0`** → donc **aucun coin arrondi aujourd'hui** (le « but recherché » du verdict
  n'est pas encore en place, contrairement à ce que « picom GARDÉ » pouvait laisser croire).

**Scope réel = bspwm uniquement** : [retex]
- **i3** n'appelle `dex` que sur **un seul** fichier (`exec dex ~/.config/autostart/StartGpg.desktop`),
  **pas** `dex -a` → i3 ne lance pas picom.
- **XFCE** a son **propre** compositeur (`xfwm4.xml: use_compositing = true`) → pas besoin de picom.

→ **Conséquence pour la convention global/local** : picom est **de fait local à bspwm**. Sa config suit
la **convention « un sous-dossier par outil »** déjà en place (`~/.config/bspwm/{scripts,themes,sxhkd,
tabbed,bspwm-tabs}/`) et identique à JAGL (`bspwm-setup/bspwm/picom/picom.conf`) → **`~/.config/bspwm/
picom/picom.conf`** (pas en flat `~/.config/bspwm/picom.conf`, ni `~/.config/picom.conf` que titux refuse
comme « pollution »). picom ne lisant pas ce chemin tout seul, le câblage propre (**« option B »**, à
valider) est : lancer picom **depuis `bspwmrc`** en idempotent (`pkill -x picom` + wait + `picom -b
--config ~/.config/bspwm/picom/picom.conf`) **et neutraliser** l'autostart système
(`~/.config/autostart/picom.desktop` avec `Hidden=true`) pour éviter le double-lancement. Contenu cible =
**adapter** le `picom.conf` de JAGL (`corner-radius`, shadow, fading) en **conservant** le comportement
actuel que titux aime (notamment le **fading** inter-bureaux). **Backend = `glx`** (et non `xrender`) :
vérifié le 30/05, `xrender` rend les coins **carrés** ; seul `glx` (OpenGL GL 3.1, OK sur HD 3000) applique
`corner-radius`. **FAIT (30/05)** : picom local câblé (config glx + lancement idempotent dans `bspwmrc` +
masque autostart `Hidden=true`) — **validé par titux** (coins arrondis + fondu + fluide).

→ Alimente la **tâche 7.2** (ADR 0007 / annexe A : picom rouvert/adopté) et la future tâche de câblage.

## 6. scratchpad : ce n'est PAS un terminal flottant, c'est un système à 3 fonctions

**Correction d'un sous-dimensionnement** (le plan 6.3 et le §4 ci-dessus ne décrivaient qu'un terminal
escamotable). Le transcript vidéo JAGL (`bspm-video-transscript.txt`, section « Scratchpads ») et les
scripts de référence (`~/GIT/bspwm-setup/bspwm/scripts/{scratchpad,scratchpad-promote}`) montrent **trois**
fonctions distinctes : [officiel = transcript/scripts JAGL]

1. **Terminal scratchpad** — toggle d'un terminal escamotable (script `scratchpad`, `st` classe dédiée,
   `bspc node -g hidden`). *La version « basique ».*
2. **Promotion de n'importe quelle fenêtre** — ranger la fenêtre focus (Firefox, pavucontrol, n'importe
   quoi) dans un **slot** numéroté, la rappeler, la **relâcher** (script `scratchpad-promote`, slots
   persistés dans `~/.cache/bspwm/scratchpads/<slot>`, actions `add/toggle/release/auto`).
3. **Slots nommés** — idem (2) mais avec des noms parlants (JAGL : audio, notes).

→ **À cadrer en BRAINSTORM**, pas à coder dans ce plan : titux **découvre** bspwm et ne connaît pas
encore ses vrais usages (quelles apps il voudrait en scratchpad). Décision : **scratchpad gelé** jusqu'au
brainstorm ; idéalement après avoir vécu un peu avec bspwm. Le plan 6.2/6.3 sera **re-cadré** en
conséquence. (st reste « suspendu au scratchpad » — son sort suit ce brainstorm.)

**Précision fr-mac à intégrer dès la conception des binds** (PAS « éviter la rangée des chiffres » — on
binde dessus tout le temps) : sur fr-mac la rangée du haut donne les **symboles au repos**
(`& é " ' ( § è ! ç à ) -`) et les **chiffres au niveau Shift** (`1 2 3 …`). Il faut donc **prendre le bon
keysym** : les bureaux le font déjà — *aller* = `super + {ampersand,eacute,…}` (keysyms-symboles, au
repos), *envoyer* = `super + shift + {1-9,0}` (le Shift produit le chiffre). Écueil concret : écrire
`super + alt + 1` n'est PAS un chord simple — pour produire `1` il faut Shift, donc ça revient à
`super + alt + shift + ampersand`. Pour des slots sur la rangée, choisir explicitement : soit le
**keysym-symbole** au repos (`super + alt + ampersand`), soit assumer le Shift. Voir mémoire
`[[fr-mac-binds-chiffres-niveau-shift]]`.

## Related
- Plan : `docs/plans/2026-05-27-feat-bspwm-polish-jagl-plan.md` (Phase 6 = ces essais, Phase 7 = doc)
- Finding précédent : `docs/findings/2026-05-26-bspwm-polybar-sxhkd.md` (bug clavier boot, tray, %index%)
- ADR 0007 (outils terminal HD3000) — **picom adopté inscrit** (truth-up 30/05) ; annexe A reste à faire (tâche 7.2)
- Référence externe : `bspwm-video-transscript.txt` (section Scratchpads, §6) ;
  `~/GIT/bspwm-setup/bspwm/scripts/{scratchpad,scratchpad-promote}`
- Mémoire : `[[polybar-x-session-restart]]`, `[[mbp-fkeys-need-fn]]`,
  `[[fr-mac-binds-chiffres-niveau-shift]]`
