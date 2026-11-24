import { Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { couleurs, polices } from './theme';

/**
 * Le logo : une poutre orange avec ses trois réglettes, et en dessous
 * une courbe à la craie qui monte (la progression).
 * Le même dessin est dans public/logo.svg (icônes du site).
 */
export function Logo({ taille = 40, fond = true }: { taille?: number; fond?: boolean }) {
  return (
    <Svg width={taille} height={taille} viewBox="0 0 100 100">
      {fond ? <Rect x={0} y={0} width={100} height={100} rx={24} fill={couleurs.ardoise} /> : null}
      <Rect x={14} y={28} width={72} height={26} rx={8} fill={couleurs.accent} />
      <Rect x={22} y={28} width={14} height={10} rx={5} fill={fond ? couleurs.ardoise : couleurs.fond} />
      <Rect x={41} y={28} width={18} height={10} rx={5} fill={fond ? couleurs.ardoise : couleurs.fond} />
      <Rect x={64} y={28} width={14} height={10} rx={5} fill={fond ? couleurs.ardoise : couleurs.fond} />
      <Path
        d="M24 80 L40 70 L52 75 L74 61"
        stroke={fond ? couleurs.texteSurArdoise : couleurs.ardoise}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Logo + nom, pour l'en-tête de l'accueil. */
export function LogoEtNom() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Logo taille={30} />
      <Text style={{ fontFamily: polices.tresGras, fontSize: 22, color: couleurs.texte, letterSpacing: -0.3 }}>Poutre</Text>
    </View>
  );
}
