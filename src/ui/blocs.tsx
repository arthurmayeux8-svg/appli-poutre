import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { CibleExercice, choisirPrise, Exercice, NOMS_PREHENSION, PLACEMENT_DOIGTS } from '../core/plans';
import { Prise } from '../core/types';
import { useConnexion } from '../state/connexion';
import { PointPulsant } from './animations';
import { Bouton, Carte, couleurs, Ligne, polices, T } from './composants';

export const NOMS_MAINS = { deux: 'Deux mains', gauche: 'Main gauche', droite: 'Main droite' } as const;

/** Détail d'un exercice : prise, placement des doigts, déroulé, charge. */
export function CarteExercice({ ex, cible, prises }: { ex: Exercice; cible: CibleExercice; prises: Prise[] }) {
  const prise = choisirPrise(prises, ex.priseVisee);
  return (
    <Carte titre={ex.nom}>
      <Ligne libelle="Prise" valeur={prise ? `${prise.nom} (${prise.profondeurMm} mm)` : '—'} />
      <Ligne libelle="Main" valeur={NOMS_MAINS[cible.main]} />
      <Ligne libelle="Préhension" valeur={NOMS_PREHENSION[ex.prehension]} />
      <T doux>{PLACEMENT_DOIGTS[ex.prehension]}</T>
      <Ligne libelle="Déroulé" valeur={`${ex.series} × ${ex.repetitions} × ${cible.suspensionS} s`} />
      <Ligne libelle="Repos" valeur={`${ex.reposS} s${ex.series > 1 ? ` · ${Math.round(ex.reposSeriesS / 60)} min entre séries` : ''}`} />
      <Ligne
        libelle="Charge visée"
        valeur={
          cible.cibleKg
            ? `${cible.cibleKg[0].toFixed(0)} à ${cible.cibleKg[1].toFixed(0)} kg`
            : `${cible.intensitePct[0]} à ${cible.intensitePct[1]} % de votre max`
        }
      />
      <T>{ex.consigne}</T>
    </Carte>
  );
}

/** Petit bandeau d'état de la planche, avec accès rapide si elle n'est pas connectée. */
export function BandeauPlanche() {
  const c = useConnexion();
  if (c.etat === 'connecte') {
    return (
      <View style={styles.bandeau}>
        <PointPulsant couleur={couleurs.vert} />
        <Text style={styles.texte}>
          {c.simulateur ? 'Simulateur connecté' : `Planche connectée : ${c.nomPlanche}`}
        </Text>
      </View>
    );
  }
  return (
    <Carte>
      <View style={styles.bandeauInterne}>
        <View style={[styles.point, { backgroundColor: couleurs.rouge }]} />
        <Text style={styles.texte}>{c.etat === 'connexion' ? 'Connexion…' : 'Planche non connectée'}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Bouton titre="Simulateur" icone="game-controller-outline" variante="contour" onPress={c.connecterSimulateur} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton titre="Paramètres" icone="settings-outline" variante="contour" onPress={() => router.push('/parametres')} />
        </View>
      </View>
    </Carte>
  );
}

const styles = StyleSheet.create({
  bandeau: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: couleurs.vertDoux, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 0 },
  bandeauInterne: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  point: { width: 8, height: 8, borderRadius: 4 },
  texte: { fontSize: 13, color: couleurs.texte, fontFamily: polices.demiGras },
});
