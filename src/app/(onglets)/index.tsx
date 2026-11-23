import { router } from 'expo-router';
import { View } from 'react-native';
import { NOMS_NIVEAUX } from '../../core/plans';
import { dureePlanMin } from '../../core/programme';
import { useDonnees } from '../../state/donnees';
import { useEntrainement } from '../../state/entrainement';
import { BandeauPlanche, NOMS_MAINS } from '../../ui/blocs';
import { Bouton, Carte, Chiffre, couleurs, Ecran, Ligne, Section, T } from '../../ui/composants';
import { Courbe } from '../../ui/graphiques';

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
      <T gros>Salut {profil.nom} !</T>
      <BandeauPlanche />

      <Section>Mon score de grimpe</Section>
      <Carte>
        <View style={{ flexDirection: 'row' }}>
          <Chiffre valeur={e.score !== null ? `${e.score.toFixed(1)}` : '–'} legende="sur 10" couleur={couleurs.accent} />
          <Chiffre valeur={NOMS_NIVEAUX[e.niveau]} legende="niveau" />
          <Chiffre
            valeur={variation !== null ? `${variation >= 0 ? '+' : ''}${variation.toFixed(1)}` : '–'}
            legende="depuis le dernier test"
            couleur={variation !== null && variation < 0 ? couleurs.rouge : couleurs.vert}
          />
        </View>
        <Courbe points={e.scores.map((s) => ({ date: s.date, valeur: s.score }))} min={1} max={10} graduations={[1, 4, 7, 10]} />
        <Bouton titre="Faire un test de force" onPress={() => router.navigate('/test')} />
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
        <Bouton titre="Voir la séance" variante="contour" onPress={() => router.navigate('/seance')} />
      </Carte>
    </Ecran>
  );
}
