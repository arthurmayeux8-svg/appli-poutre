import { Niveau, ResultatTest } from './types';

/**
 * SCORE DE GRIMPE DE 1 À 10
 *
 * Il est calculé à partir de la force max à deux mains, en % du poids de corps,
 * ramenée à une réglette de 20 mm (une prise plus petite est plus dure, donc
 * la même force sur 10 mm "vaut" plus que sur 20 mm).
 *
 *   60 % du poids ou moins  -> 1   (débutant)
 *   100 %                   -> 4   (début intermédiaire)
 *   130 %                   -> 6,3 (début confirmé)
 *   160 %                   -> 8,5 (début expert)
 *   180 % ou plus           -> 10
 */
export const PCT_SCORE_1 = 60;
export const PCT_SCORE_10 = 180;

export function scorePourPct(pct: number): number {
  const s = 1 + (9 * (pct - PCT_SCORE_1)) / (PCT_SCORE_10 - PCT_SCORE_1);
  return Math.round(Math.min(10, Math.max(1, s)) * 10) / 10;
}

export function niveauPourScore(score: number | null): Niveau {
  if (score === null) return 'debutant';
  if (score >= scorePourPct(160)) return 'expert';
  if (score >= scorePourPct(130)) return 'confirme';
  if (score >= scorePourPct(100)) return 'intermediaire';
  return 'debutant';
}

/** Force équivalente sur une réglette de 20 mm. */
export function forceEquivalente20mm(forceKg: number, priseMm: number): number {
  if (priseMm <= 0) return forceKg;
  return forceKg * Math.pow(20 / priseMm, 0.35);
}

export interface PointScore {
  date: string;
  score: number;
}

/**
 * Rejoue les tests dans l'ordre pour obtenir le score après chaque test.
 * Une force "deux mains" vient soit d'un test à deux mains,
 * soit de la somme du dernier test main gauche + dernier test main droite.
 * Plusieurs tests le même jour ne donnent qu'un point (le dernier).
 */
export function historiqueScores(tests: ResultatTest[]): PointScore[] {
  const forces = tests
    .filter((t) => t.type === 'force-max' && t.poidsCorpsKg > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  let gauche: ResultatTest | null = null;
  let droite: ResultatTest | null = null;
  const points: PointScore[] = [];

  for (const t of forces) {
    let pct: number | null = null;
    if (t.main === 'deux') {
      pct = (forceEquivalente20mm(t.forceMaxKg, t.priseMm) / t.poidsCorpsKg) * 100;
    } else {
      if (t.main === 'gauche') gauche = t;
      else droite = t;
      if (gauche && droite) {
        const somme = forceEquivalente20mm(gauche.forceMaxKg, gauche.priseMm) + forceEquivalente20mm(droite.forceMaxKg, droite.priseMm);
        pct = (somme / t.poidsCorpsKg) * 100;
      }
    }
    if (pct === null) continue;
    const point = { date: t.date, score: scorePourPct(pct) };
    const dernier = points[points.length - 1];
    if (dernier && dernier.date.slice(0, 10) === t.date.slice(0, 10)) points[points.length - 1] = point;
    else points.push(point);
  }
  return points;
}

export function scoreActuel(tests: ResultatTest[]): number | null {
  const h = historiqueScores(tests);
  return h.length ? h[h.length - 1].score : null;
}
