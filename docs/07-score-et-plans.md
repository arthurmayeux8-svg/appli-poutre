# Score, niveaux et plans

## Score de grimpe de 1 à 10

Calculé avec la **force max à deux mains** (ou bras gauche + bras droit), en % du poids de corps, ramenée à une réglette de 20 mm.

| % du poids | Score | Niveau |
|---|---|---|
| 60 % ou moins | 1 | Débutant |
| 100 % | 4 | Intermédiaire à partir de 4 |
| 130 % | 6,3 | Confirmé à partir de 6,3 |
| 160 % | 8,5 | Expert à partir de 8,5 |
| 180 % ou plus | 10 | Expert |

Une prise plus petite est plus dure : la même force sur 10 mm compte plus que sur 20 mm. Réglages dans `src/core/score.ts`.

## Plans d'entraînement

| Plan | Pour qui | Exemple |
|---|---|---|
| Découverte | Débutant | 10 s suspendu allégé, 50 s repos, 2 × 5 |
| Suspensions longues | Débutant à confirmé | 30 s, 60 s repos, 2 × 4 |
| Repeaters 7/3 | Intermédiaire, confirmé | 7 s / 3 s × 6, 3 séries |
| Force max | Confirmé, expert | 10 s à 85-95 %, 3 min repos, × 5 |
| Petites réglettes | Expert | 7 s sur 10 mm, × 6 |
| Rééquilibrage | Si dissymétrie > 10 % | Une main, la plus faible |

Chaque exercice indique la prise, le placement des doigts (demi-arqué, tendu, 3 doigts) et la **zone de force visée** en kg.

## Adaptation automatique

- Les charges visées = un % de la dernière force max mesurée.
- Après chaque séance : « trop facile » → +5 % ; « trop dur » ou suspensions ratées → −5 %.
- Au-delà de +15 %, on ajoute 1 s de suspension.
- Un nouveau test remet l'ajustement à zéro (les charges sont recalculées).
- Une séance un jour sur deux, en alternant les plans conseillés. Un test est conseillé toutes les 4 semaines.

Réglages dans `src/core/plans.ts` et `src/core/programme.ts`.
