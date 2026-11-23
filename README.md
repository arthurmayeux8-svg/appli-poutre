# Appli Poutre

Application mobile (Android et iPhone) de la poutre d'escalade instrumentée. Elle se connecte à la planche en Bluetooth, mesure la force des doigts, propose des plans d'entraînement adaptés au niveau et suit la progression au fil du temps.

## Ouvrir le site

**https://arthurmayeux8-svg.github.io/appli-poutre/** : rien à installer.

- Pour se connecter à la planche en Bluetooth : **Chrome** sur Android ou ordinateur, **Bluefy** (gratuit) sur iPhone.
- Sans planche, le simulateur se connecte tout seul.
- Toute la documentation du projet (décisions, câblage, mise en route, glossaire) est dans [docs/](docs/README.md).

## Ce que fait l'appli

L'appli a trois onglets en bas, et une roue dentée en haut à droite pour les paramètres.

- **Accueil** : le **score de grimpe de 1 à 10** et sa courbe de progression, et un aperçu de l'**entraînement du jour**.
- **Séance** : la séance du jour en détail (prise, placement des doigts, durées, charge visée), les **séances à venir** (une séance un jour sur deux, en alternant les plans conseillés), les dernières séances faites et les autres plans. Pendant la séance, l'appli enchaîne suspensions et repos et affiche la **zone de force à viser**, qui passe au vert.
- **Test de force** : bras gauche, bras droit ou les deux, sur la prise de son choix.
  - « Force max » : on tire le plus fort possible pendant 7 s (réglable). C'est ce test qui met à jour le score.
  - « Tenir le plus longtemps » : on mesure le temps de suspension.
  - L'onglet montre aussi un graphique main gauche / main droite et l'historique des tests.
- **Paramètres** : profil (nom, poids), connexion à la planche ou au simulateur, réglages de la planche (capteurs, prises, seuil), et données (démo, tout effacer).

### Le score de 1 à 10

Il vient de la force max à deux mains (ou bras gauche + bras droit), en % du poids de corps, ramenée à une réglette de 20 mm :
60 % du poids ou moins = 1, 100 % = 4, 130 % = 6,3, 160 % = 8,5, 180 % ou plus = 10.
Débutant en dessous de 4, intermédiaire de 4 à 6,3, confirmé de 6,3 à 8,5, expert au-delà. Les valeurs sont dans `src/core/score.ts`.

### L'adaptation automatique

- Les plans conseillés dépendent du niveau ; un plan de rééquilibrage s'ajoute si la dissymétrie dépasse 10 %.
- Les charges visées sont recalculées après chaque test de force.
- Après chaque séance, le ressenti (trop facile / bien / trop dur) fait monter ou baisser la charge suivante.

### Le simulateur

Tant que la planche n'existe pas, le **simulateur** la remplace. Il se connecte tout seul au lancement (réglable dans les paramètres). Un grimpeur virtuel se suspend automatiquement pendant les tests et les séances : il tire environ 115 % de son poids en force max, sa main gauche est un peu plus faible, et il lâche au bout de 15 à 35 s au test « tenir le plus longtemps ». Dans les paramètres, le bouton **Maintenir pour se suspendre** le fait se suspendre à la main.

Pour voir tout de suite les graphiques, **Paramètres → Charger 3 mois de démo** remplit l'historique avec un grimpeur fictif qui progresse.

## Lancer l'appli (sans la planche)

Il faut une seule fois installer **Node.js** (version 20 ou plus) depuis [nodejs.org](https://nodejs.org), et l'appli **Expo Go** sur le téléphone (App Store ou Google Play).

Ensuite, dans un terminal :

```bash
git clone https://github.com/arthurmayeux8-svg/appli-poutre.git
cd appli-poutre
npm install        # télécharge les bibliothèques (une seule fois)
npm start          # lance l'appli
```

Un QR code s'affiche :

- **Android** : ouvrez Expo Go et scannez le QR code.
- **iPhone** : scannez le QR code avec l'appareil photo.
- **Ordinateur** : appuyez sur la touche `w` pour l'ouvrir dans le navigateur.

Le simulateur se connecte tout seul : vous pouvez directement faire un test de force ou une séance.

## Utiliser la vraie planche (Bluetooth)

Expo Go ne contient pas le Bluetooth. Il faut donc installer une version « développement » de l'appli, qui contient le Bluetooth. Deux possibilités :

- **Avec un compte Expo (gratuit), sans rien installer de plus** :
  ```bash
  npx eas-cli@latest build --profile development --platform android
  ```
  Expo fabrique l'appli en ligne et donne un lien pour l'installer sur le téléphone. Pour l'iPhone (`--platform ios`), il faut un compte développeur Apple.
- **Sur l'ordinateur, téléphone branché en USB** : `npx expo run:android` (nécessite Android Studio) ou `npx expo run:ios` (nécessite un Mac avec Xcode).

Une fois cette version installée, `npm start` la relie à votre code comme avec Expo Go.

## Côté Arduino

Deux programmes prêts à l'emploi dans le dossier `arduino/`, au choix selon la carte :

| Carte | Programme | Bluetooth |
|---|---|---|
| Arduino UNO ou Nano | `arduino/poutre_hm10` | module **HM-10** à ajouter (pas un HC-05 : il ne marche pas avec l'iPhone) |
| Arduino Nano 33 BLE, Nano 33 IoT, UNO R4 WiFi | `arduino/poutre_ble` | intégré à la carte |

Les branchements sont décrits en haut de chaque programme. Dans le programme, réglez `NB_CAPTEURS` (1 à 4). Puis, dans l'appli, écran **Réglages**, indiquez le même nombre de capteurs et le côté de chacun.

### Étalonner les capteurs

Chaque capteur a un « facteur d'étalonnage » qui transforme sa mesure brute en grammes :

1. Mettez `FACTEURS[i] = 1.0` pour le capteur, téléversez, ouvrez le moniteur série.
2. Planche vide, puis posez un poids connu (par exemple 5 000 g) sur ce capteur.
3. Facteur = valeur affichée ÷ 5 000. Reportez-le dans `FACTEURS[i]` et téléversez à nouveau.

Le format exact des messages échangés est décrit dans [docs/protocole.md](docs/protocole.md).

## Organisation du code

```
src/
  app/        les écrans : (onglets)/ = Accueil, Séance, Test ; parametres ; plan/[id] = déroulé d'une séance
  core/       les calculs, sans écran : forces, analyse, score, plans, programme, adaptation, démo
  ble/        la connexion Bluetooth et le simulateur
  state/      les données partagées (profil, réglages, historique, connexion)
  ui/         les éléments visuels réutilisés (boutons, jauge de force, graphique)
arduino/      les programmes pour la carte
docs/         le protocole d'échange
```

Pour changer de carte, seul `src/ble/bluetooth.ts` peut être concerné, et seulement si la nouvelle carte utilise d'autres identifiants Bluetooth que `FFE0` / `FFE1`.

Les plans, les seuils de niveau et les règles d'adaptation sont dans `src/core/plans.ts` : c'est là qu'il faut aller pour les modifier.

## Vérifier le code

```bash
npm test             # tests automatiques des calculs
npm run typecheck    # vérification des types TypeScript
```

## Précautions

Les plans proposés sont des points de départ. Échauffez-vous toujours avant de vous suspendre, et arrêtez à la moindre douleur dans un doigt. L'entraînement sur poutre est déconseillé aux grimpeurs qui débutent l'escalade depuis moins d'un an.
