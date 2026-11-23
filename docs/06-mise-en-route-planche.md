# Préparer une planche avant de la donner

À faire **une fois par l'équipe**. Ensuite, l'utilisateur allume la planche, ouvre le site, se connecte : c'est tout.

## 1. Repérer quel capteur est où

1. Brancher la planche, ouvrir le site, se connecter à la planche.
2. Paramètres → Capteurs : appuyer fort sur un coin de la planche.
3. Le capteur qui s'allume en orange est sous ce coin. Noter son côté (gauche ou droite).

## 2. Écrire les côtés dans le programme Arduino

```cpp
const int NB_CAPTEURS = 4;
const char COTES[4] = {'G', 'G', 'D', 'D'};   // G = gauche, D = droite, M = milieu
```

L'Arduino envoie ces côtés à l'appli toutes les 2 secondes (`C,G,G,D,D`). L'appli se règle toute seule.

## 3. Étalonner

Avec l'appli : Paramètres → Étalonnage.

1. Planche vide : « Remise à zéro ».
2. Choisir « Toute la planche », se suspendre pieds décollés avec son poids pesé sur une balance (ou accrocher des packs d'eau pesés).
3. « Mesurer et étalonner ». L'appli affiche un nombre par capteur.
4. Dans le programme Arduino : `FACTEURS[i] = ancien ÷ nombre affiché`. Exemple : 420 ÷ 1,05 = 400.
5. Téléverser, puis « Effacer l'étalonnage de l'appli » et vérifier que le poids affiché est juste.

Sans l'appli : voir la méthode au moniteur série dans le README principal.

## 4. Vérifier

- Planche vide : environ 0 kg (l'Arduino fait la remise à zéro tout seul à l'allumage, planche vide).
- Avec un poids connu : la bonne valeur, et le bon côté qui réagit.
