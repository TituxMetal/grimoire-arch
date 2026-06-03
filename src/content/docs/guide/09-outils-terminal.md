---
title: "09 — Outils terminal"
---

## Objectif

Constituer un environnement de travail **fondé sur des outils terminal** : un éditeur (Neovim), un
émulateur de terminal et ses polices, un navigateur durci. À la fin de ce chapitre, on édite dans Neovim
(base kickstart, plugins en gestionnaire natif), on lance les applis terminal proprement depuis un
lanceur graphique, et le navigateur est configuré pour la confidentialité et la stabilité.

Le *pourquoi* : un poste de travail efficace ne dépend pas d'éditeurs GPU-accélérés (voir annexe A pour
la contrainte matérielle qui motive ce choix sur du matériel ancien). Les outils terminal sont rapides,
scriptables, portables, et cohérents avec une philosophie minimaliste.

## Procédure

### 1. Neovim : base kickstart + plugins natifs

Partir de **kickstart.nvim** (un `init.lua` commenté, pédagogique). Installer Neovim et l'outillage qui
fait fonctionner ses fonctions de recherche/coloration :

```sh
pacman -S neovim ripgrep fd tree-sitter-cli
```

Point décisif : **kickstart récent utilise le gestionnaire natif `vim.pack`, pas `lazy.nvim`**. Les
specs au format lazy ne fonctionnent pas. Format `vim.pack` :

```lua
vim.pack.add { { src = 'https://github.com/<owner>/<repo>' } }
require('<module>').setup {}
```

Contrôler la santé avec `:checkhealth`. _(Selon Arch Wiki : Neovim ; doc kickstart.nvim.)_

### 2. Plugins perso, chargés automatiquement

Kickstart sépare l'upstream (`lua/kickstart/plugins/`, qu'on ne touche pas) de la zone perso
(`lua/custom/plugins/`, un fichier par plugin, chargés en boucle). Encore faut-il que la ligne
`require 'custom.plugins'` soit **décommentée** dans `init.lua` (voir Pièges).

### 3. Lancer une appli terminal depuis un lanceur graphique

Une appli terminal (Neovim, btop…) ne se lance pas via `rofi -show run` (binaire sans terminal). Créer
un fichier `.desktop` qui l'enrobe, et la lancer via `rofi -show drun` :

```ini
# ~/.local/share/applications/nvim.desktop — illustration
Exec=alacritty -e nvim %F
Categories=Development;
```

_(Selon spécification freedesktop Desktop Entry.)_

### 4. Terminal + polices

Alacritty avec une Nerd Font (pour les glyphes d'icônes). Attention : certaines lignes de couleur du
thème peuvent rester commentées par défaut et ne s'appliquer qu'une fois décommentées. _(Selon doc Alacritty.)_

### 5. Navigateur durci : Firefox ESR + betterfox

Installer **Firefox ESR** (pas la branche standard) et appliquer **betterfox au tag correspondant à la
version ESR**, puis figer ses overrides :

```sh
# illustration
paru -S firefox-esr
curl -fsSL https://raw.githubusercontent.com/yokoffing/Betterfox/<tag>/user.js -o "$PROFILE/user.js"
# overrides concaténés à la fin du user.js (sinon betterfox les écrase au démarrage)
```

`$PROFILE` est le profil de l'**Install ID propre à ESR** (voir Pièges). _(Selon projet betterfox ; doc Firefox profiles.)_

## Décisions & pourquoi

### kickstart plutôt que LazyVim ou une config tierce

Pour apprendre Neovim, un `init.lua` unique et commenté est plus pédagogique qu'une distribution opaque.
On garde une config tierce auditée en référence, mais on travaille sur kickstart.

### Firefox ESR plutôt que la branche standard

Trois raisons : **correspondance exacte avec un tag betterfox** (pas d'approximation), **stabilité** (socle
figé ~12 mois, juste des backports sécurité, idéal pour une config soignée), et un déploiement **plus
prudent des features expérimentales** (souvent gourmandes en GPU) — favorable au matériel ancien. Coût :
nouveautés en retard, sans impact ici.

### bun comme gestionnaire de paquets ; npm seulement comme béquille Mason

`bun` est le runtime/PM JS explicite. `npm` (via nvm) n'est conservé que parce que **Mason (Neovim) ne
sait pas utiliser bun** (limitation upstream). On ne lance jamais `npm` à la main. → décision figée :
`docs/adr/0006-runtime-js-bun.md`.

> _Matériel ancien._ Le choix « tout terminal » (et l'exclusion des éditeurs GPU) découle d'une contrainte
> matérielle détaillée en **annexe A**. → `docs/adr/0007-outils-terminal-hd3000.md`.

## Pièges

- **Specs au format lazy dans un kickstart `vim.pack`** — ne fonctionnent pas (lazy.nvim absent) →
  utiliser le format `vim.pack.add`. _(retour d'expérience.)_

- **`require 'custom.plugins'` commentée** — la zone perso n'est jamais chargée, les plugins jamais
  installés → décommenter la ligne dans `init.lua`. _(retour d'expérience.)_

- **Mason réclame npm alors qu'on est en bun** — c'est attendu : garder le npm de nvm comme béquille,
  ne pas chercher à forcer bun pour Mason. _(retour d'expérience — limitation upstream.)_

- **`user.js` déposé dans le mauvais profil** — ESR crée un **Install ID et un profil distincts** de
  Firefox standard ; déposer le `user.js` dans l'ancien profil n'a aucun effet → confirmer le profil
  actif via `profiles.ini` (`[InstallXXX] Default=`) avant de déposer. _(retour d'expérience.)_

- **`pkill -x firefox` ne tue pas ESR** — le binaire est `firefox-esr` → `pkill -x firefox-esr` (ou
  `pkill -if firefox`). _(retour d'expérience.)_

- **Overrides betterfox écrasés au démarrage** — betterfox réapplique ses valeurs ; concaténer les
  overrides **à la fin** du `user.js` (ou utiliser le mécanisme prévu). _(retour d'expérience.)_

- **`alias cat=bat`** — pollue les copier-coller avec des numéros de ligne → garder `cat` natif si on
  copie souvent depuis le terminal. _(retour d'expérience.)_
