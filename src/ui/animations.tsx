/**
 * Petites animations réutilisables. Elles utilisent l'API Animated de React Native,
 * qui marche pareil sur le site, Android et iPhone.
 */
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';
import { durees } from './theme';

const NATIF = false; // le pilote natif n'existe pas sur le web : on reste en JS partout

/** Fait apparaître son contenu en glissant légèrement vers le haut. `rang` décale le départ. */
export function Apparition({ children, rang = 0, style }: { children: ReactNode; rang?: number; style?: ViewStyle }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: durees.normale + 100,
      delay: Math.min(rang, 8) * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIF,
    }).start();
  }, [v, rang]);
  return (
    <Animated.View
      style={[
        style,
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Apparition avec un petit rebond (résultats, bravos). */
export function Rebond({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 5, tension: 80, useNativeDriver: NATIF }).start();
  }, [v]);
  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

/** Point qui « respire » (planche connectée). */
export function PointPulsant({ couleur, taille = 8 }: { couleur: string; taille?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const boucle = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: NATIF }),
    );
    boucle.start();
    return () => boucle.stop();
  }, [v]);
  return (
    <Animated.View style={{ width: taille, height: taille }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: taille,
          height: taille,
          borderRadius: taille / 2,
          backgroundColor: couleur,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
        }}
      />
      <Animated.View style={{ width: taille, height: taille, borderRadius: taille / 2, backgroundColor: couleur }} />
    </Animated.View>
  );
}

/**
 * Un nombre qui va en douceur vers `cible` (compteur du score, tracé des courbes).
 * Renvoie la valeur du moment, recalculée à chaque image.
 */
export function useValeurAnimee(cible: number, dureeMs = durees.lente, depart = 0): number {
  const [valeur, setValeur] = useState(depart);
  const actuelle = useRef(depart);
  useEffect(() => {
    const de = actuelle.current;
    const t0 = Date.now();
    let image = 0;
    const pas = () => {
      const p = Math.min(1, (Date.now() - t0) / dureeMs);
      const v = de + (cible - de) * (1 - Math.pow(1 - p, 3));
      actuelle.current = v;
      setValeur(v);
      if (p < 1) image = requestAnimationFrame(pas);
    };
    image = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(image);
  }, [cible, dureeMs]);
  return valeur;
}
