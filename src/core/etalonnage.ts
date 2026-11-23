/**
 * ÉTALONNAGE DANS L'APPLI
 *
 * L'Arduino envoie une valeur par capteur qui est PROPORTIONNELLE au poids,
 * même si son facteur d'étalonnage n'est pas encore bon. L'appli corrige ensuite
 * chaque capteur avec deux nombres enregistrés sur le téléphone :
 *
 *   poids corrigé = (valeur reçue - zéro) × facteur
 *
 * - le « zéro » se règle avec la remise à zéro (planche vide) ;
 * - le « facteur » se règle avec un poids connu.
 * Ainsi, pas besoin de modifier le programme Arduino pour étalonner.
 */

export interface Etalonnage {
  /** Valeur reçue (kg) quand la planche est vide, par capteur. */
  zerosKg: number[];
  /** Facteur multiplicatif, par capteur (1 = pas de correction). */
  facteurs: number[];
}

export const ETALONNAGE_NEUTRE: Etalonnage = { zerosKg: [], facteurs: [] };

export function corriger(brutsKg: number[], e: Etalonnage): number[] {
  return brutsKg.map((v, i) => (v - (e.zerosKg[i] ?? 0)) * (e.facteurs[i] ?? 1));
}

/** Moyenne capteur par capteur d'une série de mesures brutes. */
export function moyenne(series: number[][]): number[] {
  if (series.length === 0) return [];
  const nb = Math.max(...series.map((s) => s.length));
  return Array.from({ length: nb }, (_, i) => series.reduce((s, m) => s + (m[i] ?? 0), 0) / series.length);
}

/** Remise à zéro : la valeur actuelle (planche vide) devient le zéro. */
export function regleZero(e: Etalonnage, moyenneBrutsKg: number[]): Etalonnage {
  return { ...e, zerosKg: moyenneBrutsKg.slice() };
}

/**
 * Règle le facteur avec un poids connu.
 * - capteur = un numéro (0, 1…) : le poids est posé juste au-dessus de ce capteur ;
 * - capteur = 'tous' : le poids est porté par toute la planche (ex. on se suspend
 *   avec son poids pesé sur une balance) ; tous les facteurs sont corrigés pareil.
 * Renvoie null si la mesure est trop faible pour être fiable (< 1 kg).
 */
export function regleFacteur(
  e: Etalonnage,
  moyenneBrutsKg: number[],
  capteur: number | 'tous',
  poidsConnuKg: number,
): Etalonnage | null {
  const actuels = corriger(moyenneBrutsKg, e);
  const facteurs = moyenneBrutsKg.map((_, i) => e.facteurs[i] ?? 1);
  if (capteur === 'tous') {
    const total = actuels.reduce((s, v) => s + v, 0);
    if (Math.abs(total) < 1) return null;
    const correction = poidsConnuKg / total;
    return { ...e, facteurs: facteurs.map((f) => f * correction) };
  }
  const mesure = actuels[capteur] ?? 0;
  if (Math.abs(mesure) < 1) return null;
  facteurs[capteur] = facteurs[capteur] * (poidsConnuKg / mesure);
  return { ...e, facteurs };
}

/**
 * Pour identifier les capteurs : renvoie le numéro du capteur qui porte
 * le plus de charge (au moins 2 kg et 60 % du total), sinon null.
 */
export function capteurLePlusCharge(capteursKg: number[]): number | null {
  const total = capteursKg.reduce((s, v) => s + Math.max(0, v), 0);
  if (total < 2) return null;
  let best = 0;
  capteursKg.forEach((v, i) => {
    if (v > capteursKg[best]) best = i;
  });
  return capteursKg[best] / total >= 0.6 ? best : null;
}
