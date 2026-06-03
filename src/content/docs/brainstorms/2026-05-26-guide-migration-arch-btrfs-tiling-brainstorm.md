---
title: "Guide de migration Arch → BTRFS + station tiling"
type: brainstorm
date: 2026-05-26
participants: [titux, Claude]
related:
  - btrfs-migration.md
  - btrfs-migration-day2.md
  - phase9-10-20260523.md
  - day5.md
  - day6.md
  - day6-2.md
  - day7.md
  - PERFS-BENCHMARK.md
---


## Problem Statement

Le repo `~/migration-backup` contient **8 journaux chronologiques** retraçant le rebuild complet
d'une machine (migration ext4/LVM → BTRFS, boot moderne, snapshots, bureau, réseau/sécurité, shell,
outils terminal, WM tiling, outillage IA). Ces journaux sont une **trace personnelle** : datés,
bruités (mentions répétées de la seconde machine et du GPU ancien, TODO « à valider au reboot »,
bribes de conversation), parfois **dépassés ou faux** au regard de l'état actuel du système.

Une tentative antérieure de documentation par un agent web a produit du contenu **halluciné**.

**Le vrai besoin** : transformer cette matière en une **vraie doc de référence**, orientée lecteur,
ancrée dans la doc officielle, débarrassée du bruit perso — exploitable par quelqu'un qui referait
ce type de chantier, sans répéter les erreurs déjà commises.

## Context

- **Prior art interne** : les 8 journaux (lus intégralement cette session) + le dépôt cloné
  `~/GIT/bspwm-setup` (JustAGuyLinux) + les contraintes figées de `CLAUDE.md`. **Aucun** `docs/`
  préexistant, aucune doc structurée antérieure.
- **Ancrage officiel** : man pages locales (bspwm, sxhkd, bspc) + wikis (Arch, polybar). À mobiliser
  **par chapitre, au moment d'écrire** (pas en amont).
- **État courant ≠ journaux** : plusieurs points ont divergé (config bspwm éditée, `single_monocle`
  incohérent avec le journal, bug clavier au reboot, hook plugin marvin neutralisé). Le guide doit
  refléter l'état **corrigé**.

## Chosen Approach

**Guide raisonné**, machine-agnostique, dans une arborescence `docs/` neuve :

- `docs/guide/` — un fichier markdown **par chapitre** (12 chapitres + 2 annexes).
- `docs/adr/` — les décisions d'architecture figées sous forme d'ADR (annexe B éclatée en fichiers).
- Les journaux `*.md` **restent à la racine** comme trace personnelle (séparation nette des deux genres).

Chaque chapitre suit le même gabarit : **Objectif → Procédure (ancrée doc officielle) → Décisions &
pourquoi → Pièges (avec issue/fix)**. Les commandes sont des **illustrations**, pas un script à copier.

## Why This Approach

- **Guide raisonné** plutôt que tutoriel pas-à-pas : explique le *pourquoi*, vieillit mieux (les
  commandes exactes périment avec les versions), transmet les décisions — c'est ce qui manquait.
- **Machine-agnostique** : les leçons (BTRFS, boot, snapshots, sécurité, WM) valent indépendamment
  du matériel. Le MacBook 2012 n'est qu'un **exemple de référence**, cité une fois en intro.
- **`docs/guide/` séparé des journaux** : on ne détruit pas la trace brute, et on ne pollue pas la
  doc propre avec le perso.

## Subjective Contract

- **Target outcome** : un guide qu'un utilisateur Arch lambda peut suivre pour migrer une install
  existante vers BTRFS et reconstruire une station tiling, en comprenant chaque décision.
- **Anti-goals** : pas un journal ; pas un récit perso ; pas un copier-coller de commandes ; pas une
  doc centrée matériel ; pas d'affirmation non sourcée présentée comme un fait.
- **References** : doc officielle (wiki Arch, man bspwm/sxhkd, wiki polybar), `~/GIT/bspwm-setup`.
- **Anti-references** : les journaux bruités eux-mêmes (ton, datation, TODO) ; la doc hallucinée de
  l'agent web précédent.
- **Règles de propreté** :
  - La seconde machine n'apparaît **pas** en boucle → au plus **une ligne « leçon portable »** par
    chapitre si pertinent.
  - Le matériel ancien (GPU, clavier fr-mac, touches Apple) est **confiné à l'annexe A** + une mention
    unique en intro. Jamais martelé.
  - **Supprimer** : dates/heures, « à valider au reboot », bribes de conversation, TODO perso.
  - **Sourcing** : doc officielle quand elle s'applique ; sinon étiquette explicite
    **« retour d'expérience »** (mesure/test) + lien issue upstream si elle existe.
- **Rejection criteria** (le résultat est mauvais si) : on y trouve une date, un « j'ai », un
  paragraphe sur le CPU répété, une commande sans contexte, ou une affirmation technique sans source
  ni étiquette « retour d'expérience ».
- **Langue** : français.

## Preview And Proof Slice

- **Proof slice** : le **chapitre 2 (ext4 → BTRFS à subvolumes)**. C'est le cœur technique et le
  chapitre le plus dense en *décisions* et *pièges* — donc le meilleur banc d'essai pour le gabarit
  **Objectif → Procédure → Décisions & pourquoi → Pièges (issue/fix)** et pour le ton (sourcing,
  zéro bruit perso).
- **Artefact de preuve** : le chapitre 2 rédigé en entier sert d'artefact. Pas de mockup séparé : le
  livrable étant du markdown, le chapitre lui-même *est* le preview.
- **Critère de passage** : le chapitre 2 doit franchir les **Rejection criteria** du contrat subjectif
  (aucune date, aucun « j'ai », aucun paragraphe matériel répété, aucune commande sans contexte, aucune
  affirmation sans source ni étiquette « retour d'expérience ») **et** appliquer proprement le gabarit.
- **Rollout rule** : on ne propage le gabarit aux chapitres 3→12 (+ annexes) **qu'après** validation du
  chapitre 2. Si le slice échoue aux critères, on corrige le gabarit avant d'écrire la suite.
- **Réconciliation avec Q5** : l'ordre d'écriture reste 1→12. Le chapitre 1 (audit/baseline, court) peut
  être rédigé d'abord, mais c'est le **chapitre 2 qui fait office de gate** : tant qu'il n'a pas passé les
  critères de rejet, on n'enchaîne pas les chapitres 3+. Le proof slice est un **point de validation**,
  pas une rupture de l'ordre.

## Structure (table des matières validée)

1. Audit & baseline (nettoyage, services, NVRAM, méthode de bench)
2. ext4 → BTRFS à subvolumes (filet de sécurité, subvolumes, mount opts, fstab, BLS)
3. Snapshots (Timeshift BTRFS + autosnap + hook *Remove*)
4. Boot moderne (ESP-on-/boot, mkinitcpio vanilla, hook microcode, BLS systemd-boot)
5. Quand ça casse : récupération (live USB, chroot, libgcc, pkg-vide 2-3 Ko, sed silencieux, .pacnew)
6. Bureau (XFCE + Ly, NetworkManager, suspend/lock cohérent via xss-lock)
7. Réseau & sécurité (WireGuard wg-quick + killswitch, GPG agent + pinentry, faillock)
8. Shell & env modulaire (split XDG `~/.config/{bash,env}/NN-*`)
9. Outils terminal (nvim kickstart + vim.pack, fonts, alacritty, durcissement Firefox ESR + betterfox)
10. Hotkeys portables (xbindkeys → sxhkd, modèle **un lanceur par WM**)
11. WM tiling : i3 → bspwm + polybar  ← chapitre des arbitrages ouverts
12. Outillage IA (Claude Code natif, claudecode.nvim en vim.pack, skills/marketplace)
- **Annexe A** : matériel ancien (HD 3000, clavier fr-mac, touches Apple) — une seule fois
- **Annexe B** : décisions d'architecture figées = ADRs (Ly, systemd-boot, zram, bun, Timeshift BTRFS, ESP-on-/boot…)

## Key Design Decisions

### Q1 : Nature du document — RÉSOLU
**Décision :** guide raisonné (objectif/procédure/décisions/pièges).
**Rationale :** explique le pourquoi, vieillit bien, transmet les décisions.
**Alternatives rejetées :** tutoriel pas-à-pas (fragile aux versions, n'explique rien) ; référence/
playbook pur (moins narratif, moins pédagogique pour qui découvre).

### Q2 : Cadrage d'audience — RÉSOLU
**Décision :** machine-agnostique ; cible = utilisateur Arch migrant une install existante vers BTRFS
+ station tiling. Le MacBook Pro 2012 = exemple de référence cité une fois.
**Rationale :** les leçons valent indépendamment du matériel ; cadrer sur « vieux Mac » reproduisait
exactement le bruit matériel à bannir.
**Alternatives rejetées :** guide centré « rebuild d'un vieux Mac » (narcissique au matériel, audience
trop étroite).

### Q3 : Politique de sourcing — RÉSOLU
**Décision :** doc officielle où elle s'applique ; sinon étiquette « retour d'expérience » + issue
upstream si elle existe.
**Rationale :** honnête et traçable ; ne prétend pas à une autorité officielle absente.
**Alternatives rejetées :** « officiel uniquement » (perd des leçons durement acquises : pkg-vide,
fr-mac, perfs driver, sed silencieux).

### Q4 : Emplacement & sort des journaux — RÉSOLU
**Décision :** guide dans `docs/guide/` (1 fichier/chapitre) + `docs/adr/` ; journaux conservés à la racine.
**Rationale :** sépare les deux genres ; préserve la trace brute.
**Alternatives rejetées :** fichier unique racine (peu navigable) ; remplacer les journaux (perte de
contexte).

### Q5 : Ordre d'écriture — RÉSOLU
**Décision :** depuis le chapitre 1, dans l'ordre.
**Rationale :** capturer les leçons fondatrices pour ne pas refaire les erreurs ; un guide qui démarre
au WM est inutile.
**Alternatives rejetées :** commencer par le chapitre 11 (travail vivant) — rejeté par titux.

### Q6 : Distillation corrigée, pas transcription — RÉSOLU
**Décision :** le guide documente l'état **correct/actuel**, pas le contenu brut des journaux.
**Rationale :** plusieurs points ont divergé ou sont faux (`single_monocle` activé alors que le journal
le dit écarté, bug clavier au reboot, classe de règle `Timeshift-gtk`). Transcrire propagerait les erreurs.
**Alternatives rejetées :** transcription fidèle (propage bugs et incohérences).

### Q7 : Touches de focus/déplacement du WM — RÉSOLU
**Décision :** sous bspwm, **garder les touches vim canoniques `h/j/k/l`** (ouest/sud/nord/est), telles
qu'actuellement dans `sxhkdrc-bspwm`. NE PAS reprendre le mapping i3 idiosyncrasique k/l/o/m. Les bons
keybindings repris de JAGL sont adaptés en `h/j/k/l`.
**Rationale :** choix délibéré pour le nouveau WM — `h/j/k/l` est la convention vim standard, et les
touches sont adjacentes sur la rangée de repère AZERTY fr-mac (`q s d f g h j k l m`). L'écart avec le
k/l/o/m de l'i3 historique est **assumé**, ce n'est pas un bug.
**Alternatives rejetées :** répliquer le k/l/o/m d'i3 (préférence explicite pour le vim-like sur bspwm).

## Open Questions

À résoudre au moment d'écrire chaque chapitre (pas maintenant) :

- **Généralisation LVM** : l'exemple est sur LVM ; noter comment adapter pour une install sans LVM (ch. 2/4).
- **Touches de focus/déplacement : RÉSOLU** → `h/j/k/l` vim-like conservé (voir Q7). Plus à arbitrer.
- **Arbitrages bspwm (chapitre 11)** — à trancher en live à l'arrivée du chapitre :
  - resize (absent) ; drag souris flottantes (`pointer_modifier`) ; scratchpad ;
  - layout stacked/tabbed (tiling pur → `bspwm-tabs` de JAGL ou modèle monocle) ;
  - split-direction preselect ; focus tiling↔floating ; workspace next/prev + back_and_forth ;
  - règles assign app→desktop ; règles floating (limite bspwm : classe/nom, pas `window_role`) ;
  - 10 vs 12 bureaux ; rendu polybar `%index%:%name%`.
- **Bug clavier au reboot** : confirmer la course de process (test `pgrep -a sxhkd` post-reboot) — sera
  traité comme correctif au chapitre 10/11.

## Out of Scope

- Refaire la migration (elle est faite ; on documente).
- La migration de la seconde machine (hors périmètre doc).
- Compositeur picom (écarté sur le matériel de référence).
- Suppression du filet de sécurité ext4 (phase ultérieure conditionnée).

## Next Steps

- `deep-thought:architect` sur ce brainstorm pour produire le **spec/architecture** : gabarit de
  chapitre détaillé + liste d'ADR (annexe B), puis le plan d'écriture chapitre par chapitre.
- **Premier livrable concret = proof slice du chapitre 2 (BTRFS)**, validé contre les *Rejection
  criteria* avant de propager le gabarit aux chapitres 3→12 (voir « Preview And Proof Slice »).
- Candidat `/compound` : le modèle « un lanceur sxhkd par WM » et le diagnostic « pkg-vide 2-3 Ko »
  sont des patterns réutilisables.
