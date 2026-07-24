---
title: "Coulisses — journal du projet"
---

Les Coulisses sont le **journal de bord** du projet de migration, pas du guide lui-même. On
y trouve les traces brutes du raisonnement : ce qui a été envisagé, testé, décidé, et
parfois abandonné. Chaque artefact est daté et figé — il témoigne de l'état des
connaissances au moment où il a été écrit.

Contrairement au [Guide](/grimoire-arch/guide/) qui raconte une histoire linéaire, les
Coulisses sont un **référentiel** où chaque dossier remplit un rôle précis dans le cycle de
vie d'une idée.

## Ce que contient chaque section

**Brainstorms** — Exploration ouverte d'un problème, avant toute décision. Plusieurs pistes
coexistent, les questions restent parfois sans réponse. On y arrive quand on ne sait pas
encore *quoi* construire.

**Findings** — Constat ou diagnostic après investigation. Un finding répond à une question
précise par de l'observation ou du test. Il ne propose pas de solution, il établit un fait.

**Plans** — Décomposition d'un travail en unités vérifiables. Chaque plan est daté, porte
un contrat de produit, et liste ce qui est dedans et dehors. C'est le « quoi faire » avant
le « comment ».

**Solutions** — Correctif documenté sous forme problème → cause → remède. Une solution
émerge d'un finding ou d'un plan, et capture ce qu'il faut savoir pour ne pas retomber dans
le même piège.

**Stories** — Récit utilisateur et architecture d'une fonctionnalité. Les stories sont le
pont entre le brainstorming (quoi) et les ADR (décisions d'architecture).

**Décisions (ADR)** — Décision d'architecture irréversible ou coûteuse à changer, avec son
contexte, ses alternatives envisagées, et ses conséquences. Numérotées, immuables.
