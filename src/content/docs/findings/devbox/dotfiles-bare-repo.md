---
title: "Devbox — dépôt bare des dotfiles"
type: findings
date: 2026-07-18
domain: devbox / dotfiles
component: bare repo / alias dot / autocommit / mimeapps
status: vivant
---

> **Statut : vivant — capture de session sandbox, rédigé le 2026-07-18.**
> Modifications effectuées ce jour (inventaire, mimeapps, commits par dossier, push).
> Source de vérité opérationnelle pour tout agent qui touche une config machine.

## Pourquoi ce fichier existe

Le dépôt a été créé le 2026-07-07, mais les sessions §10–11 n’y committaient presque rien.
Résultat : stack WM (i3/bspwm/polybar/…) uniquement sur disque jusqu’au 18/07.
Ce rapport évite qu’un agent « tombe des nues » quand on lui demande de versionner un changement de config.

## Identité du dépôt

| | |
|---|---|
| Type | **Bare repo** git (pas chezmoi, pas yadm) |
| Git dir | `~/GIT/dotfiles` |
| Work tree | `$HOME` |
| Alias shell | `dot='git --git-dir=$HOME/GIT/dotfiles --work-tree=$HOME'` |
| Remote | `git@github.com:TituxMetal/devbox-dotfiles.git` (**privé**) |
| Branche | `main` |
| Config clé | `status.showUntrackedFiles = no` |
| Commits | conventional commits **en anglais**, signés GPG |

En shell non-interactif, l’alias peut ne pas expand `$HOME` : utiliser

```bash
git --git-dir="$HOME/GIT/dotfiles" --work-tree="$HOME" …
# ou
dot …   # dans un shell interactif où l’alias est chargé
```

## Auto-commit quotidien

Unités user : `dotfiles-autocommit.{service,timer}` (enabled).

```sh
git add -u
git diff --cached --quiet || git commit -m "auto $(date +%F_%H%M)"
```

**Conséquence :** seuls les fichiers **déjà trackés** sont auto-commités.
Un **nouveau** path n’entre **jamais** tout seul → il faut un `dot add` explicite + commit nommé.

L’auto-commit ne pousse pas : le `push` reste manuel (ou demandé explicitement).

## Workflow agent — changer une config

1. **Vérifier** si le path est déjà suivi :
   ```bash
   dot ls-files -- path/relatif
   # ou
   git --git-dir="$HOME/GIT/dotfiles" --work-tree="$HOME" ls-files -- path/relatif
   ```
2. **Modifier** le fichier sur disque.
3. **Commit ciblé** (pas de monolithe) :
   - fichier déjà tracké → `dot add -u -- path` + commit
   - nouveau dossier/fichier → `dot add -- path` + commit
4. Message : conventional commit EN, un composant = un commit quand c’est possible  
   ex. `feat(bspwm): …`, `fix(sxhkd): …`, `mimeapps: …`
5. **Push** seulement si demandé / fin de lot validé : `dot push`
6. GPG : commits signés (`commit.gpgsign=true`). Sonde avant si besoin :
   `gpg-connect-agent 'keyinfo --list' /bye` — colonne CACHED `1` = déverrouillée.

### `.gitignore`

- **Préférer** un `.gitignore` **dans le dossier** concerné (ex. `.config/bspwm/.gitignore` pour binaires / sources vendored).
- Ignore transverse déjà présent : `.config/git/ignore` (tracké).
- `GIT/dotfiles/info/exclude` = local machine only, non poussé.

Sans ignore local, un `dot add .config/bspwm` peut ramasser des ELF (`scripts/tabbed`, etc.).

## Ce qui est versionné (état 2026-07-18, HEAD poussé)

Socle 07–08/07 : shell modulaire (`env/`, `bash/`), alacritty, nvim, butter*, dunst, gtk3/4, scripts lock/gpg/vpn, systemd autocommit, ssh config, mimeapps, xed…

Vague 18/07 (un dossier ≈ un commit, push `main`) :

| Commit (thème) | Paths |
|---|---|
| mimeapps | `.config/mimeapps.list` |
| sxhkd | `.config/sxhkd/` |
| picom | `.config/picom/` |
| polybar | `.config/polybar/` |
| rofi | `.config/rofi/` |
| flameshot | `.config/flameshot/` |
| btop | `.config/btop/` |
| qt5ct | `.config/qt5ct/` |
| autostart | `.config/autostart/` |
| scripts | `screen-layout`, `pi-terminal` |
| wallpaper | `.config/wallpaper` (symlink) |
| i3 | `.config/i3/` (split config.d) |
| bspwm | `.config/bspwm/` (+ `.gitignore` build) |
| git | `.gitconfig`, `.config/git/ignore` |

Correctif follow-up : binaires `bspwm/scripts/{tabbed,bspwm-tabs}` retirés du tracking (restent un instant dans l’historique du commit bspwm — repo privé).

## Hors repo (ne pas ajouter sans demande)

État applicatif / secrets / runtime : Brave, Code, Zed, mozilla, dconf, `.gnupg`, pass-store, histfiles, `.omp`, `.claude`, wallpapers binaires, caches.
Build bspwm : `tabbed/`, `bspwm-tabs/`, `*.o`, binaires sous `scripts/`.

## mimeapps (fix 18/07)

Defaults cohérents vérifiés via `xdg-mime query default` :

| Famille | App |
|---|---|
| dossiers | pcmanfm |
| texte / scripts / code | xed (`org.x.editor`) |
| images | ristretto |
| audio | Quod Libet (EasyTAG = manuel seulement) |
| vidéo | VLC |
| pdf | atril |
| archives | xarchiver |
| http(s)/html | firefox-esr |

Cause racine du chaos : EasyTAG déclare `inode/directory` + audio en premier dans le cache MIME système. Les defaults user dans `mimeapps.list` écrasent ça.

## Pièges pour l’agent suivant

- `dot status` **ne montre pas** les untracked → un dossier nouveau « n’existe pas » pour git tant qu’on ne l’a pas `add`.
- Ne **pas** faire un gros `dot add -A` sur `$HOME`.
- Ne **pas** compter sur l’auto-commit pour du travail de session (nouveaux paths).
- Après une session config : si le path doit vivre dans le temps → **commit nommé**, pas seulement le timer de minuit.
- Remote privé : `gh` / SSH OK ; clone HTTP anonyme = 404.

## Références

- Création initiale : `2026-07-07-execution-sections-06-07.md` (calepin, non publié — § Socle)
- Hand-off migration : `MIGRATION_STATUS.md` (calepin, non publié)
- GitHub : https://github.com/TituxMetal/devbox-dotfiles

## Reste à faire

- [ ] topgrade : pas encore tranché (hors vague 18/07)
- [ ] Optionnel : rewrite historique pour purger les 2 ELF du commit bspwm (faible priorité, repo privé)
- [ ] Toute nouvelle config machine → add + commit dédié + push si fin de lot
