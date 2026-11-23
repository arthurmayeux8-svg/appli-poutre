import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { bluetoothDisponible, chercherPlanches } from '../ble/bluetooth';
import { AppareilTrouve } from '../ble/planche';
import { useConnexion } from '../state/connexion';
import { useDonnees } from '../state/donnees';
import { Bouton, Carte, Ecran, JaugeForce, Ligne, T } from '../ui/composants';

/** Recherche de la planche en Bluetooth, ou lancement du simulateur. */
export default function EcranConnexion() {
  const c = useConnexion();
  const { profil } = useDonnees();
  const [appareils, setAppareils] = useState<AppareilTrouve[]>([]);
  const [recherche, setRecherche] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [arret, setArret] = useState<(() => void) | null>(null);
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

  if (c.etat === 'connecte') {
    return (
      <Ecran>
        <Carte titre={`Connectée : ${c.nomPlanche}`}>
          <JaugeForce valeurKg={c.forces.totalKg} maxKg={profil.poidsCorpsKg} />
          {c.forces.gaucheKg !== null ? (
            <>
              <Ligne libelle="Côté gauche" valeur={`${c.forces.gaucheKg.toFixed(1)} kg`} />
              <Ligne libelle="Côté droit" valeur={`${c.forces.droiteKg!.toFixed(1)} kg`} />
            </>
          ) : null}
          {c.simulateur ? (
            <T doux>Simulateur : la force monte toute seule pendant les tests et les suspensions.</T>
          ) : (
            <T doux>Sans personne suspendu, la valeur doit être proche de 0. Sinon, faites une remise à zéro.</T>
          )}
        </Carte>
        <Bouton titre="Remise à zéro (tare)" variante="contour" onPress={c.tare} />
        <Bouton titre="Déconnecter" variante="danger" onPress={c.deconnecter} />
      </Ecran>
    );
  }

  return (
    <Ecran>
      {c.erreur ? (
        <Carte>
          <T>{c.erreur}</T>
        </Carte>
      ) : null}

      <Carte titre="Planche Bluetooth">
        {bleOk ? (
          <>
            <T doux>Allumez la planche puis lancez la recherche. Le module s'appelle souvent « HMSoft », « BT05 » ou « Poutre ».</T>
            <Bouton titre={recherche ? 'Recherche…' : 'Chercher la planche'} onPress={lancerRecherche} desactive={recherche} />
            {recherche ? <ActivityIndicator /> : null}
            {message ? <T>{message}</T> : null}
            <View style={{ gap: 8 }}>
              {appareils.map((a) => (
                <Bouton key={a.id} titre={a.nom} variante="contour" onPress={() => c.connecter(a)} />
              ))}
            </View>
            {c.etat === 'connexion' ? <T>Connexion en cours…</T> : null}
          </>
        ) : (
          <T doux>
            Le Bluetooth n'est pas disponible dans Expo Go. Pour utiliser la vraie planche, il faut installer la
            version « développement » de l'appli (voir le README). En attendant, utilisez le simulateur.
          </T>
        )}
      </Carte>

      <Carte titre="Sans matériel">
        <T doux>Le simulateur imite la planche pour essayer toute l'appli.</T>
        <Bouton titre="Utiliser le simulateur" variante="contour" onPress={c.connecterSimulateur} />
      </Carte>
    </Ecran>
  );
}
