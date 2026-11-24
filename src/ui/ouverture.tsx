/**
 * Écran d'ouverture animé (environ 2,5 s), affiché à chaque lancement :
 *  1. la barre du P monte, puis sa boucle orange se dessine (comme l'anneau du score) ;
 *  2. le nom « Poutre » et la phrase d'accroche apparaissent ;
 *  3. tout s'efface en s'agrandissant légèrement et on arrive sur l'accueil.
 * Un appui n'importe où passe directement à l'appli.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Logo } from './logo';
import { couleurs, polices } from './theme';

const DUREE_MS = 2600;
const DEBUT_SORTIE_MS = 2050;

const borne = (v: number) => Math.max(0, Math.min(1, v));
const douce = (v: number) => 1 - Math.pow(1 - borne(v), 3);
/** Avancement (0 à 1, adouci) entre deux instants. */
const entre = (t: number, debut: number, fin: number) => douce((t - debut) / (fin - debut));

export function EcranOuverture({ surFin }: { surFin: () => void }) {
  const [t, setT] = useState(0);
  const fini = useRef(false);

  const terminer = () => {
    if (fini.current) return;
    fini.current = true;
    surFin();
  };

  useEffect(() => {
    const t0 = Date.now();
    let image = 0;
    const pas = () => {
      const ecoule = Date.now() - t0;
      setT(ecoule);
      if (ecoule < DUREE_MS) image = requestAnimationFrame(pas);
      else terminer();
    };
    image = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(image);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dessin = entre(t, 100, 1250);
  const nom = entre(t, 900, 1400);
  const accroche = entre(t, 1150, 1650);
  const sortie = entre(t, DEBUT_SORTIE_MS, DUREE_MS);

  return (
    <Pressable
      accessibilityLabel="Passer l'introduction"
      onPress={terminer}
      style={[StyleSheet.absoluteFill, styles.fond, { opacity: 1 - sortie }]}
    >
      <View style={{ alignItems: 'center', transform: [{ scale: 0.9 + 0.1 * dessin + 0.12 * sortie }] }}>
        <Logo taille={150} fond={false} progression={dessin} />
        <Text style={[styles.nom, { opacity: nom, transform: [{ translateY: 12 * (1 - nom) }] }]}>Poutre</Text>
        <Text style={[styles.accroche, { opacity: accroche, transform: [{ translateY: 10 * (1 - accroche) }] }]}>
          Mesure ta force. Entraîne tes doigts.
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fond: { backgroundColor: couleurs.ardoise, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  nom: { fontFamily: polices.tresGras, fontSize: 44, color: couleurs.texteSurArdoise, letterSpacing: -1, marginTop: 8 },
  accroche: { fontFamily: polices.moyen, fontSize: 16, color: couleurs.texteSurArdoiseDoux, marginTop: 6 },
});
