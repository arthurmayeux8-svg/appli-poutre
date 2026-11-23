import { Forces } from './types';

export interface Echantillon extends Forces {
  t: number;
}

export interface AnalyseSuspension {
  /** Durée pendant laquelle la force est restée au-dessus du seuil, en secondes. */
  dureeS: number;
  forceMaxKg: number;
  forceMoyenneKg: number;
  gaucheMaxKg: number | null;
  droiteMaxKg: number | null;
}

/**
 * Analyse un enregistrement : on cherche la plus longue période où le grimpeur
 * est suspendu (force > seuil), puis on calcule le max et la moyenne sur cette période.
 *
 * Le max est lissé sur ~3 mesures pour éviter qu'un à-coup (un petit saut
 * en attrapant la prise) ne fausse le résultat.
 */
export function analyserSuspension(echantillons: Echantillon[], seuilKg: number): AnalyseSuspension {
  const vide: AnalyseSuspension = {
    dureeS: 0,
    forceMaxKg: 0,
    forceMoyenneKg: 0,
    gaucheMaxKg: null,
    droiteMaxKg: null,
  };
  if (echantillons.length === 0) return vide;

  // 1. Trouver la plus longue période au-dessus du seuil.
  let meilleurDebut = -1;
  let meilleureFin = -1;
  let debut = -1;
  for (let i = 0; i <= echantillons.length; i++) {
    const dessus = i < echantillons.length && echantillons[i].totalKg > seuilKg;
    if (dessus && debut < 0) debut = i;
    if (!dessus && debut >= 0) {
      const fin = i - 1;
      if (meilleurDebut < 0 || dureeEntre(echantillons, debut, fin) > dureeEntre(echantillons, meilleurDebut, meilleureFin)) {
        meilleurDebut = debut;
        meilleureFin = fin;
      }
      debut = -1;
    }
  }
  if (meilleurDebut < 0) return vide;

  const periode = echantillons.slice(meilleurDebut, meilleureFin + 1);
  const totaux = lisser(periode.map((e) => e.totalKg));
  const moyenne = periode.reduce((s, e) => s + e.totalKg, 0) / periode.length;

  const gauches = periode.map((e) => e.gaucheKg);
  const droites = periode.map((e) => e.droiteKg);
  const aDetail = gauches.every((g) => g !== null) && droites.every((d) => d !== null);

  return {
    dureeS: dureeEntre(echantillons, meilleurDebut, meilleureFin),
    forceMaxKg: Math.max(...totaux),
    forceMoyenneKg: moyenne,
    gaucheMaxKg: aDetail ? Math.max(...lisser(gauches as number[])) : null,
    droiteMaxKg: aDetail ? Math.max(...lisser(droites as number[])) : null,
  };
}

function dureeEntre(e: Echantillon[], debut: number, fin: number): number {
  return (e[fin].t - e[debut].t) / 1000;
}

/** Moyenne glissante sur 3 valeurs. */
export function lisser(valeurs: number[]): number[] {
  if (valeurs.length < 3) return valeurs.slice();
  return valeurs.map((_, i) => {
    const a = valeurs[Math.max(0, i - 1)];
    const b = valeurs[i];
    const c = valeurs[Math.min(valeurs.length - 1, i + 1)];
    return (a + b + c) / 3;
  });
}
