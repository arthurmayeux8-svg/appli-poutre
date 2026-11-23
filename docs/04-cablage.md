# Câblage

Chaque cellule a son propre HX711. Chaque HX711 a deux fils de données vers l'Arduino.

## Cellule → HX711 (couleurs de la notice Joy-IT)

| Fil | Borne HX711 |
|---|---|
| Rouge | E+ |
| Noir | E- |
| Vert | A- |
| Blanc | A+ |

Si la valeur devient négative quand on tire, inverser vert et blanc.

## HX711 → Arduino

| HX711 | DT | SCK |
|---|---|---|
| n°1 (capteur 1) | D2 | D3 |
| n°2 (capteur 2) | D4 | D5 |
| n°3 (capteur 3) | D6 | D7 |
| n°4 (capteur 4) | D8 | D9 |

Tous les HX711 : VCC sur 5V (UNO, UNO R4) ou **3,3 V (Nano 33 BLE)**, GND sur GND.

## Module HM-10 (UNO seulement)

| HM-10 | Arduino |
|---|---|
| VCC | 5V |
| GND | GND |
| TXD | D10 |
| RXD | D11 via un pont diviseur : 1 kΩ entre D11 et RXD, 2 kΩ entre RXD et GND |

## Programmes

- UNO + HM-10 : `arduino/poutre_hm10/poutre_hm10.ino`
- Nano 33 BLE / UNO R4 WiFi : `arduino/poutre_ble/poutre_ble.ino`

Le schéma complet et les explications sont aussi dans le document « Poutre : câblage, données Bluetooth et appli sur téléphone ».
