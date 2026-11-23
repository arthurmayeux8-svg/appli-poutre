/*
 * Poutre d'escalade : Arduino Nano 33 BLE / Nano 33 IoT / UNO R4 WiFi (Bluetooth intégré)
 * + 1 à 4 capteurs HX711. Aucun module Bluetooth à ajouter.
 *
 * Même protocole et mêmes identifiants Bluetooth (FFE0 / FFE1) que le HM-10 :
 * l'appli fonctionne avec les deux cartes sans aucune modification.
 *
 * Bibliothèques à installer : "ArduinoBLE" (Arduino) et "HX711" (Bogdan Necula).
 *
 * Branchements HX711 : n°1 DT -> D2, SCK -> D3 ; n°2 DT -> D4, SCK -> D5 ;
 *                      n°3 DT -> D6, SCK -> D7 ; n°4 DT -> D8, SCK -> D9.
 * Attention : la Nano 33 BLE fonctionne en 3,3 V -> alimenter les HX711 en 3,3 V.
 */
#include <ArduinoBLE.h>
#include "HX711.h"

const int NB_CAPTEURS = 2;               // <-- mettre 1, 2, 3 ou 4
const int BROCHES_DT[4]  = {2, 4, 6, 8};
const int BROCHES_SCK[4] = {3, 5, 7, 9};
float FACTEURS[4] = {420.0, 420.0, 420.0, 420.0};

HX711 capteurs[4];
BLEService service("FFE0");
BLECharacteristic carac("FFE1", BLERead | BLENotify | BLEWrite | BLEWriteWithoutResponse, 20);

void tare() {
  for (int i = 0; i < NB_CAPTEURS; i++) capteurs[i].tare();
}

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < NB_CAPTEURS; i++) {
    capteurs[i].begin(BROCHES_DT[i], BROCHES_SCK[i]);
    capteurs[i].set_scale(FACTEURS[i]);
  }
  tare();

  if (!BLE.begin()) {
    Serial.println("Erreur : Bluetooth indisponible");
    while (1);
  }
  BLE.setLocalName("Poutre");
  BLE.setAdvertisedService(service);
  service.addCharacteristic(carac);
  BLE.addService(service);
  BLE.advertise();
}

void loop() {
  BLE.poll();

  // Commande "T" reçue de l'appli ?
  if (carac.written() && carac.valueLength() > 0 && carac.value()[0] == 'T') tare();

  String ligne = "P";
  for (int i = 0; i < NB_CAPTEURS; i++) {
    long grammes = 0;
    if (capteurs[i].wait_ready_timeout(100)) grammes = (long)capteurs[i].get_units(1);
    ligne += ",";
    ligne += grammes;
  }
  ligne += "\n";
  Serial.print(ligne);

  // Le Bluetooth envoie au plus 20 caractères à la fois : on découpe la ligne.
  if (BLE.connected()) {
    for (unsigned int i = 0; i < ligne.length(); i += 20) {
      String morceau = ligne.substring(i, min(i + 20, ligne.length()));
      carac.writeValue(morceau.c_str(), morceau.length());
    }
  }
}
