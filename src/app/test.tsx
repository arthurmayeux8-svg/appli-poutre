import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { analyserSuspension, AnalyseSuspension } from '../core/analyse';
import { dissymetriePct } from '../core/forces';
import { Main, TypeTest } from '../core/types';
import { useConnexion } from '../state/connexion';
import { nouvelId, useDonnees } from '../state/donnees';
import { Bouton, Carte, Choix, Ecran, JaugeForce, Ligne, T } from '../ui/composants';

type Etape = 'choix' | 'preparation' | 'mesure' | 'resultat';

const PREPARATION_S = 5;
const DUREE_MAX_SUSPENSION_S = 180;

/**
 * Test de force :
 * - "Force max" : se suspendre X secondes (7 s par défaut) en tirant le plus fort possible.
 * - "Suspension max" : tenir le plus longtemps possible (ex. 7 s puis 25 s deux mois plus tard).
 */
export default function EcranTest() {
  const c = useConnexion();
  const { reglages, profil, tests, ajouterTest } = useDonnees();
  const [type, setType] = useState<TypeTest>('force-max');
  const [main, setMain] = useState<Main>('deux');
  const [priseId, setPriseId] = useState(reglages.prises.find((p) => p.profondeurMm === 20)?.id ?? reglages.prises[0]?.id ?? '');
  const [etape, setEtape] = useState<Etape>('choix');
  const [secondes, setSecondes] = useState(0);
  const [resultat, setResultat] = useState<AnalyseSuspension | null>(null);
  const debutEtape = useRef(0);
  const debutSuspension = useRef<number | null>(null);
  const fini = useRef(false);

  const prise = reglages.prises.find((p) => p.id === priseId);

  const terminer = () => {
    if (fini.current) return; // évite de terminer deux fois
    fini.current = true;
    c.indiquerPhase({ suspendu: false, main });
    const mesures = c.arreterEnregistrement();
    setResultat(analyserSuspension(mesures, reglages.seuilSuspensionKg));
    setEtape('resultat');
  };

  // Horloge : décompte puis mesure.
  useEffect(() => {
    if (etape !== 'preparation' && etape !== 'mesure') return;
    debutEtape.current = Date.now();
    debutSuspension.current = null;
    const id = setInterval(() => {
      const ecoule = (Date.now() - debutEtape.current) / 1000;
      if (etape === 'preparation') {
        setSecondes(Math.ceil(PREPARATION_S - ecoule));
        if (ecoule >= PREPARATION_S) {
          fini.current = false;
          c.demarrerEnregistrement();
          c.indiquerPhase({ suspendu: true, main });
          setEtape('mesure');
        }
      } else {
        const depuis = debutSuspension.current ? (Date.now() - debutSuspension.current) / 1000 : 0;
        setSecondes(depuis);
        // Force max : on arrête après la durée prévue (+1 s de marge pour attraper la prise).
        if (type === 'force-max' && depuis >= reglages.dureeTestForceS) terminer();
        // Simulateur, suspension max : le "grimpeur virtuel" lâche au bout d'environ 25 s.
        if (type === 'suspension-max' && c.simulateur && depuis >= 25) c.indiquerPhase({ suspendu: false, main });
        if (ecoule > DUREE_MAX_SUSPENSION_S) terminer();
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape]);

  // Détection du début et de la fin de la suspension.
  useEffect(() => {
    if (etape !== 'mesure') return;
    const suspendu = c.forces.totalKg > reglages.seuilSuspensionKg;
    if (suspendu && debutSuspension.current === null) debutSuspension.current = Date.now();
    if (!suspendu && debutSuspension.current !== null && type === 'suspension-max') terminer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.forces]);

  if (c.etat !== 'connecte') {
    return (
      <Ecran>
        <Carte>
          <T>Connectez d'abord la planche (ou le simulateur).</T>
          <Bouton titre="Se connecter" onPress={() => router.push('/connexion')} />
        </Carte>
      </Ecran>
    );
  }

  if (etape === 'choix') {
    return (
      <Ecran>
        <Carte titre="Type de test">
          <Choix
            valeur={type}
            onChange={setType}
            options={[
              { valeur: 'force-max', libelle: `Force max (${reglages.dureeTestForceS} s)` },
              { valeur: 'suspension-max', libelle: 'Tenir le plus longtemps' },
            ]}
          />
        </Carte>
        <Carte titre="Main">
          <Choix
            valeur={main}
            onChange={setMain}
            options={[
              { valeur: 'gauche', libelle: 'Bras gauche' },
              { valeur: 'droite', libelle: 'Bras droit' },
              { valeur: 'deux', libelle: 'Les deux' },
            ]}
          />
          <T doux>Pour mesurer la dissymétrie, faites le test bras gauche puis bras droit sur la même prise.</T>
        </Carte>
        <Carte titre="Prise">
          <Choix
            valeur={priseId}
            onChange={setPriseId}
            options={reglages.prises.map((p) => ({ valeur: p.id, libelle: `${p.nom} (${p.profondeurMm} mm)` }))}
          />
        </Carte>
        <Bouton titre="Commencer" onPress={() => setEtape('preparation')} desactive={!prise} />
      </Ecran>
    );
  }

  if (etape === 'preparation' || etape === 'mesure') {
    const enSuspension = etape === 'mesure' && debutSuspension.current !== null;
    return (
      <Ecran>
        <Carte>
          <T gros>
            {etape === 'preparation'
              ? `Préparez-vous… ${secondes}`
              : enSuspension
                ? `${secondes.toFixed(1)} s`
                : 'Suspendez-vous !'}
          </T>
          <T doux>
            {main === 'deux' ? 'Deux mains' : main === 'gauche' ? 'Main gauche' : 'Main droite'} sur {prise?.nom} (
            {prise?.profondeurMm} mm).{' '}
            {type === 'force-max' ? 'Tirez le plus fort possible.' : 'Tenez le plus longtemps possible.'}
          </T>
          <JaugeForce valeurKg={c.forces.totalKg} maxKg={profil.poidsCorpsKg} />
        </Carte>
        {etape === 'mesure' ? <Bouton titre="Arrêter" variante="contour" onPress={terminer} /> : null}
      </Ecran>
    );
  }

  // Résultat
  const r = resultat!;
  const pctPoids = profil.poidsCorpsKg > 0 ? (r.forceMaxKg / profil.poidsCorpsKg) * 100 : 0;
  const precedent = tests
    .filter((t) => t.type === type && t.main === main && t.priseId === priseId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .pop();
  const valide = r.dureeS > 0.5;

  const enregistrer = () => {
    if (!prise) return;
    ajouterTest({
      id: nouvelId(),
      date: new Date().toISOString(),
      type,
      main,
      priseId,
      priseMm: prise.profondeurMm,
      dureeS: r.dureeS,
      forceMaxKg: r.forceMaxKg,
      forceMoyenneKg: r.forceMoyenneKg,
      gaucheMaxKg: r.gaucheMaxKg,
      droiteMaxKg: r.droiteMaxKg,
      poidsCorpsKg: profil.poidsCorpsKg,
    });
    router.back();
  };

  return (
    <Ecran>
      <Carte titre="Résultat">
        {!valide ? (
          <T>Aucune suspension détectée. Vérifiez la connexion et le seuil dans les réglages.</T>
        ) : (
          <>
            <Ligne libelle="Force max" valeur={`${r.forceMaxKg.toFixed(1)} kg (${pctPoids.toFixed(0)} % du poids)`} />
            <Ligne libelle="Force moyenne" valeur={`${r.forceMoyenneKg.toFixed(1)} kg`} />
            <Ligne libelle="Temps suspendu" valeur={`${r.dureeS.toFixed(1)} s`} />
            {r.gaucheMaxKg !== null && r.droiteMaxKg !== null && main === 'deux' ? (
              <>
                <Ligne libelle="Main gauche (max)" valeur={`${r.gaucheMaxKg.toFixed(1)} kg`} />
                <Ligne libelle="Main droite (max)" valeur={`${r.droiteMaxKg.toFixed(1)} kg`} />
                <Ligne libelle="Dissymétrie" valeur={`${dissymetriePct(r.gaucheMaxKg, r.droiteMaxKg).toFixed(0)} %`} />
              </>
            ) : null}
            {precedent ? (
              <T doux>
                Dernière fois ({new Date(precedent.date).toLocaleDateString('fr-FR')}) :{' '}
                {type === 'force-max' ? `${precedent.forceMaxKg.toFixed(1)} kg` : `${precedent.dureeS.toFixed(1)} s`}
              </T>
            ) : null}
          </>
        )}
      </Carte>
      {valide ? <Bouton titre="Enregistrer dans mon profil" onPress={enregistrer} /> : null}
      <Bouton titre="Recommencer" variante="contour" onPress={() => setEtape('choix')} />
    </Ecran>
  );
}
