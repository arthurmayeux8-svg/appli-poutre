import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { connecterPlanche } from '../ble/bluetooth';
import { AppareilTrouve, PhaseSimulee, Planche } from '../ble/planche';
import { PlancheSimulee } from '../ble/simulateur';
import { Echantillon } from '../core/analyse';
import { calculerForces } from '../core/forces';
import { COMMANDE_TARE, DecoupeurLignes, lireLigneMesure } from '../core/protocole';
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
  erreur: string | null;
  connecter(appareil: AppareilTrouve): Promise<void>;
  connecterSimulateur(): Promise<void>;
  deconnecter(): Promise<void>;
  tare(): Promise<void>;
  /** Commence à garder toutes les mesures. */
  demarrerEnregistrement(): void;
  /** Arrête et renvoie les mesures gardées. */
  arreterEnregistrement(): Echantillon[];
  /** Ne sert qu'au simulateur : indique si le grimpeur est censé être suspendu. */
  indiquerPhase(phase: PhaseSimulee): void;
}

const ZERO: Forces = { totalKg: 0, gaucheKg: null, droiteKg: null };
const Contexte = createContext<Connexion | null>(null);

export function FournisseurConnexion({ children }: { children: ReactNode }) {
  const { reglages, profil } = useDonnees();
  const [etat, setEtat] = useState<Etat>('deconnecte');
  const [planche, setPlanche] = useState<Planche | null>(null);
  const [forces, setForces] = useState<Forces>(ZERO);
  const [erreur, setErreur] = useState<string | null>(null);

  // Les "ref" gardent des valeurs à jour sans redessiner l'écran.
  const reglagesRef = useRef(reglages);
  const profilRef = useRef(profil);
  reglagesRef.current = reglages;
  profilRef.current = profil;
  const enregistrement = useRef<Echantillon[] | null>(null);
  const plancheRef = useRef<Planche | null>(null);

  const recevoirLigne = useCallback((decoupeur: DecoupeurLignes) => {
    return (morceau: string) => {
      for (const ligne of decoupeur.ajouter(morceau)) {
        const kg = lireLigneMesure(ligne);
        if (!kg) continue;
        const f = calculerForces(kg, reglagesRef.current.capteurs);
        if (enregistrement.current) enregistrement.current.push({ t: Date.now(), ...f });
        setForces(f);
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
    tare: async () => {
      await plancheRef.current?.envoyer(COMMANDE_TARE);
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
  };

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useConnexion(): Connexion {
  const c = useContext(Contexte);
  if (!c) throw new Error('useConnexion doit être utilisé dans FournisseurConnexion');
  return c;
}
