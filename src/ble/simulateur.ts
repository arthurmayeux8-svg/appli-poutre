import { COMMANDE_TARE, ecrireLigneMesure } from '../core/protocole';
import { CapteurConfig } from '../core/types';
import { PhaseSimulee, Planche } from './planche';

/**
 * Fausse planche, pour développer et tester l'appli sans matériel.
 * Elle envoie exactement les mêmes messages que l'Arduino ("P,...").
 *
 * Elle "joue le jeu" : quand l'appli lui dit que le grimpeur est suspendu
 * (pendant un test ou une suspension d'entraînement), elle simule une charge
 * réaliste avec un peu de bruit et de fatigue ; sinon elle renvoie ~0.
 * La main gauche est volontairement ~15 % plus faible, pour voir la dissymétrie.
 */
export class PlancheSimulee implements Planche {
  nom = 'Simulateur';
  private minuteur: ReturnType<typeof setInterval> | null = null;
  private phase: PhaseSimulee = { suspendu: false, main: 'deux' };
  private debutSuspension = 0;
  private decalageG = 0;

  constructor(
    private capteurs: () => CapteurConfig[],
    private poidsCorpsKg: () => number,
  ) {}

  definirPhase(phase: PhaseSimulee) {
    if (phase.suspendu && !this.phase.suspendu) this.debutSuspension = Date.now();
    this.phase = phase;
  }

  async demarrer(onLigne: (ligne: string) => void) {
    this.minuteur = setInterval(() => onLigne(ecrireLigneMesure(this.mesurer())), 50); // 20 Hz
  }

  async envoyer(commande: string) {
    if (commande === COMMANDE_TARE) this.decalageG = 0;
  }

  async deconnecter() {
    if (this.minuteur) clearInterval(this.minuteur);
    this.minuteur = null;
  }

  private mesurer(): number[] {
    const capteurs = this.capteurs();
    const nb = Math.max(1, capteurs.length);
    const bruit = () => (Math.random() - 0.5) * 60; // ±30 g
    if (!this.phase.suspendu) return Array.from({ length: nb }, () => this.decalageG + bruit());

    // Charge totale en grammes : montée en 0,4 s, puis légère fatigue.
    const ecoule = (Date.now() - this.debutSuspension) / 1000;
    const montee = Math.min(1, ecoule / 0.4);
    const fatigue = Math.max(0.6, 1 - ecoule * 0.004);
    const base = this.phase.chargeKg ?? this.poidsCorpsKg() * 0.9;
    const totalG = base * 1000 * montee * fatigue * (1 + (Math.random() - 0.5) * 0.03);

    // Répartition gauche / droite (main gauche un peu plus faible).
    let partG = 0.46;
    if (this.phase.main === 'gauche') partG = 1;
    if (this.phase.main === 'droite') partG = 0;
    const gaucheG = totalG * partG;
    const droiteG = totalG - gaucheG;

    const nbG = capteurs.filter((c) => c.cote === 'gauche').length;
    const nbD = capteurs.filter((c) => c.cote === 'droite').length;
    const nbC = capteurs.filter((c) => c.cote === 'centre').length;
    const valeurs = new Array(nb).fill(0);
    for (const c of capteurs) {
      let v = 0;
      if (nbC > 0) v = totalG / nb; // un capteur central voit tout (réparti s'il y en a plusieurs)
      else if (c.cote === 'gauche') v = gaucheG / nbG;
      else if (c.cote === 'droite') v = droiteG / nbD;
      valeurs[c.index] = v + bruit();
    }
    return valeurs;
  }
}
