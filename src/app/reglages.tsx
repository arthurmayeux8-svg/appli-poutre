import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { peutSeparerLesMains } from '../core/forces';
import { CapteurConfig, CoteCapteur } from '../core/types';
import { nouvelId, useDonnees } from '../state/donnees';
import { Bouton, Carte, Choix, couleurs, Ecran, T } from '../ui/composants';

/** Réglages de la planche : capteurs, prises, seuils. */
export default function EcranReglages() {
  const { reglages, majReglages } = useDonnees();
  const [nomPrise, setNomPrise] = useState('');
  const [mmPrise, setMmPrise] = useState('');

  const nb = reglages.capteurs.length;
  const changerNombre = (n: number) => {
    const capteurs: CapteurConfig[] = Array.from({ length: n }, (_, i) => {
      const existant = reglages.capteurs[i];
      if (existant) return existant;
      // Par défaut : la première moitié à gauche, la seconde à droite.
      const cote: CoteCapteur = n === 1 ? 'centre' : i < n / 2 ? 'gauche' : 'droite';
      return { index: i, cote };
    });
    majReglages({ ...reglages, capteurs });
  };
  const changerCote = (i: number, cote: CoteCapteur) =>
    majReglages({ ...reglages, capteurs: reglages.capteurs.map((c) => (c.index === i ? { ...c, cote } : c)) });

  const nombre = (texte: string, defaut: number) => {
    const v = Number(texte.replace(',', '.'));
    return Number.isFinite(v) && v > 0 ? v : defaut;
  };

  return (
    <Ecran>
      <Carte titre="Capteurs">
        <T doux>
          Nombre de capteurs branchés sur l'Arduino, dans l'ordre où il les envoie. Indiquez de quel côté de la
          planche se trouve chacun.
        </T>
        <Choix
          valeur={String(nb)}
          onChange={(v) => changerNombre(Number(v))}
          options={['1', '2', '3', '4'].map((v) => ({ valeur: v, libelle: v }))}
        />
        {reglages.capteurs.map((c) => (
          <View key={c.index} style={{ gap: 6 }}>
            <T>Capteur {c.index + 1}</T>
            <Choix
              valeur={c.cote}
              onChange={(cote) => changerCote(c.index, cote)}
              options={[
                { valeur: 'gauche', libelle: 'Gauche' },
                { valeur: 'centre', libelle: 'Centre' },
                { valeur: 'droite', libelle: 'Droite' },
              ]}
            />
          </View>
        ))}
        <T doux>
          {peutSeparerLesMains(reglages.capteurs)
            ? 'Avec cette disposition, l’appli peut séparer main gauche et main droite, même à deux mains.'
            : 'Avec cette disposition, la dissymétrie se mesure en testant un bras puis l’autre.'}
        </T>
      </Carte>

      <Carte titre="Prises de la planche">
        {reglages.prises.map((p) => (
          <View key={p.id} style={styles.ligne}>
            <T>
              {p.nom} · {p.profondeurMm} mm
            </T>
            <Bouton
              titre="Retirer"
              variante="danger"
              onPress={() => majReglages({ ...reglages, prises: reglages.prises.filter((x) => x.id !== p.id) })}
              desactive={reglages.prises.length <= 1}
            />
          </View>
        ))}
        <T doux>Ajouter une prise</T>
        <TextInput style={styles.champ} placeholder="Nom (ex. Réglette 18)" value={nomPrise} onChangeText={setNomPrise} />
        <TextInput
          style={styles.champ}
          placeholder="Profondeur en mm"
          keyboardType="decimal-pad"
          value={mmPrise}
          onChangeText={setMmPrise}
        />
        <Bouton
          titre="Ajouter"
          variante="contour"
          desactive={!nomPrise.trim() || !(nombre(mmPrise, 0) > 0)}
          onPress={() => {
            const profondeurMm = nombre(mmPrise, 0);
            const prises = [...reglages.prises, { id: nouvelId(), nom: nomPrise.trim(), profondeurMm }].sort(
              (a, b) => b.profondeurMm - a.profondeurMm,
            );
            majReglages({ ...reglages, prises });
            setNomPrise('');
            setMmPrise('');
          }}
        />
      </Carte>

      <Carte titre="Mesure">
        <T doux>Seuil de suspension (kg) : en dessous, on considère que personne n'est suspendu.</T>
        <TextInput
          style={styles.champ}
          keyboardType="decimal-pad"
          defaultValue={String(reglages.seuilSuspensionKg)}
          onEndEditing={(e) =>
            majReglages({ ...reglages, seuilSuspensionKg: nombre(e.nativeEvent.text, reglages.seuilSuspensionKg) })
          }
        />
        <T doux>Durée du test de force max (secondes)</T>
        <TextInput
          style={styles.champ}
          keyboardType="number-pad"
          defaultValue={String(reglages.dureeTestForceS)}
          onEndEditing={(e) =>
            majReglages({ ...reglages, dureeTestForceS: nombre(e.nativeEvent.text, reglages.dureeTestForceS) })
          }
        />
      </Carte>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  champ: { borderWidth: 1, borderColor: couleurs.bord, borderRadius: 10, padding: 10, fontSize: 16, color: couleurs.texte },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});
