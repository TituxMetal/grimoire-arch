---
title: "fix: reload bspwm config-only (piste A) + restart sûr avec save/restore fullscreen (piste B)"
type: plan
date: 2026-05-31
status: done
brainstorm: docs/findings/2026-05-31-bspwm-fullscreen-perdu-au-reload.md
confidence: high
status_note: >-
  CLÔTURÉ 01/06 — mais PRÉMISSE FAUSSE. Le bug « faux plein écran » n'était ni une perte d'état ni le
  marteau bspc wm -r : c'était un problème d'EMPILEMENT de polybar (dock _NET_WM_STATE_ABOVE sans
  wm-restack), corrigé par UNE ligne `wm-restack = bspwm` côté polybar (vérifié en live : plusieurs
  cycles plein écran/tuilé + reload + theme switch). Voir docs/solutions/bspwm/polybar-fullscreen-wm-restack.md
  et le finding 2026-05-31 (sections « Corrections »). Le refactor de ce plan (config-only + fragment +
  --restart + thememenu reuse) est CONSERVÉ comme amélioration ergonomique (pas de respawn-flash),
  nettoyé du save/restore fullscreen devenu inutile. Leçon : mesurer la fenêtre X RÉELLE (xwininfo), pas
  le rectangle interne bspwm (bspc query) — deux diagnostics faux ont découlé de cette confusion.
---


**En une ligne :** transformer le reload courant (`super + shift + r`) en un rechargement
**config-only** qui ne touche plus à l'état des fenêtres (corrige la retombée du plein écran *et*
supprime la moitié des effets de bord), garder un chemin **`--restart`** explicite pour les rares
changements structurels — avec **sauvegarde/restauration du plein écran** greffée dessus — et
**rebrancher thememenu** sur le reload config-only.

## Problem Statement

`bspc wm -r` (« restart », bspwm 0.9.12) ré-exécute tout `bspwmrc` et **ne réapplique pas l'état
`fullscreen`** des nœuds : une fenêtre plein écran qui *traverse* un reload retombe en `tiled`. Avec
`single_monocle` + `gapless_monocle` + le strut polybar (padding top=34), la régression est **déguisée**
en quasi-plein-écran (la fenêtre remplit l'écran sauf les 34 px de la barre + une bordure 2 px), donc
peu visible mais bien réelle. Détail complet : `docs/findings/2026-05-31-bspwm-fullscreen-perdu-au-reload.md`.

Deux constats issus de la lecture de la config (31/05) :

1. **Deux appelants de `bspc wm -r`**, pas un seul :
   - la chaîne `super + shift + r` → `reload-wm` → `~/.config/bspwm/scripts/reload` (mode par défaut) ;
   - **`thememenu`** qui, à chaque bascule de thème, fait `cp colors.sh` puis **`bspc wm -r` en direct**
     (`scripts/thememenu:130`). C'est probablement le déclencheur le plus *fréquent* du bug en usage réel.
2. **Le reload utilise un marteau** (`bspc wm -r`, qui ré-exécute *tout* `bspwmrc`) là où le besoin
   courant — bascule de thème, ajustement de gaps/couleurs — n'est qu'un rafraîchissement de
   `bspc config` (idempotent). Tous les effets de bord connus (retombée fullscreen, respawn
   picom/polybar, valse de la sentinelle dex) découlent de ce marteau.

## Target End State

- `super + shift + r` recharge la config **sans `bspc wm -r`** : couleurs/bordures (`colors.sh`) et
  réglages `bspc config` rejoués à chaud ; **aucune fenêtre ne perd son état** (plein écran, et a
  fortiori flottant/sticky/monocle) ; picom/polybar/sxhkd **ne sont pas respawnés**.
- Une bascule de thème (`thememenu`) ne fait **plus** retomber le plein écran.
- Un chemin **`--restart` explicite** reste disponible pour les changements *structurels* (règles,
  monitor, autostart) ; sur ce chemin, l'état **plein écran est sauvegardé puis restauré** autour du
  `bspc wm -r` (et flottant/sticky si l'enquête T6 montre qu'ils sont aussi perdus).
- La validation `validate-before-apply` (anti-lockout) reste en place sur les deux chemins.
- `docs/solutions/bspwm/reload-sur.md` et `guide/11` reflètent la nouvelle architecture et ne décrivent
  plus le reload comme « sûr » en passant l'effet de bord sous silence.

## Scope and Non-Goals

**Dans le périmètre :**

- Refonte du mode par défaut de `~/.config/bspwm/scripts/reload` en config-only (piste A).
- Ajout d'un mode `--restart` à ce même script, avec save/restore du plein écran (piste B).
- Extraction du bloc `bspc config` idempotent de `bspwmrc` vers un fragment sourçable partagé (DRY).
- Rebranchement de `thememenu` sur le reload config-only.
- Mise à jour de la solution `reload-sur.md`, du `guide/11` et de la leçon devbox.

**Hors périmètre (non-goals) :**

- Toucher à l'aiguilleur `~/.config/scripts/reload-wm` (le bind reste `super + shift + r` ; seul le
  comportement *sous bspwm* change, via le script délégué).
- Toucher au comportement reload sous **i3 / XFCE** (`pkill -USR1 -x sxhkd`, inchangé).
- Réécrire le mécanisme de validation, la sentinelle dex ou l'idempotence picom/polybar — déjà traités
  par `docs/solutions/bspwm/reload-sur.md`, on s'appuie dessus.
- Ajouter un nouveau raccourci par défaut pour `--restart` (manuel depuis un terminal suffit ; un bind
  optionnel est noté mais pas imposé).

## Proposed Solution

Architecture en **deux chemins** dans `~/.config/bspwm/scripts/reload`, derrière la même validation :

```
super + shift + r ──► reload-wm ──► reload          (défaut = CONFIG-ONLY, piste A)
                                       │  validateConfig
                                       │  re-source le fragment config + colors.sh
                                       └► (jamais bspc wm -r)

reload --restart ──────────────────► reload --restart (RESTART SÛR, piste B)
                                       │  validateConfig
                                       │  mémorise les nœuds .fullscreen (+ sticky/floating si T6)
                                       │  bspc wm -r
                                       └► ré-applique fullscreen sur les nœuds mémorisés

thememenu ─────────────────────────► reload          (config-only : le thème ne change que les couleurs)
```

**Clé de la piste A — DRY.** Le bloc des `bspc config *` idempotents + `. colors.sh` est extrait de
`bspwmrc` vers un fragment sourçable (ex. `~/.config/bspwm/config.bspwm.sh`, fonction `applyConfig`).
`bspwmrc` le source au démarrage ; le reload config-only le source aussi. **Une seule source de vérité**
pour les réglages, pas de duplication.

Ce qui **reste dans `bspwmrc`** (non idempotent / structurel, hors fragment) : `bspc monitor -d …`
(noms de bureaux), les `bspc rule -a …` (s'**empilent** si rejoués — piège), et tout l'autostart
(setxkbmap/sxhkd/picom/polybar/dex). → ces changements-là passent par `--restart`.

## Decision Rationale

**Pourquoi l'hybride A+B plutôt que A ou B seul** (décision titux, 31/05) :

- **A seul** corrige le bug du cas courant et supprime la moitié des effets de bord, mais ne reprend
  pas les changements structurels de `bspwmrc` (règles, monitor) — il faudrait relancer un restart à
  la main, *et ce restart resterait non sûr* (perte fullscreen).
- **B seul** est la greffe minimale mais conserve **tous** les autres effets de bord (respawn
  picom/polybar à chaque reload, valse dex) puisqu'on garde `bspc wm -r` partout.
- **A+B** prend le meilleur des deux : le cas fréquent (thème, gaps, couleurs) devient sans effet de
  bord (A), et le cas rare (structurel) garde un chemin explicite **rendu sûr** par la save/restore
  (B). C'est exactement la sortie esquissée par le finding (« garder un chemin restart explicite si
  besoin »).

**Pourquoi extraire un fragment** plutôt que dupliquer les `bspc config` dans le script reload :
éviter la dérive (un réglage changé à un endroit et pas l'autre). Coût marginal, gain de robustesse.

**Pourquoi ne pas rejouer les `bspc rule` en config-only :** `bspc rule -a` **append** sans dédup →
rejouer empilerait des règles fantômes. Les règles changent rarement → elles vivent côté `--restart`
(ou un `bspc rule -r` explicite si jamais besoin, hors périmètre ici).

## Constraints and Boundaries

- **Style titux (non négociable) :** header en commentaire, `printMessage` + `tput`, **camelCase**,
  dispatch par `case` dans `main`, early-return `&&`/`||`. Le script `reload` actuel est déjà conforme :
  rester dans ce moule, étendre sans casser le style.
- **Anti-lockout (dur) :** ne **jamais** relancer sxhkd à la main ni l'inclure dans le chemin
  config-only (doublons « already grabbed » = lockout). Cf. `[[polybar-x-session-restart]]`. Le
  config-only ne touche pas à sxhkd ; thememenu non plus.
- **Validation préservée :** `validateConfig` (bash -n + heuristiques) tourne **avant** d'appliquer,
  sur les deux chemins — un bloc invalide refuse le reload, session intacte.
- **Organisation par portée (ADR 0013) :** le script `reload` est spécifique bspwm →
  `~/.config/bspwm/scripts/reload` (inchangé). L'aiguilleur commun reste `~/.config/scripts/reload-wm`.
- **Réversible derrière snapshot :** un `timeshift` (ou simple copie des 3 fichiers touchés) avant
  d'implémenter — on modifie le chemin chaud de la session.

## Assumptions

| Hypothèse | Statut | Évidence |
|---|---|---|
| Les `bspc config *` (border/gap/monocle/focus/split) sont idempotents à chaud | Vérifié | Sémantique `bspc config` = set d'une valeur ; relecture `bspwmrc:14-30` |
| `. colors.sh` rejoué met à jour les bordures sans `bspc wm -r` | Vérifié | `colors.sh` = uniquement des `bspc config *_border_color` (idempotents) |
| `bspc rule -a` empile les règles si rejoué | Vérifié | Comportement documenté bspc ; d'où l'exclusion du fragment |
| `thememenu` ne dépend de `bspc wm -r` que pour les bordures/fond | À vérifier (T7) | `thememenu:97-130` : polybar/rofi/dunst/gtk gérés séparément ; seul le bloc bspwm passe par le restart |
| `bspc wm -r` perd AUSSI l'état flottant/sticky (pas que fullscreen) | À vérifier (T6) | Hypothèse du finding « Prevention » — non testée ; conditionne l'étendue de la save/restore B |
| Restaurer via `bspc node <id> -t fullscreen` après restart est fiable | À vérifier (T5) | IDs de nœuds stables au travers d'un `bspc wm -r` à confirmer empiriquement |

Les deux hypothèses « À vérifier » qui touchent le comportement de bspwm (T5/T6) sont des **tâches
d'investigation** dans le plan, pas des paris : si les IDs ne survivent pas au restart, on bascule la
restauration B sur un autre critère (classe de fenêtre / dernière focalisée).

## Implementation Tasks

> Ordre = dépendances. Tester après chaque phase **avec une fenêtre en plein écran ouverte** (pas à vide).

### Phase 1 — Extraire le fragment config idempotent (DRY)

- [x] **T1** Créer `~/.config/bspwm/config.bspwm.sh` (style titux, header + fonction `applyConfig`)
  contenant **uniquement** : les `bspc config border_width/window_gap/split_ratio/borderless_monocle/
  gapless_monocle/single_monocle/click_to_focus/focus_follows_pointer/pointer_follows_monitor` + le
  `. "$HOME/.config/bspwm/colors.sh"`. Idempotent, sourçable hors session.
- [x] **T2** *(code fait ; ⏳ reste à vérifier au reboot que la session démarre identique)* Dans `bspwmrc`, remplacer le bloc inline « Apparence + Comportement » par un
  `. "$HOME/.config/bspwm/config.bspwm.sh"; applyConfig`. Laisser `bspc monitor -d`, les `bspc rule`
  et l'autostart **en place** (structurels). Vérifier au reboot que la session démarre identique.

### Phase 2 — Reload config-only par défaut (piste A)

- [x] **T3** Modifier `reloadAll()` (mode par défaut) dans `~/.config/bspwm/scripts/reload` : après
  `validateConfig` OK, **sourcer le fragment + `applyConfig`** au lieu de `bspc wm -r`. Conserver la
  notif dunst « Config rechargée ✓ » et `printMessage`.
- [x] **T4** ✅ *validé live 01/06 (mais via `wm-restack`, pas via le config-only)* — `super + shift + r`
  garde le plein écran VRAI (barre derrière) après plusieurs cycles + theme switch. Le vrai levier était
  `wm-restack = bspwm` côté polybar, pas le config-only.

### Phase 3 — Restart sûr explicite (piste B)

- [x] **T5** *(mode `--restart` ajouté ; save/restore RETIRÉ après T6 — bspc wm -r préserve déjà le plein écran)* Ajouter un mode `--restart` (`case` dans `main` + `printUsage`) : `validateConfig` → mémoriser
  `bspc query -N -n .fullscreen` → `bspc wm -r` → ré-appliquer `bspc node <id> -t fullscreen` sur chaque
  nœud mémorisé. **Vérifier la survie des IDs** au travers du restart ; sinon basculer sur un critère
  alternatif (dernière fenêtre focalisée / classe).
- [x] **T6** ✅ *tranché live 01/06* — `bspc wm -r` **préserve** l'état plein écran des fenêtres normales
  (Alacritty : reste `fullscreen 0,0,1280,800`). Seules les fenêtres avec une `bspc rule` (pamac →
  `state=floating`) sont re-réglées par leur règle au restart (comportement voulu). → **pas de
  save/restore** à faire ; il a été retiré de `--restart`. Investigation initiale `[retex]` : poser une fenêtre **flottante** + une **sticky** + une **fullscreen**,
  lancer `reload --restart`, observer ce qui est perdu. Si flottant/sticky tombent aussi → étendre la
  save/restore (`bspc query` sur `.floating`/`.sticky` + ré-application). Documenter le résultat.
- [x] **T7** *(pas de bind, conforme au plan ; noté dans la cheatsheet `help`)* (optionnel, à décider après usage) bind dédié `--restart` ; par défaut **pas de bind**,
  appel manuel `~/.config/bspwm/scripts/reload --restart` depuis un terminal pour les changements
  structurels. Le noter dans `help` / cheatsheet.

### Phase 4 — Rebrancher thememenu

- [x] **T8** *(code fait — config-only + relance polybar ajoutée ; ⏳ contrôle visuel live)* Dans `~/.config/bspwm/scripts/thememenu`, remplacer le `bspc wm -r` (≈ ligne 130) par un
  appel au reload config-only (`~/.config/bspwm/scripts/reload`). Vérifier que bordures + fond uni se
  mettent bien à jour **sans** retombée du plein écran. Adapter le commentaire ligne 97-98 (qui dit
  « re-sourcé par bspwmrc au bspc wm -r »).

### Phase 5 — Propagation (figer le savoir)

- [x] **T9** Mettre à jour `docs/solutions/bspwm/reload-sur.md` : ajouter l'effet de bord fullscreen et
  la nouvelle architecture (config-only par défaut / `--restart` sûr) ; ne plus présenter le reload
  comme « sûr » sans cette nuance.
- [x] **T10** Mettre à jour `docs/guide/11-wm-bspwm-polybar.md` (§ « Reload sûr » + § `single_monocle` :
  expliquer pourquoi le faux plein écran était trompeur) et marquer le finding comme RÉSOLU.
- [x] **T11** Ajouter la **leçon devbox** : préférer d'emblée le reload config-only ; tout `bspc wm -r`
  est destructeur d'état runtime → save/restore obligatoire sur le chemin restart.

## Acceptance Criteria

- [ ] Après `super + shift + r` avec une fenêtre en **plein écran** ouverte : `bspc query -T -d` montre
  toujours `state=fullscreen` (pas `tiled` + `lastState=fullscreen`) ; la barre reste cachée, pas de
  bordure ; aucune retombée visuelle.
- [ ] Après `super + shift + r` : `pgrep` montre que picom / polybar / sxhkd **n'ont pas changé de PID**
  (pas de respawn).
- [ ] Une bascule de thème via `thememenu` met à jour les couleurs **et** laisse le plein écran intact.
- [ ] `reload --restart` ré-applique le plein écran après le `bspc wm -r` (et flottant/sticky si T6 l'a
  montré nécessaire).
- [ ] Un bloc de config syntaxiquement invalide (`bspwmrc`, `colors.sh`, sxhkdrc, polybar) **refuse** le
  reload sur les deux chemins, avec notif dunst nommant le bloc fautif — session et sxhkd intacts.
- [ ] `reload --check` (dry-run) fonctionne toujours hors session.
- [ ] `reload-sur.md` et `guide/11` décrivent la nouvelle architecture ; le finding est marqué RÉSOLU.

## Risk Analysis

| Risque | Impact | Mitigation |
|---|---|---|
| Le fragment `config.bspwm.sh` mal extrait → réglages perdus au boot | bspwm démarre dégradé | T2 testé au reboot avant d'aller plus loin ; snapshot/copie préalable des fichiers |
| Les IDs de nœuds ne survivent pas à `bspc wm -r` → restauration B inopérante | `--restart` perd quand même le fullscreen | T5 vérifie explicitement ; fallback sur dernière focalisée / classe |
| Un appel récursif/erreur dans le reload tue la session | Lockout | Validation **avant** application (déjà en place) ; ne jamais toucher sxhkd dans le config-only |
| `thememenu` re-source bien colors.sh mais pas le fond uni | thème partiellement appliqué | T8 vérifie bordures **et** fond ; garder l'option de forcer un `applyConfig` après `cp colors.sh` |
| Régression sur i3/XFCE | reload cassé sur les autres WM | Hors périmètre : `reload-wm` route les non-bspwm vers `pkill -USR1 sxhkd`, non touché |

## References

- Finding (cause racine + pistes) : `docs/findings/2026-05-31-bspwm-fullscreen-perdu-au-reload.md`
- Solution reload sûr (validation, dex, idempotence picom/polybar) : `docs/solutions/bspwm/reload-sur.md`
- Finding mécanisme reload §1-§3 : `docs/findings/2026-05-30-bspwm-reload-et-verdicts-phase6.md`
- Config réelle : `~/.config/bspwm/bspwmrc`, `~/.config/bspwm/colors.sh`,
  `~/.config/bspwm/scripts/reload`, `~/.config/bspwm/scripts/thememenu`, `~/.config/scripts/reload-wm`
- Guide : `docs/guide/11-wm-bspwm-polybar.md` (§ Reload sûr, § single_monocle)
- ADR 0013 (organisation scripts par portée) : `docs/adr/0013-organisation-scripts-par-portee.md`
- Mémoire : `[[polybar-x-session-restart]]` (anti-lockout sxhkd)
