# Matériel

| Élément | Nombre | Remarque |
|---|---|---|
| Cellule de charge 60 kg (Joy-IT SEN-HX711 ou équivalent) | 2 ou 4 | Une cellule par coin ou par côté |
| Amplificateur HX711 | 1 par cellule | Souvent vendu avec la cellule |
| Arduino UNO (ou Nano) | 1 | **+ module Bluetooth HM-10** (pas HC-05 / HC-06, incompatibles iPhone) |
| *ou* Arduino Nano 33 BLE / UNO R4 WiFi | 1 | Bluetooth intégré, pas de module à ajouter |
| Résistances 1 kΩ et 2 kΩ | 1 de chaque | Pont diviseur pour le HM-10 (UNO seulement) |
| Batterie Li-Po 3,7 V + chargeur USB-C + régulateur 5 V | 1 | Pour l'autonomie (à dimensionner) |
| Fils, boîtier | — | Protéger de la magnésie |

Bibliothèques Arduino à installer : **HX711** (Bogdan Necula) et, pour les cartes à Bluetooth intégré, **ArduinoBLE**.
