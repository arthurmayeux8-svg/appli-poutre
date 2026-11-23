import { describe, expect, it } from 'vitest';
import { analyserSuspension, Echantillon } from '../analyse';
import { calculerForces, dissymetriePct, mainLaPlusFaible } from '../forces';

describe('forces', () => {
  it('additionne tous les capteurs pour la force totale', () => {
    const f = calculerForces([10, 12, 9, 11], [
      { index: 0, cote: 'gauche' },
      { index: 1, cote: 'gauche' },
      { index: 2, cote: 'droite' },
      { index: 3, cote: 'droite' },
    ]);
    expect(f).toEqual({ totalKg: 42, gaucheKg: 22, droiteKg: 20 });
  });
  it('ne sépare pas les mains avec un seul capteur au centre', () => {
    expect(calculerForces([50], [{ index: 0, cote: 'centre' }])).toEqual({ totalKg: 50, gaucheKg: null, droiteKg: null });
  });
  it('calcule la dissymétrie', () => {
    expect(dissymetriePct(36, 40)).toBeCloseTo(10);
    expect(mainLaPlusFaible(36, 40)).toBe('gauche');
    expect(mainLaPlusFaible(39, 40)).toBeNull();
  });
});

describe('analyse', () => {
  const serie = (valeurs: number[]): Echantillon[] =>
    valeurs.map((v, i) => ({ t: i * 100, totalKg: v, gaucheKg: v / 2, droiteKg: v / 2 }));

  it('trouve la suspension, sa durée et son max', () => {
    const r = analyserSuspension(serie([0, 0, 30, 60, 60, 60, 60, 30, 0, 0]), 5);
    expect(r.dureeS).toBeCloseTo(0.5);
    expect(r.forceMaxKg).toBeCloseTo(60);
    expect(r.gaucheMaxKg).toBeCloseTo(30);
  });
  it('lisse un pic isolé', () => {
    const r = analyserSuspension(serie([0, 50, 50, 90, 50, 50, 0]), 5);
    expect(r.forceMaxKg).toBeLessThan(70);
  });
  it('renvoie 0 sans suspension', () => {
    expect(analyserSuspension(serie([0, 1, 2]), 5).dureeS).toBe(0);
  });
});
