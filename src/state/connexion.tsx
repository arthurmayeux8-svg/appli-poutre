import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { connecterPlanche } from '../ble/bluetooth';
import { AppareilTrouve, PhaseSimulee, Planche } from '../ble/planche';
import { PlancheSimulee } from '../ble/simulateur';
import { Echantillon } from '../core/analyse';
import { corriger, moyenne, regleZero } from '../core/etalonnage';
import { calculerForces } from '../core/forces';
import { DecoupeurLignes, lireLigneConfig, lireLigneMesure } from '../core/protocole';
import { Forces } from '../core/types';
import { useDonnees } from './donnees';

/**
 * Gère la connexion à la planche et met à disposition de tous les écrans :
 * - l'état de la connexion,
 * - la dernière force mesurée (totale, gauche, droite),
 * - un "enregistreur" pour garder toutes les mesures pendant un test.
 */

type Etat = 'deconnecte' | 'connexion' | 'connecte';

interface Connexion {
  etat: Etat;
  nomPlanche: string | null;
  simulateur: boolean;
  forces: Forces;
  /** Valeur corrigée (kg) de chaque capteur, pour les identifier et les étalonner. */
  capteursKg: number[];
  /** Vrai si la planche a envoyé sa configuration (côtés des capteurs) : rien à régler. */
  configParPlanche: boolean;
  erreur: string | null;
  /** Moyenne des dernières valeurs BRUTES reçues (avant étalonnage), capteur par capteur. */
  moyenneBrute(nombre?: number): number[];
  connecter(appareil: AppareilTrouve): Promise<void>;
  connecterSimulateur(): Promise<void>;
  deconnecter(): Promise<void>;
  /** Remise à zéro (planche vide), enregistrée dans l'étalonnage de l'appli. */
  tare(): void;
  /** Commence à garder toutes les mesures. */
  demarrerEnregistrement(): void;
  /** Arrête et renvoie les mesures gardées. */
  arreterEnregistrement(): Echantillon[];
  /** Ne sert qu'au simulateur : indique si le grimpeur est censé être suspendu. */
  indiquerPhase(phase: PhaseSimulee): void;
  /** Simulateur : suspendre le grimpeur virtuel à la main (bouton maintenu). */
  suspensionManuelle(active: boolean): void;
}

const ZERO: Forces = { totalKg: 0, gaucheKg: null, droiteKg: null };
const Contexte = createContext<Connexion | null>(null);

export function FournisseurConnexion({ children }: { children: ReactNode }) {
  const { reglages, profil, pret, majReglages } = useDonnees();
  const [etat, setEtat] = useState<Etat>('deconnecte');
  const [planche, setPlanche] = useState<Planche | null>(null);
  const [forces, setForces] = useState<Forces>(ZERO);
  const [capteursKg, setCapteursKg] = useState<number[]>([]);
  const bruts = useRef<number[][]>([]);
  const [configParPlanche, setConfigParPlanche] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Les "ref" gardent des valeurs à jour sans redessiner l'écran.
  const reglagesRef = useRef(reglages);
  const profilRef = useRef(profil);
  reglagesRef.current = reglages;
  profilRef.current = profil;
  const majReglagesRef = useRef(majReglages);
  majReglagesRef.current = majReglages;
  const enregistrement = useRef<Echantillon[] | null>(null);
  const plancheRef = useRef<Planche | null>(null);

  const recevoirLigne = useCallback((decoupeur: DecoupeurLignes) => {
    return (morceau: string) => {
      for (const ligne of decoupeur.ajouter(morceau)) {
        const config = lireLigneConfig(ligne);
        if (config) {
          setConfigParPlanche(true);
          const actuel = reglagesRef.current.capteurs.map((c) => c.cote).join(',');
          if (config.join(',') !== actuel) {
            const capteurs = config.map((cote, index) => ({ index, cote }));
            reglagesRef.current = { ...reglagesRef.current, capteurs };
            majReglagesRef.current(reglagesRef.current);
          }
          continue;
        }
        const kg = lireLigneMesure(ligne);
        if (!kg) continue;
        bruts.current.push(kg);
        if (bruts.current.length > 60) bruts.current.shift();
        const corriges = corriger(kg, reglagesRef.current.etalonnage);
        const f = calculerForces(corriges, reglagesRef.current.capteurs);
        if (enregistrement.current) enregistrement.current.push({ t: Date.now(), ...f });
        setForces(f);
        setCapteursKg(corriges);
      }
    };
  }, []);

  const brancher = useCallback(
    async (p: Planche) => {
      await p.demarrer(recevoirLigne(new DecoupeurLignes()), () => {
        plancheRef.current = null;
        setPlanche(null);
        setEtat('deconnecte');
        setForces(ZERO);
        setErreur('La planche s’est déconnectée.');
      });
      plancheRef.current = p;
      setPlanche(p);
      setEtat('connecte');
    },
    [recevoirLigne],
  );

  const deconnecter = useCallback(async () => {
    const p = plancheRef.current;
    plancheRef.current = null;
    setPlanche(null);
    setEtat('deconnecte');
    setForces(ZERO);
    setCapteursKg([]);
    setConfigParPlanche(false);
    bruts.current = [];
    if (p) await p.deconnecter();
  }, []);

  const connecter = useCallback(
    async (appareil: AppareilTrouve) => {
      await deconnecter();
      setErreur(null);
      setEtat('connexion');
      try {
        await brancher(await connecterPlanche(appareil));
      } catch (e) {
        setEtat('deconnecte');
        setErreur(`Connexion impossible : ${(e as Error).message}`);
      }
    },
    [brancher, deconnecter],
  );

  const connecterSimulateur = useCallback(async () => {
    await deconnecter();
    setErreur(null);
    await brancher(
      new PlancheSimulee(
        () => reglagesRef.current.capteurs,
        () => profilRef.current.poidsCorpsKg,
      ),
    );
  }, [brancher, deconnecter]);

  // Tant que la planche n'existe pas : simulateur connecté automatiquement au lancement.
  const dejaTente = useRef(false);
  useEffect(() => {
    if (!pret || dejaTente.current) return;
    dejaTente.current = true;
    if (reglages.simulateurAuDemarrage && !plancheRef.current) void connecterSimulateur();
  }, [pret, reglages.simulateurAuDemarrage, connecterSimulateur]);

  // Déconnexion propre quand l'appli se ferme.
  useEffect(() => () => void plancheRef.current?.deconnecter(), []);

  const valeur: Connexion = {
    etat,
    nomPlanche: planche?.nom ?? null,
    simulateur: planche instanceof PlancheSimulee,
    forces,
    erreur,
    connecter,
    connecterSimulateur,
    deconnecter,
    capteursKg,
    configParPlanche,
    moyenneBrute: (nombre = 20) => moyenne(bruts.current.slice(-nombre)),
    tare: () => {
      const m = moyenne(bruts.current.slice(-20));
      if (m.length === 0) return;
      majReglages({ ...reglagesRef.current, etalonnage: regleZero(reglagesRef.current.etalonnage, m) });
    },
    demarrerEnregistrement: () => {
      enregistrement.current = [];
    },
    arreterEnregistrement: () => {
      const e = enregistrement.current ?? [];
      enregistrement.current = null;
      return e;
    },
    indiquerPhase: (phase) => {
      if (plancheRef.current instanceof PlancheSimulee) plancheRef.current.definirPhase(phase);
    },
    suspensionManuelle: (active) => {
      if (plancheRef.current instanceof PlancheSimulee) plancheRef.current.suspensionManuelle(active);
    },
  };

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useConnexion(): Connexion {
  const c = useContext(Contexte);
  if (!c) throw new Error('useConnexion doit être utilisé dans FournisseurConnexion');
  return c;
}
