import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  calculerAjustement,
  calculerCible,
  choisirPrise,
  NOMS_PREHENSION,
  PLACEMENT_DOIGTS,
  trouverPlan,
} from '../../core/plans';
import { useConnexion } from '../../state/connexion';
import { nouvelId, useDonnees } from '../../state/donnees';
import { Bouton, Carte, Choix, Ecran, JaugeForce, Ligne, T } from '../../ui/composants';

type Phase = 'preparation' | 'suspension' | 'repos' | 'repos-serie';

interface Etape {
  phase: Phase;
  dureeS: number;
  exercice: number;
  serie: number;
  repetition: number;
}

/**
 * Déroulé d'une séance : l'appli enchaîne suspensions et repos,
 * affiche la zone de force visée, et compte les suspensions réussies.
 */
export default function EcranSeance() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = trouverPlan(id ?? '');
  const c = useConnexion();
  const { reglages, tests, seances, ajouterSeance, profil } = useDonnees();

  const dernierTest = tests.filter((t) => t.type === 'force-max').map((t) => t.date).sort().pop() ?? null;
  const ajustement = calculerAjustement(plan?.id ?? '', seances, dernierTest);
  const cibles = useMemo(
    () => plan?.exercices.map((ex) => calculerCible(ex, tests, ajustement)) ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, tests, ajustement.intensiteBonusPct, ajustement.suspensionBonusS],
  );

  // Liste de toutes les étapes de la séance, calculée une fois.
  const etapes = useMemo(() => {
    const liste: Etape[] = [];
    plan?.exercices.forEach((ex, e) => {
      liste.push({ phase: 'preparation', dureeS: 10, exercice: e, serie: 0, repetition: 0 });
      for (let s = 0; s < ex.series; s++) {
        for (let r = 0; r < ex.repetitions; r++) {
          liste.push({ phase: 'suspension', dureeS: cibles[e].suspensionS, exercice: e, serie: s, repetition: r });
          const derniere = r === ex.repetitions - 1;
          if (!derniere) liste.push({ phase: 'repos', dureeS: ex.reposS, exercice: e, serie: s, repetition: r });
          else if (s < ex.series - 1)
            liste.push({ phase: 'repos-serie', dureeS: ex.reposSeriesS, exercice: e, serie: s, repetition: r });
        }
      }
    });
    return liste;
  }, [plan, cibles]);

  const [enCours, setEnCours] = useState(false);
  const [index, setIndex] = useState(0);
  const [restant, setRestant] = useState(0);
  const [termine, setTermine] = useState(false);
  const [ressenti, setRessenti] = useState<'1' | '2' | '3'>('2');
  const reussies = useRef(0);
  const total = useRef(0);
  const tempsDansZone = useRef(0); // nb de mesures au-dessus du seuil pendant la suspension
  const nbMesures = useRef(0);

  const etape = etapes[index];

  // Minuteur des étapes.
  useEffect(() => {
    if (!enCours || !etape) return;
    const debut = Date.now();
    tempsDansZone.current = 0;
    nbMesures.current = 0;
    const cible = cibles[etape.exercice];
    c.indiquerPhase({
      suspendu: etape.phase === 'suspension',
      main: cible.main,
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
          if (nbMesures.current > 0 && tempsDansZone.current / nbMesures.current >= 0.9) reussies.current += 1;
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
    if (c.forces.totalKg > reglages.seuilSuspensionKg) tempsDansZone.current += 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.forces]);

  // On coupe la simulation si on quitte l'écran.
  useEffect(() => () => c.indiquerPhase({ suspendu: false, main: 'deux' }), []); // eslint-disable-line react-hooks/exhaustive-deps

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
        <Carte titre="Séance terminée">
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
          <T doux>Votre réponse sert à adapter la prochaine séance (plus ou moins de charge).</T>
        </Carte>
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
    const titres: Record<Phase, string> = {
      preparation: 'Préparez-vous',
      suspension: 'Suspendu !',
      repos: 'Repos',
      'repos-serie': 'Repos entre séries',
    };
    return (
      <Ecran>
        <Stack.Screen options={{ title: plan.nom }} />
        <Carte>
          <T gros>
            {titres[etape.phase]} · {Math.ceil(restant)} s
          </T>
          <T doux>
            {ex.nom} · série {etape.serie + 1}/{ex.series} · suspension {etape.repetition + 1}/{ex.repetitions}
          </T>
          <JaugeForce valeurKg={c.forces.totalKg} maxKg={profil.poidsCorpsKg} cibleKg={cible.cibleKg} />
        </Carte>
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

  // Présentation de la séance
  return (
    <Ecran>
      <Stack.Screen options={{ title: plan.nom }} />
      <Carte>
        <T>{plan.objectif}</T>
      </Carte>
      {plan.exercices.map((ex, i) => {
        const cible = cibles[i];
        const prise = choisirPrise(reglages.prises, ex.priseVisee);
        return (
          <Carte key={ex.nom} titre={ex.nom}>
            <Ligne libelle="Prise" valeur={prise ? `${prise.nom} (${prise.profondeurMm} mm)` : '—'} />
            <Ligne
              libelle="Main"
              valeur={cible.main === 'deux' ? 'Deux mains' : cible.main === 'gauche' ? 'Main gauche' : 'Main droite'}
            />
            <Ligne libelle="Préhension" valeur={NOMS_PREHENSION[ex.prehension]} />
            <T doux>{PLACEMENT_DOIGTS[ex.prehension]}</T>
            <Ligne
              libelle="Déroulé"
              valeur={`${ex.series} × ${ex.repetitions} × ${cible.suspensionS} s (repos ${ex.reposS} s)`}
            />
            <Ligne
              libelle="Intensité"
              valeur={
                cible.cibleKg
                  ? `${cible.cibleKg[0].toFixed(0)}–${cible.cibleKg[1].toFixed(0)} kg`
                  : `${cible.intensitePct[0]}–${cible.intensitePct[1]} % de votre max`
              }
            />
            <T>{ex.consigne}</T>
          </Carte>
        );
      })}
      {c.etat !== 'connecte' ? (
        <Bouton titre="Connecter la planche" onPress={() => router.push('/connexion')} />
      ) : (
        <Bouton
          titre="Démarrer la séance"
          onPress={() => {
            reussies.current = 0;
            total.current = 0;
            setIndex(0);
            setEnCours(true);
          }}
        />
      )}
    </Ecran>
  );
}
