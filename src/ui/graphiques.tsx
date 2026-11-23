import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { couleurs } from './composants';

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
  if (points.length === 0) {
    return <Text style={styles.vide}>Faites un test de force pour voir votre courbe.</Text>;
  }
  const l = largeur - MARGE.gauche - MARGE.droite;
  const h = HAUTEUR - MARGE.haut - MARGE.bas;
  const x = (i: number) => MARGE.gauche + (points.length === 1 ? l / 2 : (i / (points.length - 1)) * l);
  const y = (v: number) => MARGE.haut + h - ((v - min) / (max - min)) * h;
  const chemin = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.valeur)}`).join(' ');
  const zone = `${chemin} L${x(points.length - 1)},${y(min)} L${x(0)},${y(min)} Z`;
  const reperes = points.length <= 4 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <View onLayout={surLayout} style={{ height: HAUTEUR }}>
      {largeur > 0 ? (
        <Svg width={largeur} height={HAUTEUR}>
          {graduations.map((g) => (
            <G key={g}>
              <Line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={y(g)} y2={y(g)} stroke={couleurs.bord} strokeWidth={1} />
              <SvgText x={MARGE.gauche - 6} y={y(g) + 4} fontSize={10} fill={couleurs.texteDoux} textAnchor="end">
                {g}
              </SvgText>
            </G>
          ))}
          <Path d={zone} fill={couleurs.accent} opacity={0.12} />
          <Path d={chemin} stroke={couleurs.accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          {points.map((p, i) => (
            <Circle key={i} cx={x(i)} cy={y(p.valeur)} r={i === points.length - 1 ? 5 : 3} fill={couleurs.accent} stroke="#fff" strokeWidth={1.5} />
          ))}
          {reperes.map((i) => (
            <SvgText key={i} x={x(i)} y={HAUTEUR - 6} fontSize={10} fill={couleurs.texteDoux} textAnchor="middle">
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
  if (groupes.length === 0) {
    return <Text style={styles.vide}>Testez bras gauche puis bras droit pour voir la comparaison.</Text>;
  }
  const derniers = groupes.slice(-6);
  const max = Math.max(...derniers.flatMap((g) => [g.gauche, g.droite]), 1) * 1.15;
  const l = largeur - MARGE.gauche - MARGE.droite;
  const h = HAUTEUR - MARGE.haut - MARGE.bas;
  const pas = l / derniers.length;
  const barre = Math.min(18, pas / 3);
  const y = (v: number) => MARGE.haut + h - (v / max) * h;

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
                  <Rect x={cx - barre - 1} y={y(g.gauche)} width={barre} height={y(0) - y(g.gauche)} rx={3} fill={couleurs.bleu} />
                  <Rect x={cx + 1} y={y(g.droite)} width={barre} height={y(0) - y(g.droite)} rx={3} fill={couleurs.accent} />
                  <SvgText x={cx} y={HAUTEUR - 6} fontSize={10} fill={couleurs.texteDoux} textAnchor="middle">
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
  vide: { fontSize: 14, color: couleurs.texteDoux, paddingVertical: 20, textAlign: 'center' },
  legende: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pastille: { width: 10, height: 10, borderRadius: 3 },
  texteLegende: { fontSize: 12, color: couleurs.texteDoux },
});
