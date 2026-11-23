import { COMMANDE_TARE, ecrireLigneMesure } from '../core/protocole';
import { CapteurConfig } from '../core/types';
import { PhaseSimulee, Planche } from './planche';

/**
 * Fausse planche, pour développer et tester l'appli sans matériel.
 * Elle envoie exactement les mêmes messages que l'Arduino ("P,...") 20 fois par seconde.
 *
 * Un "grimpeur virtuel" se suspend tout seul pendant les tests et les séances :
 * - sa force max à deux mains vaut environ 115 % de son poids de corps,
 * - sa main gauche est ~15 % plus faible que la droite (pour voir la dissymétrie),
 * - il fatigue un peu au fil de la suspension.
 * On peut aussi le faire se suspendre à la main (bouton "Maintenir" dans les paramètres).
 */
export class PlancheSimulee implements Planche {
  nom = 'Simulateur';
  private minuteur: ReturnType<typeof setInterval> | null = null;
  private phase: PhaseSimulee = { suspendu: false, main: 'deux' };
  private manuel = false;
  private debut = 0;
  private lacherApresS = 25;
  private chargeActuelleG = 0;
  private decalageG: number[] = [0, 0, 0, 0];

  constructor(
    private capteurs: () => CapteurConfig[],
    private poidsCorpsKg: () => number,
  ) {}

  definirPhase(phase: PhaseSimulee) {
    if (phase.suspendu && !this.phase.suspendu) {
      this.debut = Date.now();
      this.lacherApresS = 15 + Math.random() * 20;
    }
    this.phase = phase;
  }

  /** Suspension "à la main" : tant que c'est vrai, le grimpeur virtuel est suspendu. */
  suspensionManuelle(active: boolean) {
    if (active && !this.manuel) this.debut = Date.now();
    this.manuel = active;
  }

  async demarrer(onLigne: (ligne: string) => void) {
    // Petit décalage de zéro au démarrage, comme un vrai capteur avant la tare.
    this.decalageG = this.decalageG.map(() => (Math.random() - 0.5) * 400);
    this.minuteur = setInterval(() => onLigne(ecrireLigneMesure(this.mesurer())), 50);
  }

  async envoyer(commande: string) {
    if (commande === COMMANDE_TARE) this.decalageG = this.decalageG.map(() => 0);
  }

  async deconnecter() {
    if (this.minuteur) clearInterval(this.minuteur);
    this.minuteur = null;
  }

  /** Charge (kg) que le grimpeur virtuel cherche à mettre en ce moment. */
  private chargeVisee(): { kg: number; main: PhaseSimulee['main'] } {
    const poids = this.poidsCorpsKg() || 70;
    const ecoule = (Date.now() - this.debut) / 1000;
    if (this.manuel) return { kg: poids, main: 'deux' };
    const p = this.phase;
    if (!p.suspendu) return { kg: 0, main: p.main };

    const forceMaxDeuxMains = poids * 1.15;
    const forceMaxMain = p.main === 'deux' ? forceMaxDeuxMains : p.main === 'gauche' ? forceMaxDeuxMains * 0.46 : forceMaxDeuxMains * 0.54;
    const fatigue = Math.max(0.7, 1 - ecoule * 0.006);

    switch (p.mode) {
      case 'force-max':
        return { kg: forceMaxMain * fatigue, main: p.main };
      case 'tenir':
        return { kg: ecoule < this.lacherApresS ? Math.min(poids, forceMaxMain) : 0, main: p.main };
      default: {
        // Entraînement : vise la zone, avec de petites variations.
        const vise = p.chargeKg ?? poids * 0.8;
        const oscillation = 1 + 0.04 * Math.sin(ecoule * 2.3);
        return { kg: Math.min(vise * oscillation, forceMaxMain), main: p.main };
      }
    }
  }

  private mesurer(): number[] {
    const capteurs = this.capteurs();
    const nb = Math.max(1, capteurs.length);
    const { kg, main } = this.chargeVisee();

    // La charge suit la cible en douceur (montée en ~0,4 s).
    this.chargeActuelleG += (kg * 1000 - this.chargeActuelleG) * 0.25;
    const totalG = this.chargeActuelleG * (1 + (Math.random() - 0.5) * 0.02);

    let partGauche = 0.46;
    if (main === 'gauche') partGauche = 1;
    if (main === 'droite') partGauche = 0;
    const gaucheG = totalG * partGauche;
    const droiteG = totalG - gaucheG;

    const nbG = capteurs.filter((c) => c.cote === 'gauche').length;
    const nbD = capteurs.filter((c) => c.cote === 'droite').length;
    const aCentre = capteurs.some((c) => c.cote === 'centre');
    const valeurs = new Array(nb).fill(0);
    for (const c of capteurs) {
      let v = 0;
      if (aCentre) v = totalG / nb;
      else if (c.cote === 'gauche') v = gaucheG / nbG;
      else v = droiteG / nbD;
      valeurs[c.index] = v + (this.decalageG[c.index] ?? 0) + (Math.random() - 0.5) * 60;
    }
    return valeurs;
  }
}
