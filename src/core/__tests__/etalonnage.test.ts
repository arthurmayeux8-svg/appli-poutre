import { describe, expect, it } from 'vitest';
import { capteurLePlusCharge, corriger, ETALONNAGE_NEUTRE, moyenne, regleFacteur, regleZero } from '../etalonnage';

describe('étalonnage dans l’appli', () => {
  it('ne change rien sans réglage', () => {
    expect(corriger([10, 20], ETALONNAGE_NEUTRE)).toEqual([10, 20]);
  });
  it('remise à zéro puis poids connu sur un capteur', () => {
    // Capteur 0 : décalé de 0,3 kg et mesure 2 fois trop.
    let e = regleZero(ETALONNAGE_NEUTRE, [0.3, -0.1]);
    expect(corriger([0.3, -0.1], e)).toEqual([0, 0]);
    e = regleFacteur(e, [0.3 + 20, -0.1], 0, 10)!;
    expect(corriger([0.3 + 20, -0.1], e)[0]).toBeCloseTo(10);
    expect(e.facteurs[1]).toBe(1);
  });
  it('poids connu porté par toute la planche', () => {
    const e = regleFacteur(ETALONNAGE_NEUTRE, [30, 40], 'tous', 63)!;
    const c = corriger([30, 40], e);
    expect(c[0] + c[1]).toBeCloseTo(63);
  });
  it('refuse une mesure trop faible', () => {
    expect(regleFacteur(ETALONNAGE_NEUTRE, [0.2, 0.1], 'tous', 70)).toBeNull();
  });
  it('fait la moyenne de plusieurs mesures', () => {
    expect(moyenne([[1, 2], [3, 4]])).toEqual([2, 3]);
  });
  it('repère le capteur sur lequel on appuie', () => {
    expect(capteurLePlusCharge([0.1, 0.2, 8, 0.3])).toBe(2);
    expect(capteurLePlusCharge([4, 4, 0, 0])).toBeNull();
    expect(capteurLePlusCharge([0.5, 0.2])).toBeNull();
  });
});
