/**
 * Protocole d'échange entre la carte Arduino et l'appli.
 * Voir docs/protocole.md pour l'explication complète.
 *
 * Arduino -> appli : une ligne de texte par mesure, environ 20 fois par seconde
 *     P,<grammes capteur 0>,<grammes capteur 1>,...\n
 *   exemple avec 2 capteurs : "P,31250,29800\n"
 *
 * Arduino -> appli, toutes les ~2 secondes : la configuration de la planche
 *     C,<côté capteur 1>,<côté capteur 2>,...\n     avec G = gauche, D = droite, M = milieu
 *   exemple avec 4 capteurs : "C,G,G,D,D\n"
 *   L'appli règle alors toute seule le nombre de capteurs et leur côté :
 *   l'utilisateur n'a rien à faire.
 *
 * Appli -> Arduino : une commande par ligne
 *     T\n   remise à zéro (tare) des capteurs
 */

import type { CoteCapteur } from './types';

export const COMMANDE_TARE = 'T\n';

/**
 * Le Bluetooth basse consommation découpe les messages en petits morceaux
 * (souvent 20 octets). Cette classe recolle les morceaux et rend
 * les lignes complètes une par une.
 */
export class DecoupeurLignes {
  private tampon = '';

  /** Ajoute un morceau reçu et renvoie les lignes complètes trouvées. */
  ajouter(morceau: string): string[] {
    this.tampon += morceau;
    const lignes = this.tampon.split('\n');
    this.tampon = lignes.pop() ?? '';
    // Sécurité : si on ne reçoit jamais de fin de ligne, on vide le tampon.
    if (this.tampon.length > 200) this.tampon = '';
    return lignes.map((l) => l.trim()).filter((l) => l.length > 0);
  }
}

/**
 * Lit une ligne "P,..." et renvoie les valeurs en kg,
 * ou null si la ligne n'est pas une mesure valide.
 */
export function lireLigneMesure(ligne: string): number[] | null {
  const morceaux = ligne.trim().split(',');
  if (morceaux[0] !== 'P' || morceaux.length < 2) return null;
  const valeurs: number[] = [];
  for (const m of morceaux.slice(1)) {
    const grammes = Number(m);
    if (m.trim() === '' || !Number.isFinite(grammes)) return null;
    valeurs.push(grammes / 1000);
  }
  return valeurs;
}

/**
 * Lit une ligne "C,G,D,..." (configuration envoyée par la planche).
 * Accepte aussi L/R (anglais) et C pour le centre.
 */
export function lireLigneConfig(ligne: string): CoteCapteur[] | null {
  const morceaux = ligne.trim().toUpperCase().split(',');
  if (morceaux[0] !== 'C' || morceaux.length < 2 || morceaux.length > 5) return null;
  const cotes: CoteCapteur[] = [];
  for (const m of morceaux.slice(1)) {
    const c = m.trim();
    if (c === 'G' || c === 'L') cotes.push('gauche');
    else if (c === 'D' || c === 'R') cotes.push('droite');
    else if (c === 'M' || c === 'C') cotes.push('centre');
    else return null;
  }
  return cotes;
}

/** Fabrique une ligne de mesure (utilisé par le simulateur et les tests). */
export function ecrireLigneMesure(grammes: number[]): string {
  return 'P,' + grammes.map((g) => Math.round(g)).join(',') + '\n';
}
