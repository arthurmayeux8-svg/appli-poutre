import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { bluetoothDisponible, chercherPlanches } from '../ble/bluetooth';
import { AppareilTrouve } from '../ble/planche';
import { genererHistoriqueDemo } from '../core/demo';
import { peutSeparerLesMains } from '../core/forces';
import { CapteurConfig, CoteCapteur } from '../core/types';
import { useConnexion } from '../state/connexion';
import { nouvelId, useDonnees } from '../state/donnees';
import { Bouton, Carte, Chiffre, Choix, couleurs, Ecran, JaugeForce, Section, T } from '../ui/composants';

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
      (a) => setAppareils((l) => [...l, a]),
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
                <Bouton titre="Remise à zéro" variante="contour" onPress={c.tare} />
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
          <Text style={{ flex: 1, color: couleurs.texte }}>Connecter le simulateur au lancement</Text>
          <Switch
            value={reglages.simulateurAuDemarrage}
            onValueChange={(v) => majReglages({ ...reglages, simulateurAuDemarrage: v })}
            trackColor={{ true: couleurs.accent, false: couleurs.bord }}
          />
        </View>
      </Carte>

      <Carte titre="Planche Bluetooth">
        {bleOk ? (
          <>
            <T doux>Allumez la planche puis lancez la recherche. Le module s'appelle souvent « HMSoft », « BT05 » ou « Poutre ».</T>
            <Bouton titre={recherche ? 'Recherche…' : 'Chercher la planche'} onPress={lancerRecherche} desactive={recherche} />
            {recherche ? <ActivityIndicator /> : null}
            {message ? <T>{message}</T> : null}
            {appareils.map((a) => (
              <Bouton key={a.id} titre={a.nom} variante="contour" onPress={() => c.connecter(a)} />
            ))}
          </>
        ) : (
          <T doux>
            Le Bluetooth n'est pas disponible ici (navigateur ou Expo Go). Pour la vraie planche, il faut la version
            « développement » de l'appli sur le téléphone (voir le README). En attendant, le simulateur fait tout.
          </T>
        )}
      </Carte>
    </>
  );
}

/* ---------------------------------------------------------------- */

function BlocReglages() {
  const { reglages, majReglages } = useDonnees();
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
        <T doux>Nombre de capteurs branchés sur l'Arduino, dans l'ordre où il les envoie, et leur côté sur la planche.</T>
        <Choix
          valeur={String(reglages.capteurs.length)}
          onChange={(v) => changerNombre(Number(v))}
          options={['1', '2', '3', '4'].map((v) => ({ valeur: v, libelle: v }))}
        />
        {reglages.capteurs.map((c) => (
          <View key={c.index} style={[styles.ligne, { justifyContent: 'space-between' }]}>
            <T>Capteur {c.index + 1}</T>
            <Choix
              valeur={c.cote}
              onChange={(cote) => changerCote(c.index, cote)}
              options={[
                { valeur: 'gauche', libelle: 'Gauche' },
                { valeur: 'centre', libelle: 'Centre' },
                { valeur: 'droite', libelle: 'Droite' },
              ]}
            />
          </View>
        ))}
        <T doux>
          {peutSeparerLesMains(reglages.capteurs)
            ? 'L’appli peut séparer main gauche et main droite, même à deux mains.'
            : 'La dissymétrie se mesurera en testant un bras, puis l’autre.'}
        </T>
      </Carte>

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
              <Text style={{ color: couleurs.rouge, fontWeight: '600' }}>Retirer</Text>
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
  champ: { borderWidth: 1, borderColor: couleurs.bord, borderRadius: 10, padding: 10, fontSize: 16, color: couleurs.texte, backgroundColor: '#fff' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  point: { width: 10, height: 10, borderRadius: 5 },
  titre: { fontSize: 17, fontWeight: '700', color: couleurs.texte },
  maintenir: { borderWidth: 2, borderColor: couleurs.accent, borderRadius: 14, paddingVertical: 22, alignItems: 'center' },
  texteMaintenir: { fontSize: 16, fontWeight: '700', color: couleurs.accent },
});
