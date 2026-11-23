# 05 · Cahier des charges : câblage et communication Arduino → site

Ce document dit **ce que la carte Arduino doit faire** pour que le site (ou l'appli) la reconnaisse et affiche les bonnes valeurs, sans souci de transmission. Le reste (lire les HX711, faire la moyenne, etc.) est libre : c'est votre code.

Si une carte respecte toutes les exigences marquées **E1, E2…** ci-dessous, le site fonctionne avec elle.

---

## 1. Ce qui est dans le périmètre

```
 Cellules 60 kg ──► HX711 ──► Arduino ──► Bluetooth BLE ──► Téléphone (site Poutre)
   (1 à 4)        (1 par      (votre      (HM-10 ou BLE        (Chrome Android,
                   cellule)    code)       intégré)             Bluefy iPhone)
```

- **Côté Arduino (vous)** : câblage, lecture des capteurs, étalonnage, mise en forme et envoi des lignes de texte.
- **Côté site (déjà fait)** : connexion Bluetooth, recollage des morceaux, calcul gauche/droite, tests, séances, score.

## 2. Matériel et câblage

| Élément | Exigence |
|---|---|
| Carte | Arduino **UNO / Nano + module HM-10**, ou une carte **avec BLE intégré** (Nano 33 BLE, UNO R4 WiFi). |
| Bluetooth | **BLE obligatoire** (Bluetooth basse consommation). Un HC-05 / HC-06 ne marche pas avec l'iPhone ni avec le site. |
| Capteurs | 1 à 4 cellules 60 kg, **un HX711 par cellule**. |
| Ordre des capteurs | Capteur 1 sur D2/D3, capteur 2 sur D4/D5, capteur 3 sur D6/D7, capteur 4 sur D8/D9 (DT puis SCK). |

Câblage d'une cellule Joy-IT sur son HX711 :

| Fil de la cellule | Borne du HX711 |
|---|---|
| Rouge | E+ |
| Noir | E− |
| Vert | A− |
| Blanc | A+ |

HX711 → Arduino : VCC → 5 V (3,3 V sur Nano 33 BLE), GND → GND, DT et SCK sur les broches ci-dessus.

HM-10 → UNO : VCC → 5 V, GND → GND, **TXD → D10**, **RXD ← D11 à travers un pont diviseur** (1 kΩ côté Arduino, 2 kΩ vers GND) car le HM-10 attend du 3,3 V.

Détails et schéma : [04-cablage.md](04-cablage.md).

> Astuce : si une valeur est négative quand on appuie, inverser les fils **vert et blanc** de cette cellule.

## 3. La liaison Bluetooth

| Id | Exigence | Pourquoi |
|---|---|---|
| E1 | La carte se présente comme un **périphérique BLE** qui émet en permanence quand personne n'est connecté. | Le site cherche la planche dans la liste Bluetooth. |
| E2 | **Nom** affiché : `Poutre` (conseillé, ex. `Poutre-1` si plusieurs planches). | Pour la reconnaître dans la liste. Sur HM-10 : commande `AT+NAMEPoutre`. |
| E3 | **Service `FFE0`**, **caractéristique `FFE1`**. | C'est là que le site écoute. Le HM-10 les a déjà par défaut ; avec ArduinoBLE, les créer avec ces numéros. |
| E4 | `FFE1` autorise **Notify** (la carte → le site) et **Write / Write without response** (le site → la carte). | Le site s'abonne aux notifications et y écrit ses commandes. |
| E5 | Après une déconnexion, la carte **se remet à émettre toute seule**, sans redémarrage. | Pour pouvoir se reconnecter. Le HM-10 le fait seul ; avec ArduinoBLE, `BLE.advertise()` reste actif. |

## 4. Ce que la carte envoie : le format des lignes

Tout est en **texte simple** (ASCII), une information par ligne.

| Id | Exigence |
|---|---|
| E6 | Chaque ligne se termine par **`\n`** (retour à la ligne). `\r\n` est aussi accepté. Sans `\n`, le site n'affiche rien. |
| E7 | Les valeurs sont séparées par une **virgule**, **sans espace**. |
| E8 | Rien d'autre que les lignes ci-dessous n'est envoyé sur le Bluetooth. Les messages de débogage vont sur `Serial` (le câble USB), **pas** sur le Bluetooth. |

### Ligne de mesure `P` (environ 20 fois par seconde)

```
P,<grammes capteur 1>,<grammes capteur 2>,...\n
```

| Id | Exigence |
|---|---|
| E9 | Valeurs en **grammes**, **nombres entiers** (ex. `31250`, pas `31.25` ni `31250.0`). Un petit négatif autour de 0 est normal (ex. `-12`). |
| E10 | **Une valeur par capteur branché**, toujours **dans le même ordre** (capteur 1, puis 2…), toujours le **même nombre** de valeurs. |
| E11 | Rythme : **10 à 20 lignes par seconde** (au moins 5). Plus lent, les courbes sont saccadées et le décompte des suspensions moins précis. |
| E12 | Si un HX711 n'est pas prêt, renvoyer **sa dernière valeur connue**, jamais un 0 inventé (un 0 ferait croire que la personne a lâché). |

Exemples :

| Capteurs | Ligne |
|---|---|
| 1 | `P,64200\n` |
| 2 | `P,31250,29800\n` |
| 4 | `P,15100,16020,14800,15300\n` |

### Ligne de configuration `C` (toutes les 2 secondes)

```
C,<côté capteur 1>,<côté capteur 2>,...\n
```

| Id | Exigence |
|---|---|
| E13 | Une lettre par capteur, dans le **même ordre que la ligne P** : `G` = gauche, `D` = droite, `M` = milieu. |
| E14 | Envoyée **toutes les 2 secondes environ** (le site peut se connecter à n'importe quel moment, il doit la recevoir vite). |

Exemple, 4 capteurs (2 à gauche, 2 à droite) : `C,G,G,D,D\n`. Le site règle alors tout seul le nombre de capteurs et les côtés : l'utilisateur n'a rien à faire.

## 5. Ce que le site envoie à la carte

| Commande | Effet | Obligatoire ? |
|---|---|---|
| `T\n` | Remise à zéro (tare) de tous les capteurs, planche vide. | Non, mais conseillé. Le site sait aussi faire sa propre remise à zéro. |

| Id | Exigence |
|---|---|
| E15 | Au **démarrage**, la carte fait la remise à zéro (planche vide), puis applique ses facteurs d'étalonnage (`FACTEURS[i]`). |
| E16 | Les caractères inconnus reçus sont **ignorés** sans planter. |

## 6. Pour que la transmission se passe sans ennui

1. **Les paquets font 20 caractères au maximum.** Une ligne de 4 capteurs fait jusqu'à ~30 caractères.
   - Avec le **HM-10** : rien à faire, il découpe tout seul.
   - Avec **ArduinoBLE** (Nano 33 BLE, UNO R4) : **découper la ligne en morceaux de 20** et envoyer chaque morceau (voir le code plus bas). Le site recolle les morceaux grâce au `\n`.
2. **Envoyer la ligne d'un seul coup**, avec un seul `print` d'une `String` déjà complète. Plusieurs petits `print` dans la boucle peuvent mélanger les morceaux.
3. **Ne pas saturer le HM-10** : à 9600 bauds il passe environ 900 caractères par seconde. 20 lignes × 30 caractères = 600 : ça passe. Ne pas monter au-delà de 25 lignes par seconde.
4. **Pas de `delay()` long** dans `loop()` (au-delà de 50 ms) : ça ralentit les mesures et, avec ArduinoBLE, ça peut couper la connexion. Avec ArduinoBLE, appeler `BLE.poll()` à chaque tour.
5. **La carte envoie tout le temps**, connectée ou non. Pas besoin d'attendre une commande pour démarrer.
6. **Le HX711 limite le rythme** : en mode normal il donne 10 mesures par seconde. Pour 20 par seconde, relier sa broche **RATE à VCC** (mode 80 Hz) si votre module le permet. Lire chaque capteur **une seule fois** par tour (`get_units(1)`), pas une moyenne de 10 qui ralentit tout.
7. **Alimentation stable** : un Bluetooth qui se coupe vient souvent d'une alimentation trop faible (pile 9 V usée). Préférer une batterie USB.
8. **Reconnexion** : si la liaison coupe, le site affiche « déconnecté ». Sur le téléphone, il suffit d'appuyer de nouveau sur **Se connecter** dans Paramètres (le navigateur exige un appui de l'utilisateur, il ne peut pas se reconnecter tout seul).

Ce que le site fait déjà pour vous : il recolle les morceaux, ignore les lignes mal formées (une ligne abîmée est simplement sautée), jette un message trop long sans `\n` (plus de 200 caractères), et accepte `\r\n`.

## 7. Exemple de code minimal (la partie « envoi »)

À intégrer dans votre programme. Les fichiers complets prêts à téléverser sont dans `arduino/poutre_hm10` (UNO + HM-10) et `arduino/poutre_ble` (BLE intégré).

```cpp
const int NB_CAPTEURS = 2;                    // 1 à 4
const char COTES[4] = {'G', 'D', 'G', 'D'};   // côté de chaque capteur
long dernieres[4] = {0, 0, 0, 0};             // dernière valeur connue (E12)
unsigned long derniereConfig = 0;

void loop() {
  // 1. Commande reçue ? (ici HM-10 branché sur SoftwareSerial "bluetooth")
  while (bluetooth.available()) {
    if (bluetooth.read() == 'T') {            // tout autre caractère est ignoré (E16)
      for (int i = 0; i < NB_CAPTEURS; i++) capteurs[i].tare();
    }
  }

  // 2. Construire TOUTE la ligne avant de l'envoyer.
  String ligne = "";

  // 2a. Toutes les 2 s : la ligne de configuration "C,G,D\n" (E13, E14).
  if (millis() - derniereConfig > 2000) {
    ligne += "C";
    for (int i = 0; i < NB_CAPTEURS; i++) { ligne += ","; ligne += COTES[i]; }
    ligne += "\n";
    derniereConfig = millis();
  }

  // 2b. La ligne de mesure "P,31250,29800\n" (E9, E10, E12).
  ligne += "P";
  for (int i = 0; i < NB_CAPTEURS; i++) {
    if (capteurs[i].wait_ready_timeout(100)) {
      dernieres[i] = (long)capteurs[i].get_units(1);   // grammes, entier
    }
    ligne += ",";
    ligne += dernieres[i];
  }
  ligne += "\n";                                       // indispensable (E6)

  // 3. Envoyer d'un seul coup.
  bluetooth.print(ligne);   // HM-10 : il découpe tout seul en paquets de 20
  Serial.print(ligne);      // copie sur le câble USB pour vérifier (E8 : le débogage, c'est ici)
}
```

Avec **ArduinoBLE**, remplacer l'étape 3 par :

```cpp
  BLE.poll();
  if (BLE.connected()) {
    for (unsigned int i = 0; i < ligne.length(); i += 20) {      // morceaux de 20 caractères
      String morceau = ligne.substring(i, min(i + 20, ligne.length()));
      carac.writeValue(morceau.c_str(), morceau.length());
    }
  }
```

**Étalonnage** : `FACTEURS[i]` se règle dans le programme pour que `get_units()` donne des **grammes**. Méthode : [06-mise-en-route-planche.md](06-mise-en-route-planche.md).

## 8. Liste de contrôle avant de livrer une planche

Cocher dans l'ordre. Si une étape échoue, ne pas passer à la suivante.

- [ ] **Moniteur série** (Arduino IDE, câble USB) : on voit défiler `P,...` environ 20 fois par seconde, et `C,...` toutes les 2 s.
- [ ] Planche vide : chaque valeur reste proche de 0 (± 50 g).
- [ ] Un poids connu (ex. sac de 5 kg) posé sur un capteur : la valeur affiche environ `5000`. Pas de valeur négative.
- [ ] Le nombre de valeurs dans `P` = le nombre de lettres dans `C` = le nombre de capteurs.
- [ ] **nRF Connect** (appli gratuite) : on trouve `Poutre`, on se connecte, le service `FFE0` contient `FFE1`, et en activant les notifications on voit arriver le texte.
- [ ] **Site** (Chrome sur Android ou Bluefy sur iPhone) : Paramètres → Se connecter → choisir `Poutre`. L'état passe à « connecté ».
- [ ] Paramètres → Capteurs : le site affiche le bon nombre de capteurs et les bons côtés, sans rien régler.
- [ ] On appuie sur le coin **gauche** de la planche : c'est un capteur marqué « gauche » qui s'allume. Pareil à droite.
- [ ] Suspension à deux mains : la force totale ≈ poids de la personne (à ± 3 %).
- [ ] On coupe le Bluetooth du téléphone puis on se reconnecte : ça repart sans redémarrer la carte.
- [ ] La planche tourne **20 minutes** connectée sans coupure ni valeur bloquée.

## 9. En cas de problème

| Symptôme | Cause probable |
|---|---|
| `Poutre` n'apparaît pas dans la liste | Module HC-05 au lieu de HM-10, carte non alimentée, ou déjà connectée à un autre téléphone. |
| Connecté mais rien ne bouge | Pas de `\n` en fin de ligne, mauvais service/caractéristique, ou lignes avec espaces. |
| Valeurs qui sautent à 0 de temps en temps | HX711 pas prêt → appliquer E12 (dernière valeur connue). |
| Gauche et droite inversées | Changer les lettres dans `COTES` (ou inverser les câbles). |
| Valeurs ×1000 trop grandes ou trop petites | Envoi en kg au lieu de grammes, ou facteur d'étalonnage faux. |
| Coupures après quelques minutes | Alimentation faible, ou `delay()` trop longs. |

Voir aussi : [protocole.md](protocole.md) (le format, version courte) et [04-cablage.md](04-cablage.md).
