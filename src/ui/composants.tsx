import Ionicons from '@expo/vector-icons/Ionicons';
import { Children, isValidElement, ReactNode, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Apparition, useValeurAnimee } from './animations';
import { couleurs, ombre, polices, rayons } from './theme';

export { couleurs, polices } from './theme';

type NomIcone = keyof typeof Ionicons.glyphMap;

/** Un écran qui défile. Ses blocs apparaissent l'un après l'autre. */
export function Ecran({ children }: { children: ReactNode }) {
  const blocs = Children.toArray(children);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: couleurs.fond }} contentContainerStyle={styles.ecran}>
      {blocs.map((b, i) => (
        <Apparition key={isValidElement(b) && b.key != null ? b.key : i} rang={i}>
          {b}
        </Apparition>
      ))}
    </ScrollView>
  );
}

export function Carte({ titre, children, sombre }: { titre?: string; children: ReactNode; sombre?: boolean }) {
  return (
    <View style={[styles.carte, sombre && styles.carteSombre]}>
      {titre ? <Text style={[styles.titreCarte, sombre && { color: couleurs.texteSurArdoise }]}>{titre}</Text> : null}
      {children}
    </View>
  );
}

export function Bouton({
  titre,
  onPress,
  variante = 'plein',
  desactive,
  icone,
}: {
  titre: string;
  onPress: () => void;
  variante?: 'plein' | 'contour' | 'danger' | 'clair';
  desactive?: boolean;
  icone?: NomIcone;
}) {
  const echelle = useRef(new Animated.Value(1)).current;
  const presser = (v: number) => Animated.spring(echelle, { toValue: v, speed: 40, bounciness: 6, useNativeDriver: false }).start();
  const couleurTexte =
    variante === 'plein' ? '#fff' : variante === 'danger' ? couleurs.rouge : variante === 'clair' ? couleurs.ardoise : couleurs.accent;
  return (
    <Animated.View style={{ transform: [{ scale: echelle }] }}>
      <Pressable
        accessibilityRole="button"
        disabled={desactive}
        onPress={onPress}
        onPressIn={() => presser(0.96)}
        onPressOut={() => presser(1)}
        style={({ pressed }) => [
          styles.bouton,
          variante === 'plein' && { backgroundColor: pressed ? couleurs.accentFonce : couleurs.accent },
          variante === 'clair' && { backgroundColor: couleurs.texteSurArdoise },
          (variante === 'contour' || variante === 'danger') && {
            borderWidth: 1.5,
            borderColor: variante === 'danger' ? couleurs.rouge : couleurs.accent,
            backgroundColor: pressed ? couleurs.accentDoux : 'transparent',
          },
          desactive && { opacity: 0.4 },
        ]}
      >
        {icone ? <Ionicons name={icone} size={18} color={couleurTexte} /> : null}
        <Text style={[styles.texteBouton, { color: couleurTexte }]}>{titre}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Rangée de boutons où un seul est sélectionné. */
export function Choix<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: { valeur: T; libelle: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.choix}>
      {options.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <Pressable
            key={o.valeur}
            onPress={() => onChange(o.valeur)}
            style={[styles.option, actif && { backgroundColor: couleurs.ardoise, borderColor: couleurs.ardoise }]}
          >
            <Text style={{ color: actif ? couleurs.texteSurArdoise : couleurs.texte, fontFamily: polices.demiGras, fontSize: 14 }}>
              {o.libelle}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View style={styles.ligne}>
      <Text style={styles.texteDoux}>{libelle}</Text>
      <Text style={styles.valeur}>{valeur}</Text>
    </View>
  );
}

export function T({ children, doux, gros }: { children: ReactNode; doux?: boolean; gros?: boolean }) {
  return <Text style={[gros ? styles.gros : styles.texte, doux && { color: couleurs.texteDoux }]}>{children}</Text>;
}

/**
 * Jauge horizontale de force. Si une zone cible est donnée,
 * elle est dessinée en vert et la barre devient verte quand on est dedans.
 */
export function JaugeForce({ valeurKg, maxKg, cibleKg }: { valeurKg: number; maxKg: number; cibleKg?: [number, number] | null }) {
  const echelle = Math.max(maxKg, cibleKg ? cibleKg[1] * 1.2 : 0, valeurKg, 1);
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / echelle) * 100))}%` as const;
  const dansCible = cibleKg ? valeurKg >= cibleKg[0] && valeurKg <= cibleKg[1] : false;
  return (
    <View>
      <Text style={[styles.valeurJauge, dansCible && { color: couleurs.vert }]}>
        {valeurKg.toFixed(1)}
        <Text style={styles.uniteJauge}> kg</Text>
      </Text>
      <View style={styles.jauge}>
        {cibleKg ? <View style={[styles.zoneCible, { left: pct(cibleKg[0]), width: pct(cibleKg[1] - cibleKg[0]) }]} /> : null}
        <View style={[styles.barre, { width: pct(valeurKg), backgroundColor: dansCible ? couleurs.vert : couleurs.accent }]} />
      </View>
      {cibleKg ? (
        <Text style={[styles.texteDoux, { textAlign: 'center', marginTop: 6 }]}>
          Zone visée : {cibleKg[0].toFixed(0)} à {cibleKg[1].toFixed(0)} kg
        </Text>
      ) : null}
    </View>
  );
}

/** Titre de section, au-dessus d'un groupe de cartes. */
export function Section({ children }: { children: ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

/** Une petite valeur mise en avant (ex. score, durée). */
export function Chiffre({
  valeur,
  legende,
  couleur,
  sombre,
}: {
  valeur: string;
  legende: string;
  couleur?: string;
  sombre?: boolean;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.chiffre,
          valeur.length > 5 ? styles.chiffreTexte : null,
          sombre && { color: couleurs.texteSurArdoise },
          couleur ? { color: couleur } : null,
        ]}
      >
        {valeur}
      </Text>
      <Text style={[styles.texteDoux, { textAlign: 'center' }, sombre && { color: couleurs.texteSurArdoiseDoux }]}>{legende}</Text>
    </View>
  );
}

/** Nombre qui compte jusqu'à sa valeur à l'apparition. */
export function NombreAnime({ valeur, decimales = 1, style }: { valeur: number; decimales?: number; style?: object }) {
  const v = useValeurAnimee(valeur);
  return <Text style={style}>{v.toFixed(decimales)}</Text>;
}

const styles = StyleSheet.create({
  ecran: { padding: 16, gap: 12, paddingBottom: 40, width: '100%', maxWidth: 640, alignSelf: 'center' },
  carte: {
    backgroundColor: couleurs.carte,
    borderRadius: rayons.carte,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: couleurs.bord,
    ...ombre,
  },
  carteSombre: { backgroundColor: couleurs.ardoise, borderColor: couleurs.ardoise },
  titreCarte: { fontSize: 18, fontFamily: polices.gras, color: couleurs.texte, letterSpacing: -0.2 },
  bouton: {
    borderRadius: rayons.bouton,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  texteBouton: { fontSize: 16, fontFamily: polices.gras },
  choix: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: rayons.pilule, borderWidth: 1.5, borderColor: couleurs.bord },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  texte: { fontSize: 15, color: couleurs.texte, lineHeight: 22, fontFamily: polices.normal },
  texteDoux: { fontSize: 14, color: couleurs.texteDoux, fontFamily: polices.normal },
  gros: { fontSize: 26, fontFamily: polices.tresGras, color: couleurs.texte, letterSpacing: -0.4 },
  valeur: { fontSize: 15, fontFamily: polices.demiGras, color: couleurs.texte, flexShrink: 1, textAlign: 'right' },
  valeurJauge: { fontSize: 52, fontFamily: polices.tresGras, color: couleurs.texte, textAlign: 'center', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  uniteJauge: { fontSize: 20, fontFamily: polices.demiGras, color: couleurs.texteDoux, letterSpacing: 0 },
  jauge: { height: 30, borderRadius: rayons.pilule, backgroundColor: couleurs.fond, overflow: 'hidden', borderWidth: 1, borderColor: couleurs.bord },
  zoneCible: { position: 'absolute', top: 0, bottom: 0, backgroundColor: couleurs.vertDoux, borderLeftWidth: 2, borderRightWidth: 2, borderColor: couleurs.vert },
  barre: { position: 'absolute', left: 4, top: 4, bottom: 4, borderRadius: rayons.pilule },
  section: { fontSize: 12, fontFamily: polices.gras, color: couleurs.texteDoux, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 10 },
  chiffreTexte: { fontSize: 18 },
  chiffre: { fontSize: 30, lineHeight: 36, fontFamily: polices.tresGras, color: couleurs.texte, fontVariant: ['tabular-nums'] },
});
