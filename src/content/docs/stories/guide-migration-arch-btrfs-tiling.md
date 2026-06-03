---
title: "Guide de migration Arch → BTRFS + station tiling — Stories (chapitres)"
type: stories
date: 2026-05-26
related:
  - ../brainstorms/2026-05-26-guide-migration-arch-btrfs-tiling-brainstorm.md
  - guide-migration-arch-btrfs-tiling.architecture.md
---


> **Réconcilié le 2026-06-01.** Les 14 stories sont **livrées** : mapping **1:1** STORY-00N = chapitre NN
> (voir la table « Correspondance stories ↔ chapitres » du **chapitre 13 — Workflow IA**). Les cases
> ci-dessous ont été **cochées a posteriori** contre le guide réellement livré : le gate formel
> (STORY-002 proof slice) n'a pas eu lieu à l'époque, mais ses critères sont remplis dans le guide. Ce
> fichier est un **artefact de processus** (périssable) conservé pour la traçabilité, pas la cible — la
> cible est `docs/guide/`.

Chaque **story = un chapitre (ou une annexe) à rédiger**. L'« acteur » est le **lecteur** : un
utilisateur Arch qui migre une install existante vers BTRFS et reconstruit une station tiling. Les
stories sont **ordonnées par dépendance** ; **STORY-002 (chapitre 2) est le proof slice et le gate** —
rien en aval ne se rédige tant qu'il n'a pas passé les critères transverses.

> Détail du gabarit, sources *binding* par chapitre, ADR et structure de fichiers :
> voir `guide-migration-arch-btrfs-tiling.architecture.md`.

## Critères transverses (Definition of Done — s'appliquent à CHAQUE story)

Un chapitre n'est « fait » que si **tous** ces critères passent (ce sont les *Rejection criteria* du
contrat subjectif, inversés en checklist) :

- [x] Suit le gabarit **Objectif → Procédure → Décisions & pourquoi → Pièges (issue/fix)**.
- [x] **Aucune** date/heure, aucun « j'ai », aucune bribe de conversation, aucun TODO perso.
- [x] **Aucune** affirmation technique sans source : soit doc officielle citée, soit étiquette
      explicite **« retour d'expérience »** (+ lien issue upstream si elle existe).
- [x] Les commandes sont des **illustrations contextualisées**, jamais un script à copier tel quel.
- [x] Le matériel ancien (GPU HD 3000, clavier fr-mac, touches Apple) n'est **pas** martelé :
      au plus une ligne, renvoi vers l'**annexe A**.
- [x] La seconde machine : **au plus une ligne « leçon portable »** si pertinent.
- [x] Documente l'**état corrigé/actuel**, pas le brut des journaux (voir corrections en architecture).
- [x] Langue : **français**.

---

## STORY-001 : Chapitre 1 — Audit & baseline

**En tant que** lecteur partant d'une install Arch existante
**je veux** auditer et assainir le système avant toute migration, et me doter d'une méthode de mesure
**afin de** partir d'une base saine et pouvoir prouver les gains plus tard.

### Acceptance Criteria
- [x] Explique **pourquoi auditer avant de migrer** (un système obsolète/encombré migre mal).
- [x] Couvre : revue des services activés, nettoyage du cache pacman, NVRAM/entrées boot mortes.
- [x] Pose une **méthode de bench reproductible** (ce qu'on mesure, comment, à quoi on compare) — sans
      promettre un chiffre universel ; le gain est un **retour d'expérience**.
- [x] Pose le réflexe **`pacman -Syu` complet, jamais `-Sy` partiel** (renvoi ch. 5 pour le pourquoi détaillé).

### Edge Cases
- Système très en retard : mise à jour complète **d'abord**, nettoyage et migration FS **ensuite**.
- Le chiffre de boot (origine → après nettoyage) est un exemple mesuré, étiqueté « retour d'expérience ».

### Notes
- [SOURCE] `btrfs-migration.md` (Phase 1).
- [INTEGRATION] Chapitre d'entrée : aucune dépendance amont. Alimente la méthode de bench réutilisée
  en ch. 4 (boot) et résumée dans `PERFS-BENCHMARK.md`.

---

## STORY-002 : Chapitre 2 — ext4 → BTRFS à subvolumes  ⭐ PROOF SLICE / GATE

**En tant que** lecteur sur ext4 (souvent sur LVM)
**je veux** migrer vers un BTRFS à subvolumes sans perdre la possibilité de revenir en arrière
**afin de** disposer d'un layout moderne (snapshots, compression) avec un filet de sécurité.

### Acceptance Criteria
- [x] **C'est le chapitre de validation du gabarit** : il doit franchir *tous* les critères transverses
      ET appliquer proprement les 4 sections. Tant qu'il n'est pas validé, aucun chapitre 3→12 n'est rédigé.
- [x] Couvre le **filet de sécurité** : LV ext4 d'origine conservés intacts + entrées BLS ext4 gardées
      → rollback pré-migration en un clic. Énonce que leur suppression est **hors périmètre** (phase ultérieure).
- [x] Détaille les **7 subvolumes** (`@`, `@home`, `@snapshots`, `@var-log`, `@var-cache`, `@var-tmp`,
      `@pkg`) et **pourquoi ce découpage** (ce qu'on veut/ne veut pas snapshoter).
- [x] Donne les **options de montage** et le pourquoi de chacune
      (`noatime`, `compress=zstd:3`, `space_cache=v2`, `ssd`, `discard=async`).
- [x] Couvre la copie (rsync), la réécriture **fstab** par UUID, et le **hook mkinitcpio btrfs**.
- [x] Note la **généralisation hors LVM** : l'exemple est sur LVM ; indiquer ce qui change sans LVM.

### Edge Cases
- Sans LVM : adapter la création du volume cible (partition directe vs LV).
- Les UUID/subvolumes de l'exemple sont des **valeurs de référence**, pas à copier (renvoi annexe / table d'identifiants).

### Notes
- [SOURCE] `btrfs-migration.md` (Phase 2).
- [INTEGRATION] Dépend de **STORY-001** (système assaini). Prérequis de **STORY-003** (snapshots) et
  **STORY-004** (boot : le layout BTRFS conditionne fstab/BLS). **Gate du projet entier.**

---

## STORY-003 : Chapitre 3 — Snapshots

**En tant que** lecteur sur BTRFS
**je veux** des snapshots automatiques avant chaque transaction pacman, couvrant aussi les suppressions
**afin de** pouvoir revenir en arrière après une mise à jour ou une désinstallation hasardeuse.

### Acceptance Criteria
- [x] Couvre **Timeshift en mode BTRFS** + `timeshift-autosnap` (snapshot avant `Upgrade`).
- [x] Explique **pourquoi un hook custom `Remove`** est nécessaire (autosnap ne couvre pas les suppressions).
- [x] Distingue snapshot BTRFS (atomique, instantané) vs sauvegarde — et ce que Timeshift ne protège pas (`@home` selon config).

### Edge Cases
- Restauration : ce qu'implique un rollback de `@` (et l'interaction avec `@home` non snapshoté).

### Notes
- [SOURCE] `btrfs-migration.md` (Phase 3).
- [INTEGRATION] Dépend de **STORY-002** (subvolumes, dont `@snapshots`). Décision figée → **ADR Timeshift-BTRFS**.

---

## STORY-004 : Chapitre 4 — Boot moderne

**En tant que** lecteur migrant vers BTRFS
**je veux** un boot moderne, simple et vanilla
**afin de** éviter les configs custom fragiles et profiter de kernel-install natif.

### Acceptance Criteria
- [x] Couvre **ESP montée sur `/boot`** (convention kernel-install) et **pourquoi** (alignement Arch vanilla).
- [x] Couvre **mkinitcpio vanilla** : hooks standard, dont **`sd-vconsole`** (remplace udev+keymap+consolefont),
      hook **microcode**, et le layout plat `/boot/vmlinuz-<pkgbase>` + `initramfs-<pkgbase>.img`.
- [x] **Piège central** : ne PAS utiliser `kernel-install-mkinitcpio` (AUR) — il crée des presets
      ESP-relatifs cassés. À expliquer comme décision, pas comme anecdote.
- [x] Couvre **systemd-boot** + entrées **BLS** (et la cohabitation avec les entrées ext4 du filet de sécurité).

### Edge Cases
- Généralisation hors LVM (hooks `lvm2` conditionnels) — cohérent avec ch. 2.
- Microcode Intel vs AMD : l'exemple est Intel ; signaler l'équivalent.

### Notes
- [SOURCE] `btrfs-migration-day2.md` (Phase 7B) + `btrfs-migration.md` (Phase 6).
- [INTEGRATION] Dépend de **STORY-002** (fstab/BLS pointent les subvolumes). Décisions figées →
  **ADR systemd-boot**, **ADR ESP-on-/boot + mkinitcpio vanilla**.

---

## STORY-005 : Chapitre 5 — Quand ça casse : récupération

**En tant que** lecteur qui a cassé son système pendant la migration
**je veux** une boîte à outils de récupération et un catalogue de pièges pacman/boot reconnaissables
**afin de** réparer depuis un live USB sans tout réinstaller.

### Acceptance Criteria
- [x] Couvre le **chroot depuis live USB** (montage des subvolumes + ESP) comme procédure de base.
- [x] Catalogue de pièges, chacun avec **symptôme → diagnostic → fix** :
      `gcc-libs`/`libgcc`, **paquet « vide » 2-3 Ko** (vérif `tar -tf` : méta-paquet légitime vs corruption),
      **`sed` silencieux** (décommentation qui échoue sans erreur ; vérifier le résultat),
      **`.pacnew`** (`passwd`/`group`/`shadow`/`mirrorlist`/`hosts` → quand DROP, jamais fusionner).
- [x] Rappelle le réflexe **`-Syu` complet jamais `-Sy`** avec le pourquoi (désync db/miroirs, 404, cache corrompu).
- [x] Couvre le **rollback** via le filet de sécurité ext4 (entrées BLS d'origine).

### Edge Cases
- Méta-paquet splitté légitime (ex. `gcc-libs`) vs vraie corruption : critère de distinction explicite.
- `locale-gen` « Generation complete » silencieusement faux après `sed` raté.

### Notes
- [SOURCE] `btrfs-migration.md` (Phase 5).
- [INTEGRATION] Dépend de **STORY-002/004** (savoir monter/chrooter le layout). Chapitre transversal
  référencé par 1, 2, 4. Candidat **`/compound`** : le diagnostic « pkg-vide 2-3 Ko ».

---

## STORY-006 : Chapitre 6 — Bureau (XFCE + Ly)

**En tant que** lecteur ayant un système qui boote
**je veux** un environnement de bureau léger avec un login manager minimal et un suspend/lock cohérent
**afin de** disposer d'une session utilisable et d'un verrouillage fiable.

### Acceptance Criteria
- [x] Couvre **Ly** comme login manager (jamais LightDM) et comment il **source la session** (`.xprofile`).
- [x] Couvre **NetworkManager** pour la connectivité de base.
- [x] Couvre **suspend/lock cohérent via `xss-lock`** + script `~/bin/lock` : lock **avant** suspend,
      comportement identique sur tous les WM, basé sur logind (pas `xfce4-power-manager`).

### Edge Cases
- `.xprofile` comme point d'entrée commun aux WM (sourcé par Ly) — prépare ch. 10 (sxhkd y est lancé).

### Notes
- [SOURCE] `day5.md`, `day6.md` ; `phase9-10-20260523.md` (Phase 9C pour xss-lock).
- [INTEGRATION] Dépend de **STORY-004** (boot). Décisions figées → **ADR Ly**, **ADR xss-lock**.

---

## STORY-007 : Chapitre 7 — Réseau & sécurité

**En tant que** lecteur voulant un poste sécurisé
**je veux** un VPN full-tunnel avec killswitch, un agent GPG fonctionnel et une politique faillock saine
**afin de** protéger le trafic et les secrets sans me verrouiller dehors.

### Acceptance Criteria
- [x] Couvre **WireGuard via `wg-quick`** (full-tunnel) + **killswitch** (fwmark) + `openresolv` pour le DNS.
- [x] **Piège central** : NM et wg-quick **ne cohabitent pas** bien (interfaces désync) → wg-quick natif,
      scriptable (renvoi au wrapper `~/bin/vpn`, style titux).
- [x] Couvre **GPG agent + pinentry** (et le piège de nommage `gpgctl` ≠ `gpg`).
- [x] Couvre **faillock** et la politique sudo, en signalant le compromis sécurité/ergonomie choisi.

### Edge Cases
- DNS dans le tunnel vs fuite hors tunnel (killswitch).
- pinentry auto selon contexte (TTY vs X).

### Notes
- [SOURCE] `phase9-10-20260523.md` (Phase 10A).
- [INTEGRATION] Dépend de **STORY-006** (NM). Décision figée → **ADR WireGuard wg-quick + killswitch**.

---

## STORY-008 : Chapitre 8 — Shell & env modulaire

**En tant que** lecteur voulant une config shell maintenable et portable
**je veux** un shell découpé en fragments XDG ordonnés
**afin de** activer/désactiver des réglages par fichier et synchroniser proprement entre machines.

### Acceptance Criteria
- [x] Couvre le **split XDG** : `~/.profile` + `~/.config/env/NN-*.sh` (env) et `~/.bashrc` +
      `~/.config/bash/NN-*.bash` (interactif), avec la convention de numérotation `NN-`.
- [x] Explique **pourquoi** le découpage (vs `.bashrc` monolithique) : portabilité, activation sélective.
- [x] **Leçon portable (1 ligne max)** : la seconde machine a un `.bashrc` monolithique → en tenir compte
      quand un réglage doit aller sur les deux.

### Edge Cases
- Sync de l'historique entre sessions.
- nvm/bun chargés via fragments dédiés (renvoi ch. 9/12).

### Notes
- [SOURCE] `phase9-10-20260523.md` (refonte bash/env), `day6-2.md`.
- [INTEGRATION] Indépendant techniquement, mais logiquement après le bureau. Prépare ch. 9 et 12.

---

## STORY-009 : Chapitre 9 — Outils terminal

**En tant que** lecteur sur matériel modeste (ou par choix)
**je veux** un environnement d'outils terminal (éditeur, navigateur durci, polices)
**afin de** travailler efficacement sans dépendre d'éditeurs GPU-accélérés.

### Acceptance Criteria
- [x] Couvre **Neovim** base **kickstart.nvim** + plugins en **`vim.pack` natif (PAS lazy)**, et
      l'outillage (ripgrep, fd, tree-sitter-cli) ; `:checkhealth` comme contrôle.
- [x] Couvre **alacritty** et les polices.
- [x] Couvre le **durcissement Firefox ESR + betterfox**.
- [x] **Une ligne max** sur l'incompatibilité matérielle des éditeurs GPU (Zed/Ghostty) → **renvoi annexe A**.
      Ne PAS développer le GPU ici.

### Edge Cases
- `npm` (via nvm) n'existe que comme béquille Mason — ne jamais le lancer à la main (renvoi **ADR bun**).
- Brave/Chromium nécessite `--disable-gpu-rasterization` → mentionné, détaillé en annexe A.

### Notes
- [SOURCE] `day5.md` (nvim), `day6-2.md` (ESR).
- [INTEGRATION] Dépend de **STORY-008** (env). Prépare **STORY-012** (claudecode.nvim en vim.pack).

---

## STORY-010 : Chapitre 10 — Hotkeys portables

**En tant que** lecteur utilisant plusieurs WM
**je veux** un daemon de raccourcis unique et portable
**afin de** partager une base de hotkeys entre WM sans redéfinir tout à chaque fois.

### Acceptance Criteria
- [x] Couvre la **bascule xbindkeys → sxhkd** et **pourquoi** (daemon unique, portable i3/XFCE/bspwm).
- [x] Pose le modèle **un lanceur par WM** : `sxhkdrc` commun + `sxhkdrc-<wm>` spécifique, lancé depuis `.xprofile`.
- [x] **Piège clavier fr-mac/AZERTY** (retour d'expérience) : binder les **symboles** (`&`, `é`, `"`, `'`…)
      et non les chiffres pour switcher de desktop, car les chiffres exigent Shift au niveau matériel.
- [x] **Piège course de process** (retour d'expérience) : tuer puis relancer sxhkd **sans attendre** la mort
      de l'ancien casse les grabs → fix `while pgrep -x sxhkd; do sleep 0.2; done` avant relance.

### Edge Cases
- Les touches de **focus** restent `h/j/k/l` (vim-like) — voir ch. 11 / décision Q7. Cohérence à maintenir.

### Notes
- [SOURCE] `day6.md` (sxhkd), `day7.md` (Leçons 13 & 14).
- [INTEGRATION] Dépend de **STORY-006** (`.xprofile`). Pivot vers **STORY-011** (bspwm pilote tout via sxhkd).
  Candidat **`/compound`** : le modèle « un lanceur sxhkd par WM ». Décision figée → **ADR sxhkd daemon**.

---

## STORY-011 : Chapitre 11 — WM tiling : i3 → bspwm + polybar

**En tant que** lecteur connaissant i3 et voulant passer à bspwm
**je veux** une config bspwm + polybar raisonnée, avec les arbitrages explicités
**afin de** reconstruire une station tiling sans rejouer les tâtonnements.

### Acceptance Criteria
- [x] Couvre la bascule i3 → **bspwm + polybar** : `bspwmrc` (desktops, gaps, bordure, thème), bindings **via sxhkd**.
- [x] **Focus/déplacement = `h/j/k/l`** (vim-like, Q7) : écart **assumé** avec le k/l/o/m de l'i3 historique,
      à présenter comme décision, pas comme bug.
- [x] **single_monocle activé** (`bspc config single_monocle true`, choix délibéré) — corriger le PENDING
      de `day7.md` qui le dit « écarté » (périmé ; la config vivante fait foi).
- [x] **Règle flottante de classe `Timeshift-gtk`** (pas `Timeshift`) — WM_CLASS trouvée via `xprop`.
- [x] Trancher en rédaction les **arbitrages ouverts** (resize, drag souris flottantes via `pointer_modifier`,
      scratchpad, stacked/tabbed, preselect, focus tiling↔floating, workspace next/prev + back_and_forth,
      règles assign app→desktop, règles floating par classe/nom — **pas** `window_role`, 10 vs 12 bureaux,
      rendu polybar `%index%:%name%`) et **documenter le choix retenu + pourquoi**.

### Edge Cases
- **Onglets type dwm (bspwm-tabs, JustAGuyLinux)** : **adopté** (réconcilié 01/06) — `tabbed`/bspwm-tabs
  câblé (binds `super+ctrl+a`/`d`, `~/.config/bspwm/tabbed/config.h`), figé en **ADR 0017**. La story
  d'origine le notait « reporté » : statut corrigé pour coller à `guide/11`. Référence Codeberg conservée
  (ne pas confondre dépôt-référence cloné et feature câblée).
- Limite bspwm : règles floating par classe/nom uniquement, pas `window_role` (à expliquer).

### Notes
- [SOURCE] `phase11-bspwm-plan-20260525.md`, `day7.md` (Phase 11A–C).
- [REF] JustAGuyLinux bspwm-setup : <https://codeberg.org/justaguylinux/bspwm-setup>
  (**cloné en référence** à `~/GIT/bspwm-setup` ; feature « bspwm-tabs » **adoptée** depuis — ADR 0017).
- [INTEGRATION] Dépend de **STORY-010** (sxhkd pilote bspwm). Chapitre des arbitrages ouverts.

---

## STORY-012 : Chapitre 12 — Outillage IA

**En tant que** lecteur voulant intégrer un assistant IA à son flux terminal
**je veux** Claude Code natif + son intégration Neovim et une approche skills/marketplace
**afin de** gagner en productivité tout en gardant le contrôle (« style titux »).

### Acceptance Criteria
- [x] Couvre **Claude Code** en CLI et son installation/usage de base.
- [x] Couvre **`claudecode.nvim` installé en `vim.pack`** (cohérence avec ch. 9, pas lazy) et l'intégration
      des diffs nvim ↔ Claude.
- [x] Présente l'approche **skills / marketplace** (cycle brainstorm → plan → build → review) comme méthode,
      avec **liens externes** vers les toolkits de référence.
- [x] Énonce la contrainte transverse : les agents doivent **respecter les conventions** du poste (bun, scripts
      shell, outils terminal) plutôt qu'imposer leurs défauts.

### Edge Cases
- Distinguer ce qui est **généralisable** (méthode skills) de ce qui est **préférence perso** (toolkits précis).

### Notes
- [SOURCE] `day7.md` (Outillage IA).
- [INTEGRATION] Dépend de **STORY-009** (nvim/vim.pack). Chapitre de clôture.

---

## STORY-013 : Annexe A — Matériel ancien

**En tant que** lecteur ayant un matériel ancien (ou curieux des contraintes)
**je veux** un seul endroit qui regroupe les spécificités matérielles
**afin de** ne pas les retrouver disséminées et martelées dans tout le guide.

### Acceptance Criteria
- [x] Regroupe **en un seul endroit** : GPU **Intel HD 3000** (pas de compute shaders/Vulkan → Zed/Ghostty
      incompatibles ; Brave/Chromium avec `--disable-gpu-rasterization`), **clavier fr-mac**, **touches Apple**.
- [x] Chaque chapitre du corps ne fait que **renvoyer ici** (max une ligne sur place).
- [x] Cadre la chose comme **exemple de référence**, pas comme le sujet du guide.

### Edge Cases
- Ce qui est une **vraie limite matérielle** vs un simple réglage de contournement.

### Notes
- [INTEGRATION] Cible de tous les renvois « matériel ancien ». Référencée par ch. 6, 9, 11.

---

## STORY-014 : Annexe B — Décisions d'architecture (index ADR)

**En tant que** lecteur voulant comprendre les choix structurants
**je veux** un index des décisions figées sous forme d'ADR
**afin de** voir le contexte/décision/conséquences/alternatives de chaque choix non négociable.

### Acceptance Criteria
- [x] Index pointant vers les ADR de `docs/adr/` (un fichier par décision).
- [x] Couvre au minimum : **Ly**, **systemd-boot**, **zram**, **Timeshift-BTRFS**, **ESP-on-/boot +
      mkinitcpio vanilla**, **bun**, **outils terminal sur HD 3000**, **WireGuard wg-quick + killswitch**,
      **xss-lock**, **sxhkd daemon unique**, **split bash/env XDG**.
- [x] Chaque ADR suit le format Context → Décision → Conséquences → Alternatives.

### Edge Cases
- ADR à rationale faible (Ly, zram : choix de légèreté/contrainte de départ) : l'**assumer** comme tel,
  ne pas inventer de justification.

### Notes
- [SOURCE] `CLAUDE.md` (décisions figées) + journaux pour les rationales.
- [INTEGRATION] Catalogue détaillé dans `guide-migration-arch-btrfs-tiling.architecture.md` (§ ADRs).

---

## Ordre de dépendance (résumé)

```
001 (audit) → 002 (BTRFS) ⭐GATE → 003 (snapshots)
                          └→ 004 (boot) → 005 (récup, transversal)
                                        → 006 (bureau) → 007 (réseau/sécu)
                                                       → 008 (shell) → 009 (terminal) → 012 (IA)
                                        006 → 010 (sxhkd) → 011 (bspwm)
Annexes A (013) et B (014) : transversales, rédigées au fil des renvois.
```

**Règle de gate** : STORY-002 doit passer les critères transverses **avant** toute story ≥ 003.
