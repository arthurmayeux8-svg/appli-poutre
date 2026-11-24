import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { trouverPlan } from '../../core/plans';
import { dureePlanMin } from '../../core/programme';
import { useConnexion } from '../../state/connexion';
import { nouvelId, useDonnees } from '../../state/donnees';
import { useEntrainement } from '../../state/entrainement';
import { BandeauPlanche, CarteExercice } from '../../ui/blocs';
import { Text } from 'react-native';
import { Rebond } from '../../ui/animations';
import { Bouton, Carte, Choix, Ecran, JaugeForce, Ligne, T } from '../../ui/composants';

type Phase = 'preparation' | 'suspension' | 'repos' | 'repos-serie';

interface Etape {
  phase: Phase;
  dureeS: number;
  exercice: number;
  serie: number;
  repetition: number;
}

const TITRES: Record<Phase, string> = {
  preparation: 'Préparez-vous',
  suspension: 'Suspendu !',
  repos: 'Repos',
  'repos-serie': 'Repos entre séries',
};

/**
 * Une séance : présentation détaillée, puis déroulé guidé
 * (l'appli enchaîne suspensions et repos et compte les suspensions tenues).
 */
export default function EcranPlan() {
  const { id, demarrer } = useLocalSearchParams<{ id: string; demarrer?: string }>();
  const plan = trouverPlan(id ?? '');
  const c = useConnexion();
  const { reglages, ajouterSeance, profil } = useDonnees();
  const e = useEntrainement();
  const { cibles } = e.cibles(plan?.id ?? '', plan?.exercices ?? []);

  // Liste de toutes les étapes de la séance.
  const etapes = useMemo(() => {
    const liste: Etape[] = [];
    plan?.exercices.forEach((ex, i) => {
      liste.push({ phase: 'preparation', dureeS: 10, exercice: i, serie: 0, repetition: 0 });
      for (let s = 0; s < ex.series; s++) {
        for (let r = 0; r < ex.repetitions; r++) {
          liste.push({ phase: 'suspension', dureeS: cibles[i].suspensionS, exercice: i, serie: s, repetition: r });
          if (r < ex.repetitions - 1) liste.push({ phase: 'repos', dureeS: ex.reposS, exercice: i, serie: s, repetition: r });
          else if (s < ex.series - 1) liste.push({ phase: 'repos-serie', dureeS: ex.reposSeriesS, exercice: i, serie: s, repetition: r });
        }
      }
    });
    return liste;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  const [enCours, setEnCours] = useState(false);
  const [index, setIndex] = useState(0);
  const [restant, setRestant] = useState(0);
  const [termine, setTermine] = useState(false);
  const [ressenti, setRessenti] = useState<'1' | '2' | '3'>('2');
  const reussies = useRef(0);
  const total = useRef(0);
  const mesuresSuspendu = useRef(0);
  const nbMesures = useRef(0);
  const etape = etapes[index];

  const lancer = () => {
    reussies.current = 0;
    total.current = 0;
    setIndex(0);
    setEnCours(true);
  };
  const passer = () => setIndex((i) => Math.min(i + 1, etapes.length - 1));

  // Démarrage direct depuis l'onglet Séance.
  useEffect(() => {
    if (demarrer === '1' && c.etat === 'connecte' && !enCours && !termine) lancer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Minuteur des étapes.
  useEffect(() => {
    if (!enCours || !etape) return;
    const debut = Date.now();
    mesuresSuspendu.current = 0;
    nbMesures.current = 0;
    const cible = cibles[etape.exercice];
    c.indiquerPhase({
      suspendu: etape.phase === 'suspension',
      main: cible.main,
      mode: 'entrainement',
      chargeKg: cible.cibleKg ? (cible.cibleKg[0] + cible.cibleKg[1]) / 2 : undefined,
    });
    const idMinuteur = setInterval(() => {
      const r = etape.dureeS - (Date.now() - debut) / 1000;
      setRestant(Math.max(0, r));
      if (r <= 0) {
        clearInterval(idMinuteur);
        if (etape.phase === 'suspension') {
          total.current += 1;
          // Suspension réussie si le grimpeur est resté suspendu au moins 90 % du temps.
          if (nbMesures.current > 0 && mesuresSuspendu.current / nbMesures.current >= 0.9) reussies.current += 1;
        }
        if (index + 1 >= etapes.length) {
          c.indiquerPhase({ suspendu: false, main: 'deux' });
          setEnCours(false);
          setTermine(true);
        } else setIndex(index + 1);
      }
    }, 100);
    return () => clearInterval(idMinuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enCours, index]);

  // Suivi des mesures pendant une suspension.
  useEffect(() => {
    if (!enCours || etape?.phase !== 'suspension') return;
    nbMesures.current += 1;
    if (c.forces.totalKg > reglages.seuilSuspensionKg) mesuresSuspendu.current += 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.forces]);

  // On coupe la simulation si on quitte l'écran.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => c.indiquerPhase({ suspendu: false, main: 'deux' }), []);

  if (!plan) {
    return (
      <Ecran>
        <T>Plan introuvable.</T>
      </Ecran>
    );
  }

  if (termine) {
    const taux = total.current > 0 ? reussies.current / total.current : 0;
    return (
      <Ecran>
        <Stack.Screen options={{ title: plan.nom }} />
        <Rebond>
          <Carte titre="Séance terminée">
          <Text style={{ fontSize: 44, textAlign: 'center' }}>🎉</Text>
          <Ligne libelle="Suspensions tenues" valeur={`${reussies.current} / ${total.current}`} />
          <T>Comment était la séance ?</T>
          <Choix
            valeur={ressenti}
            onChange={setRessenti}
            options={[
              { valeur: '1', libelle: 'Trop facile' },
              { valeur: '2', libelle: 'Bien' },
              { valeur: '3', libelle: 'Trop dur' },
            ]}
          />
          <T doux>Votre réponse adapte la prochaine séance : plus de charge si c'était trop facile, moins si c'était trop dur.</T>
          </Carte>
        </Rebond>
        <Bouton
          titre="Enregistrer"
          onPress={() => {
            ajouterSeance({
              id: nouvelId(),
              date: new Date().toISOString(),
              planId: plan.id,
              reussite: taux,
              ressenti: Number(ressenti) as 1 | 2 | 3,
            });
            router.back();
          }}
        />
      </Ecran>
    );
  }

  if (enCours && etape) {
    const ex = plan.exercices[etape.exercice];
    const cible = cibles[etape.exercice];
    return (
      <Ecran>
        <Stack.Screen options={{ title: plan.nom }} />
        <Carte>
          <T gros>
            {TITRES[etape.phase]} · {Math.ceil(restant)} s
          </T>
          <T doux>
            {ex.nom} · série {etape.serie + 1}/{ex.series} · suspension {etape.repetition + 1}/{ex.repetitions}
          </T>
          <JaugeForce valeurKg={c.forces.totalKg} maxKg={profil.poidsCorpsKg} cibleKg={cible.cibleKg} />
        </Carte>
        {etape.phase !== 'suspension' ? <Bouton titre="Passer le repos" variante="contour" onPress={passer} /> : null}
        <Bouton
          titre="Arrêter la séance"
          variante="danger"
          onPress={() => {
            c.indiquerPhase({ suspendu: false, main: 'deux' });
            setEnCours(false);
            setTermine(true);
          }}
        />
      </Ecran>
    );
  }

  return (
    <Ecran>
      <Stack.Screen options={{ title: plan.nom }} />
      <BandeauPlanche />
      <Carte>
        <T>{plan.objectif}</T>
        <T doux>Environ {dureePlanMin(plan)} min · {plan.parSemaine} séances par semaine conseillées</T>
      </Carte>
      {plan.exercices.map((ex, i) => (
        <CarteExercice key={ex.nom} ex={ex} cible={cibles[i]} prises={reglages.prises} />
      ))}
      <Bouton titre="Démarrer la séance" onPress={lancer} desactive={c.etat !== 'connecte'} />
    </Ecran>
  );
}
