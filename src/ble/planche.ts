/**
 * "Planche" = l'objet qui représente la poutre connectée.
 * L'appli ne parle qu'à cette interface : elle ne sait pas si derrière
 * il y a un vrai module Bluetooth ou le simulateur.
 * Changer de carte Arduino ne demande donc de modifier que ble/bluetooth.ts
 * (et encore, seulement si les identifiants Bluetooth changent).
 */

export interface AppareilTrouve {
  id: string;
  nom: string;
}

export interface Planche {
  nom: string;
  /** Démarre la réception. onLigne est appelé pour chaque ligne de texte reçue. */
  demarrer(onLigne: (ligne: string) => void, onDeconnexion: () => void): Promise<void>;
  envoyer(commande: string): Promise<void>;
  deconnecter(): Promise<void>;
}

/** Informations que l'appli donne au simulateur pour qu'il "joue le jeu". */
export interface PhaseSimulee {
  suspendu: boolean;
  main: 'gauche' | 'droite' | 'deux';
  /** Charge visée en kg (sinon le simulateur utilise environ 90 % du poids de corps). */
  chargeKg?: number;
}
