import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { ETALONNAGE_NEUTRE } from '../core/etalonnage';
import { Profil, Reglages, ResultatTest, SeanceFaite } from '../core/types';

/**
 * Toutes les données du grimpeur, enregistrées sur le téléphone uniquement
 * (pas de compte en ligne). AsyncStorage = petit espace de stockage de l'appli.
 */

export const REGLAGES_PAR_DEFAUT: Reglages = {
  capteurs: [
    { index: 0, cote: 'gauche' },
    { index: 1, cote: 'droite' },
  ],
  prises: [
    { id: 'p30', nom: 'Grande réglette', profondeurMm: 30 },
    { id: 'p25', nom: 'Réglette 25', profondeurMm: 25 },
    { id: 'p20', nom: 'Réglette 20', profondeurMm: 20 },
    { id: 'p15', nom: 'Réglette 15', profondeurMm: 15 },
    { id: 'p10', nom: 'Petite réglette', profondeurMm: 10 },
  ],
  seuilSuspensionKg: 5,
  dureeTestForceS: 7,
  simulateurAuDemarrage: true,
  etalonnage: ETALONNAGE_NEUTRE,
};

export const PROFIL_PAR_DEFAUT: Profil = { nom: 'Grimpeur', poidsCorpsKg: 70 };

const CLES = {
  profil: 'poutre.profil',
  reglages: 'poutre.reglages',
  tests: 'poutre.tests',
  seances: 'poutre.seances',
};

interface Donnees {
  pret: boolean;
  profil: Profil;
  reglages: Reglages;
  tests: ResultatTest[];
  seances: SeanceFaite[];
  majProfil(p: Profil): void;
  majReglages(r: Reglages): void;
  ajouterTest(t: ResultatTest): void;
  supprimerTest(id: string): void;
  ajouterSeance(s: SeanceFaite): void;
  /** Remplace tout l'historique (démo) ; listes vides = tout effacer. */
  remplacerHistorique(tests: ResultatTest[], seances: SeanceFaite[]): void;
}

const Contexte = createContext<Donnees | null>(null);

export function FournisseurDonnees({ children }: { children: ReactNode }) {
  const [pret, setPret] = useState(false);
  const [profil, setProfil] = useState(PROFIL_PAR_DEFAUT);
  const [reglages, setReglages] = useState(REGLAGES_PAR_DEFAUT);
  const [tests, setTests] = useState<ResultatTest[]>([]);
  const [seances, setSeances] = useState<SeanceFaite[]>([]);

  // Chargement au démarrage
  useEffect(() => {
    (async () => {
      const lire = async <T,>(cle: string, defaut: T): Promise<T> => {
        try {
          const brut = await AsyncStorage.getItem(cle);
          return brut ? (JSON.parse(brut) as T) : defaut;
        } catch {
          return defaut;
        }
      };
      setProfil(await lire(CLES.profil, PROFIL_PAR_DEFAUT));
      setReglages({ ...REGLAGES_PAR_DEFAUT, ...(await lire(CLES.reglages, REGLAGES_PAR_DEFAUT)) });
      setTests(await lire(CLES.tests, []));
      setSeances(await lire(CLES.seances, []));
      setPret(true);
    })();
  }, []);

  const sauver = (cle: string, valeur: unknown) => {
    AsyncStorage.setItem(cle, JSON.stringify(valeur)).catch(() => {});
  };

  const majProfil = useCallback((p: Profil) => {
    setProfil(p);
    sauver(CLES.profil, p);
  }, []);
  const majReglages = useCallback((r: Reglages) => {
    setReglages(r);
    sauver(CLES.reglages, r);
  }, []);
  const ajouterTest = useCallback((t: ResultatTest) => {
    setTests((l) => {
      const n = [...l, t];
      sauver(CLES.tests, n);
      return n;
    });
  }, []);
  const supprimerTest = useCallback((id: string) => {
    setTests((l) => {
      const n = l.filter((t) => t.id !== id);
      sauver(CLES.tests, n);
      return n;
    });
  }, []);
  const ajouterSeance = useCallback((s: SeanceFaite) => {
    setSeances((l) => {
      const n = [...l, s];
      sauver(CLES.seances, n);
      return n;
    });
  }, []);

  const remplacerHistorique = useCallback((t: ResultatTest[], s: SeanceFaite[]) => {
    setTests(t);
    setSeances(s);
    sauver(CLES.tests, t);
    sauver(CLES.seances, s);
  }, []);

  return (
    <Contexte.Provider
      value={{ pret, profil, reglages, tests, seances, majProfil, majReglages, ajouterTest, supprimerTest, ajouterSeance, remplacerHistorique }}
    >
      {children}
    </Contexte.Provider>
  );
}

export function useDonnees(): Donnees {
  const c = useContext(Contexte);
  if (!c) throw new Error('useDonnees doit être utilisé dans FournisseurDonnees');
  return c;
}

export function nouvelId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
