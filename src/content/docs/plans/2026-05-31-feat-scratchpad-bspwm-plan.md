---
title: "feat: scratchpad bspwm (adoption JAGL, famille super+alt)"
type: plan
date: 2026-05-31
status: complete
brainstorm: docs/brainstorms/2026-05-31-scratchpad-bspwm-brainstorm.md
confidence: high
---


> Installer le scratchpad JAGL (3 mécanismes) sur le MBP, toute la famille sous `super + alt`,
> terminal = st (essai réversible), + un helper dédié — pour **ancrer l'usage de l'outil**, pas pour
> sur-concevoir.

## Problem Statement

bspwm n'a pas de scratchpad natif. titux veut **ancrer par la répétition les binds des *outils* du
WM** (le trou de ses 10 ans sur i3 : jamais mémorisé le mécanisme scratchpad/tabs, alors que sa
mémoire spatiale app→bureau est solide). Sans scratchpad, pas d'habitude à prendre ; et un portage
naïf de JAGL casserait sur le clavier fr-mac et sur une collision de bind existante.

## Target End State

Sous bspwm (et **seulement** bspwm — i3/XFCE intacts), titux dispose de :

- un **terminal escamotable** (st, classe `scratchpad`) qui se montre/cache et revient à sa place ;
- **3 slots numérotés** pour ranger/rappeler/relâcher n'importe quelle fenêtre focus ;
- **2 slots nommés** (`audio`, `notes`) ;
- un **helper dédié** listant ces raccourcis, référencé depuis le `help` principal ;

le tout sous une **grammaire unique `super + alt`**, fr-mac-correcte, rechargeable sans casser les
autres raccourcis.

## Scope and Non-Goals

**Dans le périmètre :** copier/adapter les 2 scripts JAGL, créer `scratchpad-help`, ajouter la règle
`bspc rule` dans `bspwmrc`, ajouter les binds `super+alt+*` dans `sxhkdrc-bspwm`, référencer le helper
depuis `help`, appliquer via le reload validé, tester en live (dont le keysym release fr-mac).

**Hors périmètre (gelé, cf. brainstorm) :** épinglage dédié `bspc rule … desktop=`, nvim-par-projet,
profils/`--class` navigateurs, mail en scratchpad. **Ne pas toucher** au `sxhkdrc` commun
(`super+Return`, `super+b/n/t`, `super+shift+Return`=PCManFM — partagés i3/XFCE). **Ne pas changer**
`super+b` (btop) : le terminal scratchpad reste un shell jetable nu (btop se lance dedans à la main si
besoin — câblage dédié = optionnel futur).

## Proposed Solution

Réutiliser tel quel le code JAGL (`scratchpad`, `scratchpad-promote` — bash, `bspc`/`xdotool`/
`notify-send`, déjà présents) ; **seules les touches sont adaptées**. La famille `super + alt` est
**entièrement libre** dans `sxhkdrc-bspwm` (vérifié) → aucune collision.

**Binds cibles** (dans `sxhkdrc-bspwm`) :

```
# Terminal escamotable (st, classe scratchpad) — super+shift+Return est pris (PCManFM, commun)
super + alt + Return
    ~/.config/bspwm/scripts/scratchpad

# Slots 1/2/3 : ranger la fenêtre focus si vide, sinon montrer/cacher
# fr-mac : symboles AU REPOS (calque les desktops l.16) → ampersand/eacute/quotedbl = touches 1/2/3
super + alt + {ampersand,eacute,quotedbl}
    ~/.config/bspwm/scripts/scratchpad-promote auto {1,2,3}

# Release slot 1/2/3 : shift → chiffres (calque l'envoi-au-desktop l.20) → pas de collision
super + alt + shift + {1,2,3}
    ~/.config/bspwm/scripts/scratchpad-promote release {1,2,3}

# Slots nommés
super + alt + a
    ~/.config/bspwm/scripts/scratchpad-promote auto audio
super + alt + n
    ~/.config/bspwm/scripts/scratchpad-promote auto notes

# Helper dédié scratchpad
super + alt + i
    ~/.config/bspwm/scripts/scratchpad-help
```

sxhkd apparie positionnellement `{ampersand,eacute,quotedbl}` → `{1,2,3}` (ampersand=slot 1, etc.).

**Règle** (dans `bspwmrc`, section l.33-36, style titux) :
```
bspc rule -a scratchpad state=floating
```
*(JAGL ajoute `layer=normal` + parfois `center=true` — optionnel, non retenu pour rester aligné sur
tes règles existantes ; à ajouter en finition si le terminal s'ouvre mal placé.)*

**Scripts** : `scratchpad` (st classe `scratchpad`) et `scratchpad-promote` copiés depuis
`~/GIT/bspwm-setup/bspwm/scripts/` vers `~/.config/bspwm/scripts/`, `chmod +x`. `scratchpad-help`
créé sur le modèle de `help` (rofi -dmenu, lecture seule).

## Implementation Tasks

- [x] **T1.** Copier `~/GIT/bspwm-setup/bspwm/scripts/scratchpad` → `~/.config/bspwm/scripts/scratchpad` ; vérifier qu'il lance bien `st -c scratchpad` ; `chmod +x`.
- [x] **T2.** Copier `~/GIT/bspwm-setup/bspwm/scripts/scratchpad-promote` → `~/.config/bspwm/scripts/scratchpad-promote` (aucune adaptation interne) ; `chmod +x`.
- [x] **T3.** Créer `~/.config/bspwm/scripts/scratchpad-help` (miroir de `help` : rofi -dmenu, liste des binds `super+alt+*` ci-dessus) ; `chmod +x`.
- [x] **T4.** Ajouter `bspc rule -a scratchpad state=floating` dans `~/.config/bspwm/bspwmrc` (à la suite des règles l.33-36). *(dépend de rien ; indépendant de T1-T3)*
- [x] **T5.** Ajouter le bloc de binds `super+alt+*` (cf. *Proposed Solution*) dans `~/.config/bspwm/sxhkd/sxhkdrc-bspwm`. *(dépend de T1-T3 : les scripts doivent exister)*
- [x] **T6.** Référencer le helper depuis `~/.config/bspwm/scripts/help` (ligne `Super + Alt + i  Aide scratchpad (dédiée)`, section Système ; option : ajouter une section « Scratchpad » résumant les binds).
- [x] **T7.** Appliquer **sans casser** : règles `bspc rule` appliquées à chaud + reload `super+shift+r`. **NE JAMAIS relancer sxhkd à la main** (doublons « already grabbed », cf. `[[polybar-x-session-restart]]`).
- [x] **T8.** Test live OK : slots `& é " ' (` (1..5), release `super+alt+shift+1..5` répond correctement (keysym fr-mac OK, pas de repli nécessaire).
- [x] **T9.** Essai st **validé** : terminal st conservé (classe `scratchpad`, `-g 120x34`). Pas de bascule alacritty.

### Écarts vs plan initial (implémentés et testés en live le 31/05)

- **Terminal « jetable » suit le bureau courant** : script `scratchpad` réécrit (4 cas : lance / cachée→montre ici / visible ici→cache / visible ailleurs→ramène ici) au lieu du simple `-g hidden` JAGL qui ramenait sur le bureau d'origine. **Piège rencontré** : l'ancien script JAGL `st -c "$CLASS" -e "$CMD"` produisait un st-dans-st (double terminal) — corrigé en `"$@" &`.
- **5 slots** numérotés au lieu de 3 (`& é " ' (`).
- **Slots « nommés » → vrais dropdowns d'app** (la vraie demande de titux) : `super+alt+a` = pavucontrol, `super+alt+u` = pamac `--updates`, `super+alt+b` = btop (alacritty classe `scratch-btop`). Taille fixe + centrage via `bspc rule … rectangle=` (les apps GTK n'acceptent pas `-g`). **Piège** : classe WM réelle de pavucontrol = `pavucontrol` (minuscule), pas `Pavucontrol`.
- **`super+alt+n` = butternotes** (outil **rofi** JustAGuyLinux, `~/.local/bin/butternotes`, lance & ferme) → simple lancement, **pas** un scratchpad.
- **Help non dupliqué** : le `help` principal ne fait que **pointer** vers l'aide dédiée (1 ligne) ; tout le détail vit dans `scratchpad-help`.
- **NOUVEAU — `winswitch` (`super+Tab`)** : sélecteur rofi listant TOUTES les fenêtres (visibles **et** réduites/cachées), Entrée = rappeler ici, Alt+k = fermer. Résout le « bureau fantôme » (une fenêtre cachée garde le bureau allumé sans rien afficher).

## Acceptance Criteria

- `super + alt + Return` ouvre un st flottant classe `scratchpad` ; re-appui le cache ; re-appui le ramène **à sa place**.
- `super + alt + &` range la fenêtre focus en slot 1 (notif « slot 1: stored », fenêtre floating+hidden) ; re-appui la rappelle ; idem `é`/`"` pour 2/3.
- `super + alt + shift + 1` relâche le slot 1 (fenêtre reste visible, slot oublié) — **sans** déclencher l'action « ranger ».
- `super + alt + a` / `super + alt + n` rangent/rappellent les slots nommés `audio`/`notes`.
- `super + alt + i` affiche le cheatsheet scratchpad ; `help` (`super+shift+i`) le référence.
- Après `super+shift+r`, **les autres raccourcis fonctionnent toujours** (sxhkd vivant, pas de « already grabbed »).
- Sous **i3/XFCE**, aucun de ces binds n'existe (présents uniquement dans `sxhkdrc-bspwm`).

## Decision Rationale

- **Réutiliser le code JAGL tel quel** (vs réécrire) : éprouvé, deps présentes, et l'objectif est
  l'**habitude**, pas l'ingénierie. Seules les touches divergent.
- **Famille `super + alt`** (vs binds JAGL d'origine) : règle d'un coup la collision PCManFM
  (`super+shift+Return`, commun) et le piège fr-mac des chiffres ; « un modificateur = un outil » sert
  la mémorisation (le vrai problème). Espace `super+alt` libre → zéro collision.
- **Slots = symboles au repos + release au shift-chiffre** : copie le patron **déjà fonctionnel** des
  desktops (l.16/20) → confiance haute, pas un pari.
- **st en essai** (vs alacritty d'emblée) : « essayer pour de vrai » ; bascule réversible 1 ligne.
- **Binds dans `sxhkdrc-bspwm`** (vs commun) : isole bspwm, i3/XFCE intacts.

## Constraints and Boundaries

- Ne pas éditer `~/.config/sxhkd/sxhkdrc` (commun, cross-WM).
- Ne pas relancer sxhkd manuellement → uniquement `super+shift+r` (USR1, reload validé). `[[polybar-x-session-restart]]`
- Respecter le « style titux » des scripts (header commenté, camelCase) pour `scratchpad-help`.
- fr-mac : binder le bon keysym (jamais une touche Fn). `[[fr-mac-binds-chiffres-niveau-shift]]`, `[[mbp-fkeys-need-fn]]`

## Assumptions

| Hypothèse | Statut | Évidence |
|---|---|---|
| `xdotool`/`notify-send`/`bspc` présents | Vérifié | check 31/05 |
| Espace `super + alt` libre dans `sxhkdrc-bspwm` | Vérifié | grep 31/05 (aucune occurrence) |
| Slots fr-mac = symboles au repos fonctionnent | Vérifié (par précédent) | desktops l.16 (mêmes keysyms, marchent) |
| Release `super+alt+shift+{1,2,3}` répond correctement | À vérifier en live (T8) | calque l.20, risque faible |
| `scratchpad-promote` tourne tel quel sur ce bspwm | Présumé | bash + bspc/xdotool standard, deps OK |
| Reload `super+shift+r` est sûr (ne tue pas sxhkd) | Vérifié | script `reload` + commentaire sxhkdrc l.31 |
| st acceptable comme terminal scratchpad | Non vérifié (essai voulu) | décision titux, bascule réversible |

## Risk Analysis

- **Lockout sxhkd** (bind fautif) : faible — une ligne sxhkd cassée fait perdre **ce** raccourci, sxhkd
  survit (finding §2/§3). Mitigation : reload validé `super+shift+r` ; filet TTY `Ctrl+Alt+Fn+F2`.
- **bspwmrc cassé avant le lancement sxhkd** (vrai lockout, finding §3) : la règle T4 est une ligne
  `bspc rule` simple en zone règles (avant l'autostart, loin du lancement sxhkd) ; un `bspc rule`
  malformé renvoie une erreur mais n'interrompt pas le script. Mitigation : tester la ligne à la main
  (`bspc rule -a scratchpad state=floating`) **avant** de compter dessus au prochain boot.
- **Keysym release fr-mac** : si `super+alt+shift+1` ne matche pas, repli sur
  `super+alt+shift+{ampersand,eacute,quotedbl}` — résolu en T8.
- **st désagréable** : bascule alacritty (T9), réversible.
- **Doublons sxhkd** si relance manuelle → interdit (contrainte ci-dessus).

## References

- Brainstorm : `docs/brainstorms/2026-05-31-scratchpad-bspwm-brainstorm.md`
- Finding : `docs/findings/2026-05-30-bspwm-reload-et-verdicts-phase6.md` (§4 verdict scratchpad, §6 re-cadrage, §1-§3 reload/lockout)
- Plan parent : `docs/plans/2026-05-27-feat-bspwm-polish-jagl-plan.md` (scratchpad = ex-tâches 6.2/6.3, re-cadrées)
- Code source JAGL : `~/GIT/bspwm-setup/bspwm/scripts/{scratchpad,scratchpad-promote}`, `bspwmrc` l.21
- Config cible : `~/.config/bspwm/{bspwmrc, sxhkd/sxhkdrc-bspwm, scripts/help}`
- Mémoires : `[[fr-mac-binds-chiffres-niveau-shift]]`, `[[polybar-x-session-restart]]`, `[[titux-choices-revisitable]]`, `[[mbp-fkeys-need-fn]]`
