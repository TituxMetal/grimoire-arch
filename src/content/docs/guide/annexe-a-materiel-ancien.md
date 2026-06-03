---
title: "Annexe A — Matériel ancien"
---

Cette annexe regroupe **en un seul endroit** les spécificités liées à du matériel ancien, pour que le
corps du guide n'ait qu'à y renvoyer (au plus une ligne sur place). Le matériel de référence est un
ordinateur portable de 2012 (GPU Intel HD 3000 « Sandy Bridge », clavier AZERTY variant Apple) ; les
contraintes ci-dessous valent pour toute machine de cette génération.

## GPU Intel HD 3000 — pas de compute shaders, pas de Vulkan

Le HD 3000 (2011) est **sous la barre** des GPU exigés par les applications de rendu moderne : il n'a ni
compute shaders ni pilote Vulkan. Conséquences concrètes :

- **Éditeurs GPU-accélérés incompatibles (limite dure).** Les éditeurs à moteur GPU (type GPUI/wgpu) ou
  les émulateurs GTK4 accélérés échouent au lancement : wgpu ne peut créer aucun device
  (`Limit 'max_compute_workgroups_per_dimension' value … is better than allowed 0`). Ce n'est **pas** un
  problème de configuration — c'est une limite matérielle. Sur ce type de machine, l'édition passe par
  des **outils terminal** (Neovim), qui ignorent le GPU. → chapitre 9, `docs/adr/0007-outils-terminal-hd3000.md`.

- **Compositeur picom : OK — la limite ne le concerne pas.** picom (backend **`glx`**) n'utilise que de
  l'**OpenGL classique** (GL 3.1), pas Vulkan ni compute shaders : il tourne proprement sur ce GPU (fondu,
  ombres, coins arrondis). C'est ce qui rend possibles ici le **fondu inter-bureaux** et les **coins
  arrondis**. ⚠️ Les coins arrondis **exigent `glx`** — le backend `xrender` ne les rend pas (vérifié 30/05 :
  xrender → coins carrés). Adopté comme compositeur local à bspwm. → chapitre 11
  (« Compositeur (picom) — retenu »), `docs/adr/0007-outils-terminal-hd3000.md`. _(retour d'expérience.)_

- **Chromium/Brave : rastérisation des glyphes à désactiver.** Le navigateur tente d'accélérer le rendu
  des glyphes via le GPU, produisant du texte illisible. Contournement chirurgical (garde le décodage
  vidéo et la composition, coupe seulement la rastérisation) :

  ```sh
  printf -- '--disable-gpu-rasterization\n' >> ~/.config/brave-flags.conf
  ```

  Si insuffisant un jour, `--disable-gpu` complet dans le même fichier. _(retour d'expérience — même
  cause matérielle que les éditeurs GPU, mais contournable ici.)_

- **Pilote X : `intel` plutôt que `modesetting`.** Sur ce GPU, le pilote `xf86-video-intel` initialise le
  serveur X plus vite que le `modesetting` générique (écart mesuré ~1,4 s sur le matériel de référence).
  Garder la config `modesetting` désactivée mais récupérable, pour revenir en cas de tearing. _(retour
  d'expérience.)_

- **Pas de firmware GPU.** Le i915 de cette génération est antérieur à GuC/HuC/DMC : aucun firmware GPU à
  charger (utile à savoir lors du nettoyage de `linux-firmware`, chapitre 9 / récupération).

## Firmware : ne garder que le matériel présent

Sur une machine ancienne et bien identifiée, le méta-paquet `linux-firmware` tire des firmwares de
matériel absent (datacenter, autres GPU). Après **vérification matérielle complète** (Wi-Fi, Bluetooth,
audio, GPU, périphériques), on peut marquer les firmwares utiles comme explicites puis retirer le méta et
les inutiles. _(retour d'expérience — vérifier avant de retirer, le filet ext4 reste la sécurité.)_

## Clavier AZERTY variant Apple (fr-mac)

- **sxhkd : différencier symboles (au repos) et chiffres (au Shift).** Sur fr-mac, la rangée du haut
  donne les **symboles** au repos (`& é " ' ( § è ! ç à ) -`) et les **chiffres** au niveau **Shift**.
  Ce n'est **pas** « ne pas binder les chiffres » — on binde bien la rangée, il faut juste le **bon
  keysym** : *aller au bureau* = `super + {ampersand,eacute,…}` (symboles, au repos) ; *envoyer au
  bureau* = `super + shift + {1-9,0}` (le Shift produit le chiffre). Écueil : `super + 1` n'est pas un
  chord simple — produire `1` exige Shift, donc ça équivaut à `super + shift + ampersand`. **Différence
  avec i3** : i3 grabbe par *keycode*, donc ses `$mod+1` marchent sans Shift — d'où la fausse intuition
  que « les chiffres marchent pareil ». → chapitres 10 et 11. _(retour d'expérience.)_

## Touches Apple : F7-F12 et Fn muettes

Sur ce clavier, **F7-F12 et Fn n'émettent aucun keysym X11** (comportement `hid_apple` connu) : les
binds média correspondants (play/next/prev) restent dormants. F1/F2 (luminosité écran) et F5/F6
(rétroéclairage clavier) émettent bien leurs keysym `XF86`. Réveiller F7-F12 via `hid_apple fnmode` est
possible mais optionnel et non garanti. La luminosité matérielle se pilote via
`/sys/class/backlight/intel_backlight` et `/sys/class/leds/…kbd_backlight` (`brightnessctl`, après
`usermod -aG video`). _(retour d'expérience.)_

## Synthèse

Le matériel ancien n'est pas le sujet du guide — c'est un **exemple de référence**. Tout ce qui précède
se résume à une règle : **privilégier les outils qui ignorent le GPU** et **traiter le clavier par ses
keysym réels**. Le reste du guide est valable indépendamment de ce matériel.
