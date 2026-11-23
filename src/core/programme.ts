import { Plan } from './plans';
import { SeanceFaite } from './types';

/**
 * Programme de la semaine : une séance un jour sur deux (le repos fait partie
 * de l'entraînement des doigts), en faisant tourner les plans conseillés.
 */

export type StatutJour = 'a-faire' | 'faite' | 'repos';

export interface SeancePrevue {
  date: Date;
  plan: Plan;
}

export interface JourEntrainement {
  statut: StatutJour;
  /** Le plan du jour (à faire, ou déjà fait). Pour un jour de repos : la prochaine séance. */
  plan: Plan;
  prochaine: SeancePrevue;
}

function jour(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function ajouterJours(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  r.setHours(12, 0, 0, 0);
  return r;
}

/** Plan suivant dans la rotation, d'après la dernière séance faite. */
export function planSuivant(conseilles: Plan[], seances: SeanceFaite[]): Plan {
  const derniere = seances
    .filter((s) => conseilles.some((p) => p.id === s.planId))
    .sort((a, b) => a.date.localeCompare(b.date))
    .pop();
  if (!derniere) return conseilles[0];
  const i = conseilles.findIndex((p) => p.id === derniere.planId);
  return conseilles[(i + 1) % conseilles.length];
}

export function entrainementDuJour(conseilles: Plan[], seances: SeanceFaite[], maintenant = new Date()): JourEntrainement {
  const triees = seances.slice().sort((a, b) => a.date.localeCompare(b.date));
  const derniere = triees[triees.length - 1];
  const suivant = planSuivant(conseilles, seances);

  if (derniere && jour(new Date(derniere.date)) === jour(maintenant)) {
    const fait = conseilles.find((p) => p.id === derniere.planId) ?? suivant;
    return { statut: 'faite', plan: fait, prochaine: { date: ajouterJours(maintenant, 2), plan: suivant } };
  }
  if (derniere && jour(new Date(derniere.date)) === jour(ajouterJours(maintenant, -1))) {
    return { statut: 'repos', plan: suivant, prochaine: { date: ajouterJours(maintenant, 1), plan: suivant } };
  }
  return { statut: 'a-faire', plan: suivant, prochaine: { date: ajouterJours(maintenant, 0), plan: suivant } };
}

/** Les prochaines séances prévues (en commençant par la prochaine). */
export function seancesAVenir(conseilles: Plan[], seances: SeanceFaite[], nombre = 4, maintenant = new Date()): SeancePrevue[] {
  const duJour = entrainementDuJour(conseilles, seances, maintenant);
  const debut = conseilles.findIndex((p) => p.id === duJour.prochaine.plan.id);
  return Array.from({ length: nombre }, (_, i) => ({
    date: ajouterJours(duJour.prochaine.date, i * 2),
    plan: conseilles[(debut + i) % conseilles.length],
  }));
}

/** Durée totale approximative d'un plan, en minutes. */
export function dureePlanMin(plan: Plan): number {
  let s = 0;
  for (const ex of plan.exercices) {
    const parSerie = ex.repetitions * ex.suspensionS + (ex.repetitions - 1) * ex.reposS;
    s += 10 + ex.series * parSerie + (ex.series - 1) * ex.reposSeriesS;
  }
  return Math.max(1, Math.round(s / 60));
}
