import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { NOMS_NIVEAUX } from '../../core/plans';
import { dureePlanMin } from '../../core/programme';
import { useDonnees } from '../../state/donnees';
import { useEntrainement } from '../../state/entrainement';
import { BandeauPlanche, NOMS_MAINS } from '../../ui/blocs';
import { Bouton, Carte, couleurs, Ecran, Ligne, polices, Section, T } from '../../ui/composants';
import { AnneauScore, Courbe } from '../../ui/graphiques';

function dateLongue(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Accueil : score de grimpe et sa courbe, aperçu de l'entraînement du jour. */
export default function Accueil() {
  const { profil } = useDonnees();
  const e = useEntrainement();
  const precedent = e.scores.length >= 2 ? e.scores[e.scores.length - 2].score : null;
  const variation = e.score !== null && precedent !== null ? e.score - precedent : null;

  const plan = e.duJour.plan;
  const { cibles } = e.cibles(plan.id, plan.exercices);
  const ex = plan.exercices[0];
  const cible = cibles[0];

  return (
    <Ecran>
      <View style={styles.entete}>
        <T gros>Salut {profil.nom} !</T>
        <BandeauPlanche />
      </View>

      <Carte sombre>
        <Text style={styles.surtitre}>Mon score de grimpe</Text>
        <View style={styles.hero}>
          <AnneauScore score={e.score} />
          <View style={{ flex: 1, gap: 14 }}>
            <View>
              <Text style={styles.niveau}>{NOMS_NIVEAUX[e.niveau]}</Text>
              <Text style={styles.legende}>niveau actuel</Text>
            </View>
            <View>
              <Text style={[styles.variation, { color: variation !== null && variation < 0 ? couleurs.rougeSurArdoise : couleurs.vertSurArdoise }]}>
                {variation !== null ? `${variation >= 0 ? '▲ +' : '▼ '}${variation.toFixed(1)}` : '–'}
              </Text>
              <Text style={styles.legende}>depuis le dernier test</Text>
            </View>
          </View>
        </View>
        <Bouton titre="Faire un test de force" icone="speedometer-outline" onPress={() => router.navigate('/test')} />
      </Carte>

      <Section>Ma progression</Section>
      <Carte>
        <Courbe points={e.scores.map((s) => ({ date: s.date, valeur: s.score }))} min={1} max={10} graduations={[1, 4, 7, 10]} />
      </Carte>

      <Section>Entraînement du jour</Section>
      <Carte titre={e.duJour.statut === 'repos' ? 'Repos aujourd’hui' : plan.nom}>
        {e.duJour.statut === 'repos' ? (
          <T>
            Les doigts récupèrent. Prochaine séance {dateLongue(e.duJour.prochaine.date)} : {plan.nom}.
          </T>
        ) : e.duJour.statut === 'faite' ? (
          <T>Séance faite, bravo ! Prochaine séance {dateLongue(e.duJour.prochaine.date)}.</T>
        ) : (
          <>
            <T doux>{plan.objectif}</T>
            <Ligne libelle="Durée" valeur={`environ ${dureePlanMin(plan)} min`} />
            <Ligne libelle="Exercice" valeur={`${ex.series} × ${ex.repetitions} × ${cible.suspensionS} s`} />
            <Ligne libelle="Main" valeur={NOMS_MAINS[cible.main]} />
            <Ligne
              libelle="Charge visée"
              valeur={cible.cibleKg ? `${cible.cibleKg[0].toFixed(0)} à ${cible.cibleKg[1].toFixed(0)} kg` : `${cible.intensitePct[0]} à ${cible.intensitePct[1]} %`}
            />
          </>
        )}
        <Bouton titre="Voir la séance" icone="arrow-forward" variante="contour" onPress={() => router.navigate('/seance')} />
      </Carte>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  entete: { gap: 10 },
  surtitre: { fontSize: 12, fontFamily: polices.gras, color: couleurs.texteSurArdoiseDoux, textTransform: 'uppercase', letterSpacing: 1.2 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingVertical: 4 },
  niveau: { fontSize: 24, fontFamily: polices.tresGras, color: couleurs.texteSurArdoise, letterSpacing: -0.3 },
  variation: { fontSize: 20, fontFamily: polices.gras },
  legende: { fontSize: 13, fontFamily: polices.normal, color: couleurs.texteSurArdoiseDoux },
});
