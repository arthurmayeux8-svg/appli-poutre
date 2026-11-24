import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NOMS_NIVEAUX, Plan, PLANS } from '../../core/plans';
import { dureePlanMin } from '../../core/programme';
import { useDonnees } from '../../state/donnees';
import { useEntrainement } from '../../state/entrainement';
import { BandeauPlanche, CarteExercice } from '../../ui/blocs';
import { Bouton, Carte, couleurs, Ecran, polices, Section, T } from '../../ui/composants';

function dateCourte(d: Date | string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function LignePlan({ plan, gauche, droite }: { plan: Plan; gauche: string; droite?: string }) {
  return (
    <Pressable onPress={() => router.push(`/plan/${plan.id}`)} style={({ pressed }) => [styles.ligne, pressed && { opacity: 0.6 }]}>
      {gauche ? <Text style={styles.date}>{gauche}</Text> : null}
      <Text style={styles.nom}>{plan.nom}</Text>
      <Text style={styles.droite}>{droite ?? `${dureePlanMin(plan)} min`}</Text>
    </Pressable>
  );
}

/** Onglet Séance : la séance du jour en détail, les séances à venir, tous les plans. */
export default function OngletSeance() {
  const { reglages, seances, tests } = useDonnees();
  const e = useEntrainement();
  const plan = e.duJour.plan;
  const { cibles, ajustement } = e.cibles(plan.id, plan.exercices);
  const faites = seances.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const autres = PLANS.filter((p) => !e.conseilles.includes(p));

  return (
    <Ecran>
      <BandeauPlanche />
      <Section>{e.duJour.statut === 'a-faire' ? 'Aujourd’hui' : `Prochaine séance · ${dateCourte(e.duJour.prochaine.date)}`}</Section>
      <Carte titre={plan.nom}>
        {e.duJour.statut === 'repos' ? <T doux>Aujourd'hui c'est repos : les tendons progressent pendant la récupération.</T> : null}
        {e.duJour.statut === 'faite' ? <T doux>La séance du jour est faite.</T> : null}
        <T>{plan.objectif}</T>
        <T doux>
          Environ {dureePlanMin(plan)} min · niveau {NOMS_NIVEAUX[e.niveau].toLowerCase()}
          {ajustement.intensiteBonusPct ? ` · charge ajustée de ${ajustement.intensiteBonusPct > 0 ? '+' : ''}${ajustement.intensiteBonusPct} %` : ''}
          {ajustement.suspensionBonusS ? ` · +${ajustement.suspensionBonusS} s par suspension` : ''}
        </T>
        {tests.length === 0 ? <T doux>Faites un test de force pour que les charges soient calculées en kg.</T> : null}
        {e.dissymetrie && e.dissymetrie.pct > 10 ? (
          <T doux>Dissymétrie de {e.dissymetrie.pct.toFixed(0)} % : le rééquilibrage est ajouté au programme.</T>
        ) : null}
      </Carte>
      {plan.exercices.map((ex, i) => (
        <CarteExercice key={ex.nom} ex={ex} cible={cibles[i]} prises={reglages.prises} />
      ))}
      <Bouton titre="Démarrer la séance" icone="play" onPress={() => router.push(`/plan/${plan.id}?demarrer=1`)} />

      <Section>Séances à venir</Section>
      <Carte>
        {e.aVenir.map((s, i) => (
          <LignePlan key={i} plan={s.plan} gauche={dateCourte(s.date)} />
        ))}
        <T doux>Une séance un jour sur deux, en alternant les plans conseillés pour votre niveau.</T>
      </Carte>

      {faites.length > 0 ? (
        <>
          <Section>Dernières séances</Section>
          <Carte>
            {faites.map((s) => {
              const p = PLANS.find((x) => x.id === s.planId);
              return p ? (
                <LignePlan key={s.id} plan={p} gauche={dateCourte(s.date)} droite={`${Math.round(s.reussite * 100)} % tenu`} />
              ) : null;
            })}
          </Carte>
        </>
      ) : null}

      <Section>Autres plans</Section>
      <Carte>
        {autres.map((p) => (
          <LignePlan key={p.id} plan={p} gauche="" />
        ))}
      </Carte>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: couleurs.bord, gap: 8 },
  date: { width: 96, fontSize: 13, color: couleurs.texteDoux, fontFamily: polices.normal },
  nom: { flex: 1, fontSize: 15, fontFamily: polices.demiGras, color: couleurs.texte },
  droite: { fontSize: 13, color: couleurs.texteDoux, fontFamily: polices.normal },
});
