import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { analyserSuspension, AnalyseSuspension } from '../../core/analyse';
import { dissymetriePct } from '../../core/forces';
import { NOMS_NIVEAUX } from '../../core/plans';
import { historiqueScores } from '../../core/score';
import { Main, ResultatTest, TypeTest } from '../../core/types';
import { useConnexion } from '../../state/connexion';
import { nouvelId, useDonnees } from '../../state/donnees';
import { useEntrainement } from '../../state/entrainement';
import { BandeauPlanche, NOMS_MAINS } from '../../ui/blocs';
import { Rebond } from '../../ui/animations';
import { Bouton, Carte, Chiffre, Choix, couleurs, Ecran, JaugeForce, Ligne, polices, Section, T } from '../../ui/composants';
import { BarresGaucheDroite } from '../../ui/graphiques';

type Etape = 'choix' | 'preparation' | 'mesure' | 'resultat';

const PREPARATION_S = 5;
const DUREE_MAX_S = 180;

/**
 * Onglet Test de force :
 * - « Force max » : tirer le plus fort possible pendant 7 s (met à jour le score de 1 à 10) ;
 * - « Tenir le plus longtemps » : temps de suspension (ex. 7 s puis 25 s deux mois plus tard).
 */
export default function OngletTest() {
  const c = useConnexion();
  const { reglages, profil, tests, ajouterTest, supprimerTest } = useDonnees();
  const e = useEntrainement();
  const [type, setType] = useState<TypeTest>('force-max');
  const [main, setMain] = useState<Main>('deux');
  const [priseId, setPriseId] = useState(
    reglages.prises.find((p) => p.profondeurMm === 20)?.id ?? reglages.prises[0]?.id ?? '',
  );
  const [etape, setEtape] = useState<Etape>('choix');
  const [secondes, setSecondes] = useState(0);
  const [resultat, setResultat] = useState<AnalyseSuspension | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const debutEtape = useRef(0);
  const debutSuspension = useRef<number | null>(null);
  const fini = useRef(false);

  const prise = reglages.prises.find((p) => p.id === priseId);

  // Le message "score mis à jour" disparaît au bout de 10 s.
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 10_000);
    return () => clearTimeout(id);
  }, [message]);

  const terminer = () => {
    if (fini.current) return; // évite de terminer deux fois
    fini.current = true;
    c.indiquerPhase({ suspendu: false, main });
    setResultat(analyserSuspension(c.arreterEnregistrement(), reglages.seuilSuspensionKg));
    setEtape('resultat');
  };

  // Horloge : décompte, puis mesure.
  useEffect(() => {
    if (etape !== 'preparation' && etape !== 'mesure') return;
    debutEtape.current = Date.now();
    debutSuspension.current = null;
    const id = setInterval(() => {
      const ecoule = (Date.now() - debutEtape.current) / 1000;
      if (etape === 'preparation') {
        setSecondes(Math.ceil(PREPARATION_S - ecoule));
        if (ecoule >= PREPARATION_S) {
          fini.current = false;
          c.demarrerEnregistrement();
          c.indiquerPhase({ suspendu: true, main, mode: type === 'force-max' ? 'force-max' : 'tenir' });
          setEtape('mesure');
        }
      } else {
        const depuis = debutSuspension.current ? (Date.now() - debutSuspension.current) / 1000 : 0;
        setSecondes(depuis);
        if (type === 'force-max' && depuis >= reglages.dureeTestForceS) terminer();
        if (ecoule > DUREE_MAX_S) terminer();
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape]);

  // Détection du début et de la fin de la suspension.
  useEffect(() => {
    if (etape !== 'mesure') return;
    const suspendu = c.forces.totalKg > reglages.seuilSuspensionKg;
    if (suspendu && debutSuspension.current === null) debutSuspension.current = Date.now();
    if (!suspendu && debutSuspension.current !== null && type === 'suspension-max') terminer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.forces]);

  // --- Pendant le test -------------------------------------------------
  if (etape === 'preparation' || etape === 'mesure') {
    const enSuspension = etape === 'mesure' && debutSuspension.current !== null;
    return (
      <Ecran>
        <Carte>
          <T gros>
            {etape === 'preparation' ? `Préparez-vous… ${secondes}` : enSuspension ? `${secondes.toFixed(1)} s` : 'Suspendez-vous !'}
          </T>
          <T doux>
            {NOMS_MAINS[main]} sur {prise?.nom} ({prise?.profondeurMm} mm).{' '}
            {type === 'force-max' ? 'Tirez le plus fort possible.' : 'Tenez le plus longtemps possible.'}
          </T>
          <JaugeForce valeurKg={c.forces.totalKg} maxKg={profil.poidsCorpsKg * 1.3} />
          {c.forces.gaucheKg !== null ? (
            <View style={{ flexDirection: 'row' }}>
              <Chiffre valeur={`${c.forces.gaucheKg.toFixed(1)}`} legende="kg gauche" couleur={couleurs.bleu} />
              <Chiffre valeur={`${c.forces.droiteKg!.toFixed(1)}`} legende="kg droite" couleur={couleurs.accent} />
            </View>
          ) : null}
        </Carte>
        <Bouton titre={etape === 'mesure' ? 'Arrêter' : 'Annuler'} variante="contour" onPress={etape === 'mesure' ? terminer : () => setEtape('choix')} />
      </Ecran>
    );
  }

  // --- Résultat ----------------------------------------------------------
  if (etape === 'resultat' && resultat) {
    const r = resultat;
    const pctPoids = profil.poidsCorpsKg > 0 ? (r.forceMaxKg / profil.poidsCorpsKg) * 100 : 0;
    const precedent = tests
      .filter((t) => t.type === type && t.main === main && t.priseId === priseId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .pop();
    const valide = r.dureeS > 0.5;

    const enregistrer = () => {
      if (!prise) return;
      const nouveau: ResultatTest = {
        id: nouvelId(),
        date: new Date().toISOString(),
        type,
        main,
        priseId,
        priseMm: prise.profondeurMm,
        dureeS: r.dureeS,
        forceMaxKg: r.forceMaxKg,
        forceMoyenneKg: r.forceMoyenneKg,
        gaucheMaxKg: r.gaucheMaxKg,
        droiteMaxKg: r.droiteMaxKg,
        poidsCorpsKg: profil.poidsCorpsKg,
      };
      ajouterTest(nouveau);
      const avant = e.score;
      const apres = historiqueScores([...tests, nouveau]).pop()?.score ?? null;
      if (apres !== null && apres !== avant) {
        setMessage(avant === null ? `Votre score de grimpe : ${apres.toFixed(1)} / 10` : `Score mis à jour : ${avant.toFixed(1)} → ${apres.toFixed(1)} / 10`);
      } else if (type === 'force-max' && main !== 'deux') {
        setMessage(`Test enregistré. Faites aussi la main ${main === 'gauche' ? 'droite' : 'gauche'} pour calculer le score et la dissymétrie.`);
      } else {
        setMessage('Test enregistré.');
      }
      if (main === 'gauche') setMain('droite');
      setEtape('choix');
    };

    return (
      <Ecran>
        <Rebond>
        <Carte titre="Résultat">
          {!valide ? (
            <T>Aucune suspension détectée. Vérifiez la connexion et le seuil dans les paramètres.</T>
          ) : (
            <>
              <Text style={styles.resultat}>
                {type === 'force-max' ? r.forceMaxKg.toFixed(1) : r.dureeS.toFixed(1)}
                <Text style={styles.unite}>{type === 'force-max' ? ' kg' : ' s'}</Text>
              </Text>
              <Ligne libelle="Force max" valeur={`${r.forceMaxKg.toFixed(1)} kg (${pctPoids.toFixed(0)} % du poids)`} />
              <Ligne libelle="Force moyenne" valeur={`${r.forceMoyenneKg.toFixed(1)} kg`} />
              <Ligne libelle="Temps suspendu" valeur={`${r.dureeS.toFixed(1)} s`} />
              {r.gaucheMaxKg !== null && r.droiteMaxKg !== null && main === 'deux' ? (
                <>
                  <Ligne libelle="Main gauche (max)" valeur={`${r.gaucheMaxKg.toFixed(1)} kg`} />
                  <Ligne libelle="Main droite (max)" valeur={`${r.droiteMaxKg.toFixed(1)} kg`} />
                  <Ligne libelle="Dissymétrie" valeur={`${dissymetriePct(r.gaucheMaxKg, r.droiteMaxKg).toFixed(0)} %`} />
                </>
              ) : null}
              {precedent ? (
                <T doux>
                  Dernière fois ({new Date(precedent.date).toLocaleDateString('fr-FR')}) :{' '}
                  {type === 'force-max' ? `${precedent.forceMaxKg.toFixed(1)} kg` : `${precedent.dureeS.toFixed(1)} s`}
                </T>
              ) : null}
            </>
          )}
        </Carte>
        </Rebond>
        {valide ? <Bouton titre="Enregistrer" icone="checkmark" onPress={enregistrer} /> : null}
        <Bouton titre="Recommencer" variante="contour" onPress={() => setEtape('choix')} />
      </Ecran>
    );
  }

  // --- Choix du test + score + historique ----------------------------------
  const groupesGD = construireGroupesGD(tests);
  const historique = tests.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <Ecran>
      <BandeauPlanche />
      {message ? (
        <Rebond key={message} style={styles.message}>
          <Ionicons name="checkmark-circle" size={22} color={couleurs.vert} />
          <Text style={styles.texteMessage}>{message}</Text>
        </Rebond>
      ) : null}

      <Carte>
        <View style={{ flexDirection: 'row' }}>
          <Chiffre valeur={e.score !== null ? e.score.toFixed(1) : '–'} legende="score / 10" couleur={couleurs.accent} />
          <Chiffre valeur={NOMS_NIVEAUX[e.niveau]} legende="niveau" />
          <Chiffre valeur={e.dissymetrie ? `${e.dissymetrie.pct.toFixed(0)} %` : '–'} legende="dissymétrie" />
        </View>
        <T doux>Le score se calcule avec la force max à deux mains (ou bras gauche + bras droit), en % de votre poids.</T>
      </Carte>

      <Section>Nouveau test</Section>
      <Carte titre="Type de test">
        <Choix
          valeur={type}
          onChange={setType}
          options={[
            { valeur: 'force-max', libelle: `Force max (${reglages.dureeTestForceS} s)` },
            { valeur: 'suspension-max', libelle: 'Tenir le plus longtemps' },
          ]}
        />
        <T doux>Main</T>
        <Choix
          valeur={main}
          onChange={setMain}
          options={[
            { valeur: 'gauche', libelle: 'Bras gauche' },
            { valeur: 'droite', libelle: 'Bras droit' },
            { valeur: 'deux', libelle: 'Les deux' },
          ]}
        />
        <T doux>Prise</T>
        <Choix
          valeur={priseId}
          onChange={setPriseId}
          options={reglages.prises.map((p) => ({ valeur: p.id, libelle: `${p.profondeurMm} mm` }))}
        />
        <Bouton
          titre={c.etat === 'connecte' ? 'Commencer le test' : 'Connectez d’abord la planche'}
          onPress={() => {
            setMessage(null);
            setEtape('preparation');
          }}
          desactive={!prise || c.etat !== 'connecte'}
        />
      </Carte>

      <Section>Gauche / droite</Section>
      <Carte>
        <BarresGaucheDroite groupes={groupesGD} />
      </Carte>

      <Section>Derniers tests</Section>
      <Carte>
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
            style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: couleurs.bord }}
          >
            <T>
              {new Date(t.date).toLocaleDateString('fr-FR')} · {NOMS_MAINS[t.main]} · {t.priseMm} mm
            </T>
            <T doux>
              {t.type === 'force-max' ? `Force max ${t.forceMaxKg.toFixed(1)} kg` : `Tenu ${t.dureeS.toFixed(1)} s`}
            </T>
          </Pressable>
        ))}
        {historique.length > 0 ? <T doux>Appui long sur un test pour le supprimer.</T> : null}
      </Carte>
    </Ecran>
  );
}

/**
 * Pour le graphique gauche/droite : les paires de tests bras gauche + bras droit.
 * À défaut, le détail gauche/droite des tests à deux mains (si les capteurs le permettent).
 */
function construireGroupesGD(tests: ResultatTest[]) {
  const forces = tests.filter((t) => t.type === 'force-max').sort((a, b) => a.date.localeCompare(b.date));
  const paires: { date: string; gauche: number; droite: number }[] = [];
  const deuxMains: { date: string; gauche: number; droite: number }[] = [];
  let gauche: ResultatTest | null = null;
  let droite: ResultatTest | null = null;
  for (const t of forces) {
    if (t.main === 'deux' && t.gaucheMaxKg != null && t.droiteMaxKg != null) {
      deuxMains.push({ date: t.date, gauche: t.gaucheMaxKg, droite: t.droiteMaxKg });
    } else if (t.main === 'gauche') gauche = t;
    else if (t.main === 'droite') droite = t;
    if (gauche && droite) {
      paires.push({ date: t.date, gauche: gauche.forceMaxKg, droite: droite.forceMaxKg });
      gauche = droite = null;
    }
  }
  return paires.length > 0 ? paires : deuxMains;
}

const styles = StyleSheet.create({
  resultat: { fontSize: 56, fontFamily: polices.tresGras, color: couleurs.accent, textAlign: 'center', letterSpacing: -1.5 },
  unite: { fontSize: 22, fontFamily: polices.demiGras, color: couleurs.texteDoux, letterSpacing: 0 },
  message: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: couleurs.vertDoux, borderRadius: 16, padding: 14 },
  texteMessage: { flex: 1, fontSize: 15, fontFamily: polices.demiGras, color: couleurs.texte },
});
