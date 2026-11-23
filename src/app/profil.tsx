import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { calculerNiveau, evolutionPct, NOMS_NIVEAUX, serieProgression } from '../core/plans';
import { Main, TypeTest } from '../core/types';
import { useDonnees } from '../state/donnees';
import { Carte, Choix, couleurs, Ecran, GraphiqueProgression, Ligne, T } from '../ui/composants';

/** Profil du grimpeur, historique des tests et courbes de progression. */
export default function EcranProfil() {
  const { profil, majProfil, tests, seances, reglages, supprimerTest } = useDonnees();
  const [type, setType] = useState<TypeTest>('force-max');
  const [main, setMain] = useState<Main>('deux');
  const [priseId, setPriseId] = useState<string>(reglages.prises.find((p) => p.profondeurMm === 20)?.id ?? 'toutes');
  const [poids, setPoids] = useState(String(profil.poidsCorpsKg));

  const points = serieProgression(tests, { type, main, priseId: priseId === 'toutes' ? undefined : priseId });
  const evolution = evolutionPct(points);
  const historique = tests.slice().sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Ecran>
      <Carte titre="Mon profil">
        <T doux>Nom</T>
        <TextInput style={styles.champ} value={profil.nom} onChangeText={(nom) => majProfil({ ...profil, nom })} />
        <T doux>Poids de corps (kg) : sert à calculer le niveau</T>
        <TextInput
          style={styles.champ}
          keyboardType="decimal-pad"
          value={poids}
          onChangeText={setPoids}
          onEndEditing={() => {
            const v = Number(poids.replace(',', '.'));
            if (v > 20 && v < 200) majProfil({ ...profil, poidsCorpsKg: v });
            else setPoids(String(profil.poidsCorpsKg));
          }}
        />
        <Ligne libelle="Niveau estimé" valeur={NOMS_NIVEAUX[calculerNiveau(tests)]} />
        <Ligne libelle="Tests enregistrés" valeur={String(tests.length)} />
        <Ligne libelle="Séances faites" valeur={String(seances.length)} />
      </Carte>

      <Carte titre="Progression">
        <Choix
          valeur={type}
          onChange={setType}
          options={[
            { valeur: 'force-max', libelle: 'Force max (kg)' },
            { valeur: 'suspension-max', libelle: 'Temps tenu (s)' },
          ]}
        />
        <Choix
          valeur={main}
          onChange={setMain}
          options={[
            { valeur: 'gauche', libelle: 'Gauche' },
            { valeur: 'droite', libelle: 'Droite' },
            { valeur: 'deux', libelle: 'Deux mains' },
          ]}
        />
        <Choix
          valeur={priseId}
          onChange={setPriseId}
          options={[
            { valeur: 'toutes', libelle: 'Toutes prises' },
            ...reglages.prises.map((p) => ({ valeur: p.id, libelle: `${p.profondeurMm} mm` })),
          ]}
        />
        <GraphiqueProgression points={points} unite={type === 'force-max' ? 'kg' : 's'} />
        {evolution !== null ? (
          <T>
            {evolution >= 0 ? 'Progression' : 'Évolution'} de {evolution >= 0 ? '+' : ''}
            {evolution.toFixed(0)} % depuis le premier test.
          </T>
        ) : null}
      </Carte>

      <Carte titre="Historique des tests">
        {historique.length === 0 ? <T doux>Aucun test pour l'instant.</T> : null}
        {historique.map((t) => (
          <Pressable
            key={t.id}
            onLongPress={() =>
              Alert.alert('Supprimer ce test ?', '', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => supprimerTest(t.id) },
              ])
            }
          >
            <View style={styles.test}>
              <T>
                {new Date(t.date).toLocaleDateString('fr-FR')} ·{' '}
                {t.main === 'deux' ? '2 mains' : `main ${t.main}`} · {t.priseMm} mm
              </T>
              <T doux>
                {t.type === 'force-max' ? 'Force max' : 'Temps tenu'} : {t.forceMaxKg.toFixed(1)} kg, {t.dureeS.toFixed(1)} s
              </T>
            </View>
          </Pressable>
        ))}
        {historique.length > 0 ? <T doux>Appui long sur un test pour le supprimer.</T> : null}
      </Carte>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  champ: { borderWidth: 1, borderColor: couleurs.bord, borderRadius: 10, padding: 10, fontSize: 16, color: couleurs.texte },
  test: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: couleurs.bord },
});
