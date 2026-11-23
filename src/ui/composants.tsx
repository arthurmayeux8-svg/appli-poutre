import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export const couleurs = {
  fond: '#F4F1EC',
  carte: '#FFFFFF',
  texte: '#1F2421',
  texteDoux: '#5E6662',
  accent: '#D9622B', // orange "magnésie & rocher"
  accentDoux: '#FBE3D6',
  vert: '#2E8B57',
  vertDoux: '#D7EEDF',
  rouge: '#C0392B',
  bord: '#E2DDD5',
  bleu: '#3A6EA5',
};

export function Ecran({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: couleurs.fond }} contentContainerStyle={styles.ecran}>
      {children}
    </ScrollView>
  );
}

export function Carte({ titre, children }: { titre?: string; children: ReactNode }) {
  return (
    <View style={styles.carte}>
      {titre ? <Text style={styles.titreCarte}>{titre}</Text> : null}
      {children}
    </View>
  );
}

export function Bouton({
  titre,
  onPress,
  variante = 'plein',
  desactive,
}: {
  titre: string;
  onPress: () => void;
  variante?: 'plein' | 'contour' | 'danger';
  desactive?: boolean;
}) {
  const plein = variante === 'plein';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={desactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bouton,
        plein ? { backgroundColor: couleurs.accent } : { borderWidth: 1.5, borderColor: variante === 'danger' ? couleurs.rouge : couleurs.accent },
        (pressed || desactive) && { opacity: 0.5 },
      ]}
    >
      <Text style={[styles.texteBouton, { color: plein ? '#fff' : variante === 'danger' ? couleurs.rouge : couleurs.accent }]}>
        {titre}
      </Text>
    </Pressable>
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
            style={[styles.option, actif && { backgroundColor: couleurs.accent, borderColor: couleurs.accent }]}
          >
            <Text style={{ color: actif ? '#fff' : couleurs.texte, fontWeight: '600' }}>{o.libelle}</Text>
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
      <Text style={styles.valeurJauge}>{valeurKg.toFixed(1)} kg</Text>
      <View style={styles.jauge}>
        {cibleKg ? (
          <View
            style={[
              styles.zoneCible,
              { left: pct(cibleKg[0]), width: pct(cibleKg[1] - cibleKg[0]) },
            ]}
          />
        ) : null}
        <View style={[styles.barre, { width: pct(valeurKg), backgroundColor: dansCible ? couleurs.vert : couleurs.accent }]} />
      </View>
      {cibleKg ? (
        <Text style={[styles.texteDoux, { textAlign: 'center', marginTop: 4 }]}>
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
export function Chiffre({ valeur, legende, couleur }: { valeur: string; legende: string; couleur?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.chiffre, valeur.length > 5 ? styles.chiffreTexte : null, couleur ? { color: couleur } : null]}
      >
        {valeur}
      </Text>
      <Text style={styles.texteDoux}>{legende}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { padding: 16, gap: 12, paddingBottom: 40 },
  carte: { backgroundColor: couleurs.carte, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: couleurs.bord },
  titreCarte: { fontSize: 17, fontWeight: '700', color: couleurs.texte },
  bouton: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  texteBouton: { fontSize: 16, fontWeight: '700' },
  choix: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5, borderColor: couleurs.bord },
  ligne: { flexDirection: 'row', justifyContent: 'space-between' },
  texte: { fontSize: 15, color: couleurs.texte, lineHeight: 21 },
  texteDoux: { fontSize: 14, color: couleurs.texteDoux },
  gros: { fontSize: 22, fontWeight: '700', color: couleurs.texte },
  valeur: { fontSize: 15, fontWeight: '700', color: couleurs.texte },
  valeurJauge: { fontSize: 44, fontWeight: '800', color: couleurs.texte, textAlign: 'center', fontVariant: ['tabular-nums'] },
  jauge: { height: 28, borderRadius: 14, backgroundColor: couleurs.bord, overflow: 'hidden' },
  zoneCible: { position: 'absolute', top: 0, bottom: 0, backgroundColor: couleurs.vertDoux, borderLeftWidth: 2, borderRightWidth: 2, borderColor: couleurs.vert },
  barre: { position: 'absolute', left: 0, top: 6, bottom: 6, borderRadius: 8 },
  section: { fontSize: 13, fontWeight: '700', color: couleurs.texteDoux, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8 },
  chiffreTexte: { fontSize: 18 },
  chiffre: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: couleurs.texte, fontVariant: ['tabular-nums'] },
});
