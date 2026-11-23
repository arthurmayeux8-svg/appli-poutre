import { CapteurConfig, Forces } from './types';

/**
 * Calcule la force totale et, si possible, la force de chaque main.
 *
 * Quand la planche repose sur plusieurs capteurs, le poids se RÉPARTIT entre eux :
 * chaque capteur ne voit qu'une partie de la charge. La force totale est donc
 * la SOMME de tous les capteurs.
 *
 * Pour séparer main gauche et main droite, on additionne les capteurs placés
 * à gauche d'un côté et ceux placés à droite de l'autre. Un capteur au centre
 * ne permet pas de savoir quelle main tire : dans ce cas on ne donne pas le détail.
 */
export function calculerForces(capteursKg: number[], config: CapteurConfig[]): Forces {
  const totalKg = capteursKg.reduce((s, v) => s + v, 0);
  if (!peutSeparerLesMains(config)) {
    return { totalKg, gaucheKg: null, droiteKg: null };
  }
  let gaucheKg = 0;
  let droiteKg = 0;
  for (const c of config) {
    const v = capteursKg[c.index] ?? 0;
    if (c.cote === 'gauche') gaucheKg += v;
    else if (c.cote === 'droite') droiteKg += v;
  }
  return { totalKg, gaucheKg, droiteKg };
}

/** Il faut au moins un capteur à gauche, un à droite, et aucun au centre. */
export function peutSeparerLesMains(config: CapteurConfig[]): boolean {
  return (
    config.some((c) => c.cote === 'gauche') &&
    config.some((c) => c.cote === 'droite') &&
    !config.some((c) => c.cote === 'centre')
  );
}

/**
 * Dissymétrie en % : écart entre les deux mains rapporté à la plus forte.
 * 0 % = parfaitement équilibré. Au-delà de 10 %, on propose du rééquilibrage.
 */
export function dissymetriePct(gaucheKg: number, droiteKg: number): number {
  const fort = Math.max(gaucheKg, droiteKg);
  if (fort <= 0) return 0;
  return (Math.abs(gaucheKg - droiteKg) / fort) * 100;
}

/** Main la plus faible, ou null si l'écart est négligeable (< 5 %). */
export function mainLaPlusFaible(gaucheKg: number, droiteKg: number): 'gauche' | 'droite' | null {
  if (dissymetriePct(gaucheKg, droiteKg) < 5) return null;
  return gaucheKg < droiteKg ? 'gauche' : 'droite';
}
