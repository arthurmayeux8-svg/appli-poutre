# Le simulateur

Il remplace la planche tant qu'elle n'existe pas. Il envoie exactement les mêmes messages que l'Arduino.

- Il se connecte tout seul au lancement (réglable dans Paramètres).
- Pendant un test ou une séance, un **grimpeur virtuel** se suspend tout seul :
  - force max ≈ 115 % de son poids ;
  - main gauche un peu plus faible que la droite ;
  - au test « tenir le plus longtemps », il lâche entre 15 et 35 s ;
  - en séance, il vise la zone verte.
- Paramètres → « **Maintenir pour se suspendre** » : le suspendre à la main.
- Paramètres → « **Charger 3 mois de démo** » : un historique fictif pour voir les graphiques.

Code : `src/ble/simulateur.ts`.
