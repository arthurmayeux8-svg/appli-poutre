/*
 * Poutre d'escalade : Arduino UNO (ou Nano) + module Bluetooth HM-10 + 1 à 4 capteurs HX711.
 *
 * Envoie environ 20 fois par seconde une ligne :   P,<g capteur 1>,<g capteur 2>,...\n
 * Reçoit la commande :                             T\n   -> remise à zéro (tare)
 * (voir docs/protocole.md)
 *
 * Bibliothèque à installer (Outils > Gérer les bibliothèques) : "HX711" par Bogdan Necula.
 *
 * Branchements :
 *   HM-10 : VCC -> 5V, GND -> GND, TXD -> broche 10, RXD -> broche 11
 *           (mettre un pont diviseur 1 kΩ / 2 kΩ sur RXD : le HM-10 attend du 3,3 V)
 *   HX711 n°1 : DT -> 2, SCK -> 3     HX711 n°2 : DT -> 4, SCK -> 5
 *   HX711 n°3 : DT -> 6, SCK -> 7     HX711 n°4 : DT -> 8, SCK -> 9
 *   Chaque HX711 : VCC -> 5V, GND -> GND.
 *
 * Le HM-10 utilise le service FFE0 / caractéristique FFE1 : c'est ce que l'appli attend.
 */
#include <SoftwareSerial.h>
#include "HX711.h"

const int NB_CAPTEURS = 2;               // <-- mettre 1, 2, 3 ou 4
const int BROCHES_DT[4]  = {2, 4, 6, 8};
const int BROCHES_SCK[4] = {3, 5, 7, 9};

// Facteur d'étalonnage de chaque capteur (voir "Étalonner" dans le README).
float FACTEURS[4] = {420.0, 420.0, 420.0, 420.0};

SoftwareSerial bluetooth(10, 11); // RX, TX
HX711 capteurs[4];

void setup() {
  Serial.begin(9600);     // moniteur série, pour vérifier sur l'ordinateur
  bluetooth.begin(9600);  // vitesse par défaut du HM-10
  for (int i = 0; i < NB_CAPTEURS; i++) {
    capteurs[i].begin(BROCHES_DT[i], BROCHES_SCK[i]);
    capteurs[i].set_scale(FACTEURS[i]);
    capteurs[i].tare();   // la planche doit être vide au démarrage
  }
}

void loop() {
  // 1. Commande reçue de l'appli ?
  while (bluetooth.available()) {
    char c = bluetooth.read();
    if (c == 'T') {
      for (int i = 0; i < NB_CAPTEURS; i++) capteurs[i].tare();
    }
  }

  // 2. Lecture des capteurs et envoi d'une ligne "P,...".
  String ligne = "P";
  for (int i = 0; i < NB_CAPTEURS; i++) {
    long grammes = 0;
    if (capteurs[i].wait_ready_timeout(100)) grammes = (long)capteurs[i].get_units(1);
    ligne += ",";
    ligne += grammes;
  }
  ligne += "\n";
  bluetooth.print(ligne);
  Serial.print(ligne);
  // Un HX711 en mode 10 mesures/s limite le rythme ; passer la broche RATE à 80 Hz pour ~20 lignes/s.
}
