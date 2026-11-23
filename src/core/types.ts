/**
 * Types partagés par toute l'appli.
 * Toutes les forces sont stockées en kilogrammes (kg) côté appli,
 * la carte Arduino, elle, envoie des grammes.
 */

/** Côté de la planche où se trouve un capteur. */
import type { Etalonnage } from './etalonnage';

export type CoteCapteur = 'gauche' | 'droite' | 'centre';

export interface CapteurConfig {
  /** Numéro du capteur dans le message envoyé par l'Arduino (0, 1, 2, 3). */
  index: number;
  cote: CoteCapteur;
}

/** Une prise de la planche (réglette, bac...). */
export interface Prise {
  id: string;
  nom: string;
  /** Profondeur de la prise en millimètres. */
  profondeurMm: number;
}

export interface Reglages {
  capteurs: CapteurConfig[];
  prises: Prise[];
  /** Force (kg) au-dessus de laquelle on considère que le grimpeur est suspendu. */
  seuilSuspensionKg: number;
  /** Durée d'un test de force max, en secondes. */
  dureeTestForceS: number;
  /** Tant que la planche n'existe pas : connecter le simulateur au lancement de l'appli. */
  simulateurAuDemarrage: boolean;
  /** Zéro et facteur de chaque capteur, réglés dans l'appli (voir etalonnage.ts). */
  etalonnage: Etalonnage;
}

/** Une mesure reçue de la planche, déjà convertie en kg. */
export interface Mesure {
  /** Instant de la mesure (millisecondes, Date.now()). */
  t: number;
  /** Valeur de chaque capteur en kg, dans l'ordre envoyé par l'Arduino. */
  capteursKg: number[];
}

/** Ce que l'appli calcule à partir d'une mesure. */
export interface Forces {
  totalKg: number;
  /** null si la position des capteurs ne permet pas de séparer les mains. */
  gaucheKg: number | null;
  droiteKg: number | null;
}

export type Main = 'gauche' | 'droite' | 'deux';
export type TypeTest = 'force-max' | 'suspension-max';

export interface ResultatTest {
  id: string;
  date: string; // ISO
  type: TypeTest;
  main: Main;
  priseId: string;
  /** Profondeur de la prise au moment du test (au cas où la prise est supprimée ensuite). */
  priseMm: number;
  dureeS: number;
  forceMaxKg: number;
  forceMoyenneKg: number;
  /** Forces max par main, quand les capteurs le permettent (test à deux mains). */
  gaucheMaxKg?: number | null;
  droiteMaxKg?: number | null;
  /** Poids du grimpeur au moment du test, pour calculer le % du poids de corps. */
  poidsCorpsKg: number;
}

export interface Profil {
  nom: string;
  poidsCorpsKg: number;
}

export type Niveau = 'debutant' | 'intermediaire' | 'confirme' | 'expert';

/** Résultat d'une séance d'entraînement terminée. */
export interface SeanceFaite {
  id: string;
  date: string;
  planId: string;
  /** Proportion des suspensions tenues jusqu'au bout (0 à 1). */
  reussite: number;
  /** Ressenti du grimpeur : 1 = trop facile, 2 = bien, 3 = trop dur. */
  ressenti: 1 | 2 | 3;
}
