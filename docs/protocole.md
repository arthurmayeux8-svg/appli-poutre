# Protocole d'échange planche ↔ appli

C'est le « langage » commun entre la carte Arduino et l'appli. Tant qu'une carte respecte ces règles, l'appli fonctionne avec elle, quelle que soit la carte.

## Bluetooth

- Bluetooth basse consommation (BLE), obligatoire pour l'iPhone.
- Service `FFE0`, caractéristique `FFE1` (ceux du module HM-10). La caractéristique sert dans les deux sens.
- L'appli s'abonne aux notifications de `FFE1` pour recevoir les mesures, et écrit dans `FFE1` pour envoyer des commandes.

## De la planche vers l'appli : les mesures

Une ligne de texte par mesure, environ 20 fois par seconde :

```
P,<grammes capteur 1>,<grammes capteur 2>,...\n
```

Exemples :

| Capteurs | Ligne envoyée |
|---|---|
| 1 | `P,64200\n` |
| 2 | `P,31250,29800\n` |
| 4 | `P,15100,16020,14800,15300\n` |

- Valeurs en **grammes**, nombres entiers, éventuellement négatifs (léger bruit autour de 0).
- Les capteurs sont toujours envoyés dans le même ordre. Leur côté est donné par la ligne `C,...` ci-dessous (ou réglé à la main dans Paramètres).
- Le Bluetooth découpe les messages en morceaux de 20 caractères : l'appli les recolle grâce au `\n` de fin de ligne.

## De la planche vers l'appli : la configuration

Toutes les 2 secondes, une ligne qui donne le côté de chaque capteur :

```
C,G,G,D,D\n
```

`G` = gauche, `D` = droite, `M` = milieu (on accepte aussi `L`, `R`, `C`). L'appli règle alors toute seule le nombre de capteurs et leur côté. Ces côtés s'écrivent dans le tableau `COTES` du programme Arduino.

## De l'appli vers la planche : les commandes

| Commande | Effet |
|---|---|
| `T\n` | Remise à zéro (tare) de tous les capteurs. La planche doit être vide. Facultatif : l'Arduino fait déjà la remise à zéro à l'allumage, et l'appli a sa propre remise à zéro. |

## Comment l'appli calcule les forces

- **Force totale** = somme de tous les capteurs (le poids se répartit entre eux).
- **Main gauche** = somme des capteurs réglés « gauche », **main droite** = somme des capteurs « droite ».
- Si un capteur est réglé « centre », l'appli ne peut pas séparer les mains pendant un test à deux mains : la dissymétrie se mesure alors en testant un bras, puis l'autre.
- **Dissymétrie** = écart entre les deux mains ÷ main la plus forte × 100.
