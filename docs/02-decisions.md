# Décisions prises

Les plus récentes en haut.

| Date | Décision | Pourquoi |
|---|---|---|
| 24/11/2026 | Charte graphique « Craie & Ardoise » : fond craie, ardoise, orange magnésie, police Outfit, logo poutre + courbe | Demande d'Arthur : un visuel plus soigné, avec logo et animations |
| 23/11/2026 | La configuration (côtés des capteurs) et l'étalonnage sont faits **par l'équipe avant de donner la planche**, et écrits dans le programme Arduino | L'utilisateur final n'a rien à régler |
| 23/11/2026 | L'Arduino envoie toutes les 2 s une ligne `C,G,D,...` avec le côté de chaque capteur | L'appli se règle toute seule |
| 23/11/2026 | Pas d'appli payante sur iPhone : on utilise **le site web**. Sur iPhone, le Bluetooth passe par le navigateur gratuit **Bluefy** | Le compte Apple coûte 99 € par an, hors budget |
| 23/11/2026 | Le site est publié gratuitement sur **GitHub Pages** et peut s'ajouter à l'écran d'accueil | Une simple adresse à ouvrir, rien à installer |
| 23/11/2026 | Étalonnage guidé possible dans l'appli, qui donne les facteurs à recopier dans l'Arduino | Plus simple que de calculer à la main |
| 23/11/2026 | Score de grimpe de **1 à 10** basé sur la force max à deux mains en % du poids | Suivre la progression avec un seul chiffre |
| 23/11/2026 | Interface : onglets Accueil, Séance, Test ; paramètres derrière la roue dentée | Demande d'Arthur après la première version |
| 23/11/2026 | Simulateur intégré, connecté automatiquement | La planche n'est pas encore fabriquée |
| 23/11/2026 | Profil stocké sur l'appareil, pas de compte en ligne | Simple, pas de serveur |
| 23/11/2026 | 1 à 4 cellules de 60 kg. Force totale = somme des capteurs | Le poids se répartit entre les capteurs |
| 23/11/2026 | Carte Arduino (UNO + HM-10, ou Nano 33 BLE / UNO R4 WiFi), pas d'ESP32 | Matériel disponible à l'école |
| 23/11/2026 | Bluetooth basse consommation (BLE) obligatoire | Seul Bluetooth accepté par l'iPhone |
| 23/11/2026 | Appli en React Native avec Expo, Android + iPhone + web | Un seul code pour tout |
| 23/11/2026 | La fixation de porte est mise de côté, on avance sur l'appli | Choix d'Arthur |
