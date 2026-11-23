# Appli Poutre

Application mobile (Android et iPhone) de la poutre d'escalade instrumentée. Elle se connecte à la planche en Bluetooth, mesure la force des doigts, propose des plans d'entraînement adaptés au niveau et suit la progression au fil du temps.

## Ce que fait l'appli

- **Connexion Bluetooth** à la planche, ou **simulateur** pour tout essayer sans matériel.
- **Test de force** : bras gauche, bras droit ou les deux, sur la prise de son choix.
  - « Force max » : on tire le plus fort possible pendant 7 s (réglable).
  - « Tenir le plus longtemps » : on mesure le temps de suspension.
  - Résultat : force max, force moyenne, % du poids de corps, temps, et dissymétrie gauche/droite.
- **Plans d'entraînement** : Découverte, Repeaters 7/3, Suspensions longues, Force max, Petites réglettes, Rééquilibrage. Pour chaque exercice : la prise à utiliser, la façon de placer les doigts, la durée, le repos et la **zone de force à viser** (affichée en vert pendant la suspension).
- **Adaptation automatique** :
  - le niveau est calculé à partir de la force max en % du poids de corps ;
  - les charges visées sont recalculées après chaque test ;
  - après chaque séance, le ressenti (trop facile / bien / trop dur) fait monter ou baisser la charge suivante ;
  - si la dissymétrie dépasse 10 %, un plan de rééquilibrage est proposé.
- **Profil** stocké sur le téléphone (pas de compte en ligne) : historique des tests et graphique de progression par main et par prise.

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

Dans l'appli, allez dans **Se connecter → Utiliser le simulateur**. Le simulateur imite la planche : la force monte toute seule pendant les tests et les suspensions.

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
  app/        les écrans (accueil, connexion, test, entraînement, séance, profil, réglages)
  core/       les calculs, sans écran : forces, analyse d'une suspension, niveaux, plans, adaptation
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
