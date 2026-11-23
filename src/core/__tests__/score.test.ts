import { describe, expect, it } from 'vitest';
import { genererHistoriqueDemo } from '../demo';
import { PLANS } from '../plans';
import { dureePlanMin, entrainementDuJour, seancesAVenir } from '../programme';
import { forceEquivalente20mm, historiqueScores, niveauPourScore, scoreActuel, scorePourPct } from '../score';
import { ResultatTest } from '../types';

const t = (p: Partial<ResultatTest>): ResultatTest => ({
  id: 'x',
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

describe('score de 1 à 10', () => {
  it('va de 1 (débutant) à 10 (expert)', () => {
    expect(scorePourPct(40)).toBe(1);
    expect(scorePourPct(100)).toBe(4);
    expect(scorePourPct(180)).toBe(10);
    expect(scorePourPct(250)).toBe(10);
    expect(niveauPourScore(1)).toBe('debutant');
    expect(niveauPourScore(5)).toBe('intermediaire');
    expect(niveauPourScore(7)).toBe('confirme');
    expect(niveauPourScore(10)).toBe('expert');
  });
  it('une petite prise vaut plus qu’une grande', () => {
    expect(forceEquivalente20mm(50, 10)).toBeGreaterThan(50);
    expect(forceEquivalente20mm(50, 30)).toBeLessThan(50);
    expect(forceEquivalente20mm(50, 20)).toBe(50);
  });
  it('suit la progression test après test', () => {
    const h = historiqueScores([
      t({ date: '2026-01-01T10:00:00Z', forceMaxKg: 70 }),
      t({ date: '2026-02-01T10:00:00Z', main: 'gauche', forceMaxKg: 40 }),
      t({ date: '2026-02-01T10:05:00Z', main: 'droite', forceMaxKg: 45 }),
      t({ date: '2026-03-01T10:00:00Z', forceMaxKg: 91 }),
    ]);
    expect(h.map((p) => p.score)).toEqual([4, 5.6, 6.3]);
  });
  it('pas de score sans test de force', () => {
    expect(scoreActuel([t({ type: 'suspension-max' })])).toBeNull();
  });
});

describe('programme', () => {
  const plans = [PLANS[0], PLANS[2]];
  const maintenant = new Date('2026-05-10T09:00:00');
  it('propose une séance si rien hier', () => {
    expect(entrainementDuJour(plans, [], maintenant).statut).toBe('a-faire');
  });
  it('repos le lendemain d’une séance, et rotation des plans', () => {
    const j = entrainementDuJour(plans, [{ id: 'a', date: '2026-05-09T18:00:00', planId: plans[0].id, reussite: 1, ressenti: 2 }], maintenant);
    expect(j.statut).toBe('repos');
    expect(j.plan.id).toBe(plans[1].id);
  });
  it('liste les séances à venir un jour sur deux', () => {
    const a = seancesAVenir(plans, [], 3, maintenant);
    expect(a.map((s) => s.date.getDate())).toEqual([10, 12, 14]);
    expect(a.map((s) => s.plan.id)).toEqual([plans[0].id, plans[1].id, plans[0].id]);
  });
  it('estime la durée d’un plan', () => {
    expect(dureePlanMin(PLANS.find((p) => p.id === 'repeaters')!)).toBeGreaterThan(5);
  });
});

describe('démo', () => {
  it('génère un historique qui progresse', () => {
    const { tests, seances } = genererHistoriqueDemo(70, [{ id: 'p20', nom: 'R20', profondeurMm: 20 }]);
    const h = historiqueScores(tests);
    expect(h.length).toBeGreaterThan(5);
    expect(h[h.length - 1].score).toBeGreaterThan(h[0].score);
    expect(seances.length).toBe(24);
  });
});
