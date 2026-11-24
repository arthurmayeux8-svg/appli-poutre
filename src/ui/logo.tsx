import { Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { couleurs, polices } from './theme';

/** Longueur du tracé de la boucle du P (deux traits droits + un demi-cercle de rayon 17). */
const LONGUEUR_BOUCLE = 14 + Math.PI * 17 + 14;

const borne = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Le logo « P jauge » : un P dont la boucle orange rappelle l'anneau du score.
 * Le même dessin est dans public/logo.svg (icônes du site).
 *
 * `progression` (0 à 1) sert à l'animation d'ouverture : la barre du P monte,
 * puis la boucle se dessine comme l'anneau du score qui se remplit.
 */
export function Logo({ taille = 40, fond = true, progression = 1 }: { taille?: number; fond?: boolean; progression?: number }) {
  const barre = borne(progression / 0.4);
  const boucle = borne((progression - 0.3) / 0.7);
  return (
    <Svg width={taille} height={taille} viewBox="0 0 100 100">
      {fond ? <Rect x={0} y={0} width={100} height={100} rx={22} fill={couleurs.ardoise} /> : null}
      {boucle > 0 ? (
        <Path
          d="M40 30 H54 A17 17 0 0 1 54 64 H40"
          stroke={couleurs.accent}
          strokeWidth={14}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[LONGUEUR_BOUCLE, LONGUEUR_BOUCLE]}
          strokeDashoffset={LONGUEUR_BOUCLE * (1 - boucle)}
        />
      ) : null}
      {barre > 0 ? <Rect x={27} y={80 - 58 * barre} width={15} height={58 * barre} rx={7.5} fill={couleurs.texteSurArdoise} /> : null}
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
