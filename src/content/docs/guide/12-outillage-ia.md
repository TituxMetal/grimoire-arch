---
title: "12 — Outillage IA"
---

## Objectif

Intégrer un assistant IA au flux de travail terminal : **Claude Code** en CLI, son **intégration
Neovim**, et une approche **skills/marketplace** pour structurer le travail. À la fin de ce chapitre,
Claude Code tourne depuis un dossier projet, dialogue avec Neovim (sélections et diffs), et une méthode de
travail (brainstorm → plan → build → review) encadre l'usage — sans que l'agent impose ses défauts à la
place des conventions du poste.

Le *pourquoi* : un assistant IA mal cadré lit tout le home, casse les conventions (npm au lieu de bun) et
produit du générique. L'objectif est de gagner en productivité **tout en gardant le contrôle** :
installation propre, périmètre restreint, et méthodes explicites.

## Procédure

### 1. Claude Code (installeur natif)

L'installeur natif n'utilise **ni npm ni Node, ni sudo** (il s'installe dans `~/.local`). Lire le script
avant de l'exécuter :

```sh
curl -fsSL https://claude.ai/install.sh -o /tmp/cc-install.sh
less /tmp/cc-install.sh && bash /tmp/cc-install.sh
claude --version && claude doctor
```

Authentification par flux device-code. Les binaires sont versionnés dans
`~/.local/share/claude/versions/` (rollback possible). _(Selon doc officielle Claude Code.)_

### 2. Restreindre le périmètre

Ne pas accorder la confiance au home entier : lancer Claude Code **depuis un dossier projet précis**
(`cd ~/projet && claude`) pour éviter qu'il lise/écrive tout `~/`. Choix de sécurité délibéré.

### 3. Intégration Neovim (`claudecode.nvim`)

Installer `claudecode.nvim` **en `vim.pack`** (cohérent avec le chapitre 9, pas lazy). Une session
`claude` lancée dans un terminal voit alors les sélections de Neovim et y affiche ses diffs (accepter /
refuser au clavier). _(Selon dépôt claudecode.nvim.)_

```lua
-- ~/.config/nvim/lua/custom/plugins/claudecode.lua — illustration
vim.pack.add { { src = 'https://github.com/coder/claudecode.nvim' } }
require('claudecode').setup {}
```

### 4. Méthode : skills / marketplace

Un marketplace de skills (cycle brainstorm → plan → build → review) structure le travail. Installer les
plugins voulus via le gestionnaire de plugins de Claude Code, et n'activer que ceux qui servent. _(Selon doc plugins/skills.)_

## Décisions & pourquoi

### Installeur natif plutôt que npm

L'installeur natif s'aligne sur la philosophie « pas de npm à la main » (chapitre 9) : zéro Node, zéro
sudo, installation isolée dans `~/.local`. → cohérent avec `docs/adr/0006-runtime-js-bun.md`.

### Home non-trust

Restreindre Claude Code à un dossier projet limite la surface : il ne parcourt pas l'intégralité du home
par défaut. Compromis sécurité/confort assumé.

### Les agents respectent les conventions du poste

La contrainte transverse : un agent doit **respecter le style du poste** (bun, conventions de scripts
shell, outils terminal) plutôt qu'imposer ses défauts. Les skills sont un moyen d'encoder ces attentes,
pas une raison de les abandonner.

## Pièges

- **Reconnexion Neovim ↔ Claude après redémarrage de nvim** — le pont (serveur/lockfile) est
  **par-instance** : après un redémarrage de Neovim, refaire `/ide` dans la session claude pour
  rétablir la connexion. _(retour d'expérience.)_

- **OAuth d'abonnement qui échoue sur un agent tiers** — certains agents IA tiers échouent au login
  d'abonnement (`Unknown scope`) : c'est un **problème côté serveur**, pas spécifique à l'outil ; le
  contournement par clé API est alors la seule voie → décision séparée (ne pas bloquer dessus). _(retour
  d'expérience — issues upstream connues.)_

- **Manifeste de plugin au mauvais schéma** — un `plugin.json` upstream invalide (champ mal typé) peut
  être patché dans le **cache local du marketplace**, mais une mise à jour du marketplace **écrase** ce
  patch → le ré-appliquer le cas échéant. _(retour d'expérience.)_

- **Presse-papier indisponible en SSH** — `claudecode.nvim`/Neovim signalent `Can't open display` pour
  xclip en SSH sans X : normal ; le yank fonctionnera en session X locale (option : OSC 52, supporté par
  alacritty). _(retour d'expérience.)_

- **Exécuter un installeur sans le lire** — toujours `less` le script avant `bash` ; un `curl | bash`
  aveugle exécute du code non revu. _(bonne pratique générale.)_
