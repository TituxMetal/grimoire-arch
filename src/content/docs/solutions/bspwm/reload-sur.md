---
title: "Reload bspwm sûr (validate-before-apply) + dex idempotent + aiguilleur par WM"
type: solution
date: 2026-05-30
domain: bspwm
component: bspwmrc / sxhkd / scripts reload
symptoms:
  - "nm-applet / polkit-gnome / xss-lock / vpn s'empilent en doublon à chaque bspc wm -r"
  - "erreur shell dans bspwmrc → sxhkd tué et jamais relancé → tous les raccourcis muets (lockout)"
  - "deux reload coexistent (super+shift+r sxhkd à chaud / super+shift+c bspc wm -r)"
  - "un raccourci dupliqué dans le fichier bspwm est ignoré (sxhkd : premier chargé gagne)"
  - "après un relog, autostart absent (nm-applet/pamac/vpn) alors que dex devrait tourner — sentinelle survivante"
root_cause: "bspwm applique le reload à l'aveugle (pas de validate-before-apply comme i3) et bspwmrc relance dex sans dédup à chaque ré-exécution"
severity: high
related:
  - docs/findings/2026-05-30-bspwm-reload-et-verdicts-phase6.md
  - docs/findings/2026-05-31-bspwm-fullscreen-perdu-au-reload.md
  - docs/plans/2026-05-30-feat-bspwm-reload-sur-plan.md
  - docs/plans/2026-05-31-fix-bspwm-fullscreen-reload-plan.md
---


> **Statut : implémenté et validé en live** (titux, 30/05). Destiné à être rejoué sur la **devbox**.
>
> **Màj 2026-06-01** — le reload par défaut n'est plus un `bspc wm -r` mais un rechargement
> **config-only** (re-source du fragment idempotent, sans respawn picom/polybar/sxhkd) ; `bspc wm -r` est
> relégué à un mode `--restart` explicite pour le structurel. C'est une **amélioration ergonomique**, PAS
> le fix du « faux plein écran » (qui était un problème d'empilement polybar — voir
> `docs/solutions/bspwm/polybar-fullscreen-wm-restack.md`). Détail en « § 5 » plus bas. Ce qui suit
> (§ 1-§ 4) reste valable pour le chemin `--restart`.

## Problème

Sous bspwm, le rechargement de la config est **dangereux** et **non idempotent** :

1. **Doublons d'autostart.** `bspc wm -r` ré-exécute `bspwmrc` depuis le début, donc relance
   `dex -a -e bspwm` **sans dédup** → nm-applet, polkit-gnome, xss-lock et `vpn --up` s'**empilent
   en doublon** à chaque reload.
2. **Vrai risque de lockout.** bspwm/sxhkd/polybar appliquent **à l'aveugle**. Une erreur shell dans
   `bspwmrc` (ou dans `colors.sh` qu'il source) **avant** le respawn de sxhkd interrompt le script :
   sxhkd a été tué juste avant mais n'est jamais relancé → **tous les raccourcis muets**. Pas de
   validate-before-apply comme i3.
3. **Deux reload concurrents.** `super+shift+r` (sxhkd à chaud, commun i3/XFCE/bspwm) et
   `super+shift+c` (`bspc wm -r`, bspwm) coexistaient — on en voulait **un seul** sous bspwm.

## Root Cause

- bspwm **n'a pas** de mécanisme « valider la nouvelle config, garder l'ancienne si cassée » comme i3.
- `bspwmrc` est ré-exécuté **intégralement** à chaque `bspc wm -r`, et la ligne `dex` n'était gardée
  par aucune sentinelle (contrairement à sxhkd/polybar qui sont déjà idempotents via `pkill + wait + respawn`).
- **Piège sxhkd à connaître** : un chord dupliqué (même combinaison dans deux fichiers chargés) est
  résolu **par ordre de parsing — premier chargé gagne** (vérifié dans la source : `add_hotkey`
  appende en queue, `find_hotkey` renvoie le 1er match). Donc dupliquer le bind dans le fichier bspwm
  serait **ombragé** par le commun → il faut un **aiguilleur**, pas un doublon de chord.

## Fix

Trois pièces (toutes dans `~/.config`, **pas** dans ce repo de trace) :

### 1. dex idempotent — sentinelle run-once dans `bspwmrc`

```bash
# Sentinelle dans $XDG_RUNTIME_DIR (tmpfs, vidé au logout → re-autostart à la session suivante).
autostartFlag="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/bspwm-autostart-done"
if [ ! -e "$autostartFlag" ]; then
  dex -a -e bspwm &
  touch "$autostartFlag"
fi
```

`dex` ne tourne qu'au **1er démarrage de la session**, plus à chaque `bspc wm -r`. Plus simple/robuste
qu'un `pgrep` par app. (Choix assumé : le flag est posé même si dex échoue → pas de retry intra-session.)

> ⚠️ **Correctif 30/05 — la sentinelle n'est PAS fiablement vidée au logout.** Le commentaire ci-dessus
> (« tmpfs, vidé au logout ») est **faux** quand plusieurs sessions titux se chevauchent : `logind` ne
> purge `/run/user/1000` que quand **la dernière** session de l'utilisateur se ferme. Avec un terminal
> ouvert (autre session pts/tty) ou un re-login rapide, la sentinelle **survit** → au login suivant
> `dex` est **sauté** → nm-applet / polkit-gnome / xss-lock / `vpn --up` **ne démarrent pas** (constaté :
> sentinelle de la session précédente retrouvée intacte après un relog, tout le lot dex absent).
>
> **Fix : effacer la sentinelle dans `~/.xprofile`** (qui ne tourne **qu'au login**, PAS au `bspc wm -r`) :
>
> ```sh
> rm -f "${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/bspwm-autostart-done"
> ```
>
> → autostart frais **garanti** à chaque login (indépendant de la purge du runtime dir), tout en gardant
> l'anti-doublon sur `bspc wm -r` (la sentinelle est reposée par `bspwmrc` au 1er run de la session).
> Validé par logout/login (icônes réseau + pamac revenues sans reboot).

### 2. Aiguilleur par WM — `~/.config/scripts/reload-wm`

Bindé sur `super+shift+r` dans le **sxhkdrc commun**. Détecte le WM et route :

```bash
if pgrep -x bspwm >/dev/null; then
  "$HOME/.config/bspwm/scripts/reload"   # bspwm → reload validé
else
  pkill -USR1 -x sxhkd                    # i3/XFCE → sxhkd à chaud (inchangé)
fi
```

Un seul `super+shift+r` dans le commun → **pas de doublon de chord** (donc pas d'ombrage ni de warning
`already grabbed`) et extension propre à i3/XFCE plus tard.

### 3. Validate-before-apply — `~/.config/bspwm/scripts/reload`

Valide **chaque bloc avant d'appliquer**. Si un bloc est invalide → **rien n'est appliqué** (session +
sxhkd intacts) + notif dunst nommant le bloc fautif. Notif dunst **dans les deux cas** (✓ / refusé).
Drapeau `--check` = dry-run hors session.

| Bloc | Validation | Si invalide |
|---|---|---|
| `bspwmrc` + `colors.sh` | `bash -n` (fiable) | **BLOQUE** (seul vrai risque de lockout) |
| `sxhkdrc` (commun + bspwm) | heuristique : lisible, non vide, ≥1 raccourci (`^[^[:space:]#]`) + ≥1 commande (`^[[:space:]]+\S`) | BLOQUE (cohérence ; sxhkd survivrait) |
| polybar `config.ini` | heuristique : lisible, non vide, section `^\[bar/.+\]` | BLOQUE |

Seulement si **tout** passe → on applique (config-only par défaut, ou `bspc wm -r` en `--restart`, § 5).

### 4. Suppression du `super+shift+c` dans `sxhkdrc-bspwm`

Le bloc `super+shift+c → bspc wm -r` est retiré (remplacé par une note de renvoi vers le reload commun).

### 5. Reload config-only par défaut + `--restart` (màj 2026-06-01) — *confort, pas un fix*

> **Ce n'est PAS le fix du « faux plein écran ».** Ce bug-là (barre qui repasse devant le plein écran
> après un reload) était un problème d'**empilement** de polybar, corrigé par **`wm-restack = bspwm`**
> côté polybar — voir `docs/solutions/bspwm/polybar-fullscreen-wm-restack.md`. Le reload config-only
> n'y est pour rien (le plein écran n'a jamais perdu son état). Cette section décrit juste une
> **amélioration ergonomique** du reload.

Le mode par défaut ne fait **plus** de `bspc wm -r` : il re-source le fragment idempotent partagé
(`config.bspwm.sh`, `applyConfig` = les `bspc config` + `colors.sh`) **à chaud**. Intérêt : **pas de
respawn-flash** de picom/polybar/sxhkd à chaque `super + shift + r`, et pas de valse dex. Le `bspc wm -r`
est relégué à `reload --restart` (appel manuel) pour les changements **structurels** (règles, monitor,
autostart) — ce restart **réapplique les `bspc rule`** (ex. pamac → flottant), comportement voulu.
`thememenu` passe par le config-only (+ relance polybar pour ses couleurs). Source unique des réglages :
`config.bspwm.sh`, sourcé par `bspwmrc` **et** par `reload`.

> Note : `bspc wm -r` **préserve** l'état plein écran des fenêtres normales (vérifié 01/06) ; aucune
> sauvegarde/restauration n'est nécessaire sur le chemin `--restart`. C'est un **effet de bord du marteau** : `bspc wm -r` ré-exécute
*tout* `bspwmrc` là où le besoin courant (thème, gaps, couleurs) n'est qu'un rafraîchissement de
`bspc config` idempotent. D'où la refonte en deux chemins, derrière la **même** validation (§ 3) :

```
super + shift + r ─► reload-wm ─► reload            (défaut = CONFIG-ONLY)
                                    │ validateConfig
                                    │ . config.bspwm.sh ; applyConfig   (bspc config + colors.sh)
                                    └► JAMAIS bspc wm -r → aucun état de fenêtre touché,
                                       pas de respawn picom/polybar/sxhkd

reload --restart ───────────────► reload --restart  (RESTART SÛR, structurel)
                                    │ validateConfig
                                    │ mémorise `bspc query -N -n .fullscreen`
                                    │ bspc wm -r
                                    └► ré-applique `bspc node <id> -t fullscreen`

thememenu ──────────────────────► reload (config-only) + relance polybar (launch.sh)
```

- **DRY :** les `bspc config *` idempotents + `. colors.sh` sont extraits dans
  `~/.config/bspwm/config.bspwm.sh` (`applyConfig`), **sourcé par `bspwmrc` ET par `reload`** — une seule
  source de vérité. Ce fragment est aussi validé en `bash -n` (ajouté à `validateConfig`).
- **Restent dans `bspwmrc`** (structurels, non idempotents → chemin `--restart`) : `bspc monitor -d`,
  les `bspc rule -a` (qui **s'empilent** si rejoués), et tout l'autostart.
- **thememenu** : ne fait plus `bspc wm -r`. Il appelle le reload config-only (bordures bspwm via
  colors.sh) **et** relance polybar (`launch.sh`) pour que la barre relise `colors.ini` — le config-only
  ne respawn pas polybar, donc la barre doit être rafraîchie explicitement au changement de thème.

## Prevention

- **Toujours passer par l'aiguilleur**, jamais dupliquer un chord entre fichiers sxhkd chargés ensemble
  (premier chargé gagne → le doublon est silencieusement ombragé).
- **`bash -n` est le seul garde-fiable** contre le lockout (bspwmrc/colors.sh **+ config.bspwm.sh**,
  désormais sourcé au boot → un fragment cassé planterait le démarrage). Les heuristiques sxhkd/polybar
  sont volontairement légères (ces blocs ne causent pas de lockout).
- **`bspc wm -r` est destructeur d'état runtime** (plein écran a minima ; flottant/sticky à confirmer).
  Préférer le reload **config-only** pour tout ce qui est couleurs/gaps/thème ; ne passer par `--restart`
  que pour les changements structurels (règles, monitor, autostart), où le plein écran est sauvé/restauré.
- **Filet absolu** si malgré tout enfermé dehors : TTY `Ctrl + Alt + Fn + F2` (F-keys = Fn sur le MBP),
  corriger le fichier, reboot.
- **Ne JAMAIS relancer sxhkd à la main** depuis un shell hors-X (doublons `already grabbed` → lockout).
  La bascule sxhkd se fait via le reload (bspwmrc respawn), pas manuellement.
- **Vérif hors session** : `bash -n` sur les scripts + `reload --check` (valide sans appliquer).
- Penser à mettre à jour la **cheatsheet** (`~/.config/bspwm/scripts/help`) quand un bind change.

### Rejouer sur la devbox

Adapter les chemins (`~/.bashrc` monolithique vs `~/.config/bash/*.bash` sur le MBP). Le mécanisme est
portable : sentinelle `$XDG_RUNTIME_DIR`, aiguilleur `pgrep -x <wm>`, validation `bash -n` + heuristiques.

**Leçon (màj 2026-06-01) : viser le config-only d'emblée sur la devbox.** Tout `bspc wm -r` est
**destructeur d'état runtime** (plein écran a minima). Donc, dès la mise en place du reload bspwm sur la
devbox :

1. Extraire les `bspc config` idempotents + `colors.sh` dans un fragment sourçable
   (`config.bspwm.sh`/`applyConfig`), **sourcé par `bspwmrc` ET par le reload** (une seule source de
   vérité) — et l'inclure dans la validation `bash -n`.
2. Faire du **config-only le mode par défaut** du reload (re-source du fragment, jamais `bspc wm -r`) :
   corrige le faux plein écran *et* supprime les respawns inutiles picom/polybar/sxhkd.
3. Garder un `--restart` explicite pour le structurel (règles/monitor/autostart), avec **save/restore
   obligatoire du plein écran** (`bspc query -N -n .fullscreen` avant, `bspc node <id> -t fullscreen`
   après). Étendre à flottant/sticky si l'usage le montre nécessaire.
4. Tout consommateur qui faisait `bspc wm -r` pour rafraîchir des couleurs (ex. theme switcher) passe au
   config-only **et rafraîchit sa barre séparément** (le config-only ne respawn pas polybar).

## Related
- Finding (analyse §1-§3, avant implémentation) : `docs/findings/2026-05-30-bspwm-reload-et-verdicts-phase6.md`
- Plan (tâches T1-T6) : `docs/plans/2026-05-30-feat-bspwm-reload-sur-plan.md`
- Mémoire : `polybar-x-session-restart` (ne jamais relancer sxhkd à la main), `mbp-fkeys-need-fn` (TTY de secours)
