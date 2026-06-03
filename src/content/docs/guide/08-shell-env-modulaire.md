---
title: "08 — Shell & env modulaire"
---

## Objectif

Découper la configuration shell en **fragments XDG ordonnés**, en séparant l'environnement POSIX (valable
pour tout shell de login) de la configuration interactive bash. À la fin de ce chapitre, activer ou
désactiver un réglage revient à ajouter ou retirer un fichier, et chaque runtime (nvm, bun) a son propre
module isolé.

Le *pourquoi* : un `.bashrc` monolithique mélange variables d'environnement, options interactives,
alias et init de runtimes — il devient illisible et difficile à porter sélectivement d'une machine à
l'autre. Le découpage rend chaque réglage repérable, activable à la pièce, et testable isolément.

## Procédure

### 1. Séparer login POSIX et interactif bash

```
~/.bash_profile  → source ~/.profile, puis ~/.bashrc si shell interactif
~/.profile       → loader POSIX : source ~/.config/env/*.sh
~/.bashrc        → loader bash : source ~/.config/bash/*.bash
```

`~/.profile` doit rester **POSIX/dash-safe** (il est lu par des shells de login non-bash) ; `~/.bashrc`
peut utiliser les fonctionnalités bash. _(Selon Arch Wiki : Bash#Configuration files, man bash → INVOCATION.)_

### 2. Fragments d'environnement (`~/.config/env/NN-*.sh`)

Variables POSIX, ordonnées par préfixe numérique :

```
00-core.sh      EDITOR/VISUAL, PATH de base, SSH_AUTH_SOCK, GPG_TTY, QT_QPA…
10-history.sh   HISTFILE, HISTSIZE, HISTCONTROL…
30-nvm.sh       NVM_DIR
40-bun.sh       BUN_INSTALL + PATH bun
```

Chaque runtime a **son** module — pas d'export en vrac ailleurs (voir Pièges). _(Selon Arch Wiki : XDG Base Directory.)_

### 3. Fragments interactifs (`~/.config/bash/NN-*.bash`)

```
00-options.bash    shopt (checkwinsize, globstar, histappend, autocd…)
10-functions.bash  fonctions (sync d'historique, parse de branche git, extract, mkcd)
20-aliases.bash    alias (eza, raccourcis projets…)
30-prompt.bash     couleurs + PS1
40-completion.bash bash-completion
```

Un fragment désactivé porte une extension neutre (ex. `…bash.disabled`) : présent mais **non chargé** par
le loader (`*.bash`).

## Décisions & pourquoi

### Tout export PATH/env dans `~/.config/env/NN-*.sh`, jamais dans `.bashrc`

Ajouter un `export PATH=…` en fin de `.bashrc` est une verrue : c'est de l'environnement, pas de
l'interactif, et ça ne sera pas vu par les shells de login non-interactifs. Chaque runtime (nvm, bun)
reçoit son module dédié sur le modèle `30-nvm.sh` / `40-bun.sh`. → décision figée :
`docs/adr/0011-shell-env-modulaire-xdg.md`.

### POSIX pour `~/.profile`

`~/.profile` peut être lu par `dash` (ou un greeter) : y mettre une syntaxe bash-only le casserait
silencieusement. On y reste POSIX, et on garde les fonctionnalités bash pour `~/.config/bash/`.

> _Leçon portable._ Une machine peut avoir un `~/.bashrc` monolithique là où une autre est splittée — en
> tenir compte quand un réglage doit aller **sur les deux** (le fragment ici, la section correspondante
> là-bas).

## Pièges

- **`export PATH` en fin de `.bashrc`** — verrue non portable et invisible aux shells de login
  non-interactifs → déplacer dans `~/.config/env/NN-*.sh`. _(retour d'expérience.)_

- **PATH dupliqué après un `source` manuel** — recharger `.bashrc` à la main ré-empile le PATH ; un
  login propre, lui, ne duplique pas → vérifier le comportement réel **au login**, pas après un re-source. _(retour d'expérience.)_

- **Fragment censé être actif mais ignoré** — un fichier hors motif du loader (mauvaise extension, ou
  `.disabled`) n'est pas chargé : c'est voulu pour désactiver, piégeur si involontaire → contrôler le
  motif (`*.bash` / `*.sh`) du loader. _(retour d'expérience.)_

- **Syntaxe bash dans `~/.profile`** — casse silencieusement sous un shell POSIX → garder `~/.profile`
  dash-safe. _(Selon man bash → INVOCATION.)_
