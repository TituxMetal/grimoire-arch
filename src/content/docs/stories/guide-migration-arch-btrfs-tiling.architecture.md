---
title: "Guide de migration Arch → BTRFS + station tiling — Architecture"
type: architecture
date: 2026-05-26
related:
  - ../brainstorms/2026-05-26-guide-migration-arch-btrfs-tiling-brainstorm.md
  - guide-migration-arch-btrfs-tiling.md
---


Ce document définit **comment** le guide est construit : le gabarit de chapitre (binding), les
exigences, le catalogue d'ADR (annexe B → `docs/adr/`), la structure de fichiers, la politique de
sourcing et la discipline d'intégrité factuelle. Il sert de **prompt d'implémentation** pour la
rédaction (manuelle ou via `marvin:work`).

> « Architecture » pour un livrable **documentaire** : il n'y a pas de code. Les sections du gabarit
> standard sont adaptées — *Dépendances* = sources officielles obligatoires, *Integration Pattern* =
> gabarit + cross-linking, *External Services* = références upstream, *Security* = **intégrité
> factuelle / anti-hallucination**.

---

## 1. Requirements

### Functional Requirements

- **FR-001** — Le guide couvre les **12 chapitres + 2 annexes** selon la TOC validée du brainstorm,
  un fichier markdown par chapitre dans `docs/guide/`.
- **FR-002** — Chaque chapitre applique le **gabarit** §4 (Objectif → Procédure → Décisions → Pièges).
- **FR-003** — Le guide documente l'**état corrigé/actuel** (§7, table des corrections), pas le brut
  des journaux.
- **FR-004** — Le guide est **machine-agnostique** : le MacBook Pro 2012 est cité **une fois** en intro
  comme exemple de référence ; le matériel ancien est **confiné à l'annexe A**.
- **FR-005** — Chaque décision figée fait l'objet d'un **ADR** dans `docs/adr/`, indexé par l'annexe B.
- **FR-006** — Un **index de navigation** (`docs/guide/README.md`) liste les chapitres dans l'ordre logique.
- **FR-007** — La **généralisation hors LVM** est notée dans les chapitres 2 et 4.

### Non-Functional Requirements

- **NFR-001 (intégrité/sourcing)** — Zéro affirmation non sourcée : doc officielle citée, **ou** étiquette
  explicite « **retour d'expérience** » (+ lien issue upstream si elle existe). C'est le NFR le plus critique
  (voir §7) — l'échec ici est exactement la faute de l'agent web précédent.
- **NFR-002 (propreté/ton)** — Aucune date, aucun « j'ai », pas de répétition matérielle, commandes =
  illustrations contextualisées.
- **NFR-003 (langue)** — Français.
- **NFR-004 (pérennité)** — Le *pourquoi* prime sur la commande exacte (qui périme avec les versions).
- **NFR-005 (séparation des genres)** — Les journaux `*.md` **restent intacts** (déplacés tels quels dans `archives/`, jamais réécrits) ; le guide
  vit dans `docs/`. On ne réécrit ni ne supprime les journaux.
- **NFR-006 (proof slice / gate)** — Le chapitre 2 doit passer NFR-001/002 **avant** la rédaction des
  chapitres ≥ 3 ; sinon le gabarit est corrigé d'abord.

---

## 2. Dépendances (sources obligatoires — BINDING)

Le « dépendances » d'un guide = les **sources que chaque chapitre DOIT mobiliser** au moment d'écrire
(pas en amont). Toute affirmation non couverte par une source ci-dessous porte l'étiquette « retour
d'expérience ».

| Chapitre | Sources officielles à citer | Source interne (journal) |
|---|---|---|
| 1 Audit | Arch Wiki : *General recommendations*, *Improving performance* ; `systemctl`, `systemd-analyze` | `btrfs-migration.md` (Phase 1) |
| 2 BTRFS | Arch Wiki : *Btrfs*, *Btrfs#Subvolumes*, *Btrfs#Mount options* ; `man mkinitcpio`, `man fstab` | `btrfs-migration.md` (Phase 2) |
| 3 Snapshots | Arch Wiki : *Timeshift*, *Pacman#Hooks* ; doc `timeshift-autosnap` | `btrfs-migration.md` (Phase 3) |
| 4 Boot | Arch Wiki : *systemd-boot*, *mkinitcpio*, *Microcode*, *Boot loader specification* ; `man kernel-install` | `btrfs-migration-day2.md` (7B), `btrfs-migration.md` (6) |
| 5 Récupération | Arch Wiki : *General troubleshooting*, *chroot*, *Pacman#Troubleshooting*, *Pacnew and Pacsave* | `btrfs-migration.md` (Phase 5) |
| 6 Bureau | Arch Wiki : *Ly*, *Xfce*, *NetworkManager*, *xss-lock* ; `man logind.conf` | `day5.md`, `day6.md`, `phase9-10` (9C) |
| 7 Réseau/sécu | Arch Wiki : *WireGuard*, *GnuPG*, *security#faillock* ; `man wg-quick`, `man pam_faillock` | `phase9-10-20260523.md` (10A) |
| 8 Shell | Arch Wiki : *Bash*, *XDG Base Directory* ; `man bash` (startup files) | `phase9-10`, `day6-2.md` |
| 9 Terminal | Arch Wiki : *Neovim*, *Alacritty*, *Firefox* ; doc kickstart.nvim ; projet betterfox | `day5.md`, `day6-2.md` |
| 10 Hotkeys | `man sxhkd`, `man sxhkdrc` ; Arch Wiki : *Sxhkd* | `day6.md`, `day7.md` (Leçons 13–14) |
| 11 bspwm | `man bspwm`, `man bspc` ; Wiki polybar ; Arch Wiki : *Bspwm* | `phase11-bspwm-plan-20260525.md`, `day7.md` |
| 12 IA | Doc officielle Claude Code ; dépôt `claudecode.nvim` ; toolkits skills | `day7.md` |
| Annexe A | Arch Wiki : *Intel graphics*, *Apple Keyboard* | `CLAUDE.md`, journaux divers |
| Annexe B | — (les ADR citent leurs propres sources) | `CLAUDE.md`, journaux |

---

## 3. Structure de fichiers

```
docs/
├── brainstorms/
│   └── 2026-05-26-guide-migration-arch-btrfs-tiling-brainstorm.md   (existant)
├── stories/
│   ├── guide-migration-arch-btrfs-tiling.md                         (ce lot de stories)
│   └── guide-migration-arch-btrfs-tiling.architecture.md            (ce document)
├── guide/
│   ├── README.md                 ← index de navigation (FR-006)
│   ├── 01-audit-baseline.md
│   ├── 02-ext4-vers-btrfs.md     ← ⭐ proof slice / gate
│   ├── 03-snapshots.md
│   ├── 04-boot-moderne.md
│   ├── 05-recuperation.md
│   ├── 06-bureau-xfce-ly.md
│   ├── 07-reseau-securite.md
│   ├── 08-shell-env-modulaire.md
│   ├── 09-outils-terminal.md
│   ├── 10-hotkeys-sxhkd.md
│   ├── 11-wm-bspwm-polybar.md
│   ├── 12-outillage-ia.md
│   ├── annexe-a-materiel-ancien.md
│   └── annexe-b-adr.md           ← index pointant vers docs/adr/
└── adr/
    ├── 0001-login-manager-ly.md
    ├── 0002-bootloader-systemd-boot.md
    ├── 0003-swap-zram.md
    ├── 0004-snapshots-timeshift-btrfs.md
    ├── 0005-esp-sur-boot-mkinitcpio-vanilla.md
    ├── 0006-runtime-js-bun.md
    ├── 0007-outils-terminal-hd3000.md
    ├── 0008-vpn-wireguard-wg-quick.md
    ├── 0009-lock-suspend-xss-lock.md
    ├── 0010-hotkeys-sxhkd-daemon-unique.md
    └── 0011-shell-env-modulaire-xdg.md
```

**Conventions :** un fichier par responsabilité, pas de god-file. Nommage `NN-slug.md` (ordre logique
porté par le numéro). ADR numérotés `NNNN-slug.md`. Les **journaux bruts restent intacts dans `archives/`** (NFR-005).

---

## 4. Integration Pattern — gabarit de chapitre (BINDING)

Chaque chapitre du corps (1–12) suit **exactement** cette structure. Annexes exceptées (format libre
mais mêmes NFR).

```markdown
# NN — <Titre>

## Objectif
<2–4 phrases : ce que le lecteur sait/peut faire après ce chapitre, et POURQUOI ce sujet compte
dans le rebuild. Pas de date, pas de "j'ai".>

## Procédure
<Le déroulé raisonné, ancré sur la doc officielle citée (§2). Les commandes sont des ILLUSTRATIONS
contextualisées — chacune précédée de ce qu'elle fait et pourquoi, jamais un bloc à copier tel quel.
Renvoyer aux UUID/identifiants comme "valeurs de référence" plutôt que les présenter comme à réutiliser.>

## Décisions & pourquoi
<Les choix structurants du chapitre. Pour une décision FIGÉE → renvoi vers son ADR (docs/adr/NNNN-…).
Pour un choix local → expliquer le tradeoff. C'est ici que vit la valeur "guide raisonné".>

## Pièges
<Liste de pièges, chacun au format :>
- **<Symptôme>** — <diagnostic> → <fix>. _[Source : Wiki/man OU « retour d'expérience »]_ <lien issue si existe>
```

### Règles de cross-linking
- Une story aval **référence** ses prérequis amont par leur titre de chapitre (pas par date).
- Tout renvoi « matériel ancien » pointe vers **annexe A** (max une ligne sur place — NFR-004/FR-004).
- Toute décision figée pointe vers son **ADR** (annexe B / `docs/adr/`).
- « Leçon portable » (seconde machine) : **une ligne max** par chapitre, uniquement si pertinent.

---

## 5. External References (pas de service tiers)

Un guide ne consomme pas d'API. Les « services externes » sont des **références upstream** à lier :

- **Arch Wiki**, **man pages locales** (bspwm, sxhkd, bspc, wg-quick…), **wiki polybar** — sources primaires.
- **betterfox** (durcissement Firefox) — projet externe, ch. 9.
- **JustAGuyLinux bspwm-setup** — <https://codeberg.org/justaguylinux/bspwm-setup> — **dépôt cloné en
  référence** à `~/GIT/bspwm-setup` (a servi à valider le modèle « un lanceur par WM »). Sa fonctionnalité
  d'onglets (« bspwm-tabs ») était notée « piste » au cadrage. *(Artefact 26/05 ; état réel post-01/06 :
  **adoptée** — ADR 0017, guide/11.)* Ne pas confondre dépôt-référence et feature en place.
- **Issues upstream** — à lier quand une étiquette « retour d'expérience » correspond à un bug connu
  (ex. Mason/bun, NM+wg-quick).

---

## 6. ADR Catalog (annexe B → `docs/adr/`)

> **Gel (artefact 26/05).** Ce catalogue fige les ADR **0001→0011** tels que connus au cadrage. Il n'est
> **pas** maintenu : l'**index à jour est `docs/guide/annexe-b-adr.md`** (qui inclut 0012→0017, ajoutés
> par enrichissement). En cas de divergence, l'annexe B fait foi.

Chaque entrée devient un fichier `docs/adr/NNNN-slug.md` au format **Context → Décision → Conséquences →
Alternatives**. Rationale tirée des journaux + `CLAUDE.md`. ⚠️ = rationale faible (choix de
départ/légèreté) : **à assumer comme tel**, ne pas inventer de justification (cf. NFR-001).

| ADR | Décision | Rationale exploitable | Source rationale |
|---|---|---|---|
| 0001 | **Ly** comme login manager (jamais LightDM) | ⚠️ Légèreté / contrainte de départ | `btrfs-migration.md`, `CLAUDE.md` |
| 0002 | **systemd-boot** (jamais GRUB) | ✅ Défaut moderne, kernel-install natif, ESP UEFI | `btrfs-migration.md` (Phase 6) |
| 0003 | **zram** (pas de swap disque) | ⚠️ Perf + ménager SSD ; rationale implicite | `btrfs-migration.md`, `CLAUDE.md` |
| 0004 | **Timeshift mode BTRFS** + autosnap + hook *Remove* | ✅ Snapshots atomiques, rollback ; autosnap ne couvre pas Remove | `btrfs-migration.md` (Phase 3) |
| 0005 | **ESP-on-/boot** + **mkinitcpio vanilla** (pas `kernel-install-mkinitcpio` AUR) | ✅ Vanilla Arch ; évite presets ESP-relatifs cassés ; `sd-vconsole` clarifie | `btrfs-migration-day2.md` (7B) |
| 0006 | **bun** runtime/PM JS ; npm = béquille Mason seulement | ✅ Perf + philosophie ; Mason ne sait pas utiliser bun (issue upstream) | `CLAUDE.md`, `day5.md` |
| 0007 | **Outils terminal sur HD 3000** (pas Zed/Ghostty) | ✅ Contrainte matérielle : pas de compute shaders/Vulkan | `CLAUDE.md`, `day5.md` |
| 0008 | **WireGuard wg-quick** full-tunnel + killswitch (pas NM) | ✅ NM+wg-quick désync ; wg-quick scriptable + openresolv | `phase9-10` (10A) |
| 0009 | **xss-lock** + script `~/bin/lock` (lock avant suspend) | ✅ Portable tous WM, basé logind, préemption suspend | `phase9-10` (9C) |
| 0010 | **sxhkd daemon unique**, split commun/par-WM | ✅ bspwm sans keybindings internes ; réutilisation, pas de conflit inter-WM | `phase11-bspwm-plan`, `day7.md` |
| 0011 | **Shell/env modulaire XDG** (`~/.config/{bash,env}/NN-*`) | ✅ Portabilité, activation sélective vs monolithique | `phase9-10` |

---

## 7. Intégrité factuelle (équivalent « Security » — RISQUE PRINCIPAL)

Le risque dominant n'est pas une faille mais une **affirmation fausse présentée comme un fait** — c'est
ce qui a coulé la tentative de l'agent web. Discipline obligatoire :

1. **Toute affirmation est sourcée ou étiquetée** (NFR-001). Pas d'entre-deux.
2. **On documente l'état corrigé**, pas le brut des journaux. Corrections connues à appliquer :

**Hiérarchie des sources de vérité** : `journaux (périmables) < config vivante (~/.config) < spec (le guide)`.
Quand un journal et la config vivante divergent, **la config vivante fait foi** pour l'état actuel ; le
guide, lui, est la cible raisonnée (il peut même corriger la config). Source primaire pour les ch. 10-11 :
`docs/findings/2026-05-26-bspwm-polybar-sxhkd.md` (investigation datée, plus à jour que `day7.md`).

| Point | Ce que disent (parfois) les journaux | État correct à documenter (vérifié config vivante) |
|---|---|---|
| `single_monocle` | `day7.md` PENDING dit « écarté » | **Activé (`true`)**, choix délibéré — `bspwmrc:26`. Le PENDING day7 est **périmé**. |
| Règle flottante Timeshift | classe `Timeshift` | classe **`Timeshift-gtk`** (via `xprop WM_CLASS`) — `day7.md` |
| Focus WM | k/l/o/m (héritage i3) | **`h/j/k/l`** vim-like (Q7, assumé) — `sxhkdrc-bspwm` |
| Lanceur sxhkd | `.xprofile` lance sxhkd **et** `bspwmrc` le relance (course) | **Un seul lanceur par WM** : sxhkd lancé dans le **rc du WM**, **retiré de `.xprofile`** (fix décidé, findings §2). `pkill`+boucle d'attente réservés au **rechargement**. |
| JAGL bspwm-setup | « dépôt cloné » (brainstorm) | **Cloné** à `~/GIT/bspwm-setup` (référence réelle). Les **onglets `bspwm-tabs`** étaient « piste reportée » au cadrage → *adoptés depuis (post-01/06 : ADR 0017, guide/11)*. Ne pas confondre dépôt-référence et feature-implémentée. |
| Noms de bureaux polybar | habitude i3 `numéro:nom` | Noms **sans `:`** dans `bspwmrc` ; afficher l'index via le format polybar **`%index%:%name%`** (le `:` est rendu, pas stocké) — findings §4. |
| Autostart i3 | présenté comme uniforme | **Incohérence connue** : i3 n'a pas `dex -a` → nm-applet/xss-lock/vpn non auto-lancés sous i3. Modèle cible : `dex -a -e <wm>` sur chaque WM — findings §6. |
| Hook plugin marvin | — | hors périmètre guide (détail outillage local, pas une leçon de migration) |

3. **Étiquetage « retour d'expérience »** réservé aux mesures/tests réels (bench boot, perfs driver,
   pkg-vide, sed silencieux, fr-mac, NM+wg-quick). Joindre le lien issue upstream s'il existe.
4. **Pas de chiffre universel** : un gain mesuré (ex. temps de boot) est un exemple daté du matériel de
   référence, présenté comme tel, jamais comme une garantie générale.

---

## 8. Plan d'exécution (ordre de rédaction)

1. **Scaffold docs/** : créer `docs/guide/` et `docs/adr/` + `docs/guide/README.md` (index).
2. **Chapitre 1** (court, met le ton) puis **chapitre 2 = proof slice**.
3. **GATE** : valider le ch. 2 contre les critères transverses (stories) + NFR-001/002. Si échec →
   corriger le gabarit §4 avant de continuer.
4. Après validation : chapitres **3 → 12** dans l'ordre de dépendance, ADR rédigés au fil des renvois
   (un ADR dès qu'un chapitre le référence).
5. **Annexes A & B** consolidées à la fin (elles agrègent des renvois disséminés).

> Implémentation possible via `marvin:work` sur ces stories, ou rédaction manuelle. Quoi qu'il arrive,
> le **gate du ch. 2** est non négociable (NFR-006).

## 9. Validation (avant de livrer un chapitre)

- [ ] Gabarit §4 respecté (4 sections).
- [ ] Tous les critères transverses des stories passent.
- [ ] Chaque affirmation : source officielle **ou** étiquette « retour d'expérience ».
- [ ] Renvois matériel → annexe A ; décisions figées → ADR ; leçon portable ≤ 1 ligne.
- [ ] Corrections §7 appliquées (rien du brut faux n'est propagé).
