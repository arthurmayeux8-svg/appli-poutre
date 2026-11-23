# Le projet en résumé

**But** : une poutre d'escalade (planche à suspensions) qui mesure la force des doigts, et une appli qui en fait des tests et des plans d'entraînement.

## Ce que doit faire le système

- Mesurer la force exercée sur la planche, en temps réel.
- Envoyer les mesures au téléphone en Bluetooth basse consommation (BLE).
- Analyser : force max, temps de suspension, dissymétrie gauche / droite.
- Proposer des entraînements adaptés au niveau et suivre la progression.

## Contraintes du cahier des charges

- Résister à 150 kg en dynamique (chocs quand on attrape la prise).
- Supporter la magnésie et la transpiration.
- Batterie Li-Po 3,7 V rechargeable en USB-C, autonomie de plusieurs semaines.
- Simple et agréable à utiliser.

## Scénarios d'usage prévus

- « Max hang » : suspension de 7 s sur une réglette de 20 mm, force maximale.
- « Repeaters 7/3 » : 7 s suspendu, 3 s de repos, plusieurs fois.
- Mesure de la dissymétrie entre les deux mains.

## Outils

- Conception mécanique : SolidWorks (avec calcul de résistance).
- Électronique : cellules de charge + amplificateurs HX711 + Arduino.
- Appli : React Native (Expo), qui marche aussi comme site web.
