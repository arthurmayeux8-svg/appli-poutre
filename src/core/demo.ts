import { Prise, ResultatTest, SeanceFaite } from './types';

/**
 * Fabrique un faux historique de 12 semaines, pour voir les graphiques
 * et l'adaptation sans avoir à faire 3 mois de tests.
 * Le grimpeur fictif progresse de ~95 % à ~135 % de son poids de corps.
 */
export function genererHistoriqueDemo(
  poidsCorpsKg: number,
  prises: Prise[],
  maintenant = new Date(),
): { tests: ResultatTest[]; seances: SeanceFaite[] } {
  const prise =
    prises.slice().sort((a, b) => Math.abs(a.profondeurMm - 20) - Math.abs(b.profondeurMm - 20))[0] ??
    ({ id: 'p20', nom: 'Réglette 20', profondeurMm: 20 } as Prise);
  const tests: ResultatTest[] = [];
  const seances: SeanceFaite[] = [];
  const semaines = 12;
  let n = 0;
  const id = () => `demo-${n++}`;
  const alea = (amplitude: number) => 1 + (Math.random() - 0.5) * amplitude;

  for (let s = 0; s < semaines; s++) {
    const date = new Date(maintenant);
    date.setDate(date.getDate() - (semaines - s) * 7);
    date.setHours(18, 0, 0, 0);
    const avancement = s / (semaines - 1);
    const pct = (0.95 + 0.4 * avancement) * alea(0.04);
    const total = poidsCorpsKg * pct;
    const base = {
      priseId: prise.id,
      priseMm: prise.profondeurMm,
      poidsCorpsKg,
    };

    // Toutes les 2 semaines : test de force à deux mains
    if (s % 2 === 0) {
      tests.push({
        ...base,
        id: id(),
        date: date.toISOString(),
        type: 'force-max',
        main: 'deux',
        dureeS: 7,
        forceMaxKg: total,
        forceMoyenneKg: total * 0.93,
        gaucheMaxKg: total * 0.46,
        droiteMaxKg: total * 0.54,
      });
    }
    // Toutes les 3 semaines : bras gauche puis bras droit (dissymétrie qui diminue)
    if (s % 3 === 1) {
      const ecart = 0.16 - 0.1 * avancement;
      const droite = (total / 2) * (1 + ecart / 2);
      const gauche = (total / 2) * (1 - ecart / 2);
      for (const [main, f] of [['gauche', gauche], ['droite', droite]] as const) {
        const d = new Date(date);
        d.setMinutes(main === 'gauche' ? 5 : 10);
        tests.push({ ...base, id: id(), date: d.toISOString(), type: 'force-max', main, dureeS: 7, forceMaxKg: f, forceMoyenneKg: f * 0.93 });
      }
    }
    // Toutes les 4 semaines : tenir le plus longtemps (7 s -> 25 s)
    if (s % 4 === 3 || s === 0) {
      const duree = 7 + 18 * avancement * alea(0.1);
      const d = new Date(date);
      d.setMinutes(20);
      tests.push({ ...base, id: id(), date: d.toISOString(), type: 'suspension-max', main: 'deux', dureeS: duree, forceMaxKg: poidsCorpsKg, forceMoyenneKg: poidsCorpsKg * 0.98 });
    }
    // 2 séances par semaine
    for (const decalage of [1, 4]) {
      const d = new Date(date);
      d.setDate(d.getDate() + decalage);
      seances.push({
        id: id(),
        date: d.toISOString(),
        planId: s < 4 ? 'decouverte' : s % 2 ? 'repeaters' : 'endurance',
        reussite: 0.8 + Math.random() * 0.2,
        ressenti: Math.random() < 0.3 ? 1 : 2,
      });
    }
  }
  return { tests, seances };
}
