import { describe, expect, it } from 'vitest';
import {
  calculerAjustement,
  calculerCible,
  calculerNiveau,
  choisirPrise,
  derniereDissymetrie,
  evolutionPct,
  plansRecommandes,
  serieProgression,
  testConseille,
  trouverPlan,
} from '../plans';
import { ResultatTest, SeanceFaite } from '../types';

const test = (p: Partial<ResultatTest>): ResultatTest => ({
  id: Math.random().toString(),
  date: '2026-01-01T10:00:00.000Z',
  type: 'force-max',
  main: 'deux',
  priseId: 'p20',
  priseMm: 20,
  dureeS: 7,
  forceMaxKg: 70,
  forceMoyenneKg: 65,
  poidsCorpsKg: 70,
  ...p,
});

describe('niveau', () => {
  it('débutant sans test', () => expect(calculerNiveau([])).toBe('debutant'));
  it('selon le % du poids de corps', () => {
    expect(calculerNiveau([test({ forceMaxKg: 63 })])).toBe('debutant');
    expect(calculerNiveau([test({ forceMaxKg: 80 })])).toBe('intermediaire');
    expect(calculerNiveau([test({ forceMaxKg: 100 })])).toBe('confirme');
    expect(calculerNiveau([test({ forceMaxKg: 120 })])).toBe('expert');
  });
  it('additionne gauche et droite si ce sont les tests les plus récents', () => {
    const t = [
      test({ forceMaxKg: 60 }),
      test({ main: 'gauche', forceMaxKg: 45, date: '2026-02-01T00:00:00Z' }),
      test({ main: 'droite', forceMaxKg: 50, date: '2026-02-01T00:01:00Z' }),
    ];
    expect(calculerNiveau(t)).toBe('confirme'); // 95 kg pour 70 kg = 136 %
  });
});

describe('dissymétrie et recommandations', () => {
  const t = [test({ main: 'gauche', forceMaxKg: 30 }), test({ main: 'droite', forceMaxKg: 40 })];
  it('détecte la main faible', () => {
    expect(derniereDissymetrie(t)).toEqual({ pct: 25, faible: 'gauche' });
  });
  it('propose le rééquilibrage en premier au-delà de 10 %', () => {
    expect(plansRecommandes('intermediaire', { pct: 25 })[0].id).toBe('reequilibrage');
    expect(plansRecommandes('intermediaire', { pct: 5 }).map((p) => p.id)).not.toContain('reequilibrage');
  });
  it('la cible du rééquilibrage vise la main faible', () => {
    const ex = trouverPlan('reequilibrage')!.exercices[0];
    const c = calculerCible(ex, t, { intensiteBonusPct: 0, suspensionBonusS: 0 });
    expect(c.main).toBe('gauche');
    expect(c.cibleKg![0]).toBeCloseTo(18);
  });
});

describe('adaptation', () => {
  const s = (p: Partial<SeanceFaite>): SeanceFaite => ({
    id: 'x',
    date: '2026-03-01T00:00:00Z',
    planId: 'repeaters',
    reussite: 1,
    ressenti: 2,
    ...p,
  });
  it('augmente quand c’est trop facile, puis ajoute du temps', () => {
    const liste = [1, 2, 3, 4].map((i) => s({ ressenti: 1, date: `2026-03-0${i}T00:00:00Z` }));
    expect(calculerAjustement('repeaters', liste, null)).toEqual({ intensiteBonusPct: 15, suspensionBonusS: 1 });
  });
  it('diminue quand c’est raté', () => {
    expect(calculerAjustement('repeaters', [s({ reussite: 0.5 })], null).intensiteBonusPct).toBe(-5);
  });
  it('repart de zéro après un nouveau test', () => {
    expect(calculerAjustement('repeaters', [s({ ressenti: 1 })], '2026-04-01T00:00:00Z').intensiteBonusPct).toBe(0);
  });
});

describe('progression', () => {
  it('7 s puis 25 s sur la même prise = +257 %', () => {
    const t = [
      test({ type: 'suspension-max', dureeS: 7, date: '2026-01-01T00:00:00Z' }),
      test({ type: 'suspension-max', dureeS: 25, date: '2026-03-01T00:00:00Z' }),
    ];
    const pts = serieProgression(t, { type: 'suspension-max', main: 'deux', priseId: 'p20' });
    expect(pts.map((p) => p.valeur)).toEqual([7, 25]);
    expect(evolutionPct(pts)).toBeCloseTo(257.14, 1);
  });
  it('conseille un test après 4 semaines', () => {
    const t = [test({ date: '2026-01-01T00:00:00Z' })];
    expect(testConseille(t, new Date('2026-01-10'))).toBe(false);
    expect(testConseille(t, new Date('2026-02-10'))).toBe(true);
  });
  it('choisit la prise la plus proche', () => {
    const prises = [
      { id: 'a', nom: 'A', profondeurMm: 30 },
      { id: 'b', nom: 'B', profondeurMm: 18 },
    ];
    expect(choisirPrise(prises, 20)?.id).toBe('b');
  });
});
