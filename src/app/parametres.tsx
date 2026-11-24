import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { bluetoothDisponible, chercherPlanches } from '../ble/bluetooth';
import { AppareilTrouve } from '../ble/planche';
import { genererHistoriqueDemo } from '../core/demo';
import { capteurLePlusCharge, ETALONNAGE_NEUTRE, regleFacteur } from '../core/etalonnage';
import { peutSeparerLesMains } from '../core/forces';
import { CapteurConfig, CoteCapteur } from '../core/types';
import { useConnexion } from '../state/connexion';
import { nouvelId, useDonnees } from '../state/donnees';
import { Bouton, Carte, Chiffre, Choix, couleurs, Ecran, JaugeForce, polices, Section, T } from '../ui/composants';

/** Paramètres : profil, connexion à la planche, réglages de la planche, données. */
export default function Parametres() {
  return (
    <Ecran>
      <Section>Profil</Section>
      <BlocProfil />
      <Section>Planche</Section>
      <BlocConnexion />
      <Section>Réglages de la planche</Section>
      <BlocReglages />
      <Section>Données</Section>
      <BlocDonnees />
    </Ecran>
  );
}

function nombre(texte: string, defaut: number) {
  const v = Number(texte.replace(',', '.'));
  return Number.isFinite(v) && v > 0 ? v : defaut;
}

/* ---------------------------------------------------------------- */

function BlocProfil() {
  const { profil, majProfil } = useDonnees();
  const [poids, setPoids] = useState(String(profil.poidsCorpsKg));
  useEffect(() => setPoids(String(profil.poidsCorpsKg)), [profil.poidsCorpsKg]);
  const validerPoids = () => {
    const v = nombre(poids, profil.poidsCorpsKg);
    if (v > 20 && v < 200) majProfil({ ...profil, poidsCorpsKg: v });
    else setPoids(String(profil.poidsCorpsKg));
  };
  return (
    <Carte>
      <T doux>Nom</T>
      <TextInput style={styles.champ} value={profil.nom} onChangeText={(nom) => majProfil({ ...profil, nom })} />
      <T doux>Poids de corps (kg), pour calculer le score</T>
      <TextInput style={styles.champ} keyboardType="decimal-pad" value={poids} onChangeText={setPoids} onBlur={validerPoids} onSubmitEditing={validerPoids} />
    </Carte>
  );
}

/* ---------------------------------------------------------------- */

function BlocConnexion() {
  const c = useConnexion();
  const { profil, reglages, majReglages } = useDonnees();
  const [appareils, setAppareils] = useState<AppareilTrouve[]>([]);
  const [recherche, setRecherche] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [arret, setArret] = useState<(() => void) | null>(null);
  const [maintenu, setMaintenu] = useState(false);
  const bleOk = bluetoothDisponible();

  useEffect(() => () => arret?.(), [arret]);

  const lancerRecherche = async () => {
    setAppareils([]);
    setMessage(null);
    setRecherche(true);
    const stop = await chercherPlanches(
      (a) => {
        setAppareils((l) => [...l, a]);
        // Dans un navigateur, l'appareil vient d'être choisi dans la liste du navigateur : on se connecte tout de suite.
        if (Platform.OS === 'web') void c.connecter(a);
      },
      (m) => {
        setMessage(m);
        setRecherche(false);
      },
    );
    setArret(() => stop);
    setTimeout(() => {
      stop();
      setRecherche(false);
    }, 10_000);
  };

  const suspendre = (actif: boolean) => {
    setMaintenu(actif);
    c.suspensionManuelle(actif);
  };

  return (
    <>
      <Carte>
        <View style={styles.ligne}>
          <View style={[styles.point, { backgroundColor: c.etat === 'connecte' ? couleurs.vert : couleurs.rouge }]} />
          <Text style={styles.titre}>
            {c.etat === 'connecte'
              ? c.simulateur
                ? 'Simulateur connecté'
                : `Connectée : ${c.nomPlanche}`
              : c.etat === 'connexion'
                ? 'Connexion…'
                : 'Non connectée'}
          </Text>
        </View>
        {c.erreur && c.etat !== 'connecte' ? <T doux>{c.erreur}</T> : null}

        {c.etat === 'connecte' ? (
          <>
            <JaugeForce valeurKg={c.forces.totalKg} maxKg={profil.poidsCorpsKg * 1.3} />
            {c.forces.gaucheKg !== null ? (
              <View style={{ flexDirection: 'row' }}>
                <Chiffre valeur={c.forces.gaucheKg.toFixed(1)} legende="kg gauche" couleur={couleurs.bleu} />
                <Chiffre valeur={c.forces.droiteKg!.toFixed(1)} legende="kg droite" couleur={couleurs.accent} />
              </View>
            ) : null}
            {c.simulateur ? (
              <>
                <Pressable
                  onPressIn={() => suspendre(true)}
                  onPressOut={() => suspendre(false)}
                  style={[styles.maintenir, maintenu && { backgroundColor: couleurs.accent }]}
                >
                  <Text style={[styles.texteMaintenir, maintenu && { color: '#fff' }]}>
                    {maintenu ? 'Suspendu…' : 'Maintenir pour se suspendre'}
                  </Text>
                </Pressable>
                <T doux>
                  Le simulateur imite la planche avec un grimpeur virtuel : il se suspend tout seul pendant les tests et
                  les séances. Ce bouton permet de le suspendre à la main pour voir la force bouger.
                </T>
              </>
            ) : (
              <T doux>Sans personne suspendu, la valeur doit être proche de 0. Sinon, faites une remise à zéro.</T>
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Bouton titre="Remise à zéro" variante="contour" onPress={() => c.tare()} />
              </View>
              <View style={{ flex: 1 }}>
                <Bouton titre="Déconnecter" variante="danger" onPress={c.deconnecter} />
              </View>
            </View>
          </>
        ) : (
          <Bouton titre="Utiliser le simulateur" variante="contour" onPress={c.connecterSimulateur} />
        )}

        <View style={[styles.ligne, { justifyContent: 'space-between' }]}>
          <Text style={{ flex: 1, color: couleurs.texte, fontFamily: polices.normal }}>Connecter le simulateur au lancement</Text>
          <Switch
            value={reglages.simulateurAuDemarrage}
            onValueChange={(v) => majReglages({ ...reglages, simulateurAuDemarrage: v })}
            trackColor={{ true: couleurs.accent, false: couleurs.bord }}
            thumbColor={couleurs.carte}
            {...({ activeThumbColor: couleurs.carte } as object)}
          />
        </View>
      </Carte>

      <Carte titre="Planche Bluetooth">
        {bleOk ? (
          <>
            <T doux>
              Allumez la planche puis lancez la recherche. Le module s'appelle souvent « HMSoft », « BT05 » ou « Poutre ».
              {Platform.OS === 'web' ? ' Le navigateur affiche la liste : choisissez la planche.' : ''}
            </T>
            <Bouton titre={recherche ? 'Recherche…' : 'Chercher la planche'} onPress={lancerRecherche} desactive={recherche} />
            {recherche ? <ActivityIndicator /> : null}
            {message ? <T>{message}</T> : null}
            {appareils.map((a) => (
              <Bouton key={a.id} titre={a.nom} variante="contour" onPress={() => c.connecter(a)} />
            ))}
          </>
        ) : (
          <T doux>
            {Platform.OS === 'web'
              ? 'Ce navigateur ne gère pas le Bluetooth. Sur iPhone, ouvrez ce site dans l\u2019appli gratuite « Bluefy ». Sur Android ou ordinateur, utilisez Chrome.'
              : 'Le Bluetooth n\u2019est pas disponible dans Expo Go. Utilisez le site dans Chrome ou Bluefy, ou la version installée de l\u2019appli (voir le README).'}
          </T>
        )}
      </Carte>
    </>
  );
}

/* ---------------------------------------------------------------- */

function BlocReglages() {
  const { reglages, majReglages } = useDonnees();
  const c = useConnexion();
  const capteurActif = capteurLePlusCharge(c.capteursKg);
  const [nomPrise, setNomPrise] = useState('');
  const [mmPrise, setMmPrise] = useState('');

  const changerNombre = (n: number) => {
    const capteurs: CapteurConfig[] = Array.from({ length: n }, (_, i) => {
      const existant = reglages.capteurs[i];
      if (existant) return existant;
      const cote: CoteCapteur = n === 1 ? 'centre' : i < n / 2 ? 'gauche' : 'droite';
      return { index: i, cote };
    });
    majReglages({ ...reglages, capteurs });
  };
  const changerCote = (i: number, cote: CoteCapteur) =>
    majReglages({ ...reglages, capteurs: reglages.capteurs.map((c) => (c.index === i ? { ...c, cote } : c)) });

  return (
    <>
      <Carte titre="Capteurs">
        {c.configParPlanche ? (
          <T>La planche a envoyé sa configuration : nombre de capteurs et côtés réglés automatiquement.</T>
        ) : (
          <>
            <T doux>Nombre de capteurs branchés sur l'Arduino, et leur côté sur la planche.</T>
            <Choix
              valeur={String(reglages.capteurs.length)}
              onChange={(v) => changerNombre(Number(v))}
              options={['1', '2', '3', '4'].map((v) => ({ valeur: v, libelle: v }))}
            />
          </>
        )}
        {reglages.capteurs.map((cap) => {
          const actif = c.etat === 'connecte' && capteurActif === cap.index;
          const valeur = c.capteursKg[cap.index];
          return (
            <View key={cap.index} style={[styles.capteur, actif && styles.capteurActif]}>
              <View style={{ minWidth: 90 }}>
                <Text style={styles.titreCapteur}>Capteur {cap.index + 1}</Text>
                <Text style={styles.valeurCapteur}>{valeur !== undefined ? `${valeur.toFixed(1)} kg` : '–'}</Text>
              </View>
              {c.configParPlanche ? (
                <T>{cap.cote === 'gauche' ? 'Gauche' : cap.cote === 'droite' ? 'Droite' : 'Centre'}</T>
              ) : (
                <Choix
                  valeur={cap.cote}
                  onChange={(cote) => changerCote(cap.index, cote)}
                  options={[
                    { valeur: 'gauche', libelle: 'Gauche' },
                    { valeur: 'centre', libelle: 'Centre' },
                    { valeur: 'droite', libelle: 'Droite' },
                  ]}
                />
              )}
            </View>
          );
        })}
        {!c.configParPlanche && c.etat === 'connecte' ? (
          <T doux>
            Pour savoir quel capteur est où : appuyez fort sur un coin de la planche. Le capteur qui s'allume en orange est
            sous ce coin. Donnez-lui son côté. (Une fois le côté écrit dans le programme Arduino, ce réglage se fait tout seul.)
          </T>
        ) : null}
        <T doux>
          {peutSeparerLesMains(reglages.capteurs)
            ? 'L\u2019appli peut séparer main gauche et main droite, même à deux mains.'
            : 'La dissymétrie se mesurera en testant un bras, puis l\u2019autre.'}
        </T>
      </Carte>

      <CarteEtalonnage />

      <Carte titre="Prises">
        {reglages.prises.map((p) => (
          <View key={p.id} style={[styles.ligne, { justifyContent: 'space-between' }]}>
            <T>
              {p.nom} · {p.profondeurMm} mm
            </T>
            <Pressable
              disabled={reglages.prises.length <= 1}
              onPress={() => majReglages({ ...reglages, prises: reglages.prises.filter((x) => x.id !== p.id) })}
            >
              <Text style={{ color: couleurs.rouge, fontFamily: polices.demiGras }}>Retirer</Text>
            </Pressable>
          </View>
        ))}
        <View style={[styles.ligne, { gap: 8 }]}>
          <TextInput style={[styles.champ, { flex: 2 }]} placeholder="Nom (ex. Réglette 18)" value={nomPrise} onChangeText={setNomPrise} />
          <TextInput style={[styles.champ, { flex: 1 }]} placeholder="mm" keyboardType="decimal-pad" value={mmPrise} onChangeText={setMmPrise} />
        </View>
        <Bouton
          titre="Ajouter la prise"
          variante="contour"
          desactive={!nomPrise.trim() || !(nombre(mmPrise, 0) > 0)}
          onPress={() => {
            const prises = [...reglages.prises, { id: nouvelId(), nom: nomPrise.trim(), profondeurMm: nombre(mmPrise, 0) }].sort(
              (a, b) => b.profondeurMm - a.profondeurMm,
            );
            majReglages({ ...reglages, prises });
            setNomPrise('');
            setMmPrise('');
          }}
        />
      </Carte>

      <Carte titre="Mesure">
        <T doux>Seuil de suspension (kg) : en dessous, personne n'est considéré suspendu.</T>
        <TextInput
          style={styles.champ}
          keyboardType="decimal-pad"
          defaultValue={String(reglages.seuilSuspensionKg)}
          onEndEditing={(e) => majReglages({ ...reglages, seuilSuspensionKg: nombre(e.nativeEvent.text, reglages.seuilSuspensionKg) })}
        />
        <T doux>Durée du test de force max (secondes)</T>
        <TextInput
          style={styles.champ}
          keyboardType="number-pad"
          defaultValue={String(reglages.dureeTestForceS)}
          onEndEditing={(e) => majReglages({ ...reglages, dureeTestForceS: nombre(e.nativeEvent.text, reglages.dureeTestForceS) })}
        />
      </Carte>
    </>
  );
}

/* ---------------------------------------------------------------- */

/**
 * Étalonnage guidé, pour l'équipe : à faire une fois, avec un poids connu.
 * Il corrige les valeurs dans l'appli, sans toucher au programme Arduino.
 */
function CarteEtalonnage() {
  const c = useConnexion();
  const { reglages, majReglages, profil } = useDonnees();
  const [cible, setCible] = useState<string>('tous');
  const [poids, setPoids] = useState(String(profil.poidsCorpsKg));
  const [etat, setEtat] = useState<'attente' | 'mesure'>('attente');
  const [resultat, setResultat] = useState<string | null>(null);
  const connecte = c.etat === 'connecte';

  const mesurer = () => {
    const kg = nombre(poids, 0);
    if (kg <= 0) return;
    setResultat(null);
    setEtat('mesure');
    // On laisse 3 secondes pour stabiliser, puis on fait la moyenne des dernières mesures.
    setTimeout(() => {
      const m = c.moyenneBrute(40);
      const capteur = cible === 'tous' ? 'tous' : Number(cible);
      const nouveau = regleFacteur(reglages.etalonnage, m, capteur, kg);
      setEtat('attente');
      if (!nouveau) {
        setResultat('Mesure trop faible : le poids est-il bien posé ? Recommencez.');
        return;
      }
      majReglages({ ...reglages, etalonnage: nouveau });
      // Pour enregistrer l'étalonnage dans la planche elle-même : nouveau FACTEURS[i] = ancien ÷ facteur de l'appli.
      const lignes = nouveau.facteurs
        .map((f, i) => `Capteur ${i + 1} : FACTEURS[${i}] actuel ÷ ${f.toFixed(4)}`)
        .join('\n');
      setResultat(
        `Étalonné : la planche affiche maintenant ${kg} kg pour ce poids, sur cet appareil.\n\n` +
          `Pour que tous les utilisateurs en profitent, reportez-le dans le programme Arduino :\n${lignes}\n` +
          `(exemple : 420 ÷ 1.0500 = 400), puis effacez l'étalonnage de l'appli.`,
      );
    }, 3000);
  };

  return (
    <Carte titre="Étalonnage (pour l'équipe)">
      <T doux>
        À faire une fois par l'équipe, avec un poids connu (packs d'eau pesés, ou soi-même pesé sur une balance). L'appli
        donne ensuite les facteurs à écrire dans le programme Arduino : l'utilisateur final n'aura rien à faire.
      </T>
      <T>1. Planche vide : remise à zéro.</T>
      <Bouton titre="Remise à zéro" variante="contour" onPress={() => c.tare()} desactive={!connecte} />
      <T>2. Où est le poids connu ?</T>
      <Choix
        valeur={cible}
        onChange={(v) => {
          setCible(v);
          if (v === 'tous') setPoids(String(profil.poidsCorpsKg));
        }}
        options={[
          { valeur: 'tous', libelle: 'Toute la planche' },
          ...reglages.capteurs.map((cap) => ({ valeur: String(cap.index), libelle: `Capteur ${cap.index + 1}` })),
        ]}
      />
      <T doux>
        {cible === 'tous'
          ? 'Suspendez-vous à deux mains, pieds décollés, ou accrochez le poids au milieu de la planche.'
          : 'Posez ou accrochez le poids juste au-dessus de ce capteur.'}
      </T>
      <T>3. Poids connu (kg)</T>
      <TextInput style={styles.champ} keyboardType="decimal-pad" value={poids} onChangeText={setPoids} />
      <Bouton
        titre={etat === 'mesure' ? 'Mesure en cours… restez immobile' : 'Mesurer et étalonner'}
        onPress={mesurer}
        desactive={!connecte || etat === 'mesure'}
      />
      {resultat ? <T>{resultat}</T> : null}
      <Pressable onPress={() => majReglages({ ...reglages, etalonnage: ETALONNAGE_NEUTRE })}>
        <Text style={{ color: couleurs.texteDoux, fontFamily: polices.normal, textDecorationLine: 'underline' }}>Effacer l'étalonnage de l'appli</Text>
      </Pressable>
    </Carte>
  );
}

/* ---------------------------------------------------------------- */

function BlocDonnees() {
  const { profil, reglages, tests, seances, remplacerHistorique } = useDonnees();
  const [confirmer, setConfirmer] = useState<'demo' | 'effacer' | null>(null);
  const aDesDonnees = tests.length + seances.length > 0;

  const demo = () => {
    const d = genererHistoriqueDemo(profil.poidsCorpsKg, reglages.prises);
    remplacerHistorique(d.tests, d.seances);
    setConfirmer(null);
  };

  return (
    <Carte>
      <T doux>
        {tests.length} tests et {seances.length} séances enregistrés sur ce téléphone.
      </T>
      {confirmer ? (
        <>
          <T>{confirmer === 'demo' ? 'Remplacer votre historique par celui de la démo ?' : 'Effacer tous les tests et séances ?'}</T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Bouton titre="Annuler" variante="contour" onPress={() => setConfirmer(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <Bouton
                titre="Confirmer"
                variante="danger"
                onPress={() => {
                  if (confirmer === 'demo') demo();
                  else {
                    remplacerHistorique([], []);
                    setConfirmer(null);
                  }
                }}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          <Bouton titre="Charger 3 mois de démo" variante="contour" onPress={() => (aDesDonnees ? setConfirmer('demo') : demo())} />
          <T doux>Remplit l'historique avec un grimpeur fictif qui progresse, pour voir les graphiques.</T>
          <Bouton titre="Tout effacer" variante="danger" onPress={() => setConfirmer('effacer')} desactive={!aDesDonnees} />
        </>
      )}
    </Carte>
  );
}

const styles = StyleSheet.create({
  champ: { borderWidth: 1, borderColor: couleurs.bord, borderRadius: 10, padding: 12, fontSize: 16, color: couleurs.texte, backgroundColor: couleurs.carte, fontFamily: polices.normal },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  point: { width: 10, height: 10, borderRadius: 5 },
  titre: { fontSize: 17, fontFamily: polices.gras, color: couleurs.texte },
  capteur: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', padding: 8, borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent' },
  capteurActif: { borderColor: couleurs.accent, backgroundColor: couleurs.accentDoux },
  titreCapteur: { fontSize: 15, fontFamily: polices.demiGras, color: couleurs.texte },
  valeurCapteur: { fontSize: 13, fontFamily: polices.normal, color: couleurs.texteDoux, fontVariant: ['tabular-nums'] },
  maintenir: { borderWidth: 2, borderColor: couleurs.accent, borderRadius: 14, paddingVertical: 22, alignItems: 'center' },
  texteMaintenir: { fontSize: 16, fontFamily: polices.gras, color: couleurs.accent },
});
