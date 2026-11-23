import { router } from 'expo-router';
import { View } from 'react-native';
import { calculerNiveau, NOMS_NIVEAUX, testConseille } from '../core/plans';
import { useConnexion } from '../state/connexion';
import { useDonnees } from '../state/donnees';
import { Bouton, Carte, Ecran, T } from '../ui/composants';

/** Écran d'accueil. */
export default function Accueil() {
  const { profil, tests } = useDonnees();
  const { etat, nomPlanche } = useConnexion();
  const niveau = calculerNiveau(tests);

  return (
    <Ecran>
      <Carte>
        <T gros>Salut {profil.nom} !</T>
        <T doux>
          Niveau estimé : {NOMS_NIVEAUX[niveau]}
          {tests.length === 0 ? ' (faites un premier test pour l’affiner)' : ''}
        </T>
      </Carte>

      <Carte titre="Planche">
        <T>{etat === 'connecte' ? `Connectée : ${nomPlanche}` : etat === 'connexion' ? 'Connexion…' : 'Non connectée'}</T>
        <Bouton
          titre={etat === 'connecte' ? 'Gérer la connexion' : 'Se connecter'}
          variante={etat === 'connecte' ? 'contour' : 'plein'}
          onPress={() => router.push('/connexion')}
        />
      </Carte>

      {testConseille(tests) ? (
        <Carte>
          <T>Un test de force est conseillé (le premier, ou le dernier date de plus de 4 semaines).</T>
        </Carte>
      ) : null}

      <View style={{ gap: 10 }}>
        <Bouton titre="Tester ma force" onPress={() => router.push('/test')} />
        <Bouton titre="M'entraîner" onPress={() => router.push('/entrainement')} />
        <Bouton titre="Profil et progression" variante="contour" onPress={() => router.push('/profil')} />
        <Bouton titre="Réglages de la planche" variante="contour" onPress={() => router.push('/reglages')} />
      </View>
    </Ecran>
  );
}
