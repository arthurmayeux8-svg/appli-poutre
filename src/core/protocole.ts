/**
 * Protocole d'échange entre la carte Arduino et l'appli.
 * Voir docs/protocole.md pour l'explication complète.
 *
 * Arduino -> appli : une ligne de texte par mesure, environ 20 fois par seconde
 *     P,<grammes capteur 0>,<grammes capteur 1>,...\n
 *   exemple avec 2 capteurs : "P,31250,29800\n"
 *
 * Appli -> Arduino : une commande par ligne
 *     T\n   remise à zéro (tare) des capteurs
 */

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

/** Fabrique une ligne de mesure (utilisé par le simulateur et les tests). */
export function ecrireLigneMesure(grammes: number[]): string {
  return 'P,' + grammes.map((g) => Math.round(g)).join(',') + '\n';
}
