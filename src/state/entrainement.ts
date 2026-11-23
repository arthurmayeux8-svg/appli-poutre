import { calculerAjustement, calculerCible, calculerNiveau, derniereDissymetrie, plansRecommandes } from '../core/plans';
import { entrainementDuJour, seancesAVenir } from '../core/programme';
import { historiqueScores, scoreActuel } from '../core/score';
import { useDonnees } from './donnees';

/** Regroupe tout ce que les écrans ont besoin de savoir sur l'entraînement. */
export function useEntrainement() {
  const { tests, seances } = useDonnees();
  const niveau = calculerNiveau(tests);
  const dissymetrie = derniereDissymetrie(tests);
  const conseilles = plansRecommandes(niveau, dissymetrie);
  const duJour = entrainementDuJour(conseilles, seances);
  const aVenir = seancesAVenir(conseilles, seances, 5);
  const dernierTest = tests.filter((t) => t.type === 'force-max').map((t) => t.date).sort().pop() ?? null;
  const cibles = (planId: string, exercices: Parameters<typeof calculerCible>[0][]) => {
    const aj = calculerAjustement(planId, seances, dernierTest);
    return { ajustement: aj, cibles: exercices.map((ex) => calculerCible(ex, tests, aj)) };
  };
  return {
    niveau,
    score: scoreActuel(tests),
    scores: historiqueScores(tests),
    dissymetrie,
    conseilles,
    duJour,
    aVenir,
    cibles,
  };
}
