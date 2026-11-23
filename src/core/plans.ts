import { dissymetriePct, mainLaPlusFaible } from './forces';
import { Main, Niveau, Prise, ResultatTest, SeanceFaite } from './types';

/* ------------------------------------------------------------------ */
/* 1. Niveau du grimpeur                                               */
/* ------------------------------------------------------------------ */

export const NOMS_NIVEAUX: Record<Niveau, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  confirme: 'Confirmé',
  expert: 'Expert',
};

/**
 * Seuils de niveau, en % du poids de corps, pour la force max à deux mains
 * sur une réglette d'environ 20 mm (repères courants en escalade).
 * Ces valeurs sont un point de départ : à ajuster avec vos propres mesures.
 */
export const SEUILS_NIVEAU_PCT = { intermediaire: 100, confirme: 130, expert: 160 };

/** Force max à deux mains la plus récente, en kg (ou somme gauche + droite). */
export function forceReferenceDeuxMains(tests: ResultatTest[]): ResultatTest | null {
  const forces = trierParDate(tests.filter((t) => t.type === 'force-max'));
  const deux = forces.filter((t) => t.main === 'deux').pop();
  const g = forces.filter((t) => t.main === 'gauche').pop();
  const d = forces.filter((t) => t.main === 'droite').pop();
  if (g && d && (!deux || (g.date > deux.date && d.date > deux.date))) {
    // Les tests à une main sont plus récents : on les additionne.
    return { ...d, main: 'deux', forceMaxKg: g.forceMaxKg + d.forceMaxKg };
  }
  return deux ?? null;
}

export function calculerNiveau(tests: ResultatTest[]): Niveau {
  const ref = forceReferenceDeuxMains(tests);
  if (!ref || ref.poidsCorpsKg <= 0) return 'debutant';
  const pct = (ref.forceMaxKg / ref.poidsCorpsKg) * 100;
  if (pct >= SEUILS_NIVEAU_PCT.expert) return 'expert';
  if (pct >= SEUILS_NIVEAU_PCT.confirme) return 'confirme';
  if (pct >= SEUILS_NIVEAU_PCT.intermediaire) return 'intermediaire';
  return 'debutant';
}

/** Dissymétrie la plus récente connue (tests à une main ou détail à deux mains). */
export function derniereDissymetrie(
  tests: ResultatTest[],
): { pct: number; faible: 'gauche' | 'droite' | null } | null {
  const forces = trierParDate(tests.filter((t) => t.type === 'force-max'));
  const g = forces.filter((t) => t.main === 'gauche').pop();
  const d = forces.filter((t) => t.main === 'droite').pop();
  const deux = forces.filter((t) => t.main === 'deux' && t.gaucheMaxKg != null && t.droiteMaxKg != null).pop();

  let gKg: number | null = null;
  let dKg: number | null = null;
  if (g && d) {
    gKg = g.forceMaxKg;
    dKg = d.forceMaxKg;
  }
  if (deux && (!g || !d || deux.date > g.date || deux.date > d.date)) {
    gKg = deux.gaucheMaxKg!;
    dKg = deux.droiteMaxKg!;
  }
  if (gKg === null || dKg === null) return null;
  return { pct: dissymetriePct(gKg, dKg), faible: mainLaPlusFaible(gKg, dKg) };
}

/* ------------------------------------------------------------------ */
/* 2. Exercices et plans                                               */
/* ------------------------------------------------------------------ */

export type Prehension = 'demi-arque' | 'tendu' | 'trois-doigts';

export const NOMS_PREHENSION: Record<Prehension, string> = {
  'demi-arque': 'Demi-arqué',
  tendu: 'Doigts tendus',
  'trois-doigts': 'Trois doigts (tendu)',
};

export const PLACEMENT_DOIGTS: Record<Prehension, string> = {
  'demi-arque':
    "4 doigts sur la prise, 2e phalange pliée à environ 90°, pouce libre. Ne pas verrouiller le pouce par-dessus l'index.",
  tendu: '4 doigts sur la prise, doigts presque droits, poignet dans l\'axe. Prise la plus douce pour les tendons.',
  'trois-doigts': 'Index, majeur et annulaire sur la prise, doigts tendus, auriculaire dans le vide.',
};

export interface Exercice {
  nom: string;
  consigne: string;
  prehension: Prehension;
  /** Profondeur de prise visée, en mm. L'appli choisit la prise configurée la plus proche. */
  priseVisee: number;
  /** 'faible' = la main la plus faible (rééquilibrage). */
  main: Main | 'faible';
  suspensionS: number;
  reposS: number;
  repetitions: number;
  series: number;
  reposSeriesS: number;
  /** Intensité visée en % de la force max mesurée au dernier test. */
  intensitePct: [number, number];
}

export interface Plan {
  id: string;
  nom: string;
  objectif: string;
  niveaux: Niveau[];
  /** Séances conseillées par semaine. */
  parSemaine: number;
  exercices: Exercice[];
}

export const PLANS: Plan[] = [
  {
    id: 'decouverte',
    nom: 'Découverte',
    objectif: 'Habituer doigts et tendons à la suspension, sans risque.',
    niveaux: ['debutant'],
    parSemaine: 2,
    exercices: [
      {
        nom: 'Suspensions allégées',
        consigne: "Pieds sur une chaise pour alléger. Gardez la force dans la zone verte de l'écran.",
        prehension: 'tendu',
        priseVisee: 30,
        main: 'deux',
        suspensionS: 10,
        reposS: 50,
        repetitions: 5,
        series: 2,
        reposSeriesS: 180,
        intensitePct: [50, 70],
      },
    ],
  },
  {
    id: 'repeaters',
    nom: 'Repeaters 7/3',
    objectif: 'Force-endurance des doigts : 7 s suspendu, 3 s de repos.',
    niveaux: ['intermediaire', 'confirme'],
    parSemaine: 2,
    exercices: [
      {
        nom: 'Repeaters',
        consigne: 'Enchaînez 7 s de suspension et 3 s de repos sans lâcher le rythme.',
        prehension: 'demi-arque',
        priseVisee: 20,
        main: 'deux',
        suspensionS: 7,
        reposS: 3,
        repetitions: 6,
        series: 3,
        reposSeriesS: 180,
        intensitePct: [65, 80],
      },
    ],
  },
  {
    id: 'endurance',
    nom: 'Suspensions longues',
    objectif: 'Endurance et solidité des tendons, faible intensité.',
    niveaux: ['debutant', 'intermediaire', 'confirme'],
    parSemaine: 2,
    exercices: [
      {
        nom: 'Suspensions de 30 s',
        consigne: 'Intensité modérée, respirez calmement, ne serrez pas plus que la zone verte.',
        prehension: 'tendu',
        priseVisee: 25,
        main: 'deux',
        suspensionS: 30,
        reposS: 60,
        repetitions: 4,
        series: 2,
        reposSeriesS: 180,
        intensitePct: [40, 55],
      },
    ],
  },
  {
    id: 'force-max',
    nom: 'Force max',
    objectif: 'Gagner en force maximale : suspensions courtes et intenses.',
    niveaux: ['confirme', 'expert'],
    parSemaine: 2,
    exercices: [
      {
        nom: 'Max hangs 10 s',
        consigne: 'Échauffez-vous bien avant. Repos complet entre chaque suspension.',
        prehension: 'demi-arque',
        priseVisee: 20,
        main: 'deux',
        suspensionS: 10,
        reposS: 180,
        repetitions: 5,
        series: 1,
        reposSeriesS: 0,
        intensitePct: [85, 95],
      },
    ],
  },
  {
    id: 'petite-prise',
    nom: 'Petites réglettes',
    objectif: 'Force sur petites prises, pour grimpeurs expérimentés.',
    niveaux: ['expert'],
    parSemaine: 2,
    exercices: [
      {
        nom: 'Max hangs 7 s petite prise',
        consigne: 'Arrêtez au moindre signe de douleur dans un doigt.',
        prehension: 'demi-arque',
        priseVisee: 10,
        main: 'deux',
        suspensionS: 7,
        reposS: 180,
        repetitions: 6,
        series: 1,
        reposSeriesS: 0,
        intensitePct: [90, 100],
      },
    ],
  },
  {
    id: 'reequilibrage',
    nom: 'Rééquilibrage',
    objectif: 'Réduire la dissymétrie entre les deux mains.',
    niveaux: [],
    parSemaine: 2,
    exercices: [
      {
        nom: 'Suspensions à une main (main faible)',
        consigne: "Pieds au sol ou sur une chaise pour doser l'effort, une seule main sur la prise.",
        prehension: 'demi-arque',
        priseVisee: 20,
        main: 'faible',
        suspensionS: 7,
        reposS: 120,
        repetitions: 5,
        series: 2,
        reposSeriesS: 180,
        intensitePct: [60, 75],
      },
    ],
  },
];

/** Plans proposés au grimpeur, du plus adapté au moins adapté. */
export function plansRecommandes(niveau: Niveau, dissymetrie: { pct: number } | null): Plan[] {
  const adaptes = PLANS.filter((p) => p.niveaux.includes(niveau));
  if (dissymetrie && dissymetrie.pct > 10) {
    adaptes.unshift(PLANS.find((p) => p.id === 'reequilibrage')!);
  }
  return adaptes;
}

export function trouverPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Choisit, parmi les prises configurées, celle dont la profondeur est la plus proche. */
export function choisirPrise(prises: Prise[], viseeMm: number): Prise | null {
  if (prises.length === 0) return null;
  return prises.reduce((best, p) =>
    Math.abs(p.profondeurMm - viseeMm) < Math.abs(best.profondeurMm - viseeMm) ? p : best,
  );
}

/* ------------------------------------------------------------------ */
/* 3. Adaptation automatique                                           */
/* ------------------------------------------------------------------ */

export interface Ajustement {
  /** Points de % ajoutés (ou retirés) à l'intensité visée. */
  intensiteBonusPct: number;
  /** Secondes ajoutées à chaque suspension. */
  suspensionBonusS: number;
}

/**
 * Rejoue l'historique des séances d'un plan pour savoir comment l'adapter :
 * - séance réussie et jugée trop facile -> +5 % d'intensité (jusqu'à +15 %),
 *   puis +1 s de suspension une fois ce plafond atteint ;
 * - séance ratée (< 70 % des suspensions tenues) ou jugée trop dure -> on recule.
 * Un nouveau test de force remet l'ajustement à zéro, car les cibles en kg
 * sont alors recalculées sur la nouvelle force max.
 */
export function calculerAjustement(planId: string, seances: SeanceFaite[], dernierTestDate: string | null): Ajustement {
  const aj: Ajustement = { intensiteBonusPct: 0, suspensionBonusS: 0 };
  const liste = trierParDate(seances.filter((s) => s.planId === planId && (!dernierTestDate || s.date > dernierTestDate)));
  for (const s of liste) {
    const facile = s.ressenti === 1 && s.reussite >= 0.9;
    const dur = s.ressenti === 3 || s.reussite < 0.7;
    if (facile) {
      if (aj.intensiteBonusPct < 15) aj.intensiteBonusPct += 5;
      else aj.suspensionBonusS = Math.min(aj.suspensionBonusS + 1, 5);
    } else if (dur) {
      if (aj.suspensionBonusS > 0) aj.suspensionBonusS -= 1;
      else aj.intensiteBonusPct = Math.max(aj.intensiteBonusPct - 5, -15);
    }
  }
  return aj;
}

/** Force max de référence (kg) pour une main donnée, d'après les derniers tests. */
export function forceReferencePour(main: Main, tests: ResultatTest[]): number | null {
  if (main === 'deux') return forceReferenceDeuxMains(tests)?.forceMaxKg ?? null;
  const forces = trierParDate(tests.filter((t) => t.type === 'force-max'));
  const uneMain = forces.filter((t) => t.main === main).pop();
  if (uneMain) return uneMain.forceMaxKg;
  const deux = forceReferenceDeuxMains(tests);
  if (!deux) return null;
  const detail = main === 'gauche' ? deux.gaucheMaxKg : deux.droiteMaxKg;
  return detail ?? deux.forceMaxKg / 2;
}

export interface CibleExercice {
  main: Main;
  suspensionS: number;
  intensitePct: [number, number];
  /** Zone de force visée en kg, ou null si aucun test n'a encore été fait. */
  cibleKg: [number, number] | null;
}

export function calculerCible(ex: Exercice, tests: ResultatTest[], aj: Ajustement): CibleExercice {
  let main: Main = 'deux';
  if (ex.main === 'faible') main = derniereDissymetrie(tests)?.faible ?? 'gauche';
  else main = ex.main;

  const intensitePct: [number, number] = [
    clamp(ex.intensitePct[0] + aj.intensiteBonusPct, 20, 110),
    clamp(ex.intensitePct[1] + aj.intensiteBonusPct, 25, 115),
  ];
  const ref = forceReferencePour(main, tests);
  return {
    main,
    suspensionS: ex.suspensionS + aj.suspensionBonusS,
    intensitePct,
    cibleKg: ref ? [(ref * intensitePct[0]) / 100, (ref * intensitePct[1]) / 100] : null,
  };
}

/* ------------------------------------------------------------------ */
/* 4. Suivi de progression                                             */
/* ------------------------------------------------------------------ */

export interface PointProgression {
  date: string;
  valeur: number;
}

/**
 * Série de points pour un graphique : force max (kg) pour les tests de force,
 * durée (s) pour les tests de suspension max.
 */
export function serieProgression(
  tests: ResultatTest[],
  filtre: { type: ResultatTest['type']; main: Main; priseId?: string },
): PointProgression[] {
  return trierParDate(
    tests.filter(
      (t) => t.type === filtre.type && t.main === filtre.main && (!filtre.priseId || t.priseId === filtre.priseId),
    ),
  ).map((t) => ({ date: t.date, valeur: filtre.type === 'force-max' ? t.forceMaxKg : t.dureeS }));
}

/** Évolution en % entre le premier et le dernier point. */
export function evolutionPct(points: PointProgression[]): number | null {
  if (points.length < 2 || points[0].valeur <= 0) return null;
  const premier = points[0].valeur;
  const dernier = points[points.length - 1].valeur;
  return ((dernier - premier) / premier) * 100;
}

/** On conseille de refaire un test toutes les 4 semaines. */
export function testConseille(tests: ResultatTest[], maintenant = new Date()): boolean {
  const dernier = trierParDate(tests.filter((t) => t.type === 'force-max')).pop();
  if (!dernier) return true;
  const jours = (maintenant.getTime() - new Date(dernier.date).getTime()) / 86_400_000;
  return jours >= 28;
}

/* ------------------------------------------------------------------ */

function trierParDate<T extends { date: string }>(liste: T[]): T[] {
  return liste.slice().sort((a, b) => a.date.localeCompare(b.date));
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
