import { router } from 'expo-router';
import {
  calculerAjustement,
  calculerNiveau,
  derniereDissymetrie,
  NOMS_NIVEAUX,
  Plan,
  PLANS,
  plansRecommandes,
} from '../core/plans';
import { useDonnees } from '../state/donnees';
import { Bouton, Carte, Ecran, T } from '../ui/composants';

/** Liste des plans d'entraînement, les plus adaptés en premier. */
export default function EcranEntrainement() {
  const { tests, seances } = useDonnees();
  const niveau = calculerNiveau(tests);
  const dissy = derniereDissymetrie(tests);
  const recommandes = plansRecommandes(niveau, dissy);
  const autres = PLANS.filter((p) => !recommandes.includes(p) && p.id !== 'reequilibrage');
  const dernierTest = tests
    .filter((t) => t.type === 'force-max')
    .map((t) => t.date)
    .sort()
    .pop() ?? null;

  const carte = (p: Plan) => {
    const aj = calculerAjustement(p.id, seances, dernierTest);
    const nbFaites = seances.filter((s) => s.planId === p.id).length;
    return (
      <Carte key={p.id} titre={p.nom}>
        <T>{p.objectif}</T>
        <T doux>
          {p.parSemaine} séances par semaine · {nbFaites} faite{nbFaites > 1 ? 's' : ''}
          {aj.intensiteBonusPct !== 0 ? ` · intensité ${aj.intensiteBonusPct > 0 ? '+' : ''}${aj.intensiteBonusPct} %` : ''}
          {aj.suspensionBonusS !== 0 ? ` · +${aj.suspensionBonusS} s par suspension` : ''}
        </T>
        <Bouton titre="Voir la séance" variante="contour" onPress={() => router.push(`/seance/${p.id}`)} />
      </Carte>
    );
  };

  return (
    <Ecran>
      <Carte>
        <T gros>Niveau : {NOMS_NIVEAUX[niveau]}</T>
        {tests.length === 0 ? (
          <T doux>Faites un test de force pour que les charges soient calculées pour vous.</T>
        ) : null}
        {dissy ? (
          <T doux>
            Dissymétrie : {dissy.pct.toFixed(0)} %
            {dissy.faible ? ` (main ${dissy.faible} plus faible)` : ''}
            {dissy.pct > 10 ? '. Un plan de rééquilibrage est proposé.' : '.'}
          </T>
        ) : (
          <T doux>Testez bras gauche et bras droit pour connaître votre dissymétrie.</T>
        )}
      </Carte>
      <T gros>Conseillés pour vous</T>
      {recommandes.map(carte)}
      {autres.length > 0 ? <T gros>Autres plans</T> : null}
      {autres.map(carte)}
    </Ecran>
  );
}
