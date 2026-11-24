import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useValeurAnimee } from './animations';
import { couleurs, polices } from './theme';

export interface Point {
  date: string;
  valeur: number;
}

const HAUTEUR = 170;
const MARGE = { haut: 14, bas: 22, gauche: 26, droite: 10 };

function dateCourte(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function useLargeur(): [number, (e: LayoutChangeEvent) => void] {
  const [l, setL] = useState(0);
  return [l, (e) => setL(e.nativeEvent.layout.width)];
}

/**
 * Courbe d'évolution (ex. score de 1 à 10). L'axe vertical va de `min` à `max`.
 */
export function Courbe({ points, min, max, graduations }: { points: Point[]; min: number; max: number; graduations: number[] }) {
  const [largeur, surLayout] = useLargeur();
  // Le tracé se dessine de gauche à droite (0 -> 1) une fois la largeur connue.
  const trace = useValeurAnimee(largeur > 0 ? 1 : 0, 1200);
  if (points.length === 0) {
    return <Text style={styles.vide}>Faites un test de force pour voir votre courbe.</Text>;
  }
  const l = largeur - MARGE.gauche - MARGE.droite;
  const h = HAUTEUR - MARGE.haut - MARGE.bas;
  const x = (i: number) => MARGE.gauche + (points.length === 1 ? l / 2 : (i / (points.length - 1)) * l);
  const y = (v: number) => MARGE.haut + h - ((v - min) / (max - min)) * h;
  const chemin = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.valeur)}`).join(' ');
  const zone = `${chemin} L${x(points.length - 1)},${y(min)} L${x(0)},${y(min)} Z`;
  let longueur = 0;
  for (let i = 1; i < points.length; i++) longueur += Math.hypot(x(i) - x(i - 1), y(points[i].valeur) - y(points[i - 1].valeur));
  const visibles = Math.floor(trace * (points.length - 1) + 1e-6);
  const reperes = points.length <= 4 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <View onLayout={surLayout} style={{ height: HAUTEUR }}>
      {largeur > 0 ? (
        <Svg width={largeur} height={HAUTEUR}>
          {graduations.map((g) => (
            <G key={g}>
              <Line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={y(g)} y2={y(g)} stroke={couleurs.bord} strokeWidth={1} />
              <SvgText x={MARGE.gauche - 6} y={y(g) + 4} fontSize={10} fontFamily={polices.normal} fill={couleurs.texteDoux} textAnchor="end">
                {g}
              </SvgText>
            </G>
          ))}
          <Path d={zone} fill={couleurs.accent} opacity={0.1 * trace} />
          <Path
            d={chemin}
            stroke={couleurs.accent}
            strokeWidth={3}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={longueur > 0 ? [longueur, longueur] : undefined}
            strokeDashoffset={longueur * (1 - trace)}
          />
          {points.map((p, i) =>
            i <= visibles ? (
              <Circle
                key={i}
                cx={x(i)}
                cy={y(p.valeur)}
                r={i === points.length - 1 ? 6 : 3}
                fill={i === points.length - 1 ? couleurs.accent : couleurs.carte}
                stroke={couleurs.accent}
                strokeWidth={2}
              />
            ) : null,
          )}
          {reperes.map((i) => (
            <SvgText key={i} x={x(i)} y={HAUTEUR - 6} fontSize={10} fontFamily={polices.normal} fill={couleurs.texteDoux} textAnchor="middle">
              {dateCourte(points[i].date)}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}

/**
 * Barres groupées main gauche / main droite, un groupe par test.
 */
export function BarresGaucheDroite({ groupes }: { groupes: { date: string; gauche: number; droite: number }[] }) {
  const [largeur, surLayout] = useLargeur();
  const pousse = useValeurAnimee(largeur > 0 ? 1 : 0, 900);
  if (groupes.length === 0) {
    return <Text style={styles.vide}>Testez bras gauche puis bras droit pour voir la comparaison.</Text>;
  }
  const derniers = groupes.slice(-6);
  const max = Math.max(...derniers.flatMap((g) => [g.gauche, g.droite]), 1) * 1.15;
  const l = largeur - MARGE.gauche - MARGE.droite;
  const h = HAUTEUR - MARGE.haut - MARGE.bas;
  const pas = l / derniers.length;
  const barre = Math.min(18, pas / 3);
  const y = (v: number) => MARGE.haut + h - ((v * pousse) / max) * h;

  return (
    <View>
      <View onLayout={surLayout} style={{ height: HAUTEUR }}>
        {largeur > 0 ? (
          <Svg width={largeur} height={HAUTEUR}>
            <Line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={y(0)} y2={y(0)} stroke={couleurs.bord} />
            {derniers.map((g, i) => {
              const cx = MARGE.gauche + pas * i + pas / 2;
              return (
                <G key={i}>
                  <Rect x={cx - barre - 1} y={y(g.gauche)} width={barre} height={y(0) - y(g.gauche)} rx={4} fill={couleurs.bleu} />
                  <Rect x={cx + 1} y={y(g.droite)} width={barre} height={y(0) - y(g.droite)} rx={4} fill={couleurs.accent} />
                  <SvgText x={cx} y={HAUTEUR - 6} fontSize={10} fontFamily={polices.normal} fill={couleurs.texteDoux} textAnchor="middle">
                    {dateCourte(g.date)}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        ) : null}
      </View>
      <View style={styles.legende}>
        <View style={[styles.pastille, { backgroundColor: couleurs.bleu }]} />
        <Text style={styles.texteLegende}>Gauche</Text>
        <View style={[styles.pastille, { backgroundColor: couleurs.accent, marginLeft: 12 }]} />
        <Text style={styles.texteLegende}>Droite</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreAnneau: { fontSize: 38, lineHeight: 42, fontFamily: polices.tresGras, color: couleurs.texteSurArdoise, fontVariant: ['tabular-nums'], letterSpacing: -1 },
  surDix: { fontSize: 12, fontFamily: polices.moyen, color: couleurs.texteSurArdoiseDoux },
  vide: { fontSize: 14, fontFamily: polices.normal, color: couleurs.texteDoux, paddingVertical: 20, textAlign: 'center' },
  legende: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pastille: { width: 10, height: 10, borderRadius: 3 },
  texteLegende: { fontSize: 12, fontFamily: polices.normal, color: couleurs.texteDoux },
});

/**
 * Anneau du score de 1 à 10 : il se remplit et le nombre compte à l'apparition.
 */
export function AnneauScore({ score, taille = 132 }: { score: number | null; taille?: number }) {
  const v = useValeurAnimee(score ?? 0, 1100);
  const epais = 11;
  const r = (taille - epais) / 2;
  const tour = 2 * Math.PI * r;
  const part = Math.max(0, Math.min(1, (v - 0) / 10));
  return (
    <View style={{ width: taille, height: taille, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={taille} height={taille} style={{ position: 'absolute' }}>
        <Circle cx={taille / 2} cy={taille / 2} r={r} stroke={couleurs.ardoiseDouce} strokeWidth={epais} fill="none" />
        <Circle
          cx={taille / 2}
          cy={taille / 2}
          r={r}
          stroke={couleurs.accent}
          strokeWidth={epais}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={[tour, tour]}
          strokeDashoffset={tour * (1 - part)}
          transform={`rotate(-90 ${taille / 2} ${taille / 2})`}
        />
      </Svg>
      <Text style={styles.scoreAnneau}>{score !== null ? v.toFixed(1) : '–'}</Text>
      <Text style={styles.surDix}>sur 10</Text>
    </View>
  );
}
